/* ============================================================================
	  7. ARCHIVO: src/components/CocheList.jsx
	  PROPÓSITO: Listado de vehículos (GET) con filtros locales y acciones rápidas
	  de edición (PUT), ajuste de precio (PATCH) y borrado (DELETE).
	  ============================================================================ */

import { useState } from "react";
import { COMBUSTIBLES } from "../esquemas/motorEsquemas.js";
import {
	useCoches,
	useMarcas,
	useActualizarPrecioCoche,
	useEliminarCoche,
} from "../hooks/useMotorData.js";

export default function CocheList({ simularCorrupto, onEditarCoche }) {
	const {
		data: coches = [],
		isPending,
		isError,
		error,
		isFetching,
	} = useCoches(simularCorrupto);

	const { data: marcas = [] } = useMarcas();

	const [filtroCombustible, setFiltroCombustible] = useState("Todos");
	const [busqueda, setBusqueda] = useState("");
	const [feedbackAccion, setFeedbackAccion] = useState("");

	const patchPrecioMut = useActualizarPrecioCoche((cocheEditado) => {
		setFeedbackAccion(
			`Precio de "${cocheEditado.modelo}" actualizado a ${cocheEditado.precio} € (PATCH).`
		);
	});

	const borrarMut = useEliminarCoche(() => {
		setFeedbackAccion("Vehículo eliminado del inventario (DELETE).");
	});

	// Estructura Map para cruzar marcaId con el nombre de la marca en tiempo constante sin bucles anidados.
	const mapaMarcas = new Map(marcas.map((m) => [m.id, m]));

	// Estado derivado calculado directamente durante el render, sin useEffect ni estado redundante.
	const termino = busqueda.trim().toUpperCase();
	const cochesFiltrados = coches.filter((c) => {
		const nombreMarca = mapaMarcas.get(c.marcaId)?.nombre ?? "";
		const coincideCombustible =
			filtroCombustible === "Todos" || c.combustible === filtroCombustible;
		const texto = `${nombreMarca} ${c.modelo} ${c.anio}`.toUpperCase();
		return coincideCombustible && texto.includes(termino);
	});

	function ajustarPrecio(coche, factor) {
		// Manejadores de eventos que disparan las mutaciones PATCH (-5% / +5%) y DELETE limpiando el feedback previo.
		setFeedbackAccion("");
		const nuevoPrecio = Math.max(1000, Math.round(coche.precio * factor));
		patchPrecioMut.mutate({ id: coche.id, precio: nuevoPrecio });
	}

	function borrarCoche(id) {
		setFeedbackAccion("");
		borrarMut.mutate(id);
	}

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

			{/* Gestión explícita de los estados de carga, error (incluido el error del BONUS de Zod) y estado vacío. */}
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

			{isPending && (
				<p role="status" className="state-box">
					Cargando vehículos desde el API...
				</p>
			)}

			{isError && (
				<div role="alert" className="banner-error">
					<strong>Error al cargar vehículos:</strong> {error.message}
				</div>
			)}

			{!isPending && !isError && cochesFiltrados.length === 0 && (
				<p className="state-box">
					No hay vehículos que coincidan con los filtros actuales.
				</p>
			)}

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