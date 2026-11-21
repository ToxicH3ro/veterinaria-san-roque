"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";

import {
  crearCita,
  obtenerCitas,
  actualizarEstadoCita,
} from "@/services/citasService";

import {
  obtenerMascotasDeUsuario,
} from "@/services/petService";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AppointmentCard from "@/components/ui/AppointmentCard";

export default function AgendaPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  // Información
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);

  // Estados de carga
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Interfaz
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  // Mensajes
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Formulario
  const [cita, setCita] = useState({
    mascota: "",
    fecha: "",
    hora: "",
    tipo: "",
  });

  // Cargar información de la agenda
  const cargarDatos = useCallback(async () => {
    if (cargandoAuth) return;

    if (!usuario?.uid) {
      setCitas([]);
      setMascotas([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      if (usuario.rol === "veterinario") {
        const resultadoCitas = await obtenerCitas(usuario);

        setCitas(resultadoCitas);
        setMascotas([]);
      } else {
        const [resultadoCitas, resultadoMascotas] =
          await Promise.all([
            obtenerCitas(usuario),
            obtenerMascotasDeUsuario(usuario.uid),
          ]);

        setCitas(resultadoCitas);
        setMascotas(resultadoMascotas);
      }
    } catch (error) {
      console.error(
        "Error al cargar la agenda:",
        error
      );

      setError("No se pudo cargar la información de la agenda.");
    } finally {
      setCargando(false);
    }
  }, [usuario, cargandoAuth]);

  // Ejecutar la carga cuando exista un usuario autenticado
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);


  // Actualizar campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setCita((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setCita({
      mascota: "",
      fecha: "",
      hora: "",
      tipo: "",
    });

    setError("");
  };

  // Agendar una nueva cita
  const handleAgendar = async (e) => {
    e.preventDefault();

    if (!usuario?.uid) {
      setError("No hay un usuario autenticado.");
      return;
    }

    if (!cita.mascota || !cita.tipo || !cita.fecha || !cita.hora) {
      setError("Completa todos los campos.");
      return;
    }

    const mascotaSeleccionada = mascotas.find(
      (mascota) => mascota.id === cita.mascota
    );

    if (!mascotaSeleccionada) {
      setError("Selecciona una mascota válida.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const nuevaCita = await crearCita(
        {
          mascota: mascotaSeleccionada.nombre,
          tipo: cita.tipo,
          fecha: cita.fecha,
          hora: cita.hora,
        },
        usuario
      );

      setCitas((actuales) =>
        [...actuales, nuevaCita].sort((a, b) => {
          const fechaA = `${a.fecha || ""} ${a.hora || ""}`;
          const fechaB = `${b.fecha || ""} ${b.hora || ""}`;

          return fechaA.localeCompare(fechaB);
        })
      );

      limpiarFormulario();
      setMostrarModal(false);
      setMensaje("La cita se ha registrado correctamente.");
    } catch (error) {
      console.error("Error al agendar cita:", error);
      setError("No se pudo registrar la cita. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  };


  const tiposServicio = [
    "Consulta general",
    "Vacunación",
    "Desparasitación",
    "Control veterinario",
    "Emergencia",
  ];

  // Fecha mínima en horario local
  const fechaMinima = (() => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  })();


  // Cambiar estado de una cita
  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      setError("");
      setMensaje("");

      await actualizarEstadoCita(citaId, nuevoEstado);

      setCitas((actuales) =>
        actuales.map((cita) =>
          cita.id === citaId
            ? { ...cita, estado: nuevoEstado.toLowerCase() }
            : cita
        )
      );

      setMensaje("El estado de la cita se actualizó correctamente.");
    } catch (error) {
      console.error("Error al actualizar la cita:", error);
      setError("No se pudo actualizar el estado de la cita.");
    }
  };

  // Filtrar citas por búsqueda
  const citasFiltradas = citas.filter((cita) => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) return true;

    return (
      (cita.mascota || "").toLowerCase().includes(termino) ||
      (cita.tipo || "").toLowerCase().includes(termino) ||
      (cita.fecha || "").toLowerCase().includes(termino) ||
      (cita.hora || "").toLowerCase().includes(termino)
    );
  });

  return (
    <main className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Agenda
          </h1>

          <p className="text-gray-600">
            {usuario?.rol === "veterinario"
              ? "Administración de citas veterinarias"
              : "Consulta y administra tus citas veterinarias"}
          </p>
        </div>

        {usuario?.rol === "usuario" && (
          <Button
            onClick={() => {
              limpiarFormulario();
              setMostrarModal(true);
            }}
            disabled={cargando || mascotas.length === 0}
          >
            Agendar cita
          </Button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg">
          {mensaje}
        </div>
      )}

      {/* Información */}
      <Card title="Resumen de agenda">
        {cargandoAuth || cargando ? (
          <p className="text-gray-600 text-center py-4">
            Cargando información...
          </p>
        ) : (
          <div className="space-y-2">
            <p>
              <strong>Citas registradas:</strong> {citas.length}
            </p>

            {usuario?.rol === "usuario" && (
              <p>
                <strong>Mascotas registradas:</strong> {mascotas.length}
              </p>
            )}

            {usuario?.rol === "usuario" && mascotas.length === 0 && (
              <p className="text-amber-700">
                Primero debes registrar una mascota para poder agendar una cita.
              </p>
            )}
          </div>
        )}
      </Card>


      {/* Buscador */}
      <Card title="Citas registradas">
        <div className="mb-5">
          <Input
            label="Buscar cita"
            name="busqueda"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por mascota, servicio, fecha u hora..."
            className="w-full"
          />
        </div>

        {/* Lista de citas */}
        {cargandoAuth || cargando ? (
          <p className="text-gray-600 text-center py-6">
            Cargando citas...
          </p>
        ) : citasFiltradas.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No se encontraron citas registradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {citasFiltradas.map((cita) => (
              <AppointmentCard
                key={cita.id}
                cita={cita}
                onCambiarEstado={
                  usuario?.rol === "veterinario"
                    ? handleCambiarEstado
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </Card>


      {/* Modal de agendamiento */}
      <Modal
        isOpen={mostrarModal}
        onClose={() => {
          setMostrarModal(false);
          limpiarFormulario();
        }}
        title="Agendar nueva cita"
        size="lg"
      >
        <form onSubmit={handleAgendar} className="space-y-4">
          {/* Mascota */}
          <div>
            <label
              htmlFor="mascota"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mascota
            </label>

            <select
              id="mascota"
              name="mascota"
              value={cita.mascota}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Selecciona una mascota</option>

              {mascotas.map((mascota) => (
                <option key={mascota.id} value={mascota.id}>
                  {mascota.nombre} - {mascota.especie}
                </option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label
              htmlFor="tipo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Servicio veterinario
            </label>

            <select
              id="tipo"
              name="tipo"
              value={cita.tipo}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Selecciona un servicio</option>

              {tiposServicio.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <Input
            label="Fecha de la cita"
            name="fecha"
            type="date"
            value={cita.fecha}
            onChange={handleChange}
            required
            className="w-full"
          />

          {/* Hora */}
          <Input
            label="Hora de la cita"
            name="hora"
            type="time"
            value={cita.hora}
            onChange={handleChange}
            required
            className="w-full"
          />

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMostrarModal(false);
                limpiarFormulario();
              }}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={guardando}
            >
              {guardando ? "Agendando..." : "Confirmar cita"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
