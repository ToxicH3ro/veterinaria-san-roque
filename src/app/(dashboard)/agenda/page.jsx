"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  crearCita,
  obtenerCitas,
  actualizarEstadoCita,
} from "@/services/citasService";

export default function AgendaPage() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  const [cita, setCita] = useState({
    mascota: "",
    fecha: "",
    hora: "",
    tipo: "",
    motivo: "",
  });

  useEffect(() => {
  if (!usuario) {
    return;
  }

  const cargarCitas = async () => {
    try {
      const datos = await obtenerCitas(usuario);
      setCitas(datos);
    } catch (error) {
      console.error(
        "Error al obtener las citas:",
        error
      );
    } finally {
      setCargando(false);
    }
  };

  cargarCitas();
}, [usuario]);

  const handleChange = (e) => {
    setCita({
      ...cita,
      [e.target.name]: e.target.value,
    });
  };

  const handleAgendar = async (e) => {
  e.preventDefault();

  console.log("FORMULARIO ENVIADO");
  console.log("Datos de la cita:", cita);

  try {
    const nuevaCita = await crearCita(cita, usuario);

    console.log("Cita creada:", nuevaCita);

    setCitas((citasActuales) => [
      ...citasActuales,
      nuevaCita,
    ]);

    setMostrarModal(false);

    setCita({
      mascota: "",
      fecha: "",
      hora: "",
      tipo: "",
      motivo: "",
    });

  } catch (error) {
    console.error("Error al agendar la cita:", error);
  }
};


const handleCambiarEstado = async (
  citaId,
  nuevoEstado
) => {
  try {
    await actualizarEstadoCita(
      citaId,
      nuevoEstado
    );

    setCitas((citasActuales) =>
      citasActuales.map((cita) =>
        cita.id === citaId
          ? {
              ...cita,
              estado: nuevoEstado,
            }
          : cita
      )
    );
  } catch (error) {
    console.error(
      "Error al actualizar el estado de la cita:",
      error
    );
  }
};


const citasFiltradas = citas.filter((cita) => {
  const texto = busqueda.toLowerCase();

  return (
    cita.mascota
      ?.toLowerCase()
      .includes(texto) ||

    cita.tipo
      ?.toLowerCase()
      .includes(texto) ||

    cita.motivo
      ?.toLowerCase()
      .includes(texto) ||

    cita.fecha
      ?.toLowerCase()
      .includes(texto)
  );
});

  return (
    <main>
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#112250]">
            📅 Agenda
          </h1>

          <p className="text-gray-500 mt-1">
            Gestiona las citas de la Veterinaria San Roque
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold px-5 py-3 rounded-lg shadow-md transition"
        >
          ➕ Agendar cita
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-md p-5 mt-8">
        <label className="block text-sm font-semibold text-[#112250] mb-2">
          🔎 Buscar cita
        </label>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por mascota, propietario o fecha..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
        />
      </div>

      {/* LISTADO DE CITAS */}
      <div className="bg-white rounded-xl shadow-md mt-6 overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-[#112250]">
            {usuario?.rol === "veterinario"
              ? "📋 Todas las citas"
              : "📋 Mis citas"}
          </h2>
        </div>

        {/* CITA DE PRUEBA */}
        <div className="p-5 border-b hover:bg-gray-50 transition">
          {cargando ? (
  <div className="p-6 text-center text-gray-500">
    Cargando citas...
  </div>
) : citas.length === 0 ? (
  <div className="p-6 text-center text-gray-500">
    No hay citas registradas.
  </div>
) : (
  citasFiltradas.map((cita) =>  (
    <div
      key={cita.id}
      className="p-5 border-b hover:bg-gray-50 transition"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

        {/* INFORMACIÓN DE LA CITA */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#112250]">
            🐶 {cita.mascota}
          </h3>

          <p className="text-gray-600 mt-1">
            🩺 {cita.tipo}
          </p>

          <p className="text-gray-500 text-sm mt-2">
            📝 Motivo: {cita.motivo}
          </p>
        </div>

        {/* FECHA Y HORA */}
        <div className="lg:min-w-56">
          <p className="text-gray-600">
            📅 <strong>{cita.fecha}</strong>
          </p>

          <p className="text-gray-600 mt-2">
            🕐 <strong>{cita.hora}</strong>
          </p>
        </div>

        {/* ESTADO */}
<div>

  {usuario?.rol === "veterinario" ? (

    <select
      value={cita.estado || "Pendiente"}
      onChange={(e) =>
        handleCambiarEstado(
          cita.id,
          e.target.value
        )
      }
      className="border border-gray-300 rounded-lg px-4 py-2 bg-[#F6EBC3] text-[#112250] font-semibold outline-none focus:ring-2 focus:ring-[#8FBFE3]"
    >
      <option value="Pendiente">
        Pendiente
      </option>

      <option value="Confirmada">
        Confirmada
      </option>

      <option value="En consulta">
        En consulta
      </option>

      <option value="Completada">
        Completada
      </option>

      <option value="Cancelada">
        Cancelada
      </option>

    </select>

  ) : (

    <span className="inline-block bg-[#F6EBC3] text-[#112250] px-4 py-2 rounded-full text-sm font-semibold">
      {cita.estado || "Pendiente"}
    </span>

  )}

</div>

      </div>
    </div>
  ))
)}
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* ENCABEZADO DEL MODAL */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-[#112250]">
                  📅 Agendar nueva cita
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Completa los datos de la consulta
                </p>
              </div>

              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleAgendar} className="p-6 space-y-5">

              {/* MASCOTA */}
              <div>
                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  🐶 Mascota
                </label>

                <input
                  type="text"
                  name="mascota"
                  value={cita.mascota}
                  onChange={handleChange}
                  placeholder="Nombre de la mascota"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                />
              </div>

              {/* FECHA */}
              <div>
                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  📅 Fecha
                </label>

                <input
                  type="date"
                  name="fecha"
                  value={cita.fecha}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                />
              </div>

              {/* HORA */}
              <div>
                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  🕐 Hora
                </label>

                <input
                  type="time"
                  name="hora"
                  value={cita.hora}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                />
              </div>

              {/* TIPO */}
              <div>
                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  🩺 Tipo de consulta
                </label>

                <select
                  name="tipo"
                  value={cita.tipo}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                >
                  <option value="">
                    Selecciona un tipo
                  </option>

                  <option value="Consulta general">
                    Consulta general
                  </option>

                  <option value="Vacunación">
                    Vacunación
                  </option>

                  <option value="Revisión">
                    Revisión
                  </option>

                  <option value="Desparasitación">
                    Desparasitación
                  </option>

                  <option value="Emergencia">
                    Emergencia
                  </option>

                </select>
              </div>

              {/* MOTIVO */}
              <div>
                <label className="block text-sm font-semibold text-[#112250] mb-2">
                  📝 Motivo de la consulta
                </label>

                <textarea
                  name="motivo"
                  value={cita.motivo}
                  onChange={handleChange}
                  placeholder="Describe brevemente el motivo de la consulta..."
                  rows="4"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3] resize-none"
                />
              </div>

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-5 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-3 rounded-lg bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold transition"
                >
                  📅 Agendar cita
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </main>
  );
}