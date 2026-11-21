/* ============================================================================
	  9. ARCHIVO: src/components/PropietarioList.jsx
	  PROPÓSITO: Listado relacional de propietarios (cruza propietarios -> coches
	  -> marcas desde la caché de TanStack Query) con buscador y borrado (DELETE).
	  ============================================================================ */

// Importa useState y los hooks usePropietarios, useCoches, useMarcas y useEliminarPropietario.
import { useState } from "react";
import {
	usePropietarios,
	useCoches,
	useMarcas,
	useEliminarPropietario,
} from "../hooks/useMotorData";

export default function PropietarioList({ onEditarPropietario }) {
	// Lee las 3 colecciones desde TanStack Query (propietarios, coches y marcas).
	const { data: propietarios = [], isPending, isError, error } = usePropietarios();
	const { data: coches = [] } = useCoches(false);
	const { data: marcas = [] } = useMarcas();

	// Crea memoria local para busqueda (""), filtroCiudad ("Todas") y feedback ("").
	const [busqueda, setBusqueda] = useState("");
	const [filtroCiudad, setFiltroCiudad] = useState("Todas");
	const [feedback, setFeedback] = useState("");

	// Prepara borrarMut (DELETE) con su mensaje verde.
	const borrarMut = useEliminarPropietario(() => {
		setFeedback("Propietario eliminado (DELETE).");
	});

	// Crea dos diccionarios rápidos (Map):
	// - mapaCoches: encuentra cualquier coche por su id al instante.
	// - mapaMarcas: encuentra el nombre de cualquier marca por su id al instante.
	const mapaCoches = new Map(coches.map((c) => [c.id, c]));
	const mapaMarcas = new Map(marcas.map((m) => [m.id, m.nombre]));


	// Paso a paso:
	// 1. propietarios.map(p => p.ciudad) saca la lista de todas las ciudades (con repetidas).
	// 2. new Set(...) elimina automáticamente las ciudades duplicadas.
	// 3. [... ] vuelve a convertir el Set en una lista normal (array).
	// 4. .toSorted() ordena las ciudades de la A a la Z sin modificar nada original.
	const ciudades = [...new Set(propietarios.map((p) => p.ciudad))].toSorted();


	// Prepara el texto del buscador limpio y en mayúsculas.
	const termino = busqueda.trim().toUpperCase();
	// Para cada propietario busca su coche en mapaCoches y la marca de ese coche en mapaMarcas.
	// -> Comprueba si la ciudad coincide con filtroCiudad (o "Todas") Y si el texto combinado
	// (nombre + email + ciudad + marca + modelo) incluye lo que escribió el usuario.
	const propietariosFiltrados = propietarios.filter((p) => {
		const coche = mapaCoches.get(p.cocheId);
		const marca = coche ? mapaMarcas.get(coche.marcaId) ?? "" : "";
		const modelo = coche ? coche.modelo : "";

		const coincideCiudad =
			filtroCiudad === "Todas" || p.ciudad === filtroCiudad;
		const texto = `${p.nombre} ${p.email} ${p.ciudad} ${marca} ${modelo}`.toUpperCase();

		return coincideCiudad && texto.includes(termino);
	});
// borrarPropietario(id): limpia avisos previos y ejecuta DELETE.

	function borrarPropietario(id) {
		setFeedback("");
		borrarMut.mutate(id);
	}
// Pinta el título con el total filtrado ({propietariosFiltrados.length}) y la barra
// de filtros (caja de búsqueda + desplegable de ciudades generado con ciudades.map()).

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
				// Muestra mensajes de error/éxito de borrado, aviso de carga (isPending), error de
				// carga (isError) o aviso de lista vacía si ningún propietario coincide con el filtro.
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
						// Pinta las tarjetas (<li key={p.id}>) cruzando los 3 datos:
						// - Nombre, email e insignia de ciudad.
						// - Vehículo: si el coche todavía existe muestra "Marca Modelo (Año)"; si fue borrado
						// muestra "Vehículo eliminado".
						// - Fecha de compra.
						// - Botones "Editar (PUT)" y "Borrar (DELETE)".
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
