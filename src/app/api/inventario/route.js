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
 * GET /api/inventario
 *
 * Obtiene todos los productos del inventario.
 *
 * GET /api/inventario?id=ID
 *
 * Obtiene un producto específico.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Obtener un producto específico
    if (id) {
      const referencia = doc(db, "inventario", id);

      const documento = await getDoc(referencia);

      if (!documento.exists()) {
        return NextResponse.json(
          {
            error: "Producto no encontrado",
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

    // Obtener todo el inventario
    const referencia = collection(db, "inventario");

    const snapshot = await getDocs(referencia);

    const inventario = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));

    return NextResponse.json(inventario);
  } catch (error) {
    console.error("Error GET /api/inventario:", error);

    return NextResponse.json(
      {
        error: "No se pudo obtener el inventario",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * POST /api/inventario
 *
 * Crea un nuevo producto.
 */
export async function POST(request) {
  try {
    const datos = await request.json();

    if (!datos.nombre) {
      return NextResponse.json(
        {
          error: "El nombre del producto es obligatorio",
        },
        {
          status: 400,
        }
      );
    }

    const referencia = collection(db, "inventario");

    const nuevoProducto = await addDoc(referencia, {
      ...datos,
      creadoEn: new Date(),
    });

    return NextResponse.json(
      {
        id: nuevoProducto.id,
        ...datos,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error POST /api/inventario:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear el producto",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * PUT /api/inventario?id=ID
 *
 * Actualiza un producto.
 */
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Se requiere el ID del producto",
        },
        {
          status: 400,
        }
      );
    }

    const datos = await request.json();

    const referencia = doc(db, "inventario", id);

    const documento = await getDoc(referencia);

    if (!documento.exists()) {
      return NextResponse.json(
        {
          error: "Producto no encontrado",
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
    console.error("Error PUT /api/inventario:", error);

    return NextResponse.json(
      {
        error: "No se pudo actualizar el producto",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * DELETE /api/inventario?id=ID
 *
 * Elimina un producto.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Se requiere el ID del producto",
        },
        {
          status: 400,
        }
      );
    }

    const referencia = doc(db, "inventario", id);

    const documento = await getDoc(referencia);

    if (!documento.exists()) {
      return NextResponse.json(
        {
          error: "Producto no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    await deleteDoc(referencia);

    return NextResponse.json({
      mensaje: "Producto eliminado correctamente",
      id,
    });
  } catch (error) {
    console.error("Error DELETE /api/inventario:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar el producto",
      },
      {
        status: 500,
      }
    );
  }
}