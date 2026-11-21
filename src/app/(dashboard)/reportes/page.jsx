"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerDatosCitas,
  obtenerDatosClientes,
  obtenerDatosFacturas,
  obtenerDatosInventario,
  observarDatosPagos,
} from "@/services/reportesService";

// =========================================
// CONVERTIR FECHAS DE FIRESTORE
// =========================================

const convertirFecha = (fecha) => {
  if (!fecha) return null;

  if (typeof fecha.toDate === "function") {
    return fecha.toDate();
  }

  if (fecha instanceof Date) {
    return fecha;
  }

  if (typeof fecha === "string") {
    const fechaConvertida = new Date(fecha);

    return Number.isNaN(fechaConvertida.getTime())
      ? null
      : fechaConvertida;
  }

  return null;
};

export default function ReportesPage() {
  // =========================================
  // ESTADOS DE LOS DATOS
  // =========================================

  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [pagos, setPagos] = useState([]);

  // =========================================
  // ESTADOS DE CONTROL
  // =========================================

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const { usuario, cargando: cargandoUsuario } = useAuth();

  // =========================================
  // CARGAR DATOS
  // =========================================

  useEffect(() => {
    if (cargandoUsuario) {
      return;
    }

    if (!usuario || usuario.rol !== "veterinario") {
      setCargando(false);
      setError("No tienes permisos para consultar los reportes.");
      return;
    }

    let componenteActivo = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

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

        if (!componenteActivo) {
          return;
        }

        setCitas(datosCitas);
        setClientes(datosClientes);
        setFacturas(datosFacturas);
        setInventario(datosInventario);

      } catch (error) {
        console.error(
          "Error al cargar los reportes:",
          error
        );

        if (componenteActivo) {
          setError("No fue posible cargar los datos de los reportes.");
        }

      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    // =========================================
    // OBSERVAR PAGOS EN TIEMPO REAL
    // =========================================

    const cancelarObservacion = observarDatosPagos(
      (datosPagos) => {
        if (componenteActivo) {
          setPagos(datosPagos);
        }
      },
      (error) => {
        if (componenteActivo) {
          console.error(
            "Error al actualizar los pagos:",
            error
          );
          setError("No fue posible actualizar los datos de pagos.");
        }
      }
    );

    // =========================================
    // LIMPIAR SUSCRIPCIÓN
    // =========================================

    return () => {
      componenteActivo = false;
      cancelarObservacion();
    };

  }, [usuario, cargandoUsuario]);


  // =========================================
  // ESTADÍSTICAS DEL MES ACTUAL
  // =========================================

  const resumen = useMemo(() => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();
    const perteneceAlMesActual = (fecha) => {
      if (!fecha) return false;
      return (
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      );
    };

    // Citas del mes
    const citasMes = citas.filter((cita) => {
      if (!cita.fecha) return false;
      const fecha = new Date(`${cita.fecha}T00:00:00`);
      return (
        !Number.isNaN(fecha.getTime()) &&
        perteneceAlMesActual(fecha)
      );
    }).length;

    // Clientes registrados
    const totalClientes = clientes.length;
    // Facturas emitidas durante el mes
    const facturasMes = facturas.filter((factura) => {
      const fecha = convertirFecha(
        factura.fecha || factura.creadoEn
      );
      return perteneceAlMesActual(fecha);
    }).length;

    // Ingresos de pagos confirmados durante el mes
    const ingresosConfirmados = pagos
      .filter((pago) => {
        if (pago.estado !== "confirmado") return false;
        const fecha = convertirFecha(pago.verificadoEn);
        return perteneceAlMesActual(fecha);
      })
      .reduce((total, pago) => {
        return total + (Number(pago.monto) || 0);
      }, 0);
    return {
      citasMes,
      totalClientes,
      facturasMes,
      ingresosConfirmados,
    };

  }, [citas, clientes, facturas, pagos]);


  // =========================================
  // ESTADÍSTICAS DEL ESTADO DE LAS CITAS
  // =========================================

  const estadisticasCitas = useMemo(() => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();
    const citasMes = citas.filter((cita) => {
      if (!cita.fecha) return false;
      const fecha = new Date(`${cita.fecha}T00:00:00`);
      return (
        !Number.isNaN(fecha.getTime()) &&
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      );
    });

    const total = citasMes.length;
    const estados = [
      {
        estado: "pendiente",
        nombre: "Pendientes",
        color: "bg-yellow-500",
      },
      {
        estado: "confirmada",
        nombre: "Confirmadas",
        color: "bg-blue-500",
      },
      {
        estado: "completada",
        nombre: "Completadas",
        color: "bg-green-500",
      },
      {
        estado: "cancelada",
        nombre: "Canceladas",
        color: "bg-red-500",
      },
    ];

    const resultados = estados.map((estado) => {
      const cantidad = citasMes.filter(
        (cita) =>
          String(cita.estado || "").toLowerCase().trim() ===
          estado.estado
      ).length;

      return {
        ...estado,
        cantidad,
        porcentaje:
          total > 0
            ? (cantidad / total) * 100
            : 0,
      };
    });

    const otros = citasMes.filter((cita) => {
      const estado = String(cita.estado || "")
        .toLowerCase()
        .trim();

      return !estados.some(
        (item) => item.estado === estado
      );
    }).length;

    if (otros > 0) {
      resultados.push({
        estado: "otros",
        nombre: "Otros",
        color: "bg-gray-500",
        cantidad: otros,
        porcentaje: (otros / total) * 100,
      });
    }

    return {
      total,
      estados: resultados,
    };
  }, [citas]);

  // =========================================
// INGRESOS DE LOS ÚLTIMOS 6 MESES
// =========================================

const ingresosMensuales = useMemo(() => {
  const ahora = new Date();
  const meses = [];

  // Generar los últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(
      ahora.getFullYear(),
      ahora.getMonth() - i,
      1
    );
    meses.push({
      mes: fecha.toLocaleDateString("es-SV", {
        month: "short",
        year: "numeric",
      }),
      mesNumero: fecha.getMonth(),
      anio: fecha.getFullYear(),
      ingresos: 0,
    });
  }

  // Acumular únicamente pagos confirmados
  pagos.forEach((pago) => {
    if (pago.estado !== "confirmado") return;
    const fecha = convertirFecha(pago.verificadoEn);
    if (!fecha) return;
    const mesEncontrado = meses.find(
      (mes) =>
        mes.mesNumero === fecha.getMonth() &&
        mes.anio === fecha.getFullYear()
    );
    if (mesEncontrado) {
      mesEncontrado.ingresos += Number(pago.monto) || 0;
    }
  });
  return meses;
}, [pagos]);


  // =========================================
  // SERVICIOS Y PRODUCTOS MÁS SOLICITADOS
  // =========================================

  const elementosMasSolicitados = useMemo(() => {
    const acumulado = {};
    facturas.forEach((factura) => {
      if (!Array.isArray(factura.items)) return;
      factura.items.forEach((item) => {
        const nombre = String(item.nombre || "").trim();
        const tipo = String(item.tipo || "").toLowerCase().trim();
        if (!nombre || !["producto", "servicio"].includes(tipo)) {
          return;
        }
        const clave = `${tipo}-${nombre.toLowerCase()}`;
        if (!acumulado[clave]) {
          acumulado[clave] = {
            nombre,
            tipo,
            unidades: 0,
            vecesFacturado: 0,
            totalFacturado: 0,
          };
        }
        acumulado[clave].unidades += Number(item.cantidad) || 0;
        acumulado[clave].vecesFacturado += 1;
        acumulado[clave].totalFacturado += Number(item.subtotal) || 0;
      });
    });

    return Object.values(acumulado)
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5);
  }, [facturas]);

  // =========================================
// ESTADÍSTICAS DEL INVENTARIO
// =========================================

const estadisticasInventario = useMemo(() => {
  const totalProductos = inventario.length;
  let totalUnidades = 0;
  let valorInventario = 0;
  const categorias = {};
  inventario.forEach((producto) => {
    const cantidad = Number(producto.cantidad) || 0;
    const precio = Number(producto.precio) || 0;
    totalUnidades += cantidad;
    valorInventario += cantidad * precio;
    const categoria = String(
      producto.categoria || "Sin categoría"
    ).trim();
    categorias[categoria] =
      (categorias[categoria] || 0) + 1;
  });

  const categoriasOrdenadas = Object.entries(categorias)
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    totalProductos,
    totalUnidades,
    valorInventario,
    categoriasOrdenadas,
  };
}, [inventario]);


  // =========================================
  // ESTADÍSTICAS DE PAGOS
  // =========================================

  const estadisticasPagos = useMemo(() => {
    const estados = {
      confirmado: {
        cantidad: 0,
        monto: 0,
      },
      pendiente_verificacion: {
        cantidad: 0,
        monto: 0,
      },
      rechazado: {
        cantidad: 0,
        monto: 0,
      },
    };

    pagos.forEach((pago) => {
      const estado = String(pago.estado || "")
        .toLowerCase()
        .trim();

      if (!estados[estado]) return;

      estados[estado].cantidad += 1;
      estados[estado].monto += Number(pago.monto) || 0;
    });

    const facturasAtrasadas = facturas.filter(
      (factura) => factura.estado === "atrasada"
    ).length;

    return {
      totalPagos: pagos.length,
      confirmados: estados.confirmado,
      pendientes: estados.pendiente_verificacion,
      rechazados: estados.rechazado,
      facturasAtrasadas,
    };
  }, [pagos, facturas]);


  // =========================================
  // FORMATO DE MONEDA
  // =========================================

  const formatoMoneda = (cantidad) => {
    return new Intl.NumberFormat("es-SV", {
      style: "currency",
      currency: "USD",
    }).format(cantidad);
  };

  // =========================================
// IMPRIMIR REPORTES
// =========================================

const imprimirReporte = () => {
  window.print();
};

  // =========================================
  // INTERFAZ INICIAL
  // =========================================

  if (cargandoUsuario || cargando) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-3">
            📊
          </div>

          <p className="text-gray-500">
            Generando reportes...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-4xl mb-3">
          ⚠️
        </div>

        <h2 className="text-xl font-bold text-[#112250]">
          No se pudieron cargar los reportes
        </h2>

        <p className="text-gray-500 mt-2">
          {error}
        </p>
      </main>
    );
  }

const maximoIngresos = Math.max(
  1,
  ...ingresosMensuales.map((mes) => mes.ingresos)
);

  return (
  <main className="reporte-print space-y-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-[#112250]">
        📊 Reportes
      </h1>
      <p className="text-gray-500 mt-1">
        Consulta el resumen de actividad de la
        Veterinaria San Roque.
      </p>
    </div>

    <button
    type="button"
    onClick={imprimirReporte}
    className="no-print bg-[#112250] hover:bg-[#1b3470] text-white font-medium px-5 py-3 rounded-lg transition-colors">
    🖨️ Imprimir reportes
  </button>
  </div>

      {/* ========================================= */}
      {/* RESUMEN GENERAL */}
      {/* ========================================= */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* CITAS DEL MES */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#E57A3A]">
          <p className="text-sm text-gray-500">
            Citas del mes
          </p>
          <p className="text-3xl font-bold text-[#112250] mt-2">
            {resumen.citasMes}
          </p>
        </div>

        {/* CLIENTES */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">
            Clientes registrados
          </p>
          <p className="text-3xl font-bold text-[#112250] mt-2">
            {resumen.totalClientes}
          </p>
        </div>

        {/* FACTURAS */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">
            Facturas del mes
          </p>
          <p className="text-3xl font-bold text-[#112250] mt-2">
            {resumen.facturasMes}
          </p>
        </div>
        {/* INGRESOS */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">
            Ingresos confirmados
          </p>
          <p className="text-2xl font-bold text-[#112250] mt-2">
            {formatoMoneda(resumen.ingresosConfirmados)}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Durante el mes actual
          </p>
        </div>
      </section>

      {/* ========================================= */}
      {/* ESTADO DE LAS CITAS */}
      {/* ========================================= */}

      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#112250]">
              Estado de las citas
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Distribución de las citas del mes actual.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total:{" "}
            <span className="font-bold text-[#112250]">
              {estadisticasCitas.total}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          {estadisticasCitas.estados.map((estado) => (
            <div key={estado.estado}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {estado.nombre}
                </span>
                <span className="text-sm font-semibold text-[#112250]">
                  {estado.cantidad} ({estado.porcentaje.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`${estado.color} h-3 rounded-full transition-all duration-500`}
                  style={{
                    width: `${estado.porcentaje}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {estadisticasCitas.total === 0 && (
          <p className="text-center text-sm text-gray-400 mt-5">
            No hay citas registradas durante este mes.
          </p>
        )}
      </section>


{/* ========================================= */}
{/* INGRESOS DE LOS ÚLTIMOS 6 MESES */}
{/* ========================================= */}

<section className="bg-white rounded-xl shadow-md p-6">
  <div className="mb-6">
    <h2 className="text-xl font-bold text-[#112250]">
      Ingresos de los últimos 6 meses
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      Evolución mensual de los pagos confirmados.
    </p>
  </div>

  <div className="space-y-5">
    {ingresosMensuales.map((mes) => (
      <div key={`${mes.anio}-${mes.mesNumero}`}>
        <div className="flex justify-between items-center mb-2 gap-3">
          <span className="text-sm font-medium text-gray-700 capitalize">
            {mes.mes}
          </span>
          <span className="text-sm font-semibold text-[#112250]">
            {formatoMoneda(mes.ingresos)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="bg-[#E57A3A] h-4 rounded-full transition-all duration-500"
            style={{
              width: `${(mes.ingresos / maximoIngresos) * 100}%`,
            }}
          />
        </div>
      </div>
    ))}
  </div>

  {ingresosMensuales.every((mes) => mes.ingresos === 0) && (
    <p className="text-center text-sm text-gray-400 mt-5">
      Todavía no hay ingresos confirmados durante este período.
    </p>
  )}
</section>


      {/* ========================================= */}
      {/* ESTADÍSTICAS DE PAGOS */}
      {/* ========================================= */}

      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#112250]">
            Estadísticas de pagos
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Resumen de los pagos registrados y su estado actual.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* PAGOS CONFIRMADOS */}
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Pagos confirmados
            </p>

            <p className="text-2xl font-bold text-green-700 mt-2">
              {estadisticasPagos.confirmados.cantidad}
            </p>

            <p className="text-sm font-medium text-green-700 mt-1">
              {formatoMoneda(estadisticasPagos.confirmados.monto)}
            </p>
          </div>

          {/* PAGOS PENDIENTES */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Pendientes de verificación
            </p>

            <p className="text-2xl font-bold text-yellow-700 mt-2">
              {estadisticasPagos.pendientes.cantidad}
            </p>

            <p className="text-sm font-medium text-yellow-700 mt-1">
              {formatoMoneda(estadisticasPagos.pendientes.monto)}
            </p>
          </div>

          {/* PAGOS RECHAZADOS */}
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Pagos rechazados
            </p>

            <p className="text-2xl font-bold text-red-700 mt-2">
              {estadisticasPagos.rechazados.cantidad}
            </p>

            <p className="text-sm font-medium text-red-700 mt-1">
              {formatoMoneda(estadisticasPagos.rechazados.monto)}
            </p>
          </div>

          {/* FACTURAS ATRASADAS */}
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Facturas atrasadas
            </p>

            <p className="text-2xl font-bold text-orange-700 mt-2">
              {estadisticasPagos.facturasAtrasadas}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Según el estado de facturación
            </p>
          </div>

        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Total de registros de pagos:{" "}
            <span className="font-bold text-[#112250]">
              {estadisticasPagos.totalPagos}
            </span>
          </p>
        </div>
      </section>

      {/* ========================================= */}
      {/* SERVICIOS Y PRODUCTOS MÁS SOLICITADOS */}
      {/* ========================================= */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#112250]">
            Servicios y productos más solicitados
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Los cinco elementos con mayor cantidad facturada.
          </p>
        </div>
        {elementosMasSolicitados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Elemento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-center">Unidades</th>
                  <th className="px-4 py-3 text-center">Veces facturado</th>
                  <th className="px-4 py-3 text-right">Total facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {elementosMasSolicitados.map((item) => (
                  <tr key={`${item.tipo}-${item.nombre}`}>
                    <td className="px-4 py-3 font-medium text-[#112250]">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.tipo === "producto"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {item.tipo === "producto" ? "Producto" : "Servicio"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.unidades}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.vecesFacturado}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatoMoneda(item.totalFacturado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-6">
            Todavía no hay elementos registrados en las facturas.
          </p>
        )}
      </section>


      {/* ========================================= */}
      {/* ESTADÍSTICAS DEL INVENTARIO */}
      {/* ========================================= */}

      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#112250]">
            Estadísticas del inventario
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Resumen de productos, existencias y categorías registradas.
          </p>
        </div>

        {/* RESUMEN DEL INVENTARIO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Productos registrados
            </p>
            <p className="text-2xl font-bold text-[#112250] mt-2">
              {estadisticasInventario.totalProductos}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Unidades disponibles
            </p>
            <p className="text-2xl font-bold text-[#112250] mt-2">
              {estadisticasInventario.totalUnidades}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Valor del inventario
            </p>
            <p className="text-2xl font-bold text-[#112250] mt-2">
              {formatoMoneda(estadisticasInventario.valorInventario)}
            </p>
          </div>
        </div>
        {/* DISTRIBUCIÓN POR CATEGORÍAS */}
        <div>
          <h3 className="text-lg font-semibold text-[#112250] mb-4">
            Productos por categoría
          </h3>
          {estadisticasInventario.categoriasOrdenadas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-center">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-right">
                      Porcentaje
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {estadisticasInventario.categoriasOrdenadas.map(
                    (categoria) => (
                      <tr key={categoria.nombre}>
                        <td className="px-4 py-3 font-medium text-[#112250]">
                          {categoria.nombre}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {categoria.cantidad}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {(
                            (categoria.cantidad /
                              estadisticasInventario.totalProductos) * 100
                          ).toFixed(1)}%
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-6">
              Todavía no hay productos registrados en el inventario.
            </p>
          )}
        </div>
      </section>

    </main>
  );
}
