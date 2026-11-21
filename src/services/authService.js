import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  linkWithCredential,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

// =====================================================
// REGISTRO CON CORREO Y CONTRASEÑA
// =====================================================

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

// =====================================================
// INICIAR SESIÓN CON CORREO Y CONTRASEÑA
// =====================================================

export const iniciarSesion = async (correo, contrasena) => {
  const resultado = await signInWithEmailAndPassword(
    auth,
    correo,
    contrasena
  );

  return resultado.user;
};

// =====================================================
// INICIAR SESIÓN CON GOOGLE
// =====================================================

export const iniciarSesionConGoogle = async () => {
  const proveedorGoogle = new GoogleAuthProvider();

  const resultado = await signInWithPopup(
    auth,
    proveedorGoogle
  );

  const usuarioFirebase = resultado.user;

  const usuarioRef = doc(
    db,
    "usuarios",
    usuarioFirebase.uid
  );

  const documentoUsuario = await getDoc(usuarioRef);

  // Crear perfil únicamente si todavía no existe.
  if (!documentoUsuario.exists()) {
    const nombreCompleto =
      usuarioFirebase.displayName || "Usuario";

    const partesNombre = nombreCompleto
      .trim()
      .split(/\s+/);

    const nombre = partesNombre.shift() || "Usuario";
    const apellido = partesNombre.join(" ");

    await setDoc(usuarioRef, {
      nombre,
      apellido,
      correo: usuarioFirebase.email || "",
      telefono: usuarioFirebase.phoneNumber || "",
      direccion: "",
      rol: "usuario",
    });
  }

  return usuarioFirebase;
};

// =====================================================
// CREDENCIAL FACEBOOK PENDIENTE DE VINCULACIÓN
// =====================================================

let credencialFacebookPendiente = null;
let correoFacebookPendiente = "";

// =====================================================
// INICIAR SESIÓN CON FACEBOOK
// =====================================================

export const iniciarSesionConFacebook = async () => {
  const proveedorFacebook = new FacebookAuthProvider();

  try {
    const resultado = await signInWithPopup(
      auth,
      proveedorFacebook
    );

    const usuarioFirebase = resultado.user;

    const usuarioRef = doc(
      db,
      "usuarios",
      usuarioFirebase.uid
    );

    const documentoUsuario = await getDoc(usuarioRef);

    // Crear perfil únicamente si todavía no existe.
    if (!documentoUsuario.exists()) {
      const nombreCompleto =
        usuarioFirebase.displayName || "Usuario";

      const partesNombre = nombreCompleto
        .trim()
        .split(/\s+/);

      const nombre = partesNombre.shift() || "Usuario";
      const apellido = partesNombre.join(" ");

      await setDoc(usuarioRef, {
        nombre,
        apellido,
        correo: usuarioFirebase.email || "",
        telefono: usuarioFirebase.phoneNumber || "",
        direccion: "",
        rol: "usuario",
      });
    }

    // Limpiar cualquier credencial pendiente anterior.
    credencialFacebookPendiente = null;
    correoFacebookPendiente = "";

    return usuarioFirebase;

  } catch (error) {

    // Detectar si el correo ya está vinculado a otro proveedor.
    if (error.code === "auth/account-exists-with-different-credential") {

      credencialFacebookPendiente =
        FacebookAuthProvider.credentialFromError(error);

      correoFacebookPendiente =
        error.customData?.email || "";

    }

    throw error;
  }
};

// =====================================================
// VINCULAR FACEBOOK CON UNA CUENTA EXISTENTE
// =====================================================

export const vincularFacebookConGoogle = async () => {
  // Comprobar que existe una credencial pendiente.
  if (!credencialFacebookPendiente) {
    throw new Error("No existe una credencial de Facebook pendiente.");
  }

  // Comprobar que existe una sesión autenticada.
  const usuarioActual = auth.currentUser;

  if (!usuarioActual) {
    throw new Error("Primero debes iniciar sesión con Google.");
  }

  // Comprobar que el correo corresponde a la cuenta pendiente.
  if (
    usuarioActual.email?.toLowerCase() !==
    correoFacebookPendiente.toLowerCase()
  ) {
    throw new Error("La cuenta de Google no coincide con el correo de Facebook.");
  }

  // Vincular Facebook con la cuenta existente.
  const resultado = await linkWithCredential(
    usuarioActual,
    credencialFacebookPendiente
  );

  // Limpiar credenciales pendientes después de vincular.
  credencialFacebookPendiente = null;
  correoFacebookPendiente = "";

  return resultado.user;
};

// =====================================================
// COMPROBAR SI EXISTE UNA CREDENCIAL PENDIENTE
// =====================================================

export const hayCredencialFacebookPendiente = () => {
  return credencialFacebookPendiente !== null;
};

// =====================================================
// CERRAR SESIÓN
// =====================================================

export const cerrarSesion = async () => {
  await signOut(auth);
};
