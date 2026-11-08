import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const pagosRef = collection(db, "pagos");

const METODOS_PAGO = [
  "Tarjeta Bancaria",
  "Transferencia Bancaria",
];

const ESTADOS_PAGO = [
  "pendiente_verificacion",
  "confirmado",
  "rechazado",
];

// Verificar que el usuario tenga el rol indicado.
const verificarRol = async (rolEsperado) => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Debes iniciar sesión.");
  }

  const usuarioRef = doc(db, "usuarios", usuario.uid);
  const usuarioSnap = await getDoc(usuarioRef);

  if (!usuarioSnap.exists()) {
    throw new Error("No se encontró tu perfil de usuario.");
  }

  if (usuarioSnap.data().rol !== rolEsperado) {
    throw new Error("No tienes permisos para realizar esta operación.");
  }

  return usuario;
};

// El usuario solicita pagar una factura propia.
export const solicitarPago = async (facturaID, metodo) => {
  const usuario = await verificarRol("usuario");

  if (!facturaID) {
    throw new Error("No se especificó la factura.");
  }

  if (!METODOS_PAGO.includes(metodo)) {
    throw new Error("Selecciona un método de pago válido.");
  }

  // Consultar factura
  const facturaRef = doc(db, "facturas", facturaID);
  const facturaSnap = await getDoc(facturaRef);

  if (!facturaSnap.exists()) {
    throw new Error("La factura no existe.");
  }

  const factura = facturaSnap.data();

  if (factura.usuarioID !== usuario.uid) {
    throw new Error("No puedes pagar una factura ajena.");
  }

  if (!["pendiente", "atrasada"].includes(factura.estado)) {
    throw new Error("Esta factura no está pendiente de pago.");
  }

  const monto = factura.total;

  if (
    typeof monto !== "number" ||
    !Number.isFinite(monto) ||
    monto <= 0
  ) {
    throw new Error("El monto de la factura no es válido.");
  }

  // Evitar solicitudes duplicadas pendientes.
  const consultaPagos = query(
    pagosRef,
    where("usuarioID", "==", usuario.uid)
  );

  const pagosExistentes = await getDocs(consultaPagos);

  const pagoPendiente = pagosExistentes.docs.some((documento) => {
    const pago = documento.data();

    return (
      pago.facturaID === facturaID &&
      pago.estado === "pendiente_verificacion"
    );
  });

  if (pagoPendiente) {
    throw new Error(
      "Ya existe una solicitud pendiente para esta factura."
    );
  }

  // Registrar solicitud
  const pagoRef = await addDoc(pagosRef, {
    facturaID,
    usuarioID: usuario.uid,
    monto,
    metodo,
    estado: "pendiente_verificacion",
    creadoEn: serverTimestamp(),
  });

  return pagoRef.id;
};

// Consultar las solicitudes del usuario autenticado.
export const obtenerPagosDeUsuario = async () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Debes iniciar sesión.");
  }

  const consulta = query(
    pagosRef,
    where("usuarioID", "==", usuario.uid)
  );

  const resultado = await getDocs(consulta);

  const pagos = resultado.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));

  // Ordenar del más reciente al más antiguo.
  pagos.sort((a, b) => {
    const fechaA = a.creadoEn?.toMillis?.() || 0;
    const fechaB = b.creadoEn?.toMillis?.() || 0;

    return fechaB - fechaA;
  });

  return pagos;
};

// Consultar todas las solicitudes para el veterinario.
export const obtenerPagos = async () => {
  await verificarRol("veterinario");

  const consulta = query(
    pagosRef,
    orderBy("creadoEn", "desc")
  );

  const resultado = await getDocs(consulta);

  return resultado.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
};

// El veterinario confirma o rechaza una solicitud.
export const procesarPago = async (pagoID, decision) => {
  await verificarRol("veterinario");

  if (!pagoID) {
    throw new Error("No se especificó la solicitud de pago.");
  }

  if (!["confirmado", "rechazado"].includes(decision)) {
    throw new Error("La decisión indicada no es válida.");
  }

  const pagoRef = doc(db, "pagos", pagoID);

  await runTransaction(db, async (transaction) => {
    // Consultar solicitud
    const pagoSnap = await transaction.get(pagoRef);

    if (!pagoSnap.exists()) {
      throw new Error("La solicitud de pago no existe.");
    }

    const pago = pagoSnap.data();

    if (!ESTADOS_PAGO.includes(pago.estado)) {
      throw new Error("El estado de la solicitud no es válido.");
    }

    if (pago.estado !== "pendiente_verificacion") {
      throw new Error("Esta solicitud ya fue procesada.");
    }

    // Rechazar solicitud
    if (decision === "rechazado") {
      transaction.update(pagoRef, {
        estado: "rechazado",
        rechazadoEn: serverTimestamp(),
      });

      return;
    }

    // Consultar factura asociada
    const facturaRef = doc(db, "facturas", pago.facturaID);
    const facturaSnap = await transaction.get(facturaRef);

    if (!facturaSnap.exists()) {
      throw new Error("No se encontró la factura asociada.");
    }

    const factura = facturaSnap.data();

    if (factura.usuarioID !== pago.usuarioID) {
      throw new Error("El propietario de la factura no coincide.");
    }

    if (factura.total !== pago.monto) {
      throw new Error("El monto del pago no coincide con la factura.");
    }

    if (!["pendiente", "atrasada"].includes(factura.estado)) {
      throw new Error("La factura ya no admite este pago.");
    }

    // Confirmar pago y actualizar factura.
    transaction.update(pagoRef, {
      estado: "confirmado",
      verificadoEn: serverTimestamp(),
    });

    transaction.update(facturaRef, {
      estado: "pagada",
    });
  });
};
