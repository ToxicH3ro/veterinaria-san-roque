"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { iniciarSesion } from "@/services/authService";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const router = useRouter();

  const handleLogin = async (e) => {
  e.preventDefault();

  setMensaje("");
  setCargando(true);

  try {
    await iniciarSesion(correo, contrasena);

    router.push("/inicio");

  } catch (error) {
    console.error(error);
    setMensaje("Correo o contraseña incorrectos.");
  } finally {
    setCargando(false);
  }
  };

  return (
    <main className="min-h-screen bg-[#8FBFE3] flex items-center justify-center px-4">

      <div className="w-full max-w-md">


        {/* Tarjeta */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          <div className="mb-6">
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

            <h2 className="text-2xl font-bold text-[#112250]">
              Iniciar sesión
            </h2>

            <p className="text-gray-500 mt-1">
              Ingresa tus datos para continuar
            </p>

          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Correo */}
            <div>

              <label className="block text-sm font-semibold text-[#112250] mb-2">
                📧 Correo electrónico
              </label>

              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3]"
              />

            </div>

            {/* Contraseña */}
            <div>

              <label className="block text-sm font-semibold text-[#112250] mb-2">
                🔒 Contraseña
              </label>

              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3]"
              />

            </div>

            {/* Error */}
            {mensaje && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                ⚠️ {mensaje}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#E57A3A] hover:bg-[#d96d2f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition shadow-md"
            >
              {cargando ? "Iniciando sesión..." : "🐾 Iniciar sesión"}
            </button>

          </form>

          {/* Registro */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">

            <p className="text-gray-500 text-sm">
              ¿No tienes una cuenta?
            </p>

            <Link
              href="/register"
              className="inline-block mt-2 text-[#112250] font-semibold hover:text-[#E57A3A] transition"
            >
              Crear una cuenta →
            </Link>

          </div>

        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © 2026 Veterinaria San Roque
        </p>

      </div>

    </main>
  );
}