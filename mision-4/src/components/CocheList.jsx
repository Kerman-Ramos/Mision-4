/* ============================================================================
	  7. ARCHIVO: src/components/CocheList.jsx
	  PROPÓSITO: Listado de vehículos (GET) con filtros locales y acciones rápidas
	  de edición (PUT), ajuste de precio (PATCH) y borrado (DELETE).
	  ============================================================================ */

// Importa useState, COMBUSTIBLES y los hooks de datos (useCoches, useMarcas,
// useActualizarPrecioCoche y useEliminarCoche).
import { useState } from "react";
import { COMBUSTIBLES } from "../esquemas/motorEsquemas.js";
import {
	useCoches,
	useMarcas,
	useActualizarPrecioCoche,
	useEliminarCoche,
} from "../hooks/useMotorData.js";

// Recibe si el BONUS está activo y la función para mandar un coche al formulario de edición.
export default function CocheList({ simularCorrupto, onEditarCoche }) {
	// Pide los coches a TanStack Query y saca sus estados:
	// - coches: la lista (o [] si aún no llegó).
	// - isPending: true en la primera carga (no hay datos todavía).
	// - isError / error: true y el detalle si falló la red o saltó el BONUS de Zod.
	// - isFetching: true siempre que hay una petición en curso (incluido refresco silencioso).
	const {
		data: coches = [],
		isPending,
		isError,
		error,
		isFetching,
	} = useCoches(simularCorrupto);

	// Lee las marcas (ya están en caché, así que no hace petición duplicada).
	const { data: marcas = [] } = useMarcas();

	// Crea 3 variables de memoria local: filtroCombustible ("Todos"), busqueda ("")
	// y feedbackAccion ("" para avisar cuando un PATCH o DELETE termina).
	const [filtroCombustible, setFiltroCombustible] = useState("Todos");
	const [busqueda, setBusqueda] = useState("");
	const [feedbackAccion, setFeedbackAccion] = useState("");

	// Prepara el PATCH de precio y su mensaje verde.
	const patchPrecioMut = useActualizarPrecioCoche((cocheEditado) => {
		setFeedbackAccion(
			`Precio de "${cocheEditado.modelo}" actualizado a ${cocheEditado.precio} € (PATCH).`
		);
	});

	// Prepara el DELETE y su mensaje verde.
	const borrarMut = useEliminarCoche(() => {
		setFeedbackAccion("Vehículo eliminado del inventario (DELETE).");
	});


	// Crea un "diccionario rápido" (Map) donde buscas por id de marca (ej. 1) y obtienes
	// al instante el objeto Toyota completo sin tener que recorrer toda la lista cada vez.
	const mapaMarcas = new Map(marcas.map((m) => [m.id, m]));


	// Limpia espacios del buscador y lo pasa a MAYÚSCULAS para buscar sin que importen mayúsculas/minúsculas.
	const termino = busqueda.trim().toUpperCase();
	// Filtra la lista directamente al pintar (sin guardar copias en estado):
	// 1. Busca el nombre de la marca usando mapaMarcas.get(c.marcaId)?.nombre ?? "".
	// 2. Comprueba si el combustible coincide (o si está seleccionado "Todos").
	// 3. Junta marca + modelo + año en mayúsculas y comprueba si contiene (.includes) el texto buscado.
	// 4. Solo deja pasar los coches que cumplan ambas condiciones.
	const cochesFiltrados = coches.filter((c) => {
		const nombreMarca = mapaMarcas.get(c.marcaId)?.nombre ?? "";
		const coincideCombustible =
			filtroCombustible === "Todos" || c.combustible === filtroCombustible;
		const texto = `${nombreMarca} ${c.modelo} ${c.anio}`.toUpperCase();
		return coincideCombustible && texto.includes(termino);
	});

	// Limpia avisos previos, multiplica el precio por 0.95 (-5%) o 1.05 (+5%), lo redondea
	// con Math.round y garantiza con Math.max(1000, ...) que nunca baje de 1000 €.
	// Luego lanza la petición PATCH con patchPrecioMut.mutate().
	function ajustarPrecio(coche, factor) {

		setFeedbackAccion("");
		const nuevoPrecio = Math.max(1000, Math.round(coche.precio * factor));
		patchPrecioMut.mutate({ id: coche.id, precio: nuevoPrecio });
	}

	// Limpia avisos previos y lanza DELETE con borrarMut.mutate(id).
	function borrarCoche(id) {
		setFeedbackAccion("");
		borrarMut.mutate(id);
	}

	// Cabecera con el contador dinámico ({cochesFiltrados.length}) y un texto azul
	// "Refrescando en segundo plano..." si isFetching es true después de la primera carga.
	return (
		<section className="card">
			<div className="card-header">
				<div>
					<h2>Inventario de vehículos ({cochesFiltrados.length})</h2>
					{isFetching && !isPending && (
						<span className="badge-sync">Refrescando en segundo plano...</span>
					)}
				</div>
			</div>

			<div className="filters-bar">
				{/* Barra de filtros con dos inputs controlados: */}
				{/* - Caja de búsqueda ligada a busqueda / setBusqueda. */}
				{/* - Desplegable de combustible ligado a filtroCombustible / setFiltroCombustible. */}
				<div className="field">
					<label htmlFor="filtro-busqueda">Buscar por marca, modelo o año</label>
					<input
						id="filtro-busqueda"
						type="text"
						placeholder="Ej: Corolla, SEAT, 2023"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
				</div>

				<div className="field">
					<label htmlFor="filtro-combustible">Filtrar por combustible</label>
					<select
						id="filtro-combustible"
						value={filtroCombustible}
						onChange={(e) => setFiltroCombustible(e.target.value)}
					>
						<option value="Todos">Todos</option>
						{COMBUSTIBLES.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Carteles de error o éxito de las acciones rápidas (PATCH / DELETE). */}

			{(patchPrecioMut.isError || borrarMut.isError) && (
				<p role="alert" className="banner-error">
					{patchPrecioMut.error?.message ?? borrarMut.error?.message}
				</p>
			)}
			{feedbackAccion && (
				<p role="status" className="banner-success">
					{feedbackAccion}
				</p>
			)}
			{/* muestra "Cargando vehículos desde el API...". */}

			{isPending && (
				<p role="status" className="state-box">
					Cargando vehículos desde el API...
				</p>
			)}
			{/* muestra el cartel rojo con error.message (aquí aparece el */}
			{/* mensaje exacto del BONUS de Zod cuando activas el dato corrupto). */}

			{isError && (
				<div role="alert" className="banner-error">
					<strong>Error al cargar vehículos:</strong> {error.message}
				</div>
			)}
			{/* muestra "No hay vehículos...". */}

			{!isPending && !isError && cochesFiltrados.length === 0 && (
				<p className="state-box">
					No hay vehículos que coincidan con los filtros actuales.
				</p>
			)}
					{/* Para cada coche crea un <li key={coche.id}> con: */}
					{/* - Marca y país (o "Marca #X" si se borró la marca). */}
					{/* - Modelo, año, etiqueta de combustible y precio en €. */}
					{/* - 4 botones: "Editar (PUT)" (avisa a App), "-5% (PATCH)", "+5% (PATCH)" y "Borrar (DELETE)". */}

			{!isPending && !isError && cochesFiltrados.length > 0 && (
				<ul className="items-grid">
					{cochesFiltrados.map((coche) => {
						const marca = mapaMarcas.get(coche.marcaId);
						return (
							<li key={coche.id} className="item-card">
								<div className="item-top">
									<div>
										<span className="eyebrow">
											{marca
												? `${marca.nombre} · ${marca.paisOrigen}`
												: `Marca #${coche.marcaId}`}
										</span>
										<h3>
											{coche.modelo}{" "}
											<span className="muted">({coche.anio})</span>
										</h3>
									</div>
									<span className="badge">{coche.combustible}</span>
								</div>

								<p className="price">{coche.precio} €</p>

								<div className="item-actions">
									<button
										type="button"
										className="btn-secondary"
										onClick={() => onEditarCoche(coche)}
									>
										Editar (PUT)
									</button>
									<button
										type="button"
										className="btn-ghost"
										disabled={patchPrecioMut.isPending}
										onClick={() => ajustarPrecio(coche, 0.95)}
									>
										-5% (PATCH)
									</button>
									<button
										type="button"
										className="btn-ghost"
										disabled={patchPrecioMut.isPending}
										onClick={() => ajustarPrecio(coche, 1.05)}
									>
										+5% (PATCH)
									</button>
									<button
										type="button"
										className="btn-danger"
										disabled={borrarMut.isPending}
										onClick={() => borrarCoche(coche.id)}
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
