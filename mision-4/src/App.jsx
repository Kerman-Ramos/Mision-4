/* ============================================================================
   5. ARCHIVO: src/App.jsx
   PROPÓSITO: Componente raíz que coordina las pestañas, el estado levantado
   de edición y de mensajes de éxito, el acceso simulado de administrador
   y el banner aislado del BONUS de Zod.
   ============================================================================ */

// Importa useState para gestionar el estado local de navegación, edición y sesión simulada.
import { useState } from "react";
// Importa los hooks de marcas y el hook aislado del BONUS para probar datos corruptos.
import {
	useMarcas,
	useCambiarEstadoMarca,
	useDemoDatoCorrupto,
} from "./hooks/useMotorData.js";
// Importa todos los componentes de formularios y listados de la aplicación.
import CocheForm from "./components/CocheForm.jsx";
import CocheList from "./components/CocheList.jsx";
import PropietarioForm from "./components/PropietarioForm.jsx";
import PropietarioList from "./components/PropietarioList.jsx";
import AdminLoginForm from "./components/AdminLoginForm.jsx";
import MarcaForm from "./components/MarcaForm.jsx";
import MarcaList from "./components/MarcaList.jsx";

export default function App() {
	// Controla qué pestaña se muestra en pantalla ("coches", "propietarios" o "marcas").
	const [pestana, setPestana] = useState("coches");
	// Almacena el registro seleccionado para edición completa (PUT) o null si estamos en modo creación (POST).
	const [cocheEditando, setCocheEditando] = useState(null);
	const [propietarioEditando, setPropietarioEditando] = useState(null);
	const [marcaEditando, setMarcaEditando] = useState(null);
	// Estado levantado para los banners verdes de éxito: permite limpiarlos al cambiar de pestaña, cancelar o editar otro registro.
	const [mensajeExito, setMensajeExito] = useState("");
	// Controla el interruptor de demostración del BONUS de Zod.
	const [simularCorrupto, setSimularCorrupto] = useState(false);
	// Controla la compuerta de acceso simulado de administrador en el cliente.
	const [esAdmin, setEsAdmin] = useState(false);

	// Lee las marcas desde la caché de TanStack Query (usa [] mientras llegan).
	const { data: marcas = [] } = useMarcas();
	// Prepara la mutación PATCH para activar o desactivar marcas desde los chips superiores.
	const toggleMarcaMut = useCambiarEstadoMarca();
	// Ejecuta la consulta aislada del BONUS solo cuando simularCorrupto está marcado (sin contaminar ["coches"]).
	const demoCorrupto = useDemoDatoCorrupto(simularCorrupto);

	// Cambia de pestaña y limpia cualquier mensaje de confirmación anterior.
	function cambiarPestana(nuevaPestana) {
		setPestana(nuevaPestana);
		setMensajeExito("");
	}

	// Cierra la sesión simulada de administrador, limpia la marca en edición y borra avisos previos.
	function cerrarSesionAdmin() {
		setEsAdmin(false);
		setMarcaEditando(null);
		setMensajeExito("");
	}

	return (
		<div className="app-shell">
			{/* Cabecera principal con el título del proyecto y el interruptor de demostración del BONUS. */}
			<header className="app-header">
				<div>
					<h1>MotorRegistry</h1>
					<p className="subtitle">
						CRUD completo con React Hook Form · Zod v4 · TanStack Query v5
					</p>
				</div>

				{/* Checkbox controlado que activa o desactiva la query aislada useDemoDatoCorrupto. */}
				<label className="bonus-toggle">
					<input
						type="checkbox"
						checked={simularCorrupto}
						onChange={(e) => setSimularCorrupto(e.target.checked)}
					/>
					<span>Simular dato corrupto del API (Bonus Zod)</span>
				</label>
			</header>

			{/* Aviso de carga temporal mientras se ejecuta la comprobación del BONUS. */}
			{simularCorrupto && demoCorrupto.isPending && (
				<p role="status" className="state-box" style={{ marginBottom: "18px" }}>
					Ejecutando comprobación de dato corrupto con Zod...
				</p>
			)}

			{/* Banner rojo aislado del BONUS: muestra el error exacto de safeParse sin romper la caché real de vehículos. */}
			{simularCorrupto && demoCorrupto.isError && (
				<div
					role="alert"
					className="banner-error"
					style={{ marginBottom: "18px" }}
				>
					<strong>Demo Bonus Zod:</strong> {demoCorrupto.error.message}
					<div className="form-actions" style={{ marginTop: "10px" }}>
						{/* Permite relanzar la comprobación manualmente mediante refetch(). */}
						<button
							type="button"
							className="btn-secondary"
							onClick={() => demoCorrupto.refetch()}
						>
							Reintentar comprobación
						</button>
					</div>
				</div>
			)}

			{/* Barra superior de marcas: solo permite hacer PATCH si el usuario ha iniciado sesión como admin. */}
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

			{/* Navegación por pestañas: al pulsar, cambia la vista activa y limpia mensajes de éxito obsoletos. */}
			<nav className="tabs">
				<button
					type="button"
					className={`tab ${pestana === "coches" ? "tab-active" : ""}`}
					onClick={() => cambiarPestana("coches")}
				>
					Vehículos
				</button>
				<button
					type="button"
					className={`tab ${pestana === "propietarios" ? "tab-active" : ""}`}
					onClick={() => cambiarPestana("propietarios")}
				>
					Propietarios
				</button>
				<button
					type="button"
					className={`tab ${pestana === "marcas" ? "tab-active" : ""}`}
					onClick={() => cambiarPestana("marcas")}
				>
					Marcas {esAdmin ? "(Admin ✓)" : "(Admin)"}
				</button>
			</nav>

			{/* Zona principal: renderizado condicional según la pestaña seleccionada. */}
			<main className="main-content">
				{pestana === "coches" && (
					<>
						{/* Formulario de vehículos: recibe el estado levantado de edición y de confirmación. */}
						<CocheForm
							cocheEditando={cocheEditando}
							mensajeExito={mensajeExito}
							onMensajeExito={setMensajeExito}
							onCancelarEdicion={() => {
								setCocheEditando(null);
								setMensajeExito("");
							}}
							onEdicionCompletada={() => setCocheEditando(null)}
						/>
						{/* Listado de vehículos: al pulsar Editar limpia el aviso anterior y carga el coche en el formulario. */}
						<CocheList
							onEditarCoche={(coche) => {
								setCocheEditando(coche);
								setMensajeExito("");
							}}
						/>
					</>
				)}

				{pestana === "propietarios" && (
					<>
						{/* Formulario de propietarios conectado al estado levantado de App. */}
						<PropietarioForm
							propietarioEditando={propietarioEditando}
							mensajeExito={mensajeExito}
							onMensajeExito={setMensajeExito}
							onCancelarEdicion={() => {
								setPropietarioEditando(null);
								setMensajeExito("");
							}}
							onEdicionCompletada={() => setPropietarioEditando(null)}
						/>
						{/* Listado de propietarios con buscador y acción de edición. */}
						<PropietarioList
							onEditarPropietario={(prop) => {
								setPropietarioEditando(prop);
								setMensajeExito("");
							}}
						/>
					</>
				)}

				{pestana === "marcas" &&
					(!esAdmin ? (
						/* Compuerta de acceso simulado: si no es admin, muestra el formulario de login. */
						<AdminLoginForm onLoginExito={() => setEsAdmin(true)} />
					) : (
						<>
							{/* Botón para salir del modo administrador. */}
							<div className="form-actions">
								<button
									type="button"
									className="btn-secondary"
									onClick={cerrarSesionAdmin}
								>
									Cerrar sesión de administrador
								</button>
							</div>
							{/* Formulario CRUD de marcas (POST / PUT). */}
							<MarcaForm
								marcaEditando={marcaEditando}
								mensajeExito={mensajeExito}
								onMensajeExito={setMensajeExito}
								onCancelarEdicion={() => {
									setMarcaEditando(null);
									setMensajeExito("");
								}}
								onEdicionCompletada={() => setMarcaEditando(null)}
							/>
							{/* Listado de marcas con acciones PUT, PATCH y DELETE. */}
							<MarcaList
								onEditarMarca={(marca) => {
									setMarcaEditando(marca);
									setMensajeExito("");
								}}
							/>
						</>
					))}
			</main>
		</div>
	);
}