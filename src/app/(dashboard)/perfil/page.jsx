"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { actualizarDocumento } from "@/lib/firestore";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function PerfilPage() {
  const { usuario, cargando } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Cargar información del usuario autenticado
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setApellido(usuario.apellido || "");
      setTelefono(usuario.telefono || "");
      setDireccion(usuario.direccion || "");
    }
  }, [usuario]);

  // Restaurar los datos originales al cancelar
  const cancelarEdicion = () => {
    setNombre(usuario?.nombre || "");
    setApellido(usuario?.apellido || "");
    setTelefono(usuario?.telefono || "");
    setDireccion(usuario?.direccion || "");

    setEditando(false);
    setMensaje("");
    setError("");
  };

  // Guardar cambios en Firestore
  const guardarCambios = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!usuario?.uid) {
      setError("No se pudo identificar la cuenta autenticada.");
      return;
    }

    if (!nombre.trim() || !apellido.trim()) {
      setError("El nombre y el apellido son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      const datosActualizados = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      };

      await actualizarDocumento(
        "usuarios",
        usuario.uid,
        datosActualizados
      );

      setMensaje("¡Tu perfil se actualizó correctamente!");
      setEditando(false);

    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setError("No se pudieron guardar los cambios. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-[#112250] font-semibold">
          Cargando perfil...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <Card>
        <p className="text-center text-gray-600">
          No se encontró una sesión autenticada.
        </p>
      </Card>
    );
  }

  const nombreCompleto =
    `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();

  const inicial = nombreCompleto
    ? nombreCompleto.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-[#112250]">
          Mi perfil
        </h1>

        <p className="text-gray-500 mt-2">
          Consulta y administra tu información personal.
        </p>
      </div>

      {/* Información principal */}
      <Card className="overflow-hidden">

        <div className="flex flex-col sm:flex-row items-center gap-5">

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-[#112250] flex items-center justify-center shadow-md">
            <span className="text-4xl font-bold text-white">
              {inicial}
            </span>
          </div>

          {/* Datos principales */}
          <div className="text-center sm:text-left flex-1">

            <h2 className="text-2xl font-bold text-[#112250]">
              {nombreCompleto || "Usuario"}
            </h2>

            <p className="text-gray-500 mt-1">
              {usuario.correo || usuario.email || "Correo no disponible"}
            </p>

            <span className="inline-block mt-3 px-4 py-1 rounded-full bg-[#8FBFE3]/30 text-[#112250] text-sm font-semibold capitalize">
              {usuario.rol || "Sin rol asignado"}
            </span>

          </div>

          {/* Acción de edición */}
          {!editando && (
            <Button
              variant="primary"
              onClick={() => {
                setMensaje("");
                setError("");
                setEditando(true);
              }}
            >
              ✏️ Editar perfil
            </Button>
          )}

        </div>

      </Card>

      {/* Mensajes */}
      {mensaje && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Formulario de información personal */}
      <Card
        title="Información personal"
        description="Datos asociados a tu cuenta de Veterinaria San Roque."
      >

        <form onSubmit={guardarCambios}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <Input
              label="Nombre"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre"
              disabled={!editando || guardando}
              required
            />

            <Input
              label="Apellido"
              name="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ingresa tu apellido"
              disabled={!editando || guardando}
              required
            />

            <Input
              label="Teléfono"
              name="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ingresa tu teléfono"
              disabled={!editando || guardando}
            />

            <Input
              label="Dirección"
              name="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ingresa tu dirección"
              disabled={!editando || guardando}
            />

          </div>

          {/* Acciones del formulario */}
          {editando && (
            <div className="flex flex-wrap justify-end gap-3 mt-8">

              <Button
                variant="outline"
                onClick={cancelarEdicion}
                disabled={guardando}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "💾 Guardar cambios"}
              </Button>

            </div>
          )}

        </form>

      </Card>

      {/* Información de la cuenta */}
      <Card
        title="Información de la cuenta"
        description="Información de identificación de tu cuenta."
      >

        <div className="space-y-5">

          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">
              CORREO ELECTRÓNICO
            </p>

            <p className="text-gray-800 font-medium break-all">
              {usuario.correo || usuario.email || "No disponible"}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-sm font-semibold text-gray-500 mb-1">
              TIPO DE CUENTA
            </p>

            <p className="text-gray-800 font-medium capitalize">
              {usuario.rol || "No especificado"}
            </p>
          </div>

        </div>

      </Card>

    </div>
  );
}
