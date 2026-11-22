/* ============================================================================
   7. ARCHIVO: src/components/CocheList.jsx
   PROPÓSITO: Listado de vehículos (GET) con filtros locales derivados en render,
   confirmación de borrado (DELETE), ajuste de precio (PATCH) y reintento.
   ============================================================================ */

// Importa useState para los filtros locales y el aviso de acciones rápidas.
import { useState } from "react";
// Importa la lista oficial de combustibles para generar el desplegable de filtro.
import { COMBUSTIBLES } from "../esquemas/motorEsquemas.js";
// Importa los hooks de TanStack Query para leer coches/marcas y ejecutar PATCH/DELETE.
import {
	useCoches,
	useMarcas,
	useActualizarPrecioCoche,
	useEliminarCoche,
} from "../hooks/useMotorData.js";

export default function CocheList({ onEditarCoche }) {
	// Lee los vehículos reales desde la caché compartida ["coches"] junto con refetch() para reintentar fallos.
	const {
		data: coches = [],
		isPending,
		isError,
		error,
		isFetching,
		refetch,
	} = useCoches();

	// Lee el catálogo de marcas desde la caché compartida sin duplicar peticiones.
	const { data: marcas = [] } = useMarcas();

	// Estados locales mínimos: filtro por combustible, texto de búsqueda y feedback de acciones rápidas.
	const [filtroCombustible, setFiltroCombustible] = useState("Todos");
	const [busqueda, setBusqueda] = useState("");
	const [feedbackAccion, setFeedbackAccion] = useState("");

	// Mutación PATCH para subir o bajar el precio un 5%.
	const patchPrecioMut = useActualizarPrecioCoche((cocheEditado) => {
		setFeedbackAccion(
			`Precio de "${cocheEditado.modelo}" actualizado a ${cocheEditado.precio} € (PATCH).`
		);
	});

	// Mutación DELETE para eliminar un vehículo del inventario.
	const borrarMut = useEliminarCoche(() => {
		setFeedbackAccion("Vehículo eliminado del inventario (DELETE).");
	});

	// Diccionario Map para consultar la marca de cada coche en tiempo constante O(1).
	const mapaMarcas = new Map(marcas.map((m) => [m.id, m]));

	// Estado derivado calculado directamente en el render (sin useEffect ni copias en estado).
	const termino = busqueda.trim().toUpperCase();
	const cochesFiltrados = coches.filter((c) => {
		const nombreMarca = mapaMarcas.get(c.marcaId)?.nombre ?? "";
		const coincideCombustible =
			filtroCombustible === "Todos" || c.combustible === filtroCombustible;
		const texto = `${nombreMarca} ${c.modelo} ${c.anio}`.toUpperCase();
		return coincideCombustible && texto.includes(termino);
	});

	// Calcula el nuevo precio respetando el mínimo de 1.000 € y lanza la petición PATCH.
	function ajustarPrecio(coche, factor) {
		setFeedbackAccion("");
		const nuevoPrecio = Math.max(1000, Math.round(coche.precio * factor));
		patchPrecioMut.mutate({ id: coche.id, precio: nuevoPrecio });
	}

	// Pide confirmación explícita antes de ejecutar la operación destructiva DELETE.
	function borrarCoche(coche) {
		if (
			!window.confirm(
				`¿Seguro que quieres eliminar el vehículo "${coche.modelo}"?`
			)
		) {
			return;
		}
		setFeedbackAccion("");
		borrarMut.mutate(coche.id);
	}

	return (
		<section className="card">
			{/* Cabecera con contador dinámico de resultados y aviso de refresco en segundo plano. */}
			<div className="card-header">
				<div>
					<h2>Inventario de vehículos ({cochesFiltrados.length})</h2>
					{isFetching && !isPending && (
						<span className="badge-sync">
							Refrescando en segundo plano...
						</span>
					)}
				</div>
			</div>

			{/* Barra de filtros controlados (texto libre y desplegable de combustible). */}
			<div className="filters-bar">
				<div className="field">
					<label htmlFor="filtro-busqueda">
						Buscar por marca, modelo o año
					</label>
					<input
						id="filtro-busqueda"
						type="text"
						placeholder="Ej: Corolla, SEAT, 2023"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
				</div>

				<div className="field">
					<label htmlFor="filtro-combustible">
						Filtrar por combustible
					</label>
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

			{/* Avisos de error o éxito de las acciones rápidas (PATCH / DELETE). */}
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

			{/* Estado de carga inicial. */}
			{isPending && (
				<p role="status" className="state-box">
					Cargando vehículos desde el API...
				</p>
			)}

			{/* Estado de error con botón Reintentar conectado a refetch(). */}
			{isError && (
				<div role="alert" className="banner-error">
					<strong>Error al cargar vehículos:</strong> {error.message}
					<div className="form-actions" style={{ marginTop: "10px" }}>
						<button
							type="button"
							className="btn-secondary"
							onClick={() => refetch()}
						>
							Reintentar
						</button>
					</div>
				</div>
			)}

			{/* Estado vacío cuando ningún vehículo cumple los filtros actuales. */}
			{!isPending && !isError && cochesFiltrados.length === 0 && (
				<p className="state-box">
					No hay vehículos que coincidan con los filtros actuales.
				</p>
			)}

			{/* Rejilla de tarjetas de vehículos con acciones PUT, PATCH (-5% / +5%) y DELETE. */}
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
											<span className="muted">
												({coche.anio})
											</span>
										</h3>
									</div>
									<span className="badge">
										{coche.combustible}
									</span>
								</div>

								<p className="price">{coche.precio} €</p>

								<div className="item-actions">
									<button
										type="button"
										className="btn-secondary"
										onClick={() => {
											setFeedbackAccion("");
											onEditarCoche(coche);
										}}
									>
										Editar (PUT)
									</button>
									<button
										type="button"
										className="btn-ghost"
										disabled={patchPrecioMut.isPending}
										onClick={() =>
											ajustarPrecio(coche, 0.95)
										}
									>
										-5% (PATCH)
									</button>
									<button
										type="button"
										className="btn-ghost"
										disabled={patchPrecioMut.isPending}
										onClick={() =>
											ajustarPrecio(coche, 1.05)
										}
									>
										+5% (PATCH)
									</button>
									<button
										type="button"
										className="btn-danger"
										disabled={borrarMut.isPending}
										onClick={() => borrarCoche(coche)}
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