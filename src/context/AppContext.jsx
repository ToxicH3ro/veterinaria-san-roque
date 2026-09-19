"use client";

import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cargandoApp, setCargandoApp] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
  };

  const mostrarError = (texto) => {
    setError(texto);
  };

  const limpiarMensajes = () => {
    setMensaje("");
    setError("");
  };

  return (
    <AppContext.Provider
      value={{
        cargandoApp,
        setCargandoApp,
        mensaje,
        error,
        mostrarMensaje,
        mostrarError,
        limpiarMensajes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}