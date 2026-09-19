import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const facturasRef = collection(db, "facturas");

// Crear una nueva factura y descontar inventario
export const crearFacturaConInventario = async (factura) => {
  const productos = factura.items.filter(
    (item) =>
      item.tipo === "producto" &&
      item.productoId
  );

  const resultado = await runTransaction(
    db,
    async (transaction) => {
      /*
       * Primero obtenemos todos los productos
       * que serán descontados del inventario.
       */

      const productosInventario = [];

      for (const item of productos) {
        const productoRef = doc(
          db,
          "inventario",
          item.productoId
        );

        const productoSnapshot =
          await transaction.get(productoRef);

        if (!productoSnapshot.exists()) {
          throw new Error(
            `El producto "${item.producto}" no existe en el inventario.`
          );
        }

        productosInventario.push({
          ref: productoRef,
          snapshot: productoSnapshot,
          item,
        });
      }

      /*
       * Validamos que exista suficiente stock
       * antes de modificar cualquier documento.
       */

      for (const producto of productosInventario) {
        const datos = producto.snapshot.data();

        const stockActual =
          Number(datos.cantidad) || 0;

        const cantidadSolicitada =
          Number(producto.item.cantidad) || 0;

        if (cantidadSolicitada <= 0) {
          throw new Error(
            `La cantidad de "${datos.nombre}" no es válida.`
          );
        }

        if (cantidadSolicitada > stockActual) {
          throw new Error(
            `No hay suficiente stock de "${datos.nombre}". ` +
            `Disponible: ${stockActual}.`
          );
        }
      }

      /*
       * Creamos la factura.
       */

      const facturaRef = doc(facturasRef);

      const nuevaFactura = {
        ...factura,
        estado: "Pendiente",
        creadoEn: serverTimestamp(),
      };

      transaction.set(
        facturaRef,
        nuevaFactura
      );

      /*
       * Descontamos el inventario.
       */

      for (const producto of productosInventario) {
        const datos = producto.snapshot.data();

        const stockActual =
          Number(datos.cantidad) || 0;

        const cantidadSolicitada =
          Number(producto.item.cantidad) || 0;

        const nuevoStock =
          stockActual - cantidadSolicitada;

        transaction.update(
          producto.ref,
          {
            cantidad: nuevoStock,
          }
        );
      }

      return {
        id: facturaRef.id,
        ...nuevaFactura,
      };
    }
  );

  return resultado;
};

// Obtener todas las facturas
export const obtenerFacturas = async () => {
  const consulta = query(
    facturasRef,
    orderBy("creadoEn", "desc")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
