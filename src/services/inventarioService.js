import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const inventarioRef = collection(db, "inventario");

// Crear producto
export const crearProducto = async (producto) => {
  const nuevoProducto = {
    ...producto,
    creadoEn: serverTimestamp(),
  };

  const documento = await addDoc(
    inventarioRef,
    nuevoProducto
  );

  return {
    id: documento.id,
    ...nuevoProducto,
  };
};

// Obtener productos
export const obtenerProductos = async () => {
  const consulta = query(
    inventarioRef,
    orderBy("nombre")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Actualizar producto
export const actualizarProducto = async (
  productoId,
  producto
) => {
  if (!productoId) {
    throw new Error(
      "No se especificó el producto que se desea actualizar."
    );
  }

  const referencia = doc(
    db,
    "inventario",
    productoId
  );

  const documento = await getDoc(referencia);

  if (!documento.exists()) {
    throw new Error(
      "El producto no existe en el inventario."
    );
  }

  const productoActualizado = {
    nombre: producto.nombre,
    categoria: producto.categoria,
    cantidad: Number(producto.cantidad),
    precio: Number(producto.precio),
    proveedor: producto.proveedor,
  };

  await updateDoc(
    referencia,
    productoActualizado
  );

  return {
    id: productoId,
    ...productoActualizado,
  };
};

// Descontar producto del inventario
export const descontarProducto = async (
  productoId,
  cantidad
) => {
  if (!productoId) {
    throw new Error(
      "No se especificó el producto."
    );
  }

  if (!cantidad || cantidad <= 0) {
    throw new Error(
      "La cantidad a descontar debe ser mayor que 0."
    );
  }

  const referencia = doc(
    db,
    "inventario",
    productoId
  );

  const documento = await getDoc(referencia);

  if (!documento.exists()) {
    throw new Error(
      "El producto no existe en el inventario."
    );
  }

  const producto = documento.data();

  const cantidadActual =
    Number(producto.cantidad) || 0;

  const cantidadDescontar =
    Number(cantidad);

  if (cantidadDescontar > cantidadActual) {
    throw new Error(
      `No hay suficiente inventario de ${producto.nombre}. Disponible: ${cantidadActual}.`
    );
  }

  const nuevaCantidad =
    cantidadActual - cantidadDescontar;

  await updateDoc(referencia, {
    cantidad: nuevaCantidad,
  });

  return {
    id: productoId,
    nombre: producto.nombre,
    cantidadAnterior: cantidadActual,
    cantidadDescontada: cantidadDescontar,
    cantidadNueva: nuevaCantidad,
  };
};

// Eliminar producto
export const eliminarProducto = async (productoId) => {
  if (!productoId) {
    throw new Error(
      "No se especificó el producto que se desea eliminar."
    );
  }

  const referencia = doc(
    db,
    "inventario",
    productoId
  );

  const documento = await getDoc(referencia);

  if (!documento.exists()) {
    throw new Error(
      "El producto no existe en el inventario."
    );
  }

  await deleteDoc(referencia);

  return {
    id: productoId,
  };
};
