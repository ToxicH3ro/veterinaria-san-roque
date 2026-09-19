"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();
  const router = useRouter();

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesion();

      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-[#112250] text-white p-6 flex flex-col">

      {/* Identidad de la veterinaria */}
      <div className="text-center mb-8">

        {/* Nombre */}
        <h2 className="text-2xl font-bold">
          Veterinaria San Roque
        </h2>

        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="items-center justify-center overflow-hidden">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2105/2105138.png"
              alt="Veterinaria San Roque"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-3">

        <p className="text-sm font-semibold uppercase text-white/60 mb-1">
          Operaciones
        </p>

        <Link
          href="/inicio"
          className="bg-white/10 hover:bg-[#E57A3A] hover:text-[#112250] text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          🏠 Inicio
        </Link>

        <Link
          href="/agenda"
          className="bg-white/10 hover:bg-[#E57A3A] hover:text-[#112250] text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          📅 Agenda
        </Link>

        {usuario?.rol === "veterinario" && (
          <>
            <Link
              href="/clientes"
              className="bg-white/10 hover:bg-[#E57A3A] hover:text-[#112250] text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              👥 Clientes
            </Link>

            <p className="text-sm font-semibold uppercase text-white/60 mt-4 mb-1">
              Servicios
            </p>

            <Link
              href="/inventario"
              className="bg-white/10 hover:bg-[#E57A3A] hover:text-[#112250] text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              📦 Inventario
            </Link>

            <Link
              href="/facturacion"
              className="bg-white/10 hover:bg-[#E57A3A] hover:text-[#112250] text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              💳 Facturación
            </Link>

            <Link
              href="/reportes"
              className="bg-white/10 hover:bg-[#E57A3A] hover:text-[#112250] text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              📊 Reportes
            </Link>
          </>
        )}

      </nav>

      {/* Usuario y cerrar sesión */}
      <div className="mt-auto pt-6 border-t border-white/20">

        <div className="mb-4">

          <p className="font-semibold">
            👤 {usuario?.nombre} {usuario?.apellido}
          </p>

          <p className="text-sm text-white/60 mt-1">
            {usuario?.correo}
          </p>

          <p className="text-xs text-[#8FBFE3] mt-1 uppercase">
            {usuario?.rol}
          </p>

        </div>

        <button
          onClick={handleCerrarSesion}
          className="w-full bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          🚪 Cerrar sesión
        </button>

      </div>

    </aside>
  );
}
