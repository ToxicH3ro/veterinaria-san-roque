import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export const registrarUsuario = async ({
  nombre,
  apellido,
  correo,
  telefono,
  direccion,
  contrasena,
}) => {
  const usuarioCreado = await createUserWithEmailAndPassword(
    auth,
    correo,
    contrasena
  );

  const uid = usuarioCreado.user.uid;

  await setDoc(doc(db, "usuarios", uid), {
    nombre,
    apellido,
    correo,
    telefono,
    direccion,
    rol: "usuario",
  });

  return {
    uid,
    correo,
  };
};

export const iniciarSesion = async (correo, contrasena) => {
  const resultado = await signInWithEmailAndPassword(
    auth,
    correo,
    contrasena
  );

  return resultado.user;
};

export const cerrarSesion = async () => {
  await signOut(auth);
};