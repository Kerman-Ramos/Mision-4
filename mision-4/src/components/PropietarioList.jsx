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
  const [feedback, setFeedback] = useState("");

  const borrarMut = useEliminarPropietario(() => {
    setFeedback("Propietario eliminado (DELETE).");
  });

  const mapaCoches = new Map(coches.map((c) => [c.id, c]));
  const mapaMarcas = new Map(marcas.map((m) => [m.id, m.nombre]));

  function borrarPropietario(id) {
    setFeedback("");
    borrarMut.mutate(id);
  }

  return (
    <section className="card">
      <h2>Propietarios registrados ({propietarios.length})</h2>

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

      {!isPending && !isError && propietarios.length === 0 && (
        <p className="state-box">Aún no hay propietarios registrados.</p>
      )}

      {!isPending && !isError && propietarios.length > 0 && (
        <ul className="items-grid">
          {propietarios.map((p) => {
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