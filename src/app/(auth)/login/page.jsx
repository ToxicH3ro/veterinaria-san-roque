"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  iniciarSesion,
  iniciarSesionConGoogle,
  iniciarSesionConFacebook,
  vincularFacebookConGoogle,
  hayCredencialFacebookPendiente,
} from "@/services/authService";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [facebookPendiente, setFacebookPendiente] = useState(false);

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

  const handleGoogleLogin = async () => {
  setMensaje("");
  setCargando(true);

  try {
    await iniciarSesionConGoogle();

    // Si existe una credencial de Facebook pendiente,
    // vincularla con la cuenta autenticada de Google.
    if (hayCredencialFacebookPendiente()) {
      await vincularFacebookConGoogle();
      setFacebookPendiente(false);

      console.log("Facebook vinculado correctamente con Google.");
    }
    router.push("/inicio");
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);

    if (error.code === "auth/popup-closed-by-user") {
      setMensaje("Se canceló el inicio de sesión con Google.");
    } else if (error.code === "auth/popup-blocked") {
      setMensaje("El navegador bloqueó la ventana de Google.");
    } else if (error.code === "auth/credential-already-in-use") {
      setMensaje("Esta cuenta de Facebook ya está vinculada a otra cuenta.");
    } else if (error.code === "auth/provider-already-linked") {
      setMensaje("Facebook ya está vinculado a esta cuenta.");
    } else {
      setMensaje(
        error.message || "No se pudo completar el inicio de sesión."
      );
    }

  } finally {
    setCargando(false);
  }
};

  // =====================================================
  // INICIAR SESIÓN CON FACEBOOK
  // =====================================================

  const handleFacebookLogin = async () => {
  setMensaje("");
  setCargando(true);

  try {
    await iniciarSesionConFacebook();
    setFacebookPendiente(false);

    router.push("/inicio");

  } catch (error) {
    console.error("Error al iniciar sesión con Facebook:", error);
    if (error.code === "auth/popup-closed-by-user") {
      setMensaje("Se canceló el inicio de sesión con Facebook.");
    } else if (error.code === "auth/popup-blocked") {
      setMensaje("El navegador bloqueó la ventana de Facebook.");
    } else if (error.code === "auth/account-exists-with-different-credential") {

      setFacebookPendiente(hayCredencialFacebookPendiente());

      setMensaje(
        "Ya existe una cuenta con este correo. Continúa con Google para vincular tu cuenta de Facebook."
      );

    } else if (error.code === "auth/operation-not-allowed") {
      setMensaje("El inicio de sesión con Facebook no está habilitado.");

    } else {
      setMensaje("No se pudo iniciar sesión con Facebook.");
    }

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

            {/* Boton Google */}
            <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-gray-300"></div>

            <span className="text-sm text-gray-400">
            O continúa con
            </span>

          <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* GOOGLE */}
          <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-lg transition"
          >
        <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
        />
{cargando
  ? "Conectando..."
  : facebookPendiente
    ? "Continuar con Google y vincular Facebook"
    : "Continuar con Google"}
</button>


{/* FACEBOOK */}
<button
  type="button"
  onClick={handleFacebookLogin}
  disabled={cargando}
  className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-lg transition"
>
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg"
    alt="Facebook"
    className="w-5 h-5"
  />

  {cargando ? "Conectando..." : "Continuar con Facebook"}
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