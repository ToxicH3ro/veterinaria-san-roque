import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const citasRef = collection(db, "citas");


// Obtener citas
export const obtenerCitas = async (usuario) => {

  // Si todavía no hay usuario autenticado,
  // no intentar consultar Firestore.
  if (!usuario?.uid) {
    return [];
  }

  let snapshot;

  if (usuario.rol === "veterinario") {

    // El veterinario puede ver todas las citas
    snapshot = await getDocs(citasRef);

  } else {

    // El usuario solamente puede ver sus propias citas
    const consulta = query(
      citasRef,
      where("usuarioId", "==", usuario.uid),
      orderBy("fecha"),
      orderBy("hora")
    );

    snapshot = await getDocs(consulta);
  }


  const citas = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));


  // Ordenar las citas por fecha y hora
  citas.sort((a, b) => {

    const fechaHoraA = `${a.fecha || ""} ${a.hora || ""}`;
    const fechaHoraB = `${b.fecha || ""} ${b.hora || ""}`;

    return fechaHoraA.localeCompare(fechaHoraB);
  });


  return citas;
};


// Crear una cita
export const crearCita = async (cita, usuario) => {

  if (!usuario?.uid) {
    throw new Error(
      "No hay un usuario autenticado para crear la cita."
    );
  }

  const nuevaCita = {
    ...cita,
    usuarioId: usuario.uid,
    estado: "Pendiente",
    creadoEn: serverTimestamp(),
  };


  const documento = await addDoc(
    citasRef,
    nuevaCita
  );


  return {
    id: documento.id,
    ...nuevaCita,
  };
};


// Actualizar estado de una cita
export const actualizarEstadoCita = async (
  citaId,
  nuevoEstado
) => {

  const referencia = doc(
    db,
    "citas",
    citaId
  );

  await updateDoc(referencia, {
    estado: nuevoEstado,
  });

  return {
    id: citaId,
    estado: nuevoEstado,
  };
};