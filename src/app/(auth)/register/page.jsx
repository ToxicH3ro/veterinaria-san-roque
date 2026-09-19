"use client";

import { useState } from "react";
import Link from "next/link";
import { registrarUsuario } from "@/services/authService";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleRegister = async (e) => {
  e.preventDefault();

  setMensaje("");

  if (contrasena !== confirmarContrasena) {
    setMensaje("Las contraseñas no coinciden.");
    return;
  }

  setCargando(true);

  try {
    await registrarUsuario({
      nombre,
      apellido,
      correo,
      telefono,
      direccion,
      contrasena,
    });

    setMensaje("Cuenta creada correctamente.");

    // Limpiar formulario
    setNombre("");
    setApellido("");
    setCorreo("");
    setTelefono("");
    setDireccion("");
    setContrasena("");
    setConfirmarContrasena("");

  } catch (error) {
    console.error(error);

    if (error.code === "auth/email-already-in-use") {
      setMensaje("Este correo electrónico ya está registrado.");
    } else if (error.code === "auth/weak-password") {
      setMensaje("La contraseña debe tener al menos 6 caracteres.");
    } else if (error.code === "auth/invalid-email") {
      setMensaje("El correo electrónico no es válido.");
    } else {
      setMensaje("No se pudo crear la cuenta.");
    }

  } finally {
    setCargando(false);
  }
};

  return (
    <main className="min-h-screen bg-[#112250] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* TARJETA */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

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

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-[#112250]">
              Crear una cuenta
            </h2>

            <p className="text-gray-500 mt-1">
              Completa tus datos para registrarte
            </p>

          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* NOMBRE Y APELLIDO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* NOMBRE */}
              <div>

                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  👤 Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3]"
                />

              </div>

              {/* APELLIDO */}
              <div>

                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  👤 Apellido
                </label>

                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Tu apellido"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3]"
                />

              </div>

            </div>

            {/* CORREO Y TELÉFONO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* CORREO */}
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

              {/* TELÉFONO */}
              <div>

                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  📞 Teléfono
                </label>

                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="0000-0000"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3]"
                />

              </div>

            </div>

            {/* DIRECCIÓN */}
            <div>

              <label className="block text-sm font-semibold text-[#112250] mb-2">
                📍 Dirección
              </label>

              <textarea
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ingresa tu dirección"
                rows="3"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3] resize-none"
              />

            </div>

            {/* CONTRASEÑAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* CONTRASEÑA */}
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

              {/* CONFIRMAR */}
              <div>

                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  🔒 Confirmar contraseña
                </label>

                <input
                  type="password"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none transition focus:ring-2 focus:ring-[#8FBFE3] focus:border-[#8FBFE3]"
                />

              </div>

            </div>

            {/* MENSAJE */}
            {mensaje && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  mensaje === "Cuenta creada correctamente."
                    ? "bg-green-50 border border-green-200 text-green-600"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {mensaje === "Cuenta creada correctamente."
                  ? "✓"
                  : "⚠️"}{" "}
                {mensaje}
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#E57A3A] hover:bg-[#d96d2f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition shadow-md"
            >
              {cargando
                ? "Creando cuenta..."
                : "🐾 Crear cuenta"}
            </button>

          </form>

          {/* LOGIN */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">

            <p className="text-gray-500 text-sm">
              ¿Ya tienes una cuenta?
            </p>

            <Link
              href="/login"
              className="inline-block mt-2 text-[#112250] font-semibold hover:text-[#E57A3A] transition"
            >
              Iniciar sesión →
            </Link>

          </div>

        </div>

        {/* FOOTER */}
        <p className="text-center text-white/50 text-xs mt-6">
          © 2026 Veterinaria San Roque
        </p>

      </div>

    </main>
  );
}