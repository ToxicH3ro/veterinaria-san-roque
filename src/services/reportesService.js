import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";


// =====================================================
// OBTENER CITAS
// =====================================================

export const obtenerDatosCitas = async () => {

  const snapshot = await getDocs(
    collection(db, "citas")
  );

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));

};


// =====================================================
// OBTENER CLIENTES
// =====================================================

export const obtenerDatosClientes = async () => {

  const snapshot = await getDocs(
    collection(db, "usuarios")
  );

  return snapshot.docs
    .map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }))
    .filter(
      (usuario) => usuario.rol === "usuario"
    );

};


// =====================================================
// OBTENER FACTURAS
// =====================================================

export const obtenerDatosFacturas = async () => {

  const snapshot = await getDocs(
    collection(db, "facturas")
  );

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));

};


// =====================================================
// OBTENER INVENTARIO
// =====================================================

export const obtenerDatosInventario = async () => {

  const snapshot = await getDocs(
    collection(db, "inventario")
  );

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));

};