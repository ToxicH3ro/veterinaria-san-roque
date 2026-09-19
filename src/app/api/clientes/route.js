import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const referencia = collection(db, "usuarios");
    const snapshot = await getDocs(referencia);

    const usuarios = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));

    return Response.json(usuarios, {
      status: 200,
    });

  } catch (error) {
    console.error("Error al obtener usuarios:", error);

    return Response.json(
      {
        error: "No se pudieron obtener los usuarios.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    const datos = await request.json();

    const referencia = collection(db, "usuarios");

    const documento = await addDoc(referencia, {
      ...datos,
      creadoEn: serverTimestamp(),
    });

    return Response.json(
      {
        id: documento.id,
        ...datos,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error("Error al crear cliente:", error);

    return Response.json(
      {
        error: "No se pudo crear el cliente.",
      },
      {
        status: 500,
      }
    );
  }
}