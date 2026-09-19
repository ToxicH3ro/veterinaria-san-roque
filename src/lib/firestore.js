import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * Obtener todos los documentos de una colección.
 */
export const obtenerDocumentos = async (nombreColeccion) => {
  const referencia = collection(db, nombreColeccion);

  const snapshot = await getDocs(referencia);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
};

/**
 * Obtener un documento específico.
 */
export const obtenerDocumento = async (
  nombreColeccion,
  id
) => {
  const referencia = doc(db, nombreColeccion, id);

  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

/**
 * Crear un documento.
 */
export const crearDocumento = async (
  nombreColeccion,
  datos
) => {
  const referencia = collection(db, nombreColeccion);

  const documento = await addDoc(referencia, datos);

  return {
    id: documento.id,
    ...datos,
  };
};

/**
 * Actualizar un documento.
 */
export const actualizarDocumento = async (
  nombreColeccion,
  id,
  datos
) => {
  const referencia = doc(db, nombreColeccion, id);

  await updateDoc(referencia, datos);

  return {
    id,
    ...datos,
  };
};

/**
 * Eliminar un documento.
 */
export const eliminarDocumento = async (
  nombreColeccion,
  id
) => {
  const referencia = doc(db, nombreColeccion, id);

  await deleteDoc(referencia);

  return true;
};