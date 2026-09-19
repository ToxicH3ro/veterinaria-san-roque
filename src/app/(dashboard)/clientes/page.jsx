"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerUsuarios,
  eliminarCliente,
} from "@/services/clientesService";

export default function ClientesPage() {
  const { usuario } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const usuarios = await obtenerUsuarios();

        // Solamente los usuarios con rol "usuario"
        const clientesRegistrados = usuarios.filter(
          (usuario) => usuario.rol === "usuario"
        );

        setClientes(clientesRegistrados);
      } catch (error) {
        console.error(
          "Error al obtener los clientes:",
          error
        );
      } finally {
        setCargando(false);
      }
    };

    cargarClientes();
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.apellido?.toLowerCase().includes(texto) ||
      cliente.correo?.toLowerCase().includes(texto)
    );
  });

  const handleEliminarCliente = async (cliente) => {
  const confirmar = window.confirm(
    `¿Estás seguro de eliminar al cliente ${cliente.nombre} ${cliente.apellido}?`
  );

  if (!confirmar) {
    return;
  }

  try {
    setEliminando(cliente.id);

    await eliminarCliente(cliente.id);

    setClientes((clientesActuales) =>
      clientesActuales.filter(
        (clienteActual) => clienteActual.id !== cliente.id
      )
    );

  } catch (error) {
    console.error(
      "Error al eliminar el cliente:",
      error
    );

    alert("No se pudo eliminar el cliente.");

  } finally {
    setEliminando(null);
  }
};

  return (
    <main>
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-3xl font-bold text-[#112250]">
          👥 Clientes
        </h1>

        <p className="text-gray-500 mt-1">
          Usuarios registrados en la Veterinaria San Roque
        </p>
      </div>

      {/* BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-md p-5 mt-8">
        <label className="block text-sm font-semibold text-[#112250] mb-2">
          🔎 Buscar cliente
        </label>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido o correo..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
        />
      </div>

      {/* LISTADO */}
      <div className="bg-white rounded-xl shadow-md mt-6 overflow-hidden">

        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-[#112250]">
            📋 Clientes registrados
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Los clientes aparecen automáticamente al registrarse
            en el sistema.
          </p>
        </div>

        {cargando ? (
          <div className="p-6 text-center text-gray-500">
            Cargando clientes...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {busqueda
              ? "No se encontraron clientes."
              : "No hay clientes registrados."}
          </div>
        ) : (
          <div>
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="p-5 border-b hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>
                    <h3 className="text-lg font-bold text-[#112250]">
                      👤 {cliente.nombre} {cliente.apellido}
                    </h3>

                    <p className="text-gray-600 mt-1">
                      📧 {cliente.correo}
                    </p>

                    {cliente.telefono && (
                      <p className="text-gray-600 mt-1">
                        📞 {cliente.telefono}
                      </p>
                    )}
                  </div>

                  <span className="text-sm text-[#112250] font-semibold">
                    Ver información →
                  </span>
                  {usuario?.rol === "veterinario" && (
                  <button
                  onClick={() => handleEliminarCliente(cliente)}
                  disabled={eliminando === cliente.id}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                  {eliminando === cliente.id
                  ? "Eliminando..."
                  : "🗑️ Eliminar"}
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}