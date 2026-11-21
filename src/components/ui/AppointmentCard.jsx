"use client";

import Button from "./Button";
import Card from "./Card";

const obtenerColoresEstado = (estado) => {
  switch (estado.toLowerCase()) {
    case "pendiente":
      return {
        fondo: "bg-amber-100",
        texto: "text-amber-800",
      };

    case "confirmada":
    case "confirmado":
      return {
        fondo: "bg-green-100",
        texto: "text-green-700",
      };

    case "completada":
    case "completado":
      return {
        fondo: "bg-blue-100",
        texto: "text-blue-700",
      };

    case "cancelada":
    case "cancelado":
      return {
        fondo: "bg-red-100",
        texto: "text-red-700",
      };

    default:
      return {
        fondo: "bg-gray-100",
        texto: "text-gray-600",
      };
  }
};

export default function AppointmentCard({
  cita,
  onCambiarEstado,
}) {
  const estado = (cita.estado || "").toLowerCase();

  const colores = obtenerColoresEstado(estado);

  const finalizada = [
    "completada",
    "completado",
    "cancelada",
    "cancelado",
  ].includes(estado);

  const acciones = [
    {
      titulo: "Confirmar",
      estado: "confirmada",
      variante: "primary",
    },
    {
      titulo: "Completar",
      estado: "completada",
      variante: "secondary",
    },
    {
      titulo: "Cancelar",
      estado: "cancelada",
      variante: "danger",
    },
  ];

  return (
    <Card className="mb-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl">🐾</span>

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#112250]">
              {cita.mascota || "Mascota sin nombre"}
            </h3>

            <p className="text-sm text-gray-500">
              {cita.tipo || "Consulta veterinaria"}
            </p>
          </div>
        </div>

        {/* Estado */}
        <span
          className={`
            self-start
            px-3 py-1.5
            rounded-full
            text-xs font-bold
            capitalize
            ${colores.fondo}
            ${colores.texto}
          `}
        >
          {cita.estado || "Sin estado"}
        </span>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200 my-4" />

      {/* Fecha y hora */}
      <div className="grid grid-cols-2 gap-4">

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">
            FECHA
          </p>

          <p className="text-sm font-semibold text-gray-800">
            {cita.fecha || "Sin fecha"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">
            HORA
          </p>

          <p className="text-sm font-semibold text-gray-800">
            {cita.hora || "Sin hora"}
          </p>
        </div>
      </div>

      {/* Cliente */}
      <p className="mt-4 text-xs text-gray-500">
      Cliente: {cita.clienteNombre || "Nombre no disponible"}
      </p>

      {/* Acciones */}
      {onCambiarEstado && !finalizada && (
        <div className="mt-5 flex flex-wrap gap-2">

          {acciones
            .filter((accion) => accion.estado !== estado)
            .map((accion) => (
              <Button
                key={accion.estado}
                variant={accion.variante}
                onClick={() =>
                  onCambiarEstado(cita.id, accion.estado)
                }
              >
                {accion.titulo}
              </Button>
            ))}

        </div>
      )}
    </Card>
  );
}
