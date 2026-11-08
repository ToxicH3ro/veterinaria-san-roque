import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// Colección de mascotas.
const mascotasRef = collection(db, "mascotas");

// Obtener todas las mascotas y relacionarlas con sus propietarios.
// Función utilizada por el veterinario.
export const obtenerPacientes = async () => {
  const usuariosRef = collection(db, "usuarios");

  // Obtener mascotas y usuarios en paralelo.
  const [mascotasSnapshot, usuariosSnapshot] = await Promise.all([
    getDocs(mascotasRef),
    getDocs(query(usuariosRef, where("rol", "==", "usuario"))),
  ]);

  // Crear un mapa con el UID y nombre completo de cada propietario.
  const propietarios = new Map();

  usuariosSnapshot.docs.forEach((documento) => {
    const datos = documento.data();

    const nombreCompleto = [
      datos.nombre,
      datos.apellido,
    ]
      .filter(
        (parte) =>
          typeof parte === "string" && parte.trim().length > 0
      )
      .map((parte) => parte.trim())
      .join(" ");

    propietarios.set(documento.id, nombreCompleto);
  });

  // Devolver las mascotas con los datos de sus propietarios.
  return mascotasSnapshot.docs.map((documento) => {
    const datos = documento.data();
    const usuarioId = String(datos.usuarioId ?? "");

    return {
      id: documento.id,
      nombre: String(datos.nombre ?? ""),
      especie: String(datos.especie ?? ""),
      raza: String(datos.raza ?? ""),
      usuarioId,
      propietarioNombre: propietarios.get(usuarioId) || "",
    };
  });
};

// Obtener únicamente las mascotas de un usuario.
export const obtenerMascotasDeUsuario = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error("No se especificó el usuario.");
  }

  const consulta = query(
    mascotasRef,
    where("usuarioId", "==", usuarioId)
  );

  const resultado = await getDocs(consulta);

  return resultado.docs.map((documento) => {
    const datos = documento.data();

    return {
      id: documento.id,
      nombre: datos.nombre ?? "",
      especie: datos.especie ?? "",
      raza: datos.raza ?? "",
      usuarioId: datos.usuarioId ?? "",
    };
  });
};

// Registrar una nueva mascota.
export const registrarMascota = async (mascota) => {
  if (
    !mascota ||
    !mascota.nombre?.trim() ||
    !mascota.especie?.trim() ||
    !mascota.raza?.trim() ||
    !mascota.usuarioId
  ) {
    throw new Error("Los datos de la mascota están incompletos.");
  }

  await addDoc(mascotasRef, {
    nombre: mascota.nombre.trim(),
    especie: mascota.especie.trim(),
    raza: mascota.raza.trim(),
    usuarioId: mascota.usuarioId,
  });
};