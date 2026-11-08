"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  obtenerMascotasDeUsuario,
  registrarMascota,
} from "@/services/petService";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function Mascotas() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Obtener el icono según la especie.
  const obtenerIcono = (especie) => {
    const tipo = especie.toLowerCase().trim();

    if (tipo.includes("gato")) return "🐱";
    if (tipo.includes("perro")) return "🐶";
    if (tipo.includes("conejo")) return "🐇";
    if (tipo.includes("lagartija")) return "🦎";
    if (tipo.includes("tortuga")) return "🐢";
    if (tipo.includes("periquito") || tipo.includes("ave")) return "🦜";

    return "🐾";
  };

  // Cargar las mascotas del usuario autenticado.
  const cargarMascotas = useCallback(async () => {
    if (cargandoAuth) return;

    if (!usuario?.uid) {
      setMascotas([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const resultado = await obtenerMascotasDeUsuario(usuario.uid);

      setMascotas(resultado);
    } catch (error) {
      console.error("Error al cargar las mascotas:", error);
      setError("No se pudieron cargar tus mascotas.");
    } finally {
      setCargando(false);
    }
  }, [usuario?.uid, cargandoAuth]);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  // Limpiar el formulario.
  const limpiarFormulario = () => {
    setNombre("");
    setEspecie("");
    setRaza("");
    setError("");
  };

  // Abrir el modal de registro.
  const abrirModal = () => {
    limpiarFormulario();
    setMensaje("");
    setModalVisible(true);
  };

  // Cerrar el modal.
  const cerrarModal = () => {
    if (guardando) return;

    setModalVisible(false);
    limpiarFormulario();
  };

  // Registrar una nueva mascota.
  const manejarRegistro = async (e) => {
    e.preventDefault();

    if (!nombre.trim() || !especie.trim() || !raza.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (nombre.trim().length > 60) {
      setError("El nombre no puede superar los 60 caracteres.");
      return;
    }

    if (especie.trim().length > 40) {
      setError("La especie no puede superar los 40 caracteres.");
      return;
    }

    if (raza.trim().length > 60) {
      setError("La raza no puede superar los 60 caracteres.");
      return;
    }

    if (!usuario?.uid) {
      setError("No se pudo identificar al usuario.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await registrarMascota({
        nombre,
        especie,
        raza,
        usuarioId: usuario.uid,
      });

      limpiarFormulario();
      setModalVisible(false);

      setMensaje("¡Mascota registrada correctamente!");

      await cargarMascotas();
    } catch (error) {
      console.error("Error al registrar la mascota:", error);
      setError("No se pudo registrar la mascota. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#112250]">
            Mis Mascotas
          </h1>

          <p className="text-gray-600 mt-2">
            Consulta y administra tus mascotas registradas.
          </p>
        </div>

        <Button onClick={abrirModal}>
          + Registrar mascota
        </Button>
      </div>

      {/* Mensaje de éxito */}
      {mensaje && (
        <div className="bg-green-100 border border-green-300 text-green-700 rounded-lg p-4">
          {mensaje}
        </div>
      )}

      {/* Mensaje de error */}
      {error && !modalVisible && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Lista de mascotas */}
      <Card
        title="Mis mascotas"
        description="Aquí encontrarás todas tus mascotas registradas."
      >
        {cargandoAuth || cargando ? (
          <p className="text-gray-600 text-center py-8">
            Cargando mascotas...
          </p>
        ) : error && mascotas.length === 0 ? (
          <p className="text-red-600 text-center py-8">
            {error}
          </p>
        ) : mascotas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-5xl mb-4">🐾</p>

            <h2 className="text-xl font-semibold text-[#112250]">
              No tienes mascotas registradas
            </h2>

            <p className="text-gray-600 mt-2">
              Registra tu primera mascota para que aparezca aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {mascotas.map((mascota) => (
              <div
                key={mascota.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">
                    {obtenerIcono(mascota.especie)}
                  </span>

                  <div>
                    <h2 className="text-xl font-bold text-[#112250]">
                      {mascota.nombre}
                    </h2>

                    <p className="text-gray-600">
                      {mascota.especie}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4">
                  <p className="text-sm text-gray-500">
                    Raza
                  </p>

                  <p className="font-medium text-gray-800">
                    {mascota.raza || "No especificada"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de registro */}
      <Modal
        isOpen={modalVisible}
        onClose={cerrarModal}
        title="Registrar nueva mascota"
      >
        <form onSubmit={manejarRegistro} className="space-y-5">

          <Input
            label="Nombre de la mascota"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Max"
            required
            disabled={guardando}
          />

          <Input
            label="Especie"
            name="especie"
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            placeholder="Ej. Perro, Gato, Conejo..."
            required
            disabled={guardando}
          />

          <Input
            label="Raza"
            name="raza"
            value={raza}
            onChange={(e) => setRaza(e.target.value)}
            placeholder="Ej. Labrador, Siamés..."
            required
            disabled={guardando}
          />

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={guardando}
            >
              {guardando ? "Registrando..." : "Guardar mascota"}
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
