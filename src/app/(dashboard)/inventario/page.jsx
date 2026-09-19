"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  crearProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto,
} from "@/services/inventarioService";

export default function InventarioPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  // MODAL REGISTRAR
  const [mostrarModal, setMostrarModal] =
    useState(false);

  // MODAL EDITAR
  const [mostrarEditarModal, setMostrarEditarModal] =
    useState(false);

  const [productoEditando, setProductoEditando] =
    useState(null);

  const [guardandoEdicion, setGuardandoEdicion] =
    useState(false);

  const [producto, setProducto] = useState({
    nombre: "",
    categoria: "",
    cantidad: "",
    precio: "",
    proveedor: "",
  });

  // CARGAR INVENTARIO
  useEffect(() => {
  if (cargandoAuth) {
    return;
  }

  if (!usuario) {
    setCargando(false);
    return;
  }

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const datos = await obtenerProductos();

      setProductos(datos);
    } catch (error) {
      console.error(
        "Error al obtener el inventario:",
        error
      );
    } finally {
      setCargando(false);
    }
  };

  cargarProductos();
}, [usuario, cargandoAuth]);

  // CAMBIAR CAMPOS DEL FORMULARIO
  const handleChange = (e) => {
    setProducto({
      ...producto,
      [e.target.name]: e.target.value,
    });
  };

  // REGISTRAR PRODUCTO
  const handleRegistrar = async (e) => {
    e.preventDefault();

    try {
      const nuevoProducto = await crearProducto({
        nombre: producto.nombre.trim(),
        categoria: producto.categoria,
        cantidad: Number(producto.cantidad),
        precio: Number(producto.precio),
        proveedor: producto.proveedor.trim(),
      });

      setProductos((productosActuales) => [
        ...productosActuales,
        nuevoProducto,
      ]);

      setProducto({
        nombre: "",
        categoria: "",
        cantidad: "",
        precio: "",
        proveedor: "",
      });

      setMostrarModal(false);
    } catch (error) {
      console.error(
        "Error al registrar el producto:",
        error
      );

      alert(
        error.message ||
          "No se pudo registrar el producto."
      );
    }
  };

  // ABRIR MODAL DE EDICIÓN
  const abrirEditar = (productoSeleccionado) => {
    setProductoEditando({
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre || "",
      categoria:
        productoSeleccionado.categoria || "",
      cantidad:
        productoSeleccionado.cantidad ?? "",
      precio:
        productoSeleccionado.precio ?? "",
      proveedor:
        productoSeleccionado.proveedor || "",
    });

    setMostrarEditarModal(true);
  };

  // CAMBIAR CAMPOS DEL PRODUCTO EDITADO
  const handleChangeEditar = (e) => {
    setProductoEditando({
      ...productoEditando,
      [e.target.name]: e.target.value,
    });
  };

  // ACTUALIZAR PRODUCTO
  const handleActualizar = async (e) => {
    e.preventDefault();

    if (!productoEditando?.id) {
      return;
    }

    try {
      setGuardandoEdicion(true);

      const productoActualizado =
        await actualizarProducto(
          productoEditando.id,
          {
            nombre:
              productoEditando.nombre.trim(),
            categoria:
              productoEditando.categoria,
            cantidad:
              Number(productoEditando.cantidad),
            precio:
              Number(productoEditando.precio),
            proveedor:
              productoEditando.proveedor.trim(),
          }
        );

      setProductos((productosActuales) =>
        productosActuales.map((producto) =>
          producto.id === productoActualizado.id
            ? productoActualizado
            : producto
        )
      );

      setMostrarEditarModal(false);
      setProductoEditando(null);

      alert(
        "Producto actualizado correctamente."
      );
    } catch (error) {
      console.error(
        "Error al actualizar el producto:",
        error
      );

      alert(
        error.message ||
          "No se pudo actualizar el producto."
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ELIMINAR PRODUCTO
const handleEliminar = async (productoSeleccionado) => {
  const confirmar = window.confirm(
    `¿Estás seguro de que deseas eliminar "${productoSeleccionado.nombre}" del inventario?`
  );

  if (!confirmar) {
    return;
  }

  try {
    await eliminarProducto(productoSeleccionado.id);

    setProductos((productosActuales) =>
      productosActuales.filter(
        (producto) =>
          producto.id !== productoSeleccionado.id
      )
    );

    alert("Producto eliminado correctamente.");
  } catch (error) {
    console.error(
      "Error al eliminar el producto:",
      error
    );

    alert(
      error.message ||
        "No se pudo eliminar el producto."
    );
  }
};

  // BUSCADOR
  const productosFiltrados = productos.filter(
    (producto) => {
      const texto = busqueda.toLowerCase();

      return (
        producto.nombre
          ?.toLowerCase()
          .includes(texto) ||
        producto.categoria
          ?.toLowerCase()
          .includes(texto) ||
        producto.proveedor
          ?.toLowerCase()
          .includes(texto)
      );
    }
  );

  // ESTADÍSTICAS
  const totalProductos = productos.length;

  const unidadesTotales = productos.reduce(
    (total, producto) =>
      total +
      (Number(producto.cantidad) || 0),
    0
  );

  const productosStockBajo = productos.filter(
    (producto) =>
      Number(producto.cantidad) <= 5
  ).length;

  return (
    <main>
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#112250]">
            📦 Inventario
          </h1>

          <p className="text-gray-500 mt-1">
            Gestión de productos y existencias
          </p>
        </div>

        <button
          onClick={() =>
            setMostrarModal(true)
          }
          className="bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold py-3 px-5 rounded-lg transition"
        >
          ➕ Registrar producto
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#8FBFE3]">
          <h3 className="text-lg font-semibold text-gray-600">
            Productos
          </h3>

          <p className="text-4xl font-bold text-[#112250] mt-2">
            {totalProductos}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E57A3A]">
          <h3 className="text-lg font-semibold text-gray-600">
            Unidades disponibles
          </h3>

          <p className="text-4xl font-bold text-[#112250] mt-2">
            {unidadesTotales}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-400">
          <h3 className="text-lg font-semibold text-gray-600">
            Stock bajo
          </h3>

          <p className="text-4xl font-bold text-[#112250] mt-2">
            {productosStockBajo}
          </p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-8">
        <input
          type="text"
          placeholder="🔎 Buscar producto..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-md mt-6 overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-gray-500">
            Cargando inventario...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay productos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#112250] text-white">
                <tr>
                  <th className="text-left px-6 py-4">
                    Producto
                  </th>

                  <th className="text-left px-6 py-4">
                    Categoría
                  </th>

                  <th className="text-left px-6 py-4">
                    Cantidad
                  </th>

                  <th className="text-left px-6 py-4">
                    Precio
                  </th>

                  <th className="text-left px-6 py-4">
                    Proveedor
                  </th>

                  <th className="text-left px-6 py-4">
                    Estado
                  </th>

                  <th className="text-left px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map(
                  (producto) => (
                    <tr
                      key={producto.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-semibold text-[#112250]">
                        {producto.nombre}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {producto.categoria}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {producto.cantidad}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        $
                        {Number(
                          producto.precio
                        ).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {producto.proveedor}
                      </td>

                      <td className="px-6 py-4">
                        {Number(
                          producto.cantidad
                        ) <= 5 ? (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-600">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-600">
                            Disponible
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() =>
        abrirEditar(producto)
      }
      className="bg-[#8FBFE3] hover:bg-[#76acd3] text-[#112250] font-semibold px-4 py-2 rounded-lg transition"
    >
      ✏️ Editar
    </button>

    {usuario?.rol === "veterinario" && (
      <button
        type="button"
        onClick={() =>
          handleEliminar(producto)
        }
        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
      >
        🗑️ Eliminar
      </button>
    )}
  </div>
</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR PRODUCTO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#112250]">
                  Registrar producto
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Agrega un nuevo producto al
                  inventario.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarModal(false)
                }
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleRegistrar}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre del producto
                </label>

                <input
                  type="text"
                  name="nombre"
                  value={producto.nombre}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                  placeholder="Ej. Vacuna antirrábica"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Categoría
                </label>

                <select
                  name="categoria"
                  value={
                    producto.categoria
                  }
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                >
                  <option value="">
                    Seleccionar categoría
                  </option>

                  <option value="Medicamentos">
                    Medicamentos
                  </option>

                  <option value="Alimentos">
                    Alimentos
                  </option>

                  <option value="Accesorios">
                    Accesorios
                  </option>

                  <option value="Higiene">
                    Higiene
                  </option>

                  <option value="Vacunacion">
                    Vacunación
                  </option>

                  <option value="Otros">
                    Otros
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cantidad
                  </label>

                  <input
                    type="number"
                    name="cantidad"
                    value={
                      producto.cantidad
                    }
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Precio
                  </label>

                  <input
                    type="number"
                    name="precio"
                    value={
                      producto.precio
                    }
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Proveedor
                </label>

                <input
                  type="text"
                  name="proveedor"
                  value={
                    producto.proveedor
                  }
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                  placeholder="Ej. VetPharma"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarModal(false)
                  }
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-[#E57A3A] hover:bg-[#d96d2f] text-white font-semibold py-3 rounded-lg transition"
                >
                  Guardar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {mostrarEditarModal &&
        productoEditando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#112250]">
                    ✏️ Editar producto
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Modifica los datos o actualiza
                    el stock del producto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarEditarModal(
                      false
                    );
                    setProductoEditando(
                      null
                    );
                  }}
                  className="text-gray-500 hover:text-gray-800 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleActualizar}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre del producto
                  </label>

                  <input
                    type="text"
                    name="nombre"
                    value={
                      productoEditando.nombre
                    }
                    onChange={
                      handleChangeEditar
                    }
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Categoría
                  </label>

                  <select
                    name="categoria"
                    value={
                      productoEditando.categoria
                    }
                    onChange={
                      handleChangeEditar
                    }
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                  >
                    <option value="">
                      Seleccionar categoría
                    </option>

                    <option value="Medicamentos">
                      Medicamentos
                    </option>

                    <option value="Alimentos">
                      Alimentos
                    </option>

                    <option value="Accesorios">
                      Accesorios
                    </option>

                    <option value="Higiene">
                      Higiene
                    </option>

                    <option value="Vacunacion">
                      Vacunación
                    </option>

                    <option value="Otros">
                      Otros
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Cantidad / Stock
                    </label>

                    <input
                      type="number"
                      name="cantidad"
                      value={
                        productoEditando.cantidad
                      }
                      onChange={
                        handleChangeEditar
                      }
                      min="0"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Coloca aquí la nueva cantidad
                      total disponible.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Precio
                    </label>

                    <input
                      type="number"
                      name="precio"
                      value={
                        productoEditando.precio
                      }
                      onChange={
                        handleChangeEditar
                      }
                      min="0"
                      step="0.01"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Proveedor
                  </label>

                  <input
                    type="text"
                    name="proveedor"
                    value={
                      productoEditando.proveedor
                    }
                    onChange={
                      handleChangeEditar
                    }
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8FBFE3]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarEditarModal(
                        false
                      );
                      setProductoEditando(
                        null
                      );
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-100 transition"
                    disabled={
                      guardandoEdicion
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      guardandoEdicion
                    }
                    className="flex-1 bg-[#E57A3A] hover:bg-[#d96d2f] disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {guardandoEdicion
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </main>
  );
}
