"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { obtenerCitas } from "@/services/citasService";

export default function InicioPage() {
  const { usuario, cargando } = useAuth();

  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(true);

  
  // CARGAR CITAS
  
  useEffect(() => {
    const cargarCitas = async () => {
      if (!usuario?.uid) {
        setCargandoCitas(false);
        return;
      }

      try {
        const datos = await obtenerCitas(usuario);
        setCitas(datos);
      } catch (error) {
        console.error("Error al cargar citas:", error);
      } finally {
        setCargandoCitas(false);
      }
    };

    cargarCitas();
  }, [usuario]);

  // SALUDO
 
  const hora = new Date().getHours();

  let saludo;

  if (hora < 12) {
    saludo = "Buenos días";
  } else if (hora < 19) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  // FECHA ACTUAL
 
  const ahora = new Date();

  const fechaActual =
    `${ahora.getFullYear()}-${String(
      ahora.getMonth() + 1
    ).padStart(2, "0")}-${String(
      ahora.getDate()
    ).padStart(2, "0")}`;

  // CITAS DE HOY
  const citasHoy = citas.filter(
    (cita) => cita.fecha === fechaActual
  );

  // CITAS PENDIENTES
  const citasPendientes = citas.filter(
    (cita) =>
      cita.estado?.toLowerCase() === "pendiente"
  );

  // CITAS COMPLETADAS

  const citasCompletadas = citas.filter((cita) => {
  const estado = cita.estado?.toLowerCase();

    return (
      estado === "completada" ||
      estado === "completado" ||
      estado === "atendida" ||
      estado === "atendido"
    );
  });

  // CITAS DEL MES ACTUAL
 
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const citasDelMes = citas.filter((cita) => {
    if (!cita.fecha) {
      return false;
    }

    const fecha = new Date(`${cita.fecha}T00:00:00`);

    return (
      fecha.getMonth() === mesActual &&
      fecha.getFullYear() === anioActual
    );
  });

  // PRÓXIMAS CITAS
 
  const proximasCitas = citas
    .filter((cita) => {
      if (!cita.fecha) {
        return false;
      }

      const fechaCita = new Date(
        `${cita.fecha}T${cita.hora || "00:00"}`
      );

      return fechaCita >= ahora;
    })
    .sort((a, b) => {
      const fechaA = `${a.fecha || ""} ${a.hora || ""}`;
      const fechaB = `${b.fecha || ""} ${b.hora || ""}`;

      return fechaA.localeCompare(fechaB);
    })
    .slice(0, 3);

  // FORMATO DE FECHA
 
  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "";
    }

    const fechaCita = new Date(
      `${fecha}T00:00:00`
    );

    return fechaCita.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
    });
  };

  // TEXTO DE FECHA
 
  const obtenerTextoFecha = (cita) => {
    if (!cita.fecha) {
      return "Sin fecha";
    }

    if (cita.fecha === fechaActual) {
      return "Hoy";
    }

    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);

    const mananaTexto =
      `${manana.getFullYear()}-${String(
        manana.getMonth() + 1
      ).padStart(2, "0")}-${String(
        manana.getDate()
      ).padStart(2, "0")}`;

    if (cita.fecha === mananaTexto) {
      return "Mañana";
    }

    return formatearFecha(cita.fecha);
  };

 
  // NOMBRE DEL USUARIO
 
  const nombreUsuario =
    `${usuario?.nombre || ""} ${
      usuario?.apellido || ""
    }`.trim() ||
    usuario?.correo ||
    "Usuario";

 
  // ESPERA DE AUTENTICACIÓN
 
  if (cargando) {
    return (
      <main>
        <p className="text-gray-600">
          Cargando información...
        </p>
      </main>
    );
  }

  return (
    <main>

      {/* ==============================
          ENCABEZADO
      ============================== */}
      <h1 className="text-3xl font-bold text-[#112250]">
        🐾 ¡{saludo}, {nombreUsuario}! 🐾
      </h1>

      <h2 className="text-2xl font-bold text-[#112250] mt-4">
        🐾 ¡Bienvenido a la Veterinaria San Roque! 🐾
      </h2>

      {/* ==============================
          TARJETAS RESUMEN
      ============================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

        {usuario?.rol === "veterinario" ? (
          <>
            {/* CITAS HOY */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
              <h3 className="text-lg font-semibold text-gray-600">
                Citas hoy
              </h3>

              <p className="text-4xl font-bold text-[#112250] mt-2">
                {cargandoCitas ? "..." : citasHoy.length}
              </p>
            </div>

            {/* CONSULTAS DEL MES */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E57A3A]">
              <h3 className="text-lg font-semibold text-gray-600">
                Consultas del mes
              </h3>

              <p className="text-4xl font-bold text-[#112250] mt-2">
                {cargandoCitas ? "..." : citasDelMes.length}
              </p>
            </div>

            {/* CITAS COMPLETADAS */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
              <h3 className="text-lg font-semibold text-gray-600">
                Citas atendidas
              </h3>

              <p className="text-4xl font-bold text-[#112250] mt-2">
                {cargandoCitas
                  ? "..."
                  : citasCompletadas.length}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* MIS CITAS */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
              <h3 className="text-lg font-semibold text-gray-600">
                Mis citas
              </h3>

              <p className="text-4xl font-bold text-[#112250] mt-2">
                {cargandoCitas ? "..." : citas.length}
              </p>
            </div>

            {/* CITAS PENDIENTES */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E57A3A]">
              <h3 className="text-lg font-semibold text-gray-600">
                Citas pendientes
              </h3>

              <p className="text-4xl font-bold text-[#112250] mt-2">
                {cargandoCitas
                  ? "..."
                  : citasPendientes.length}
              </p>
            </div>

            {/* CITAS DE HOY */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
              <h3 className="text-lg font-semibold text-gray-600">
                Citas hoy
              </h3>

              <p className="text-4xl font-bold text-[#112250] mt-2">
                {cargandoCitas
                  ? "..."
                  : citasHoy.length}
              </p>
            </div>
          </>
        )}

      </div>

      {/* ==============================
          CONTENIDO INFERIOR
      ============================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        {/* ==============================
            PRÓXIMAS CITAS
        ============================== */}
        <div className="bg-white rounded-xl shadow-md p-6">

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#112250]">
              📅 Próximas citas
            </h2>

            <span className="text-sm text-gray-500">
              {usuario?.rol === "veterinario"
                ? "Agenda general"
                : "Mis citas"}
            </span>
          </div>

          {cargandoCitas ? (
            <p className="text-gray-500">
              Cargando citas...
            </p>
          ) : proximasCitas.length === 0 ? (
            <p className="text-gray-500">
              No hay próximas citas.
            </p>
          ) : (
            <div className="space-y-3">

              {proximasCitas.map((cita) => (
                <div
                  key={cita.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#F6EBC3]"
                >

                  <div>
                    <p className="font-semibold text-[#112250]">
                      {cita.mascota || "Mascota"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {cita.tipo || "Consulta"}
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="font-semibold text-[#112250]">
                      {obtenerTextoFecha(cita)}
                    </p>

                    <p className="text-sm text-gray-600">
                      {cita.hora || "Sin hora"}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* ==============================
            RESUMEN MENSUAL
            SOLO VETERINARIO
        ============================== */}
        {usuario?.rol === "veterinario" && (
          <div className="bg-white rounded-xl shadow-md p-6">

            <h2 className="text-xl font-bold text-[#112250] mb-4">
              📊 Resumen mensual
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">
                  Consultas realizadas
                </span>

                <span className="font-bold text-[#112250]">
                  {cargandoCitas
                    ? "..."
                    : citasDelMes.length}
                </span>
              </div>

              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">
                  Citas atendidas
                </span>

                <span className="font-bold text-[#112250]">
                  {cargandoCitas
                    ? "..."
                    : citasCompletadas.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Citas pendientes
                </span>

                <span className="font-bold text-[#112250]">
                  {cargandoCitas
                    ? "..."
                    : citasPendientes.length}
                </span>
              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}

