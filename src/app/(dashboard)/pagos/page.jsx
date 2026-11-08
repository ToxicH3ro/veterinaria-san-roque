"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";

import {
  obtenerFacturasDeUsuario,
} from "@/services/facturacionService";

import {
  obtenerPagosDeUsuario,
  solicitarPago,
} from "@/services/PagosService";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

// Métodos de pago disponibles.
const METODOS_PAGO = [
  "Tarjeta Bancaria",
  "Transferencia Bancaria",
];

// Formatear cantidades monetarias.
const dinero = (cantidad) => {
  return `$${Number(cantidad || 0).toFixed(2)}`;
};

// Formatear fechas de Firebase.
const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  try {
    let fechaReal = null;

    if (fecha instanceof Date) {
      fechaReal = fecha;
    } else if (
      typeof fecha === "string" ||
      typeof fecha === "number"
    ) {
      fechaReal = new Date(fecha);
    } else if (typeof fecha.toDate === "function") {
      fechaReal = fecha.toDate();
    }

    if (!fechaReal || Number.isNaN(fechaReal.getTime())) {
      return "Sin fecha";
    }

    return fechaReal.toLocaleDateString("es-SV");
  } catch {
    return "Sin fecha";
  }
};

// Obtener el texto del estado de una factura.
const estadoFacturaTexto = (estado) => {
  switch (estado) {
    case "pagada":
      return "Pagada";
    case "atrasada":
      return "Atrasada";
    default:
      return "Pendiente";
  }
};

// Obtener el texto del estado de un pago.
const estadoPagoTexto = (estado) => {
  switch (estado) {
    case "confirmado":
      return "Pago confirmado";
    case "rechazado":
      return "Pago rechazado";
    default:
      return "Pendiente de verificación";
  }
};

export default function PagosPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  // Información obtenida de Firestore.
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);
  // Estados de carga.
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  // Estados del proceso de pago.
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(
    "Tarjeta Bancaria"
  );
  const [modalPago, setModalPago] = useState(false);
  const [enviandoPago, setEnviandoPago] = useState(false);
  // Mensajes de error.
  const [error, setError] = useState("");

  // Mensajes de éxito.
  const [mensajeExito, setMensajeExito] = useState("");
  // Cargar facturas y solicitudes del usuario.
  const cargarDatos = async (mostrarCarga = true) => {
    try {
      setError("");

      if (mostrarCarga) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      const [misFacturas, misPagos] = await Promise.all([
        obtenerFacturasDeUsuario(),
        obtenerPagosDeUsuario(),
      ]);
      setFacturas(misFacturas);
      setPagos(misPagos);
    } catch (error) {
      console.error("Error al cargar pagos:", error);

      setError(
        "No se pudieron cargar tus facturas o solicitudes de pago."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  // Esperar a que Firebase determine la sesión.
  useEffect(() => {
    if (cargandoAuth) return;

    if (!usuario || usuario.rol !== "usuario") {
      setFacturas([]);
      setPagos([]);
      setCargando(false);
      return;
    }

    cargarDatos();
  }, [cargandoAuth, usuario]);

  // Obtener las solicitudes correspondientes a una factura.
  const pagosDeFactura = (facturaID) => {
    return pagos
      .filter((pago) => pago.facturaID === facturaID)
      .sort((a, b) => {
        const fechaA = a.creadoEn?.toMillis?.() || 0;
        const fechaB = b.creadoEn?.toMillis?.() || 0;

        return fechaB - fechaA;
      });
  };

  // Obtener la solicitud más reciente de una factura.
  const ultimoPago = (facturaID) => {
    return pagosDeFactura(facturaID)[0];
  };

    // Resumen de facturas.
  const facturasPendientes = facturas.filter(
    (factura) =>
      factura.estado === "pendiente" ||
      factura.estado === "atrasada"
  ).length;

  const pagosEnVerificacion = pagos.filter(
    (pago) => pago.estado === "pendiente_verificacion"
  ).length;

    // Registrar una solicitud de pago.
  const confirmarSolicitud = async () => {
    if (!facturaSeleccionada || enviandoPago) return;

    try {
      setEnviandoPago(true);
      setError("");
      setMensajeExito("");

      await solicitarPago(
        facturaSeleccionada.id,
        metodoSeleccionado
      );

      setModalPago(false);
      setFacturaSeleccionada(null);

      setMensajeExito(
        "Tu solicitud de pago fue enviada correctamente. Está pendiente de verificación por el veterinario."
      );

      await cargarDatos(false);
    } catch (error) {
      console.error("Error al solicitar pago:", error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar tu solicitud de pago."
      );
    } finally {
      setEnviandoPago(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-[#112250]">
          Mis pagos
        </h1>

        <p className="mt-2 text-gray-600">
          Consulta tus facturas y administra tus solicitudes de pago.
        </p>
      </div>

      {/* Cargando */}
      {cargando && (
        <Card>
          <p className="text-center text-gray-600">
            Cargando tus facturas...
          </p>
        </Card>
      )}

      {/* Acceso no autorizado */}
      {!cargandoAuth && usuario?.rol !== "usuario" && (
        <Card>
          <p className="text-red-600">
            No tienes permisos para consultar esta sección.
          </p>
        </Card>
      )}

      {/* Contenido del usuario */}
      {!cargando &&
        !cargandoAuth &&
        usuario?.rol === "usuario" && (
          <>
            {/* Mensaje de error */}
            {error && (
              <Card>
                <p className="text-red-600">{error}</p>

                <div className="mt-4">
                  <Button onClick={() => cargarDatos()}>
                    Intentar nuevamente
                  </Button>
                </div>
              </Card>
            )}

            {mensajeExito && (
            <Card>
            <p className="text-sm font-semibold text-green-700">
             ✓ {mensajeExito}
            </p>
            </Card>
            )}

            {/* Resumen */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-sm font-medium text-gray-500">
                  Mis facturas
                </p>

                <p className="mt-2 text-3xl font-bold text-[#112250]">
                  {facturas.length}
                </p>
              </Card>

              <Card>
                <p className="text-sm font-medium text-gray-500">
                  Facturas pendientes
                </p>

                <p className="mt-2 text-3xl font-bold text-[#E57A3A]">
                  {facturasPendientes}
                </p>
              </Card>

              <Card>
                <p className="text-sm font-medium text-gray-500">
                  Pagos en verificación
                </p>

                <p className="mt-2 text-3xl font-bold text-[#112250]">
                  {pagosEnVerificacion}
                </p>
              </Card>
            </div>

            {/* Encabezado de facturas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#112250]">
                Mis facturas
              </h2>

              <Button
                variant="outline"
                onClick={() => cargarDatos(false)}
                disabled={actualizando}
              >
                {actualizando ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>

            {/* Facturas */}
            {facturas.length === 0 ? (
              <Card>
                <div className="py-6 text-center">
                  <h3 className="font-bold text-[#112250]">
                    Todavía no tienes facturas
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Cuando la veterinaria genere una factura a tu nombre,
                    aparecerá aquí.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {facturas.map((factura) => {
                  const pago = ultimoPago(factura.id);

                  const facturaPagada =
                    factura.estado === "pagada";

                  const tienePagoPendiente =
                    pago?.estado === "pendiente_verificacion";

                  const puedeSolicitarPago =
                    ["pendiente", "atrasada"].includes(factura.estado) &&
                    !tienePagoPendiente;

                  return (
                    <Card key={factura.id}>
                      {/* Número y estado */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-bold text-[#112250]">
                          {factura.numero}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            facturaPagada
                              ? "bg-green-100 text-green-700"
                              : factura.estado === "atrasada"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {estadoFacturaTexto(factura.estado)}
                        </span>
                      </div>

                      {/* Información */}
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Cliente:</strong> {factura.Cliente}
                        </p>

                        <p>
                          <strong>Fecha:</strong>{" "}
                          {formatearFecha(factura.fecha)}
                        </p>

                        <p>
                          <strong>Artículos:</strong>{" "}
                          {factura.items?.length ?? 0}
                        </p>
                      </div>

                      <div className="my-4 border-t border-gray-200" />

                      {/* Total */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          Total
                        </span>

                        <span className="text-xl font-bold text-[#112250]">
                          {dinero(factura.total)}
                        </span>
                      </div>

                      {/* Estado de pago */}
                      {facturaPagada ? (
                        <div className="mt-4 rounded-lg bg-green-50 p-3">
                          <p className="text-sm font-semibold text-green-700">
                            ✓ Esta factura ya está pagada.
                          </p>
                        </div>
                      ) : tienePagoPendiente ? (
                        <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                          <p className="font-bold text-yellow-800">
                            Pago pendiente de verificación
                          </p>

                          <p className="mt-1 text-sm text-yellow-700">
                            Método: {pago.metodo}
                          </p>

                          <p className="mt-1 text-sm text-yellow-700">
                            Enviado: {formatearFecha(pago.creadoEn)}
                          </p>
                        </div>
                      ) : pago?.estado === "rechazado" ? (
                        <div className="mt-4 rounded-lg bg-red-50 p-3">
                          <p className="text-sm text-red-700">
                            Tu solicitud anterior fue rechazada. Puedes
                            volver a solicitar el pago.
                          </p>
                        </div>
                      ) : null}

                      {/* Botón de pago */}
                      {puedeSolicitarPago && (
                        <div className="mt-4">
                          <Button
                            block
                            onClick={() => {
                            setError("");
                            setMensajeExito("");
                            setFacturaSeleccionada(factura);
                            setMetodoSeleccionado("Tarjeta Bancaria");
                            setModalPago(true);
                          }}
                          >
                            Realizar pago
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

                        {/* Historial de solicitudes */}
            <Card
              title="Historial de solicitudes"
              description="Consulta el estado de los pagos que has solicitado."
            >
              {pagos.length === 0 ? (
                <div className="py-6 text-center">
                  <h3 className="font-bold text-[#112250]">
                    No tienes solicitudes de pago
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Todavía no has solicitado ningún pago.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pagos.map((pago) => {
                    const facturaRelacionada = facturas.find(
                      (factura) => factura.id === pago.facturaID
                    );

                    const estilosEstado = {
                      pendiente_verificacion:
                        "bg-yellow-100 text-yellow-800",
                      confirmado:
                        "bg-green-100 text-green-700",
                      rechazado:
                        "bg-red-100 text-red-700",
                    };

                    return (
                      <div
                        key={pago.id}
                        className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* Información de la solicitud */}
                        <div className="space-y-2">
                          <h3 className="font-bold text-[#112250]">
                            Factura:{" "}
                            {facturaRelacionada?.numero ??
                              "No disponible"}
                          </h3>

                          <p className="text-sm text-gray-600">
                            <strong>Método:</strong> {pago.metodo}
                          </p>

                          <p className="text-sm text-gray-600">
                            <strong>Fecha:</strong>{" "}
                            {formatearFecha(pago.creadoEn)}
                          </p>

                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              estilosEstado[pago.estado] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {estadoPagoTexto(pago.estado)}
                          </span>
                        </div>

                        {/* Monto */}
                        <div className="sm:text-right">
                          <p className="text-sm text-gray-500">
                            Monto solicitado
                          </p>

                          <p className="text-xl font-bold text-[#112250]">
                            {dinero(pago.monto)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

              {/* Modal para solicitar un pago */}
      <Modal
        isOpen={modalPago}
        onClose={() => {
          if (!enviandoPago) {
            setModalPago(false);
            setFacturaSeleccionada(null);
          }
        }}
        title="Pago de factura"
        size="md"
      >
        {facturaSeleccionada && (
          <div className="space-y-5">

            {/* Información de la factura */}
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Factura seleccionada
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#112250]">
                {facturaSeleccionada.numero}
              </h3>

              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-700">
                  Total a pagar
                </span>

                <span className="text-xl font-bold text-[#E57A3A]">
                  {dinero(facturaSeleccionada.total)}
                </span>
              </div>
            </div>

            {/* Selección del método de pago */}
            <div>
              <h3 className="mb-3 font-bold text-[#112250]">
                Selecciona un método de pago
              </h3>

              <div className="space-y-3">
                {METODOS_PAGO.map((metodo) => (
                  <button
                    key={metodo}
                    type="button"
                    aria-pressed={metodoSeleccionado === metodo}
                    onClick={() => setMetodoSeleccionado(metodo)}
                    disabled={enviandoPago}
                    className={`w-full rounded-lg border-2 p-4 text-left transition ${
                      metodoSeleccionado === metodo
                        ? "border-[#E57A3A] bg-orange-50"
                        : "border-gray-200 hover:border-[#8FBFE3]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#112250]">
                        {metodo}
                      </span>

                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          metodoSeleccionado === metodo
                            ? "border-[#E57A3A] bg-[#E57A3A]"
                            : "border-gray-300"
                        }`}
                      >
                        {metodoSeleccionado === metodo && (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {metodo === "Tarjeta Bancaria"
                        ? "Registrar una solicitud mediante tarjeta bancaria."
                        : "Registrar una solicitud mediante transferencia bancaria."}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aviso sobre la verificación */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-900">
                <strong>Importante:</strong> Al continuar, se registrará
                una solicitud de pago. El pago no se confirmará
                automáticamente. La factura seguirá pendiente hasta que
                el veterinario verifique la solicitud.
              </p>
            </div>

            {/* Confirmar solicitud */}
            <Button
              block
              disabled={enviandoPago}
              onClick={confirmarSolicitud}
            >
              {enviandoPago
                ? "Enviando solicitud..."
                : "Confirmar solicitud"}
            </Button>

          </div>
        )}
      </Modal>
    </div>
  );
}
