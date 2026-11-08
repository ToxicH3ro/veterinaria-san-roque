import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const facturasRef = collection(db, "facturas");
const inventarioRef = collection(db, "inventario");
const contadorRef = doc(db, "contadores", "facturas");

/**
 * Comprueba que exista una sesión autenticada
 * y que el usuario tenga rol de veterinario.
 */
const verificarVeterinario = async () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Debes iniciar sesión.");
  }

  const usuarioRef = doc(db, "usuarios", usuario.uid);
  const usuarioSnap = await getDoc(usuarioRef);

  if (!usuarioSnap.exists()) {
    throw new Error("No se encontró tu perfil de usuario.");
  }

  if (usuarioSnap.data().rol !== "veterinario") {
    throw new Error("No tienes permisos para realizar esta operación.");
  }

  return usuario;
};

/**
 * Crea una factura y descuenta el inventario
 * dentro de una sola transacción de Firestore.
 *
 * Los productos obtienen su precio desde inventario.
 * Los servicios utilizan el precio enviado por el veterinario.
 */
export const crearFacturaConInventario = async (datos) => {
  await verificarVeterinario();

  if (!datos || typeof datos !== "object") {
    throw new Error("Los datos de la factura no son válidos.");
  }

  if (
    typeof datos.Cliente !== "string" ||
    !datos.Cliente.trim()
  ) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  if (
    typeof datos.usuarioID !== "string" ||
    !datos.usuarioID.trim()
  ) {
    throw new Error("Debes seleccionar un cliente.");
  }

  if (!Array.isArray(datos.items) || datos.items.length === 0) {
    throw new Error("La factura debe contener al menos un artículo.");
  }

  // Comprobar que el cliente exista y tenga el rol correcto.
  const clienteRef = doc(db, "usuarios", datos.usuarioID);
  const clienteSnap = await getDoc(clienteRef);

  if (!clienteSnap.exists()) {
    throw new Error("El cliente seleccionado no existe.");
  }

  if (clienteSnap.data().rol !== "usuario") {
    throw new Error("La factura debe estar asociada a un cliente.");
  }

  // Agrupar cantidades de productos repetidos.
  const productosNecesarios = new Map();

  for (const item of datos.items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new Error(
        "La cantidad de cada artículo debe ser un entero mayor que cero."
      );
    }

    const tipo =
      item.tipo ??
      ((item.productoID || item.productoId || item.id)
        ? "producto"
        : "servicio");

    if (tipo === "producto") {
      const productoID =
        item.productoID ?? item.productoId ?? item.id;

      if (
        typeof productoID !== "string" ||
        !productoID.trim()
      ) {
        throw new Error("Falta el identificador de un producto.");
      }

      productosNecesarios.set(
        productoID,
        (productosNecesarios.get(productoID) ?? 0) + item.cantidad
      );
    } else if (tipo === "servicio") {
      if (
        typeof item.nombre !== "string" ||
        !item.nombre.trim() ||
        typeof item.precio !== "number" ||
        !Number.isFinite(item.precio) ||
        item.precio < 0
      ) {
        throw new Error("Hay un servicio con datos o precio no válidos.");
      }
    } else {
      throw new Error(`El tipo de artículo "${tipo}" no es válido.`);
    }
  }

  // El ID se genera fuera de la transacción para conservarlo
  // durante posibles reintentos de Firestore.
  const facturaRef = doc(facturasRef);

  await runTransaction(db, async (transaction) => {
    // PRIMERA FASE: todas las lecturas.

    const contadorSnap = await transaction.get(contadorRef);

    const referenciasProductos = Array.from(
      productosNecesarios.keys(),
      (productoID) => ({
        id: productoID,
        referencia: doc(inventarioRef, productoID),
      })
    );

    const snapshotsProductos = await Promise.all(
      referenciasProductos.map(({ referencia }) =>
        transaction.get(referencia)
      )
    );

    const productosActuales = new Map();

    snapshotsProductos.forEach((snapshot, index) => {
      const productoID = referenciasProductos[index].id;

      if (!snapshot.exists()) {
        throw new Error(
          `El producto ${productoID} no existe en el inventario.`
        );
      }

      const producto = snapshot.data();
      const cantidad = Number(producto.cantidad);
      const precio = Number(producto.precio);

      if (
        !Number.isFinite(cantidad) ||
        cantidad < 0 ||
        !Number.isFinite(precio) ||
        precio < 0
      ) {
        throw new Error(
          `El producto ${producto.nombre ?? productoID} tiene datos inválidos.`
        );
      }

      const cantidadSolicitada =
        productosNecesarios.get(productoID) ?? 0;

      if (cantidadSolicitada > cantidad) {
        throw new Error(
          `No hay suficiente inventario de ${producto.nombre}. ` +
          `Disponible: ${cantidad}. Solicitado: ${cantidadSolicitada}.`
        );
      }

      productosActuales.set(productoID, {
        nombre: String(producto.nombre ?? "Producto"),
        categoria: String(producto.categoria ?? ""),
        cantidad,
        precio,
      });
    });

    // SEGUNDA FASE: calcular los artículos de la factura.

    const itemsCalculados = datos.items.map((item) => {
      const tipo =
        item.tipo ??
        ((item.productoID || item.productoId || item.id)
          ? "producto"
          : "servicio");

      if (tipo === "producto") {
        const productoID =
          item.productoID ?? item.productoId ?? item.id;

        const producto = productosActuales.get(productoID);

        if (!producto) {
          throw new Error(
            "No se pudo consultar un producto de la factura."
          );
        }

        return {
          tipo: "producto",
          productoID,
          nombre: producto.nombre,
          categoria: producto.categoria,
          cantidad: item.cantidad,
          precio: producto.precio,
          subtotal: producto.precio * item.cantidad,
        };
      }

      return {
        tipo: "servicio",
        nombre: item.nombre.trim(),
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.precio * item.cantidad,
      };
    });

    const subtotalCalculado = itemsCalculados.reduce(
      (suma, item) => suma + item.subtotal,
      0
    );

    if (
      !Number.isFinite(subtotalCalculado) ||
      subtotalCalculado <= 0
    ) {
      throw new Error("El total de la factura debe ser mayor que cero.");
    }

    // Generar numeración consecutiva.
    const ultimoNumero = contadorSnap.exists()
      ? Number(contadorSnap.data().ultimoNumero ?? 0)
      : 0;

    if (
      !Number.isSafeInteger(ultimoNumero) ||
      ultimoNumero < 0
    ) {
      throw new Error("El contador de facturas no es válido.");
    }

    const siguienteNumero = ultimoNumero + 1;
    const numero = `FAC-${String(siguienteNumero).padStart(3, "0")}`;

    // TERCERA FASE: escrituras.
    // A partir de aquí no deben realizarse más lecturas.

    transaction.set(contadorRef, {
      ultimoNumero: siguienteNumero,
    });

    // Descontar una sola vez cada producto.
    for (const [productoID, cantidadVendida] of productosNecesarios) {
      const producto = productosActuales.get(productoID);
      const productoRef = doc(inventarioRef, productoID);

      transaction.update(productoRef, {
        cantidad: producto.cantidad - cantidadVendida,
      });
    }

    // Guardar factura con el esquema compartido.
    transaction.set(facturaRef, {
      Cliente: datos.Cliente.trim(),
      usuarioID: datos.usuarioID,
      fecha: serverTimestamp(),
      items: itemsCalculados,
      subtotal: subtotalCalculado,
      total: subtotalCalculado,
      numero,
      estado: "pendiente",
      creadoEn: serverTimestamp(),
    });
  });

  return facturaRef.id;
};

// Alias para mantener compatibilidad.
export const crearFactura = crearFacturaConInventario;

/**
 * Obtener todas las facturas para el veterinario.
 */
export const obtenerFacturas = async () => {
  await verificarVeterinario();

  const consulta = query(
    facturasRef,
    orderBy("creadoEn", "desc")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
};

/**
 * Obtener únicamente las facturas del usuario autenticado.
 */
export const obtenerFacturasDeUsuario = async () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Debes iniciar sesión.");
  }

  const consulta = query(
    facturasRef,
    where("usuarioID", "==", usuario.uid)
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs
    .map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }))
    .sort(
      (a, b) =>
        (b.creadoEn?.toMillis?.() ?? 0) -
        (a.creadoEn?.toMillis?.() ?? 0)
    );
};

/**
 * Actualizar el estado de una factura.
 * Exclusivo del veterinario.
 */
export const actualizarEstadoFactura = async (
  facturaID,
  estado
) => {
  await verificarVeterinario();

  if (!facturaID) {
    throw new Error("No se especificó la factura.");
  }

  const estadosPermitidos = [
    "pendiente",
    "pagada",
    "atrasada",
  ];

  if (!estadosPermitidos.includes(estado)) {
    throw new Error("El estado de la factura no es válido.");
  }

  await updateDoc(
    doc(db, "facturas", facturaID),
    { estado }
  );
};
