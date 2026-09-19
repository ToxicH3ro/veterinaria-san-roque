import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";


// Referencia a la colección de usuarios
const usuariosRef = collection(db, "usuarios");


// Obtener todos los usuarios registrados
export const obtenerUsuarios = async () => {
  const consulta = query(
    usuariosRef,
    orderBy("nombre")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};


// Eliminar un cliente
export const eliminarCliente = async (clienteId) => {
  if (!clienteId) {
    throw new Error("No se especificó el cliente.");
  }

  const referencia = doc(db, "usuarios", clienteId);

  await deleteDoc(referencia);
};