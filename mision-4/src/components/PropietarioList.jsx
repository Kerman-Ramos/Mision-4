/* ============================================================================
   9. ARCHIVO: src/components/PropietarioList.jsx
   PROPÓSITO: Listado relacional de propietarios (cruza propietarios -> coches
   -> marcas desde la caché de TanStack Query) con buscador y borrado (DELETE).
   ============================================================================ */

import { useState } from "react";
import {
  usePropietarios,
  useCoches,
  useMarcas,
  useEliminarPropietario,
} from "../hooks/useMotorData";

export default function PropietarioList({ onEditarPropietario }) {
  const { data: propietarios = [], isPending, isError, error } = usePropietarios();
  const { data: coches = [] } = useCoches(false);
  const { data: marcas = [] } = useMarcas();

  const [busqueda, setBusqueda] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("Todas");
  const [feedback, setFeedback] = useState("");

  const borrarMut = useEliminarPropietario(() => {
    setFeedback("Propietario eliminado (DELETE).");
  });

  const mapaCoches = new Map(coches.map((c) => [c.id, c]));
  const mapaMarcas = new Map(marcas.map((m) => [m.id, m.nombre]));

  // Extrae las ciudades únicas con Set y las ordena de forma inmutable con toSorted() para alimentar el desplegable de filtro.
  const ciudades = [...new Set(propietarios.map((p) => p.ciudad))].toSorted();

  // Filtro derivado en render que combina ciudad y búsqueda de texto sobre nombre, email, ciudad y vehículo asignado.
  const termino = busqueda.trim().toUpperCase();
  const propietariosFiltrados = propietarios.filter((p) => {
    const coche = mapaCoches.get(p.cocheId);
    const marca = coche ? mapaMarcas.get(coche.marcaId) ?? "" : "";
    const modelo = coche ? coche.modelo : "";

    const coincideCiudad =
      filtroCiudad === "Todas" || p.ciudad === filtroCiudad;
    const texto = `${p.nombre} ${p.email} ${p.ciudad} ${marca} ${modelo}`.toUpperCase();

    return coincideCiudad && texto.includes(termino);
  });

  function borrarPropietario(id) {
    setFeedback("");
    borrarMut.mutate(id);
  }

  return (
    <section className="card">
      <h2>Propietarios registrados ({propietariosFiltrados.length})</h2>

      <div className="filters-bar">
        <div className="field">
          <label htmlFor="filtro-prop-busqueda">
            Buscar por nombre, email o vehículo
          </label>
          <input
            id="filtro-prop-busqueda"
            type="text"
            placeholder="Ej: Laura, @example.com, Corolla"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="filtro-prop-ciudad">Filtrar por ciudad</label>
          <select
            id="filtro-prop-ciudad"
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
          >
            <option value="Todas">Todas</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad} value={ciudad}>
                {ciudad}
              </option>
            ))}
          </select>
        </div>
      </div>

      {borrarMut.isError && (
        <p role="alert" className="banner-error">
          {borrarMut.error.message}
        </p>
      )}
      {feedback && (
        <p role="status" className="banner-success">
          {feedback}
        </p>
      )}

      {isPending && (
        <p role="status" className="state-box">
          Cargando propietarios...
        </p>
      )}

      {isError && (
        <p role="alert" className="banner-error">
          Error al cargar propietarios: {error.message}
        </p>
      )}

      {!isPending && !isError && propietariosFiltrados.length === 0 && (
        <p className="state-box">
          No hay propietarios que coincidan con los filtros actuales.
        </p>
      )}

      {!isPending && !isError && propietariosFiltrados.length > 0 && (
        <ul className="items-grid">
          {propietariosFiltrados.map((p) => {
            const coche = mapaCoches.get(p.cocheId);
            const marca = coche ? mapaMarcas.get(coche.marcaId) : null;

            return (
              <li key={p.id} className="item-card">
                <div className="item-top">
                  <div>
                    <h3>{p.nombre}</h3>
                    <span className="eyebrow">{p.email}</span>
                  </div>
                  <span className="badge">{p.ciudad}</span>
                </div>

                <p className="meta-line">
                  <strong>Vehículo:</strong>{" "}
                  {coche
                    ? `${marca ?? ""} ${coche.modelo} (${coche.anio})`
                    : "Vehículo eliminado"}
                </p>
                <p className="meta-line">
                  <strong>Fecha de compra:</strong> {p.fechaCompra}
                </p>

                <div className="item-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onEditarPropietario(p)}
                  >
                    Editar (PUT)
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={borrarMut.isPending}
                    onClick={() => borrarPropietario(p.id)}
                  >
                    Borrar (DELETE)
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}