"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { cerrarSesion as cerrarSesionService } from "@/services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (usuarioFirebase) => {

        console.log("AUTH FIREBASE:", usuarioFirebase);

        if (usuarioFirebase) {
          const documentoUsuario = await getDoc(
            doc(db, "usuarios", usuarioFirebase.uid)
          );

          if (documentoUsuario.exists()) {
            console.log(
              "USUARIO FIRESTORE:",
              documentoUsuario.data()
            );

            setUsuario({
              uid: usuarioFirebase.uid,
              ...documentoUsuario.data(),
            });
          } else {
            setUsuario({
              uid: usuarioFirebase.uid,
              correo: usuarioFirebase.email,
            });
          }
        } else {
          setUsuario(null);
        }

        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const cerrarSesion = async () => {
  await cerrarSesionService();
};

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}