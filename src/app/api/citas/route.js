import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * GET /api/citas
 *
 * Obtiene todas las citas.
 *
 * GET /api/citas?id=ID
 *
 * Obtiene una cita específica.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Obtener una cita específica
    if (id) {
      const referencia = doc(db, "citas", id);
      const documento = await getDoc(referencia);

      if (!documento.exists()) {
        return NextResponse.json(
          {
            error: "Cita no encontrada",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        id: documento.id,
        ...documento.data(),
      });
    }

    // Obtener todas las citas
    const referencia = collection(db, "citas");

    // Ya no usamos orderBy de Firestore.
    // Obtenemos los documentos y ordenamos después en JavaScript.
    const snapshot = await getDocs(referencia);

    const citas = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));

    // Ordenar por fecha y hora
    citas.sort((a, b) => {
      const fechaHoraA = `${a.fecha || ""} ${a.hora || ""}`;
      const fechaHoraB = `${b.fecha || ""} ${b.hora || ""}`;

      return fechaHoraA.localeCompare(fechaHoraB);
    });

    return NextResponse.json(citas);
  } catch (error) {
    console.error("=================================");
    console.error("ERROR REAL EN GET /api/citas");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        error: error.message || "No se pudieron obtener las citas",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * POST /api/citas
 *
 * Crea una nueva cita.
 */
export async function POST(request) {
  try {
    const datos = await request.json();

    if (!datos.fecha || !datos.hora || !datos.mascota) {
      return NextResponse.json(
        {
          error:
            "Los campos fecha, hora y mascota son obligatorios",
        },
        {
          status: 400,
        }
      );
    }

    const referencia = collection(db, "citas");

    const nuevaCita = await addDoc(referencia, {
      ...datos,
      creadoEn: new Date(),
    });

    return NextResponse.json(
      {
        id: nuevaCita.id,
        ...datos,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error POST /api/citas:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear la cita",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * PUT /api/citas?id=ID
 *
 * Actualiza una cita.
 */
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Se requiere el ID de la cita",
        },
        {
          status: 400,
        }
      );
    }

    const datos = await request.json();

    const referencia = doc(db, "citas", id);

    const documento = await getDoc(referencia);

    if (!documento.exists()) {
      return NextResponse.json(
        {
          error: "Cita no encontrada",
        },
        {
          status: 404,
        }
      );
    }

    await updateDoc(referencia, {
      ...datos,
      actualizadoEn: new Date(),
    });

    return NextResponse.json({
      id,
      ...datos,
    });
  } catch (error) {
    console.error("Error PUT /api/citas:", error);

    return NextResponse.json(
      {
        error: "No se pudo actualizar la cita",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * DELETE /api/citas?id=ID
 *
 * Elimina una cita.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Se requiere el ID de la cita",
        },
        {
          status: 400,
        }
      );
    }

    const referencia = doc(db, "citas", id);

    const documento = await getDoc(referencia);

    if (!documento.exists()) {
      return NextResponse.json(
        {
          error: "Cita no encontrada",
        },
        {
          status: 404,
        }
      );
    }

    await deleteDoc(referencia);

    return NextResponse.json({
      mensaje: "Cita eliminada correctamente",
      id,
    });
  } catch (error) {
    console.error("Error DELETE /api/citas:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar la cita",
      },
      {
        status: 500,
      }
    );
  }
}