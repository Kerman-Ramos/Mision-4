// Trae useState para crear memoria local dentro de App.
import { useState } from "react";
// Trae los hooks para leer marcas y activar/desactivarlas desde la barra superior.
import { useMarcas, useCambiarEstadoMarca } from "./hooks/useMotorData.js";
// Trae todas las piezas visuales que App va a combinar como bloques de Lego.
import CocheForm from "./components/CocheForm.jsx";
import CocheList from "./components/CocheList.jsx";
import PropietarioForm from "./components/PropietarioForm.jsx";
import PropietarioList from "./components/PropietarioList.jsx";
import AdminLoginForm from "./components/AdminLoginForm.jsx";
import MarcaForm from "./components/MarcaForm.jsx";
import MarcaList from "./components/MarcaList.jsx";

// Empieza la definición del componente principal App.
export default function App() {
  // Memoria que recuerda qué pestaña está abierta (empieza en "coches").
  const [pestana, setPestana] = useState("coches");
	// Recuerda qué coche pulsaste en "Editar (PUT)". Empieza en null (ninguno).
	const [cocheEditando, setCocheEditando] = useState(null);
	// Recuerda qué propietario estás editando (empieza en ninguno).
	const [propietarioEditando, setPropietarioEditando] = useState(null);
	// Recuerda qué marca estás editando (empieza en ninguna).
	const [marcaEditando, setMarcaEditando] = useState(null);
	// Recuerda si el interruptor del BONUS está encendido (true) o apagado (false).
	const [simularCorrupto, setSimularCorrupto] = useState(false);
	// Recuerda si el usuario ha iniciado sesión como administrador (empieza en false).
	const [esAdmin, setEsAdmin] = useState(false);

	// Pide las marcas a TanStack Query. Mientras cargan (cuando data aún no existe),
	// usa una lista vacía [] para que el código no falle.
	const { data: marcas = [] } = useMarcas();
	// Prepara la acción PATCH para encender/apagar marcas al pulsar los chips.
	const toggleMarcaMut = useCambiarEstadoMarca();

	// Receta para cerrar sesión de admin: apaga esAdmin y cancela cualquier edición de marca.
	function cerrarSesionAdmin() {
		setEsAdmin(false);
		setMarcaEditando(null);
	}

	// --- Lo que App dibuja en pantalla (return) ---
	return (
		// Contenedor general centrado de la página.
		<div className="app-shell">
			{/* Cabecera con título "MotorRegistry" y subtítulo. */}
			<header className="app-header">
				<div>
					<h1>MotorRegistry</h1>
					<p className="subtitle">
						CRUD completo con React Hook Form · Zod v4 · TanStack Query v5
					</p>
				</div>

				{/* Casilla del BONUS: su estado visual depende de simularCorrupto y al marcarla/desmarcarla */}
				{/* actualiza ese estado con e.target.checked (true o false). */}
				<label className="bonus-toggle">
					<input
						type="checkbox"
						checked={simularCorrupto}
						onChange={(e) => setSimularCorrupto(e.target.checked)}
					/>
					<span>Simular dato corrupto del API (Bonus Zod)</span>
				</label>
			</header>

			{/* Barra horizontal de marcas. */}
			{/* -> Muestra un texto u otro según esAdmin (si eres admin te dice que hagas clic para PATCH). */}
			<section className="marcas-bar">
				<span className="marcas-title">
					{esAdmin
						? "Marcas (Admin activo · clic = PATCH):"
						: "Marcas (inicia sesión en Admin para modificar):"}
				</span>
				<div className="marcas-chips">
					{/* Recorre la lista de marcas una por una y crea un botón "chip" para cada marca: */}
					{/* - key={m.id}: etiqueta interna obligatoria para que React identifique cada botón. */}
					{/* - className: pone estilo "chip-on" si m.activa es true, o "chip-off" si es false. */}
					{/* - disabled={!esAdmin || toggleMarcaMut.isPending}: botón bloqueado si NO eres admin */}
					{/* o si ya se está guardando un cambio en el servidor. */}
					{/* - onClick: al pulsar, envía PATCH cambiando activa por su opuesto (!m.activa). */}
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
				{/* Barra con 3 botones de pestañas: */}
				{/* -> Cada botón al hacer clic cambia "pestana" ("coches", "propietarios" o "marcas") */}
				{/* y se ilumina con la clase "tab-active" cuando coincide con la pestaña actual. */}
				{/* -> La 3ª pestaña añade "(Admin ✓)" si esAdmin es true. */}
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
				{/* Zona principal donde cambia el contenido: */}
				{pestana === "coches" && (
					// Si la pestaña es "coches", dibuja el formulario y la lista de coches.
					// Al formulario le pasa cocheEditando y una función para cancelar la edición.
					// A la lista le pasa simularCorrupto y una función para avisar qué coche se quiere editar.
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
					// Si la pestaña es "propietarios", hace lo mismo pero con los componentes de propietarios.
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
						// Si la pestaña es "marcas":
						// - Si NO eres admin (!esAdmin), dibuja solo la pantalla de login (AdminLoginForm).
						// Cuando aciertes la clave, ejecutará onLoginExito -> setEsAdmin(true).
						// - Si SÍ eres admin, dibuja el botón "Cerrar sesión", MarcaForm y MarcaList.
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
