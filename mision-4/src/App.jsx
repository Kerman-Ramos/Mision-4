import { useState } from "react";
import { useMarcas, useCambiarEstadoMarca } from "./hooks/useMotorData.js";
import CocheForm from "./components/CocheForm.jsx";
import CocheList from "./components/CocheList.jsx";
import PropietarioForm from "./components/PropietarioForm.jsx";
import PropietarioList from "./components/PropietarioList.jsx";
import AdminLoginForm from "./components/AdminLoginForm.jsx";
import MarcaForm from "./components/MarcaForm.jsx";
import MarcaList from "./components/MarcaList.jsx";

export default function App() {
  const [pestana, setPestana] = useState("coches");
	const [cocheEditando, setCocheEditando] = useState(null);
	const [propietarioEditando, setPropietarioEditando] = useState(null);
	const [marcaEditando, setMarcaEditando] = useState(null);
	const [simularCorrupto, setSimularCorrupto] = useState(false);
	const [esAdmin, setEsAdmin] = useState(false);

	const { data: marcas = [] } = useMarcas();
	const toggleMarcaMut = useCambiarEstadoMarca();

	function cerrarSesionAdmin() {
		setEsAdmin(false);
		setMarcaEditando(null);
	}

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
				<span className="marcas-title">
					{esAdmin
						? "Marcas (Admin activo · clic = PATCH):"
						: "Marcas (inicia sesión en Admin para modificar):"}
				</span>
				<div className="marcas-chips">
					{marcas.map((m) => (
						<button
							key={m.id}
							type="button"
							className={`chip ${m.activa ? "chip-on" : "chip-off"}`}
							disabled={!esAdmin || toggleMarcaMut.isPending}
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
					Vehículos
				</button>
				<button
					type="button"
					className={`tab ${pestana === "propietarios" ? "tab-active" : ""}`}
					onClick={() => setPestana("propietarios")}
				>
					Propietarios
				</button>
				<button
					type="button"
					className={`tab ${pestana === "marcas" ? "tab-active" : ""}`}
					onClick={() => setPestana("marcas")}
				>
					Marcas {esAdmin ? "(Admin ✓)" : "(Admin)"}
				</button>
			</nav>

			<main className="main-content">
				{pestana === "coches" && (
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
				)}

				{pestana === "propietarios" && (
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

				{pestana === "marcas" &&
					(!esAdmin ? (
						<AdminLoginForm onLoginExito={() => setEsAdmin(true)} />
					) : (
						<>
							<div className="form-actions">
								<button
									type="button"
									className="btn-secondary"
									onClick={cerrarSesionAdmin}
								>
									Cerrar sesión de administrador
								</button>
							</div>
							<MarcaForm
								marcaEditando={marcaEditando}
								onCancelarEdicion={() => setMarcaEditando(null)}
							/>
							<MarcaList
								onEditarMarca={(marca) => setMarcaEditando(marca)}
							/>
						</>
					))}
			</main>
		</div>
	);
}
