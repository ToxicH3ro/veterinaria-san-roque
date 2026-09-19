"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerDatosCitas,
  obtenerDatosClientes,
  obtenerDatosFacturas,
  obtenerDatosInventario,
} from "@/services/reportesService";

export default function ReportesPage() {
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { usuario } = useAuth();

  const fechaActual = new Date();

  const mesActual = fechaActual.getMonth();
  const anioActual = fechaActual.getFullYear();

  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [
          datosCitas,
          datosClientes,
          datosFacturas,
          datosInventario,
        ] = await Promise.all([
          obtenerDatosCitas(),
          obtenerDatosClientes(),
          obtenerDatosFacturas(),
          obtenerDatosInventario(),
        ]);

        setCitas(datosCitas);
        setClientes(datosClientes);
        setFacturas(datosFacturas);
        setInventario(datosInventario);
      } catch (error) {
        console.error(
          "Error al cargar datos de reportes:",
          error
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const citasDelMes = useMemo(() => {
    return citas.filter((cita) => {
      if (!cita.fecha) {
        return false;
      }

      const fecha = new Date(`${cita.fecha}T00:00:00`);

      return (
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      );
    });
  }, [citas, mesActual, anioActual]);

  const citasCompletadas = citasDelMes.filter(
    (cita) =>
      cita.estado?.toLowerCase() === "completada" ||
      cita.estado?.toLowerCase() === "completado" ||
      cita.estado?.toLowerCase() === "atendida" ||
      cita.estado?.toLowerCase() === "atendido"
  ).length;

  const citasPendientes = citasDelMes.filter(
    (cita) =>
      cita.estado?.toLowerCase() === "pendiente"
  ).length;

  const citasCanceladas = citasDelMes.filter(
    (cita) =>
      cita.estado?.toLowerCase() === "cancelada" ||
      cita.estado?.toLowerCase() === "cancelado"
  ).length;

  const facturasDelMes = useMemo(() => {
    return facturas.filter((factura) => {
      if (!factura.fecha) {
        return false;
      }

      const fecha = new Date(`${factura.fecha}T00:00:00`);

      return (
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      );
    });
  }, [facturas, mesActual, anioActual]);

  const ingresosDelMes = facturasDelMes.reduce(
    (total, factura) =>
      total + (Number(factura.total) || 0),
    0
  );

  const mascotasAtendidas = new Set(
    citasDelMes
      .filter((cita) => {
        const estado =
          cita.estado?.toLowerCase();

        return (
          estado === "completada" ||
          estado === "completado" ||
          estado === "atendida" ||
          estado === "atendido"
        );
      })
      .map((cita) => cita.mascota)
      .filter(Boolean)
  ).size;

  const ingresosMensuales = useMemo(() => {
    const resultado = [];

    for (let i = 0; i < 12; i++) {
      const total = facturas
        .filter((factura) => {
          if (!factura.fecha) {
            return false;
          }

          const fecha = new Date(
            `${factura.fecha}T00:00:00`
          );

          return (
            fecha.getMonth() === i &&
            fecha.getFullYear() === anioActual
          );
        })
        .reduce(
          (suma, factura) =>
            suma + (Number(factura.total) || 0),
          0
        );

      resultado.push({
        mes: nombresMeses[i],
        total,
      });
    }

    return resultado;
  }, [facturas, anioActual]);

  const maxIngreso = Math.max(
    ...ingresosMensuales.map((mes) => mes.total),
    1
  );

  const serviciosSolicitados = useMemo(() => {
    const servicios = {};

    facturasDelMes.forEach((factura) => {
      factura.items?.forEach((item) => {
        const nombre = item.producto;

        if (!nombre) {
          return;
        }

        if (!servicios[nombre]) {
          servicios[nombre] = {
            nombre,
            cantidad: 0,
            ingresos: 0,
          };
        }

        servicios[nombre].cantidad +=
          Number(item.cantidad) || 0;

        servicios[nombre].ingresos +=
          (Number(item.cantidad) || 0) *
          (Number(item.precio) || 0);
      });
    });

    return Object.values(servicios)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [facturasDelMes]);

  const citasPorVeterinario = useMemo(() => {

  if (!usuario || usuario.rol !== "veterinario") {
    return [];
  }

  const nombreVeterinario =
    `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() ||
    usuario.correo ||
    "Veterinario";

  const total = citasDelMes.length;

  const atendidas = citasDelMes.filter((cita) => {
    const estado = cita.estado?.toLowerCase();

    return (
      estado === "completada" ||
      estado === "completado" ||
      estado === "atendida" ||
      estado === "atendido"
    );
  }).length;

  return [
    {
      nombre: nombreVeterinario,
      total,
      atendidas,
    },
  ];

}, [citasDelMes, usuario]);

  const inventarioCritico = useMemo(() => {
    return inventario
      .map((producto) => {
        const cantidad =
          Number(
            producto.cantidad ??
            producto.stock ??
            producto.existencia ??
            0
          );

        const minimo =
          Number(
            producto.minimo ??
            producto.stockMinimo ??
            producto.cantidadMinima ??
            0
          );

        return {
          ...producto,
          cantidad,
          minimo,
        };
      })
      .filter(
        (producto) =>
          producto.cantidad <= producto.minimo
      )
      .sort(
        (a, b) =>
          a.cantidad - b.cantidad
      );
  }, [inventario]);

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "-";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const imprimirReporte = () => {
    window.print();
  };

  if (cargando) {
    return (
      <main>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-4xl mb-3">
              📊
            </div>

            <p className="text-gray-500">
              Generando reportes...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <main className="reporte-print">

      {/* =================================================
          ESTILOS DE IMPRESIÓN
      ================================================= */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .reporte-print,
          .reporte-print * {
            visibility: visible;
          }

          .reporte-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px !important;
          }

          .no-print {
            display: none !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-[#112250]">
            📊 Reportes
          </h1>

          <p className="text-gray-500 mt-1">
            Consulta el resumen de actividad de la
            Veterinaria San Roque
          </p>

          <p className="text-sm text-[#E57A3A] font-semibold mt-2">
            📅 {nombresMeses[mesActual]} {anioActual}
          </p>
        </div>

        <button
          onClick={imprimirReporte}
          className="no-print bg-[#112250] hover:bg-[#1b326d] text-white font-semibold px-5 py-3 rounded-lg shadow-md transition"
        >
          🖨️ Imprimir reporte
        </button>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

        <div className="print-card bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
          <p className="text-gray-500">
            Citas del mes
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            {citasDelMes.length}
          </p>
        </div>

        <div className="print-card bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E57A3A]">
          <p className="text-gray-500">
            Clientes
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            {clientes.length}
          </p>
        </div>

        <div className="print-card bg-white rounded-xl shadow-md p-6 border-l-4 border-[#F6EBC3]">
          <p className="text-gray-500">
            Mascotas atendidas
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            {mascotasAtendidas}
          </p>
        </div>

        <div className="print-card bg-white rounded-xl shadow-md p-6 border-l-4 border-green-400">
          <p className="text-gray-500">
            Ingresos del mes
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            ${ingresosDelMes.toFixed(2)}
          </p>
        </div>

      </div>

      {/* =================================================
          GRÁFICAS
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* INGRESOS */}

        <div className="print-card bg-white rounded-xl shadow-md p-6">

          <h2 className="text-xl font-bold text-[#112250]">
            📈 Ingresos por mes
          </h2>

          <p className="text-gray-500 mt-1">
            Ingresos registrados durante {anioActual}.
          </p>

          <div className="mt-8 flex items-end gap-3 h-64 border-b border-l border-gray-200 px-4 pb-2">

            {ingresosMensuales.map((mes) => {

              const altura =
                mes.total > 0
                  ? Math.max(
                      (mes.total / maxIngreso) * 100,
                      5
                    )
                  : 2;

              return (
                <div
                  key={mes.mes}
                  className="flex-1 h-full flex flex-col justify-end items-center"
                >

                  <div className="text-xs text-gray-500 mb-2">
                    {mes.total > 0
                      ? `$${mes.total.toFixed(0)}`
                      : ""}
                  </div>

                  <div
                    className="w-full max-w-8 bg-[#8FBFE3] rounded-t-md hover:bg-[#E57A3A] transition"
                    style={{
                      height: `${altura}%`,
                    }}
                    title={`${mes.mes}: $${mes.total.toFixed(2)}`}
                  />

                  <span className="text-[10px] text-gray-500 mt-2">
                    {mes.mes.substring(0, 3)}
                  </span>

                </div>
              );
            })}

          </div>

        </div>

        {/* CITAS */}

        <div className="print-card bg-white rounded-xl shadow-md p-6">

          <h2 className="text-xl font-bold text-[#112250]">
            📅 Estado de las citas
          </h2>

          <p className="text-gray-500 mt-1">
            Distribución de las citas del mes.
          </p>

          <div className="mt-8 space-y-6">

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  Completadas
                </span>

                <span className="font-bold text-green-600">
                  {citasCompletadas}
                </span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full"
                  style={{
                    width: `${
                      citasDelMes.length
                        ? (citasCompletadas /
                            citasDelMes.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  Pendientes
                </span>

                <span className="font-bold text-[#E57A3A]">
                  {citasPendientes}
                </span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E57A3A] rounded-full"
                  style={{
                    width: `${
                      citasDelMes.length
                        ? (citasPendientes /
                            citasDelMes.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  Canceladas
                </span>

                <span className="font-bold text-red-600">
                  {citasCanceladas}
                </span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{
                    width: `${
                      citasDelMes.length
                        ? (citasCanceladas /
                            citasDelMes.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          SERVICIOS MÁS SOLICITADOS
      ================================================= */}

      <div className="print-card bg-white rounded-xl shadow-md p-6 mt-6">

        <h2 className="text-xl font-bold text-[#112250]">
          🛒 Servicios y productos más solicitados
        </h2>

        <p className="text-gray-500 mt-1">
          Elementos con mayor cantidad de unidades
          registradas en las facturas del mes.
        </p>

        {serviciosSolicitados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay información de facturación para
            este mes.
          </div>
        ) : (
          <div className="mt-6 space-y-5">

            {serviciosSolicitados.map(
              (servicio, indice) => {

                const maxCantidad =
                  serviciosSolicitados[0].cantidad;

                const porcentaje =
                  maxCantidad > 0
                    ? (servicio.cantidad /
                        maxCantidad) *
                      100
                    : 0;

                return (
                  <div key={servicio.nombre}>

                    <div className="flex justify-between mb-2">

                      <div className="flex items-center gap-3">

                        <span className="w-7 h-7 rounded-full bg-[#112250] text-white flex items-center justify-center text-sm font-bold">
                          {indice + 1}
                        </span>

                        <span className="font-semibold text-gray-700">
                          {servicio.nombre}
                        </span>

                      </div>

                      <div className="text-right">

                        <span className="font-bold text-[#112250]">
                          {servicio.cantidad}
                        </span>

                        <span className="text-gray-400 text-sm ml-1">
                          unidades
                        </span>

                      </div>

                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-[#8FBFE3] rounded-full"
                        style={{
                          width: `${porcentaje}%`,
                        }}
                      />

                    </div>

                    <p className="text-right text-sm text-gray-500 mt-1">
                      ${servicio.ingresos.toFixed(2)}
                    </p>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =================================================
          TABLAS
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* INGRESOS POR MES */}

        <div className="print-card bg-white rounded-xl shadow-md overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold text-[#112250]">
              💰 Ingresos por mes
            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Mes
                  </th>

                  <th className="text-right p-4 text-sm font-semibold text-[#112250]">
                    Ingresos
                  </th>

                </tr>

              </thead>

              <tbody>

                {ingresosMensuales.map(
                  (mes) => (
                    <tr
                      key={mes.mes}
                      className="border-t"
                    >

                      <td className="p-4 text-gray-600">
                        {mes.mes}
                      </td>

                      <td className="p-4 text-right font-semibold text-[#112250]">
                        ${mes.total.toFixed(2)}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* CITAS POR VETERINARIO */}

        <div className="print-card bg-white rounded-xl shadow-md overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold text-[#112250]">
              👨‍⚕️ Citas atendidas por veterinario
            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Veterinario
                  </th>

                  <th className="text-center p-4 text-sm font-semibold text-[#112250]">
                    Citas
                  </th>

                  <th className="text-center p-4 text-sm font-semibold text-[#112250]">
                    Atendidas
                  </th>

                </tr>

              </thead>

              <tbody>

                {citasPorVeterinario.length === 0 ? (

                  <tr>

                    <td
                      colSpan="3"
                      className="p-6 text-center text-gray-500"
                    >
                      No hay citas registradas
                      este mes.
                    </td>

                  </tr>

                ) : (

                  citasPorVeterinario.map(
                    (veterinario) => (
                      <tr
                        key={veterinario.nombre}
                        className="border-t"
                      >

                        <td className="p-4 font-semibold text-gray-700">
                          {veterinario.nombre}
                        </td>

                        <td className="p-4 text-center text-gray-600">
                          {veterinario.total}
                        </td>

                        <td className="p-4 text-center">

                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {veterinario.atendidas}
                          </span>

                        </td>

                      </tr>
                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* =================================================
          INVENTARIO CRÍTICO
      ================================================= */}

      <div className="print-card bg-white rounded-xl shadow-md mt-6 overflow-hidden">

        <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>

            <h2 className="text-xl font-bold text-[#112250]">
              ⚠️ Inventario crítico
            </h2>

            <p className="text-gray-500 mt-1">
              Productos que necesitan reposición.
            </p>

          </div>

          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
            {inventarioCritico.length} producto
            {inventarioCritico.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {inventarioCritico.length === 0 ? (

          <div className="p-8 text-center">

            <div className="text-4xl mb-2">
              ✅
            </div>

            <p className="font-semibold text-green-600">
              No hay productos en nivel crítico.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Producto
                  </th>

                  <th className="text-center p-4 text-sm font-semibold text-[#112250]">
                    Existencia
                  </th>

                  <th className="text-center p-4 text-sm font-semibold text-[#112250]">
                    Mínimo
                  </th>

                  <th className="text-center p-4 text-sm font-semibold text-[#112250]">
                    Estado
                  </th>

                </tr>

              </thead>

              <tbody>

                {inventarioCritico.map(
                  (producto) => {

                    const nombre =
                      producto.nombre ||
                      producto.producto ||
                      producto.descripcion ||
                      "Producto";

                    return (
                      <tr
                        key={producto.id}
                        className="border-t"
                      >

                        <td className="p-4 font-semibold text-gray-700">
                          {nombre}
                        </td>

                        <td className="p-4 text-center font-bold text-red-600">
                          {producto.cantidad}
                        </td>

                        <td className="p-4 text-center text-gray-600">
                          {producto.minimo}
                        </td>

                        <td className="p-4 text-center">

                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                            Reponer
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </main>
  );
}