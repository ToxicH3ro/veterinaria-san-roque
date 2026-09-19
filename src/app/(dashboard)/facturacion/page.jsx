"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  crearFacturaConInventario,
  obtenerFacturas,
} from "@/services/facturacionService";

import {
  obtenerProductos,
} from "@/services/inventarioService";

export default function FacturacionPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  const servicios = [
    "Consulta General",
    "Vacunación",
    "Revisión",
    "Desparasitación",
    "Emergencia",
  ];

  const [facturas, setFacturas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState(null);

  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState("");

  const [items, setItems] = useState([
  {
    tipo: "servicio",
    producto: "",
    productoId: "",
    cantidad: 1,
    precio: "",
  },
]);

  // CARGAR FACTURAS

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

  useEffect(() => {
  if (cargandoAuth) {
    return;
  }

  if (!usuario) {
    setCargando(false);
    return;
  }

  cargarFacturas();
}, [usuario, cargandoAuth]);

  useEffect(() => {
  if (cargandoAuth) {
    return;
  }

  if (!usuario) {
    setCargandoProductos(false);
    return;
  }

  const cargarProductos = async () => {
    try {
      setCargandoProductos(true);

      const datos = await obtenerProductos();

      setProductos(datos);
    } catch (error) {
      console.error(
        "Error al cargar productos del inventario:",
        error
      );
    } finally {
      setCargandoProductos(false);
    }
  };

  cargarProductos();
}, [usuario, cargandoAuth]);

  // GENERAR NÚMERO DE FACTURA

  const generarNumeroFactura = () => {
    const numero = facturas.length + 1;

    return `FAC-${String(numero).padStart(3, "0")}`;
  };

  // MANEJAR ITEMS

  const cambiarItem = (indice, campo, valor) => {
    const nuevosItems = [...items];

    nuevosItems[indice][campo] = valor;

    setItems(nuevosItems);
  };

  const seleccionarProducto = (
  indice,
  productoId
) => {
  const productoSeleccionado = productos.find(
    (producto) => producto.id === productoId
  );

  if (!productoSeleccionado) {
    cambiarItem(indice, "producto", "");
    cambiarItem(indice, "productoId", "");
    cambiarItem(indice, "precio", "");

    return;
  }

  const nuevosItems = [...items];

  nuevosItems[indice] = {
    ...nuevosItems[indice],
    producto: productoSeleccionado.nombre,
    productoId: productoSeleccionado.id,
    precio: Number(productoSeleccionado.precio) || 0,
    tipo: "producto",
  };

  setItems(nuevosItems);
};

  const agregarItem = () => {
    setItems([
      ...items,
      {
        tipo: "servicio",
        producto: "",
        productoId: "",
        cantidad: 1,
        precio: "",
      },
    ]);
  };

  const eliminarItem = (indice) => {
    if (items.length === 1) {
      return;
    }

    setItems(items.filter((_, i) => i !== indice));
  };

  // CALCULAR TOTAL

  const calcularSubtotal = () => {
    return items.reduce((total, item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precio) || 0;

      return total + cantidad * precio;
    }, 0);
  };

  const subtotal = calcularSubtotal();

  const total = subtotal;

  // CREAR FACTURA

  const handleCrearFactura = async (e) => {
    e.preventDefault();

    if (!cliente.trim()) {
      alert("Ingrese el nombre del cliente.");
      return;
    }

    const itemsValidos = items.every(
      (item) =>
        item.producto.trim() !== "" &&
        Number(item.cantidad) > 0 &&
        Number(item.precio) >= 0
    );

    if (!itemsValidos) {
      alert("Complete correctamente todos los productos.");
      return;
    }

    try {
      setGuardando(true);

// Verificar que los productos tengan suficiente inventario
for (const item of items) {
  if (item.tipo !== "producto") {
    continue;
  }

  const producto = productos.find(
    (producto) =>
      producto.id === item.productoId
  );

  if (!producto) {
    throw new Error(
      `No se encontró el producto ${item.producto}.`
    );
  }

  const stockDisponible =
    Number(producto.cantidad) || 0;

  const cantidadSolicitada =
    Number(item.cantidad) || 0;

  if (cantidadSolicitada > stockDisponible) {
    throw new Error(
      `No hay suficiente stock de ${producto.nombre}. ` +
      `Disponible: ${stockDisponible}.`
    );
  }
}

      const nuevaFactura = {
        numero: generarNumeroFactura(),
        cliente: cliente.trim(),
        fecha,
        items: items.map((item) => ({
          tipo: item.tipo,
          producto: item.producto.trim(),
          productoId:
          item.tipo === "producto"
          ? item.productoId
          : null,
          cantidad: Number(item.cantidad),
          precio: Number(item.precio),
        })),
        subtotal,
        total,
      };

      const facturaCreada =
      await crearFacturaConInventario(nuevaFactura);

      setFacturas((facturasActuales) => [
        facturaCreada,
        ...facturasActuales,
      ]);

      setCliente("");
      setFecha("");
      setItems([
        {
          tipo: "servicio",
          producto: "",
          productoId: "",
          cantidad: 1,
          precio: "",
        },
      ]);

      setMostrarModal(false);

      alert("Factura creada correctamente.");
      } catch (error) {
      console.error(
      "Error al crear factura:",
      error
      );
      alert(
      error.message ||
      "No se pudo crear la factura."
      );} finally {
      setGuardando(false);
    }};

  const verDetalle = (factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDetalle(true);
  };

  const imprimirFactura = () => {
    window.print();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const facturasFiltradas = facturas.filter(
    (factura) =>
      factura.cliente
        ?.toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      factura.numero
        ?.toLowerCase()
        .includes(busqueda.toLowerCase())
  );

  const cantidadPagadas = facturas.filter(
    (factura) => factura.estado === "Pagada"
  ).length;

  const totalFacturado = facturas.reduce(
    (total, factura) =>
      total + (Number(factura.total) || 0),
    0
  );

  return (
    <main>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .factura-print,
          .factura-print * {
            visibility: visible;
          }

          .factura-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#112250]">
            💳 Facturación
          </h1>

          <p className="text-gray-500 mt-1">
            Gestiona las facturas y pagos de la veterinaria
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold px-5 py-3 rounded-lg shadow-md transition"
        >
          ➕ Nueva factura
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
          <p className="text-gray-500">
            Facturas
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            {facturas.length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-400">
          <p className="text-gray-500">
            Pagadas
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

      <div className="bg-white rounded-xl shadow-md p-5 mt-6">
        <label className="block text-sm font-semibold text-[#112250] mb-2">
          🔎 Buscar factura
        </label>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente o número de factura..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
        />
      </div>


      <div className="bg-white rounded-xl shadow-md mt-6 overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-[#112250]">
            📋 Facturas registradas
          </h2>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-gray-500">
            Cargando facturas...
          </div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay facturas registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Factura
                  </th>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Cliente
                  </th>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Fecha
                  </th>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Total
                  </th>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Estado
                  </th>

                  <th className="text-left p-4 text-sm font-semibold text-[#112250]">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {facturasFiltradas.map((factura) => (
                  <tr
                    key={factura.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-semibold text-[#112250]">
                      {factura.numero}
                    </td>

                    <td className="p-4 text-gray-600">
                      {factura.cliente}
                    </td>

                    <td className="p-4 text-gray-600">
                      {formatearFecha(factura.fecha)}
                    </td>

                    <td className="p-4 font-semibold text-[#112250]">
                      ${(Number(factura.total) || 0).toFixed(2)}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          factura.estado === "Pagada"
                            ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold"
                            : "bg-[#F6EBC3] text-[#112250] px-3 py-1 rounded-full text-sm font-semibold"
                        }
                      >
                        {factura.estado}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => verDetalle(factura)}
                        className="text-[#112250] font-semibold hover:text-[#E57A3A] transition"
                      >
                        Ver factura →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#112250]">
                  ➕ Nueva factura
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Registra una nueva factura
                </p>
              </div>

              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCrearFactura}
              className="p-6"
            >
              {/* CLIENTE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#112250] mb-2">
                    Cliente
                  </label>

                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) =>
                      setCliente(e.target.value)
                    }
                    placeholder="Nombre del cliente"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#112250] mb-2">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) =>
                      setFecha(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    required
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#112250]">
                    🛒 Productos / servicios
                  </h3>

                  <button
                    type="button"
                    onClick={agregarItem}
                    className="text-[#E57A3A] font-semibold hover:underline"
                  >
                    ➕ Agregar
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, indice) => (
                    <div
                      key={indice}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-lg"
                    >

                      <div className="md:col-span-5">
  <label className="block text-xs font-semibold text-gray-500 mb-1">
    Servicio / producto
  </label>

  <select
    value={
      item.tipo === "servicio"
        ? `servicio:${item.producto}`
        : `producto:${item.productoId}`
    }
    onChange={(e) => {
      const valor = e.target.value;

      if (!valor) {
        const nuevosItems = [...items];

        nuevosItems[indice] = {
          ...nuevosItems[indice],
          tipo: "servicio",
          producto: "",
          productoId: "",
          precio: "",
        };

        setItems(nuevosItems);
        return;
      }

      if (valor.startsWith("servicio:")) {
        const nombreServicio =
          valor.replace("servicio:", "");

        const nuevosItems = [...items];

        nuevosItems[indice] = {
          ...nuevosItems[indice],
          tipo: "servicio",
          producto: nombreServicio,
          productoId: "",
        };

        setItems(nuevosItems);

        return;
      }

      if (valor.startsWith("producto:")) {
        const productoId =
          valor.replace("producto:", "");

        seleccionarProducto(
          indice,
          productoId
        );
      }
    }}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
    required
  >
    <option value="">
      Seleccionar servicio o producto
    </option>

    <optgroup label="🩺 Servicios">
      {servicios.map((servicio) => (
        <option
          key={servicio}
          value={`servicio:${servicio}`}
        >
          {servicio}
        </option>
      ))}
    </optgroup>

    <optgroup label="📦 Inventario">
      {cargandoProductos ? (
        <option disabled>
          Cargando inventario...
        </option>
      ) : productos.length === 0 ? (
        <option disabled>
          No hay productos registrados
        </option>
      ) : (
        productos.map((producto) => (
          <option
            key={producto.id}
            value={`producto:${producto.id}`}
            disabled={
              Number(producto.cantidad) <= 0
            }
          >
            {producto.nombre} — Stock:{" "}
            {Number(producto.cantidad) || 0}
          </option>
        ))
      )}
    </optgroup>
  </select>
</div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Cantidad
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) =>
                            cambiarItem(
                              indice,
                              "cantidad",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Precio
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio}
                          onChange={(e) =>
                            cambiarItem(
                              indice,
                              "precio",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() =>
                            eliminarItem(indice)
                          }
                          disabled={items.length === 1}
                          className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full md:w-80 bg-[#F6EBC3] rounded-xl p-5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>

                    <span>
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 my-3" />

                  <div className="flex justify-between text-xl font-bold text-[#112250]">
                    <span>Total</span>

                    <span>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-5 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold px-5 py-3 rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : "💾 Crear factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
     

      {mostrarDetalle && facturaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          
          <div className="factura-print bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            {/* BOTONES */}

            <div className="no-print flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-[#112250]">
                📄 Detalle de factura
              </h2>

              <button
                onClick={() => setMostrarDetalle(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* FACTURA */}

            <div className="p-8">
              <div className="text-center border-b pb-6">
                <h1 className="text-3xl font-bold text-[#112250]">
                  Veterinaria San Roque
                </h1>

                <p className="text-gray-500 mt-1">
                  Factura
                </p>
              </div>

              <div className="flex justify-between mt-6">
                <div>
                  <p className="text-sm text-gray-500">
                    Cliente
                  </p>

                  <p className="font-semibold text-[#112250]">
                    {facturaSeleccionada.cliente}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Factura
                  </p>

                  <p className="font-semibold text-[#112250]">
                    {facturaSeleccionada.numero}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatearFecha(
                      facturaSeleccionada.fecha
                    )}
                  </p>
                </div>
              </div>

              {/* ITEMS */}

              <div className="mt-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#112250]">
                      <th className="text-left py-3">
                        Descripción
                      </th>

                      <th className="text-center py-3">
                        Cant.
                      </th>

                      <th className="text-right py-3">
                        Precio
                      </th>

                      <th className="text-right py-3">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {facturaSeleccionada.items?.map(
                      (item, indice) => (
                        <tr
                          key={indice}
                          className="border-b"
                        >
                          <td className="py-3">
                            {item.producto}
                          </td>

                          <td className="py-3 text-center">
                            {item.cantidad}
                          </td>

                          <td className="py-3 text-right">
                            $
                            {Number(
                              item.precio
                            ).toFixed(2)}
                          </td>

                          <td className="py-3 text-right font-semibold">
                            $
                            {(
                              Number(item.cantidad) *
                              Number(item.precio)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTAL */}

              <div className="flex justify-end mt-8">
                <div className="w-64">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>

                    <span>
                      $
                      {Number(
                        facturaSeleccionada.subtotal
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t my-3" />

                  <div className="flex justify-between text-xl font-bold text-[#112250]">
                    <span>Total</span>

                    <span>
                      $
                      {Number(
                        facturaSeleccionada.total
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ESTADO */}

              <div className="mt-8 text-center">
                <span
                  className={
                    facturaSeleccionada.estado === "Pagada"
                      ? "bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold"
                      : "bg-[#F6EBC3] text-[#112250] px-4 py-2 rounded-full font-semibold"
                  }
                >
                  {facturaSeleccionada.estado}
                </span>
              </div>

              <p className="text-center text-gray-400 text-sm mt-10">
                Gracias por confiar en Veterinaria San Roque.
              </p>
            </div>

            {/* BOTÓN IMPRIMIR */}

            <div className="no-print p-5 border-t flex justify-end gap-3">
              <button
                onClick={() => setMostrarDetalle(false)}
                className="px-5 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition"
              >
                Cerrar
              </button>

              <button
                onClick={imprimirFactura}
                className="bg-[#112250] hover:bg-[#1b326d] text-white font-semibold px-5 py-3 rounded-lg shadow-md transition"
              >
                🖨️ Imprimir factura
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}