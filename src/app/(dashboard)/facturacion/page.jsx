"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerUsuarios } from "@/services/clientesService";
import { obtenerProductos } from "@/services/inventarioService";
import {
  obtenerFacturas,
  crearFacturaConInventario,
} from "@/services/facturacionService";

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const fechaConvertida = fecha?.toDate
    ? fecha.toDate()
    : new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return "Fecha inválida";
  }

  return fechaConvertida.toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const serviciosVeterinarios = [
  "Consulta general",
  "Vacunación",
  "Revisión",
  "Desparasitación",
  "Emergencia",
];

export default function FacturacionPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  // Datos
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Estados de carga
  const [cargando, setCargando] = useState(true);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");

  // Búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Modales
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Factura seleccionada
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  // Datos del formulario
  const [clienteID, setClienteID] = useState("");
  const [fecha, setFecha] = useState("");

  const [items, setItems] = useState([
    {
      tipo: "servicio",
      nombre: "",
      productoID: "",
      cantidad: 1,
      precio: "",
    },
  ]
);
// Actualizar un campo de un artículo
const actualizarItem = (index, campo, valor) => {
  setItems((itemsActuales) =>
    itemsActuales.map((item, i) =>
      i === index
        ? { ...item, [campo]: valor }
        : item
    )
  );
};

// Cambiar entre producto y servicio
const cambiarTipoItem = (index, tipo) => {
  setItems((itemsActuales) =>
    itemsActuales.map((item, i) =>
      i === index
        ? {
            tipo,
            nombre: "",
            productoID: "",
            cantidad: 1,
            precio: "",
          }
        : item
    )
  );
};

// Seleccionar un producto del inventario
const seleccionarProducto = (index, productoID) => {
  const producto = productos.find(
    (producto) => producto.id === productoID
  );

  if (!producto) return;

  setItems((itemsActuales) =>
    itemsActuales.map((item, i) =>
      i === index
        ? {
            ...item,
            productoID: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
          }
        : item
    )
  );
};

// Agregar un artículo
const agregarItem = () => {
  setItems((itemsActuales) => [
    ...itemsActuales,
    {
      tipo: "servicio",
      nombre: "",
      productoID: "",
      cantidad: 1,
      precio: "",
    },
  ]);
};

// Eliminar un artículo
const eliminarItem = (index) => {
  setItems((itemsActuales) =>
    itemsActuales.filter((_, i) => i !== index)
  );
};

// Calcular subtotal de cada artículo
const calcularSubtotalItem = (item) => {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precio) || 0;

  return cantidad * precio;
};

// Calcular subtotal general de la factura
const subtotalFactura = items.reduce(
  (total, item) => total + calcularSubtotalItem(item),
  0
);

// Limpiar formulario de facturación
const limpiarFormulario = () => {
  setClienteID("");
  setFecha("");

  setItems([
    {
      tipo: "servicio",
      nombre: "",
      productoID: "",
      cantidad: 1,
      precio: "",
    },
  ]);
};

// Validar los datos del formulario
const validarFormulario = () => {
  // Validar cliente
  if (!clienteID) {
    return "Debes seleccionar un cliente.";
  }

  const clienteExiste = clientes.some(
    (cliente) => cliente.id === clienteID
  );

  if (!clienteExiste) {
    return "El cliente seleccionado no es válido.";
  }

  // Validar que exista al menos un artículo
  if (items.length === 0) {
    return "Debes agregar al menos un producto o servicio.";
  }

  // Validar cada artículo
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cantidad = Number(item.cantidad);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return `La cantidad del artículo ${i + 1} debe ser un número entero mayor que cero.`;
    }

    // Validaciones para servicios
    if (item.tipo === "servicio") {
      if (!serviciosVeterinarios.includes(item.nombre)) {
        return `Selecciona un servicio válido en el artículo ${i + 1}.`;
      }

      const precio = Number(item.precio);

      if (!Number.isFinite(precio) || precio <= 0) {
        return `El precio del servicio ${i + 1} debe ser mayor que cero.`;
      }
    }

    // Validaciones para productos
    else if (item.tipo === "producto") {
      const producto = productos.find(
        (producto) => producto.id === item.productoID
      );

      if (!producto) {
        return `Selecciona un producto válido en el artículo ${i + 1}.`;
      }

      if (cantidad > Number(producto.cantidad)) {
        return `No hay suficiente inventario de ${producto.nombre}. Stock disponible: ${producto.cantidad}.`;
      }
    }

    else {
      return `El tipo del artículo ${i + 1} no es válido.`;
    }
  }

  // Validar total
  if (subtotalFactura <= 0 || !Number.isFinite(subtotalFactura)) {
    return "El total de la factura debe ser mayor que cero.";
  }

  return null;
};

// Guardar una nueva factura
const guardarFactura = async () => {
  if (guardando) return;

  setErrorFormulario("");

  // Validar formulario
  const error = validarFormulario();

  if (error) {
    setErrorFormulario(error);
    return;
  }

  // Buscar cliente seleccionado
  const cliente = clientes.find(
    (cliente) => cliente.id === clienteID
  );

  if (!cliente) {
    setErrorFormulario("No se encontró el cliente seleccionado.");
    return;
  }

  // Preparar información de la factura
  const datosFactura = {
    Cliente: `${cliente.nombre} ${cliente.apellido || ""}`.trim(),
    usuarioID: cliente.id,

    items: items.map((item) => {
      if (item.tipo === "producto") {
        return {
          tipo: "producto",
          productoID: item.productoID,
          cantidad: Number(item.cantidad),
        };
      }

      return {
        tipo: "servicio",
        nombre: item.nombre,
        cantidad: Number(item.cantidad),
        precio: Number(item.precio),
      };
    }),
  };

  try {
    setGuardando(true);

    // Crear factura y descontar inventario
    await crearFacturaConInventario(datosFactura);

    // Actualizar listado de facturas
    const facturasActualizadas = await obtenerFacturas();

    setFacturas(facturasActualizadas);

    // Cerrar y limpiar formulario
    setMostrarModal(false);
    limpiarFormulario();
    setErrorFormulario("");

  } catch (error) {
    console.error("Error al guardar factura:", error);

    setErrorFormulario(
      error.message || "Ocurrió un error al crear la factura."
    );

  } finally {
    setGuardando(false);
  }
};

// Abrir modal de nueva factura
const abrirModal = () => {
  limpiarFormulario();
  setErrorFormulario("");
  setMostrarModal(true);
};

    // Cargar clientes registrados
useEffect(() => {
  if (cargandoAuth) return;

  if (!usuario || usuario.rol !== "veterinario") {
    setCargandoClientes(false);
    return;
  }

  const cargarClientes = async () => {
    try {
      setCargandoClientes(true);

      const usuarios = await obtenerUsuarios();

      const clientesRegistrados = usuarios.filter(
        (usuario) => usuario.rol === "usuario"
      );

      setClientes(clientesRegistrados);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setCargandoClientes(false);
    }
  };

  cargarClientes();
}, [usuario, cargandoAuth]);

// Cargar productos del inventario
useEffect(() => {
  if (cargandoAuth) return;

  if (!usuario || usuario.rol !== "veterinario") {
    setCargandoProductos(false);
    return;
  }

  const cargarProductos = async () => {
    try {
      setCargandoProductos(true);

      const datos = await obtenerProductos();

      setProductos(datos);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setCargandoProductos(false);
    }
  };

  cargarProductos();
}, [usuario, cargandoAuth]);

// Cargar facturas registradas
useEffect(() => {
  if (cargandoAuth) return;

  if (!usuario || usuario.rol !== "veterinario") {
    setCargando(false);
    return;
  }

  const cargarFacturas = async () => {
    try {
      setCargando(true);

      const datos = await obtenerFacturas();

      setFacturas(datos);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    } finally {
      setCargando(false);
    }
  };

  cargarFacturas();
}, [usuario, cargandoAuth]);

// Estadísticas de facturación
const cantidadFacturas = facturas.length;

const cantidadPagadas = facturas.filter(
  (factura) => factura.estado === "pagada"
).length;

const totalFacturado = facturas.reduce(
  (total, factura) => total + (Number(factura.total) || 0),
  0
);

// Filtrar facturas por número o cliente
const facturasFiltradas = facturas.filter((factura) => {
  const termino = busqueda.toLowerCase().trim();

  return (
    factura.numero?.toLowerCase().includes(termino) ||
    factura.Cliente?.toLowerCase().includes(termino)
  );
});

  
return (
  <main className="space-y-6">

    {/* ENCABEZADO */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[#112250]">
          💳 Facturación
        </h1>

        <p className="text-gray-500 mt-1">
          Gestiona las facturas de Veterinaria San Roque.
        </p>
      </div>

      <button
        onClick={abrirModal}
        className="bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold px-5 py-3 rounded-lg shadow-md transition"
      >
        ➕ Nueva factura
      </button>
    </div>

    {/* RESUMEN */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
        <p className="text-gray-500">
          Facturas registradas
        </p>

        <p className="text-3xl font-bold text-[#112250] mt-2">
          {cantidadFacturas}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-400">
        <p className="text-gray-500">
          Facturas pagadas
        </p>

        <p className="text-3xl font-bold text-[#112250] mt-2">
          {cantidadPagadas}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E57A3A]">
        <p className="text-gray-500">
          Total facturado
        </p>

        <p className="text-3xl font-bold text-[#112250] mt-2">
          ${totalFacturado.toFixed(2)}
        </p>
      </div>

    </div>
    {/* LISTADO DE FACTURAS */}
<div className="bg-white rounded-xl shadow-md p-6 space-y-5">

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold text-[#112250]">
        Facturas registradas
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Consulta las facturas emitidas a tus clientes.
      </p>
    </div>

    <input
      type="text"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      placeholder="Buscar por número o cliente..."
      className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3]"
    />
  </div>

  {cargando ? (
    <p className="text-center text-gray-500 py-8">
      Cargando facturas...
    </p>
  ) : facturasFiltradas.length === 0 ? (
    <p className="text-center text-gray-500 py-8">
      {busqueda
        ? "No se encontraron facturas."
        : "Todavía no hay facturas registradas."}
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">

        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-4 py-3">N.º factura</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {facturasFiltradas.map((factura) => (
            <tr
              key={factura.id}
              className="border-b hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-semibold text-[#112250]">
                {factura.numero || "Sin número"}
              </td>

              <td className="px-4 py-3">
                {factura.Cliente || "Sin cliente"}
              </td>

              <td className="px-4 py-3">
                {formatearFecha(factura.fecha)}
              </td>

              <td className="px-4 py-3 font-semibold">
                ${(Number(factura.total) || 0).toFixed(2)}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    factura.estado === "pagada"
                      ? "bg-green-100 text-green-700"
                      : factura.estado === "atrasada"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {factura.estado || "pendiente"}
                </span>
              </td>

              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setFacturaSeleccionada(factura);
                    setMostrarDetalle(true);
                  }}
                  className="text-[#112250] hover:text-[#E57A3A] font-semibold"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )}
  </div>
  {/* MODAL DE NUEVA FACTURA */}
{mostrarModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

      {/* ENCABEZADO */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-[#112250]">
            Nueva factura
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Registra los productos y servicios del cliente.
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(false)}
          disabled={guardando}
          className="text-gray-500 hover:text-red-500 text-2xl disabled:opacity-50"
        >
          &times;
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="p-6 space-y-6">

        {/* SELECCIÓN DEL CLIENTE */}
        <div>
          <label className="block text-sm font-semibold text-[#112250] mb-2">
            Cliente
          </label>

          <select
            value={clienteID}
            onChange={(e) => setClienteID(e.target.value)}
            disabled={guardando || cargandoClientes}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3]"
          >
            <option value="">
              {cargandoClientes
                ? "Cargando clientes..."
                : "Selecciona un cliente"}
            </option>

            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellido || ""} — {cliente.correo}
              </option>
            ))}
          </select>

          {!cargandoClientes && clientes.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              No hay clientes registrados disponibles.
            </p>
          )}
        </div>

        {/* PRODUCTOS Y SERVICIOS */}
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#112250]">
              Productos y servicios
            </h3>

            <button
              onClick={agregarItem}
              disabled={guardando}
              className="text-sm font-semibold text-[#E57A3A] hover:text-[#d96d2f] disabled:opacity-50"
            >
              + Agregar artículo
            </button>
          </div>

          {items.map((item, index) => {
            const productoSeleccionado = productos.find(
              (producto) => producto.id === item.productoID
            );

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 space-y-4"
              >

                {/* ENCABEZADO DEL ARTÍCULO */}
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#112250]">
                    Artículo {index + 1}
                  </p>

                  <button
                    onClick={() => eliminarItem(index)}
                    disabled={guardando}
                    className="text-sm text-red-500 hover:text-red-700 font-semibold disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>

                {/* TIPO DE ARTÍCULO */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Tipo de artículo
                  </label>

                  <select
                    value={item.tipo}
                    onChange={(e) =>
                      cambiarTipoItem(index, e.target.value)
                    }
                    disabled={guardando}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                  >
                    <option value="servicio">Servicio veterinario</option>
                    <option value="producto">Producto de inventario</option>
                  </select>
                </div>

                {/* SELECCIÓN DE SERVICIO */}
                {item.tipo === "servicio" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Servicio
                    </label>

                    <select
                      value={item.nombre}
                      onChange={(e) =>
                        actualizarItem(index, "nombre", e.target.value)
                      }
                      disabled={guardando}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    >
                      <option value="">
                        Selecciona un servicio
                      </option>

                      {serviciosVeterinarios.map((servicio) => (
                        <option key={servicio} value={servicio}>
                          {servicio}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* SELECCIÓN DE PRODUCTO */}
                {item.tipo === "producto" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Producto
                    </label>

                    <select
                      value={item.productoID}
                      onChange={(e) =>
                        seleccionarProducto(index, e.target.value)
                      }
                      disabled={guardando || cargandoProductos}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    >
                      <option value="">
                        {cargandoProductos
                          ? "Cargando productos..."
                          : "Selecciona un producto"}
                      </option>

                      {productos.map((producto) => (
                        <option
                          key={producto.id}
                          value={producto.id}
                          disabled={Number(producto.cantidad) <= 0}
                        >
                          {producto.nombre} — Stock: {producto.cantidad}
                        </option>
                      ))}
                    </select>

                    {!cargandoProductos && productos.length === 0 && (
                      <p className="text-sm text-red-500 mt-2">
                        No hay productos registrados en el inventario.
                      </p>
                    )}
                  </div>
                )}

                {/* CANTIDAD Y PRECIO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Cantidad
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarItem(index, "cantidad", e.target.value)
                      }
                      disabled={guardando}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    />

                    {item.tipo === "producto" && productoSeleccionado && (
                      <p className="text-xs text-gray-500 mt-1">
                        Stock disponible: {productoSeleccionado.cantidad}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Precio unitario ($)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precio}
                      onChange={(e) =>
                        actualizarItem(index, "precio", e.target.value)
                      }
                      disabled={guardando || item.tipo === "producto"}
                      readOnly={item.tipo === "producto"}
                      placeholder={
                        item.tipo === "servicio"
                          ? "Introduce el precio"
                          : "Precio del inventario"
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8FBFE3] disabled:opacity-70"
                    />
                  </div>

                </div>

                {/* SUBTOTAL DEL ARTÍCULO */}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm text-gray-500">
                    Subtotal del artículo
                  </span>

                  <span className="font-bold text-[#112250]">
                    ${calcularSubtotalItem(item).toFixed(2)}
                  </span>
                </div>

              </div>
            );
          })}

        </div>

        {/* TOTAL DE LA FACTURA */}
        <div className="bg-blue-50 rounded-xl p-5 flex justify-between items-center">
          <span className="font-bold text-[#112250]">
            Total de la factura
          </span>

          <span className="text-2xl font-bold text-[#E57A3A]">
            ${subtotalFactura.toFixed(2)}
          </span>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorFormulario && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {errorFormulario}
          </div>
        )}

      </div>

      {/* PIE DEL MODAL */}
      <div className="p-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">

        <button
          onClick={() => setMostrarModal(false)}
          disabled={guardando}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={guardarFactura}
          disabled={
            guardando ||
            cargandoClientes ||
            cargandoProductos ||
            clientes.length === 0
          }
          className="bg-[#E57A3A] hover:bg-[#d96d2f] text-white px-5 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? "Guardando factura..." : "Crear factura"}
        </button>

      </div>

    </div>
  </div>
)}
  {/* MODAL DE DETALLE DE FACTURA */}
{mostrarDetalle && facturaSeleccionada && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

      {/* ENCABEZADO */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-[#112250]">
            Detalle de factura
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {facturaSeleccionada.numero || "Sin número"}
          </p>
        </div>

        <button
          onClick={() => {
            setMostrarDetalle(false);
            setFacturaSeleccionada(null);
          }}
          className="text-gray-500 hover:text-red-500 text-2xl"
        >
          &times;
        </button>
      </div>

      {/* INFORMACIÓN */}
      <div className="p-6 space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-semibold text-[#112250]">
              {facturaSeleccionada.Cliente || "Sin cliente"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Fecha de emisión</p>
            <p className="font-semibold text-[#112250]">
              {formatearFecha(facturaSeleccionada.fecha)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="font-semibold capitalize text-[#112250]">
              {facturaSeleccionada.estado || "pendiente"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Número de factura</p>
            <p className="font-semibold text-[#112250]">
              {facturaSeleccionada.numero || "Sin número"}
            </p>
          </div>

        </div>

        {/* PRODUCTOS Y SERVICIOS */}
        <div>
          <h3 className="font-bold text-[#112250] mb-3">
            Productos y servicios
          </h3>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-left">

              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {(facturaSeleccionada.items || []).map((item, index) => (
                  <tr key={index} className="border-b">

                    <td className="px-4 py-3">
                      <p className="font-medium text-[#112250]">
                        {item.nombre}
                      </p>

                      <p className="text-xs text-gray-500 capitalize">
                        {item.tipo}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      {item.cantidad}
                    </td>

                    <td className="px-4 py-3">
                      ${(Number(item.precio) || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      ${(Number(item.subtotal) || 0).toFixed(2)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          </div>
        </div>

        {/* TOTAL */}
        <div className="border-t pt-4 flex justify-between items-center">
          <span className="text-lg font-bold text-[#112250]">
            Total de factura
          </span>

          <span className="text-2xl font-bold text-[#E57A3A]">
            ${(Number(facturaSeleccionada.total) || 0).toFixed(2)}
          </span>
        </div>

      </div>

      {/* PIE */}
      <div className="p-6 border-t flex justify-end">
        <button
          onClick={() => {
            setMostrarDetalle(false);
            setFacturaSeleccionada(null);
          }}
          className="bg-[#112250] hover:bg-[#1b356d] text-white px-5 py-2 rounded-lg font-semibold transition"
        >
          Cerrar
        </button>
      </div>

    </div>
  </div>
)}

  </main>
);
}