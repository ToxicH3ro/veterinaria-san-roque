"use client";
import { useAuth } from "@/context/AuthContext";
export const fechaActual = new Date().toLocaleDateString('es-ES');
export default function Header() {
  const { usuario } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">

      {/* IZQUIERDA */}
      <div>
        <h1 className="text-xl font-bold text-[#112250]">
          Veterinaria San Roque
        </h1>

        <p className="text-sm text-gray-500">
          Sistema de gestión veterinaria
        </p>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-4">

        <div className="text-right">
          <p className="font-semibold text-[#112250]">
            {usuario?.nombre} {usuario?.apellido}
          </p>

          <p className="text-sm text-gray-500">
            {usuario?.rol}
          </p>
        </div>

        <div className="w-11 h-11 rounded-full bg-[#8FBFE3] flex items-center justify-center text-[#112250] font-bold text-lg">
          {usuario?.nombre?.charAt(0)}
          {usuario?.apellido?.charAt(0)}
        </div>

      </div>

    </header>
  );
}