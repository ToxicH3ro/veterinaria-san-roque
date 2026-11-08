"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { obtenerPacientes } from "@/services/petService";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";

export default function Pacientes() {
  const { usuario, cargando: cargandoAuth } = useAuth();

  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Obtener el icono según la especie.
  const obtenerIcono = (especie) => {
    const tipo = especie.toLowerCase().trim();

    if (tipo.includes("gato")) return "🐱";
    if (tipo.includes("perro")) return "🐶";
    if (tipo.includes("conejo")) return "🐇";
    if (tipo.includes("lagartija")) return "🦎";
    if (tipo.includes("tortuga")) return "🐢";
    if (tipo.includes("periquito") || tipo.includes("ave")) return "🦜";

    return "🐾";
  };

  // Cargar todos los pacientes registrados.
  const cargarPacientes = useCallback(async () => {
    if (cargandoAuth) return;

    if (!usuario?.uid) {
      setPacientes([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const resultado = await obtenerPacientes();

      setPacientes(resultado);
    } catch (error) {
      console.error("Error al cargar los pacientes:", error);
      setError("No se pudieron cargar los pacientes.");
    } finally {
      setCargando(false);
    }
  }, [usuario?.uid, cargandoAuth]);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  // Columnas de la tabla.
  const columnas = [
    {
      key: "mascota",
      label: "Mascota",
      render: (paciente) => (
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {obtenerIcono(paciente.especie)}
          </span>

          <span className="font-semibold text-[#112250]">
            {paciente.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "especie",
      label: "Especie",
    },
    {
      key: "raza",
      label: "Raza",
      render: (paciente) => paciente.raza || "No especificada",
    },
    {
      key: "propietarioNombre",
      label: "Propietario",
      render: (paciente) =>
        paciente.propietarioNombre || "Sin información",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#112250]">
            Pacientes
          </h1>

          <p className="text-gray-600 mt-2">
            Consulta las mascotas registradas en la veterinaria.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={cargarPacientes}
          disabled={cargando || cargandoAuth}
        >
          {cargando ? "Actualizando..." : "↻ Actualizar"}
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card>
          <p className="text-gray-500 text-sm">
            Total de pacientes
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            {cargando ? "..." : pacientes.length}
          </p>
        </Card>

        <Card>
          <p className="text-gray-500 text-sm">
            Especies registradas
          </p>

          <p className="text-3xl font-bold text-[#112250] mt-2">
            {cargando
              ? "..."
              : new Set(
                  pacientes.map((paciente) =>
                    paciente.especie.toLowerCase().trim()
                  ).filter(Boolean)
                ).size}
          </p>
        </Card>
      </div>

      {/* Tabla de pacientes */}
      <Card
        title="Listado de pacientes"
        description="Mascotas y sus respectivos propietarios."
      >
        {cargandoAuth || cargando ? (
          <p className="text-center text-gray-600 py-8">
            Cargando pacientes...
          </p>
        ) : error ? (
          <p className="text-center text-red-600 py-8">
            {error}
          </p>
        ) : (
          <Table
            columns={columnas}
            data={pacientes}
            emptyMessage="No hay pacientes registrados."
          />
        )}
      </Card>

    </div>
  );
}
