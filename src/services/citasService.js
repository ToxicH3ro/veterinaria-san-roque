import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const citasRef = collection(db, "citas");
const usuariosRef = collection(db, "usuarios");

// Normalizar estados.
const normalizarEstado = (estado) =>
  String(estado || "pendiente").trim().toLowerCase();

// Obtener nombre completo de un usuario.
const obtenerNombreCompleto = (datos) => {
  return [
    datos?.nombre,
    datos?.apellido,
  ]
    .filter(
      (parte) =>
        typeof parte === "string" && parte.trim().length > 0
    )
    .map((parte) => parte.trim())
    .join(" ");
};

// Obtener citas.
export const obtenerCitas = async (usuario) => {
  if (!usuario?.uid) {
    return [];
  }

  let documentos = [];
  const propietarios = new Map();

  if (usuario.rol === "veterinario") {
    // Obtener citas y usuarios en paralelo.
    const [citasSnapshot, usuariosSnapshot] = await Promise.all([
      getDocs(citasRef),
      getDocs(query(usuariosRef, where("rol", "==", "usuario"))),
    ]);

    documentos = citasSnapshot.docs;

    // Relacionar UID con nombre completo.
    usuariosSnapshot.docs.forEach((documento) => {
      const nombreCompleto = obtenerNombreCompleto(
        documento.data()
      );

      if (nombreCompleto) {
        propietarios.set(documento.id, nombreCompleto);
      }
    });
  } else {
    // Compatibilidad con los dos nombres de campo existentes.
    const consultaActual = query(
      citasRef,
      where("usuarioID", "==", usuario.uid)
    );

    const consultaAnterior = query(
      citasRef,
      where("usuarioId", "==", usuario.uid)
    );

    const [resultadoActual, resultadoAnterior] =
      await Promise.all([
        getDocs(consultaActual),
        getDocs(consultaAnterior),
      ]);

    // Evitar documentos duplicados.
    const documentosUnicos = new Map();

    [...resultadoActual.docs, ...resultadoAnterior.docs]
      .forEach((documento) => {
        documentosUnicos.set(documento.id, documento);
      });

    documentos = Array.from(documentosUnicos.values());

    // El cliente utiliza los datos de su propio perfil.
    const nombreCompleto = obtenerNombreCompleto(usuario);

    if (nombreCompleto) {
      propietarios.set(usuario.uid, nombreCompleto);
    }
  }

  // Asociar cada cita con el nombre de su propietario.
  const citas = documentos.map((documento) => {
    const datos = documento.data();

    const propietarioId = String(
      datos.usuarioID ?? datos.usuarioId ?? ""
    );

    return {
      id: documento.id,
      ...datos,
      clienteNombre:
        propietarios.get(propietarioId) || "Nombre no disponible",
      estado: normalizarEstado(datos.estado),
    };
  });

  // Ordenar por fecha y hora.
  citas.sort((a, b) => {
    const fechaHoraA = `${a.fecha || ""} ${a.hora || ""}`;
    const fechaHoraB = `${b.fecha || ""} ${b.hora || ""}`;

    return fechaHoraA.localeCompare(fechaHoraB);
  });

  return citas;
};

// Crear una cita.
export const crearCita = async (cita, usuario) => {
  if (!usuario?.uid) {
    throw new Error(
      "No hay un usuario autenticado para crear la cita."
    );
  }

  const nuevaCita = {
    ...cita,
    usuarioID: usuario.uid,
    estado: "pendiente",
    creadoEn: serverTimestamp(),
  };

  const documento = await addDoc(citasRef, nuevaCita);

  return {
    id: documento.id,
    ...nuevaCita,
    clienteNombre:
      obtenerNombreCompleto(usuario) || "Nombre no disponible",
  };
};

// Actualizar estado de una cita.
export const actualizarEstadoCita = async (
  citaId,
  nuevoEstado
) => {
  const referencia = doc(db, "citas", citaId);
  const estado = normalizarEstado(nuevoEstado);

  await updateDoc(referencia, { estado });

  return {
    id: citaId,
    estado,
  };
};
