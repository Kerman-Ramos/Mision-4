/* ============================================================================
   9. ARCHIVO: src/components/PropietarioList.jsx
   PROPÓSITO: Listado relacional de propietarios (cruza propietarios -> coches
   -> marcas desde la caché de TanStack Query) con buscador, confirmación de
   borrado (DELETE) y botón de reintento.
   ============================================================================ */

// Importa useState para el buscador, el filtro de ciudad y el feedback de borrado.
import { useState } from "react";
// Importa los hooks de datos con la extensión explícita .js.
import {
	usePropietarios,
	useCoches,
	useMarcas,
	useEliminarPropietario,
} from "../hooks/useMotorData.js";

export default function PropietarioList({ onEditarPropietario }) {
	// Lee propietarios (con refetch para reintentos), coches y marcas desde caché.
	const {
		data: propietarios = [],
		isPending,
		isError,
		error,
		refetch,
	} = usePropietarios();
	const { data: coches = [] } = useCoches();
	const { data: marcas = [] } = useMarcas();

	// Estados locales mínimos para el filtrado y la confirmación de borrado.
	const [busqueda, setBusqueda] = useState("");
	const [filtroCiudad, setFiltroCiudad] = useState("Todas");
	const [feedback, setFeedback] = useState("");

	// Mutación DELETE con mensaje de confirmación.
	const borrarMut = useEliminarPropietario(() => {
		setFeedback("Propietario eliminado (DELETE).");
	});

	// Diccionarios Map para resolver el coche y la marca de cada propietario en O(1).
	const mapaCoches = new Map(coches.map((c) => [c.id, c]));
	const mapaMarcas = new Map(marcas.map((m) => [m.id, m.nombre]));

	// Extrae las ciudades únicas con Set y las ordena alfabéticamente de forma inmutable con toSorted().
	const ciudades = [...new Set(propietarios.map((p) => p.ciudad))].toSorted();

	// Filtro derivado en render: combina ciudad y búsqueda sobre nombre, email, ciudad y vehículo.
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

	// Solicita confirmación antes de eliminar definitivamente un propietario.
	function borrarPropietario(prop) {
		if (
			!window.confirm(
				`¿Seguro que quieres eliminar al propietario "${prop.nombre}"?`
			)
		) {
			return;
		}
		setFeedback("");
		borrarMut.mutate(prop.id);
	}

	return (
		<section className="card">
			<h2>Propietarios registrados ({propietariosFiltrados.length})</h2>

			{/* Barra de filtros controlados por texto y por ciudad. */}
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
					<label htmlFor="filtro-prop-ciudad">
						Filtrar por ciudad
					</label>
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

			{/* Banners de error o éxito del borrado. */}
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

			{/* Estado de carga inicial. */}
			{isPending && (
				<p role="status" className="state-box">
					Cargando propietarios...
				</p>
			)}

			{/* Estado de error con botón Reintentar conectado a refetch(). */}
			{isError && (
				<div role="alert" className="banner-error">
					<strong>Error al cargar propietarios:</strong>{" "}
					{error.message}
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

			{/* Estado vacío cuando no hay coincidencias con los filtros. */}
			{!isPending && !isError && propietariosFiltrados.length === 0 && (
				<p className="state-box">
					No hay propietarios que coincidan con los filtros actuales.
				</p>
			)}

			{/* Listado de tarjetas relacionales de propietarios. */}
			{!isPending && !isError && propietariosFiltrados.length > 0 && (
				<ul className="items-grid">
					{propietariosFiltrados.map((p) => {
						const coche = mapaCoches.get(p.cocheId);
						const marca = coche
							? mapaMarcas.get(coche.marcaId)
							: null;

						return (
							<li key={p.id} className="item-card">
								<div className="item-top">
									<div>
										<h3>{p.nombre}</h3>
										<span className="eyebrow">
											{p.email}
										</span>
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
									<strong>Fecha de compra:</strong>{" "}
									{p.fechaCompra}
								</p>

								<div className="item-actions">
									<button
										type="button"
										className="btn-secondary"
										onClick={() => {
											setFeedback("");
											onEditarPropietario(p);
										}}
									>
										Editar (PUT)
									</button>
									<button
										type="button"
										className="btn-danger"
										disabled={borrarMut.isPending}
										onClick={() => borrarPropietario(p)}
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