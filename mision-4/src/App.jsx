import { useState } from "react";
import { useMarcas, useCambiarEstadoMarca } from "./hooks/useMotorData";
import CocheForm from "./components/CocheForm";
import CocheList from "./components/CocheList";
import PropietarioForm from "./components/PropietarioForm";
import PropietarioList from "./components/PropietarioList";

export default function App() {
  const [pestana, setPestana] = useState("coches");
  const [cocheEditando, setCocheEditando] = useState(null);
  const [propietarioEditando, setPropietarioEditando] = useState(null);
  const [simularCorrupto, setSimularCorrupto] = useState(false);

  const { data: marcas = [] } = useMarcas();
  const toggleMarcaMut = useCambiarEstadoMarca();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>MotorRegistry</h1>
          <p className="subtitle">
            CRUD completo con React Hook Form · Zod v4 · TanStack Query v5
          </p>
        </div>

        <label className="bonus-toggle">
          <input
            type="checkbox"
            checked={simularCorrupto}
            onChange={(e) => setSimularCorrupto(e.target.checked)}
          />
          <span>Simular dato corrupto del API (Bonus Zod)</span>
        </label>
      </header>

      <section className="marcas-bar">
        <span className="marcas-title">Marcas (clic = PATCH activa):</span>
        <div className="marcas-chips">
          {marcas.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip ${m.activa ? "chip-on" : "chip-off"}`}
              disabled={toggleMarcaMut.isPending}
              onClick={() =>
                toggleMarcaMut.mutate({ id: m.id, activa: !m.activa })
              }
            >
              {m.nombre} · {m.activa ? "Activa" : "Inactiva"}
            </button>
          ))}
        </div>
      </section>

      <nav className="tabs">
        <button
          type="button"
          className={`tab ${pestana === "coches" ? "tab-active" : ""}`}
          onClick={() => setPestana("coches")}
        >
          Vehículos (CRUD completo)
        </button>
        <button
          type="button"
          className={`tab ${pestana === "propietarios" ? "tab-active" : ""}`}
          onClick={() => setPestana("propietarios")}
        >
          Propietarios
        </button>
      </nav>

      <main className="main-content">
        {pestana === "coches" ? (
          <>
            <CocheForm
              cocheEditando={cocheEditando}
              onCancelarEdicion={() => setCocheEditando(null)}
            />
            <CocheList
              simularCorrupto={simularCorrupto}
              onEditarCoche={(coche) => setCocheEditando(coche)}
            />
          </>
        ) : (
          <>
            <PropietarioForm
              propietarioEditando={propietarioEditando}
              onCancelarEdicion={() => setPropietarioEditando(null)}
            />
            <PropietarioList
              onEditarPropietario={(prop) => setPropietarioEditando(prop)}
            />
          </>
        )}
      </main>
    </div>
  );
}