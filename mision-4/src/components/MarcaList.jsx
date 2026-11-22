/* ============================================================================
   11. ARCHIVO: src/components/MarcaList.jsx
   PROPÓSITO: Listado de marcas (GET) en el panel de administrador con edición
   (PUT), cambio de estado (PATCH), borrado con confirmación (DELETE), estado
   vacío y botón de reintento.
   ============================================================================ */

// Importa useState para mostrar feedback de borrado.
import { useState } from "react";
// Importa los hooks de TanStack Query para leer y mutar marcas.
import {
	useMarcas,
	useCambiarEstadoMarca,
	useEliminarMarca,
} from "../hooks/useMotorData.js";

export default function MarcaList({ onEditarMarca }) {
	// Lee las marcas desde la caché compartida junto con refetch() para reintentar fallos.
	const {
		data: marcas = [],
		isPending,
		isError,
		error,
		refetch,
	} = useMarcas();
	// Guarda el mensaje verde cuando se completa un borrado.
	const [feedback, setFeedback] = useState("");

	// Mutación PATCH para activar o desactivar una marca.
	const toggleMut = useCambiarEstadoMarca();
	// Mutación DELETE con aviso de confirmación.
	const borrarMut = useEliminarMarca(() => {
		setFeedback("Marca eliminada del catálogo (DELETE).");
	});

	// Pide confirmación explícita antes de eliminar definitivamente una marca.
	function borrarMarca(marca) {
		if (
			!window.confirm(
				`¿Seguro que quieres eliminar la marca "${marca.nombre}"?`
			)
		) {
			return;
		}
		setFeedback("");
		borrarMut.mutate(marca.id);
	}

	return (
		<section className="card">
			<h2>Catálogo de marcas ({marcas.length})</h2>

			{/* Muestra errores de PATCH o DELETE y avisos de éxito. */}
			{(borrarMut.isError || toggleMut.isError) && (
				<p role="alert" className="banner-error">
					{borrarMut.error?.message ?? toggleMut.error?.message}
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
					Cargando marcas...
				</p>
			)}

			{/* Estado de error con botón Reintentar conectado a refetch(). */}
			{isError && (
				<div role="alert" className="banner-error">
					<strong>Error al cargar marcas:</strong> {error.message}
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

			{/* Estado vacío cuando no queda ninguna marca en db.json. */}
			{!isPending && !isError && marcas.length === 0 && (
				<p className="state-box">
					No hay marcas registradas en el catálogo.
				</p>
			)}

			{/* Tarjetas de marcas con acciones PUT, PATCH y DELETE. */}
			{!isPending && !isError && marcas.length > 0 && (
				<ul className="items-grid">
					{marcas.map((m) => (
						<li key={m.id} className="item-card">
							<div className="item-top">
								<div>
									<span className="eyebrow">
										{m.paisOrigen} · Fundada en{" "}
										{m.anioFundacion}
									</span>
									<h3>{m.nombre}</h3>
								</div>
								<span className="badge">
									{m.activa ? "Activa" : "Inactiva"}
								</span>
							</div>

							<p className="meta-line">
								<strong>Sede:</strong> {m.sede}
							</p>

							<div className="item-actions">
								<button
									type="button"
									className="btn-secondary"
									onClick={() => {
										setFeedback("");
										onEditarMarca(m);
									}}
								>
									Editar (PUT)
								</button>
								<button
									type="button"
									className="btn-ghost"
									disabled={toggleMut.isPending}
									onClick={() => {
										setFeedback("");
										toggleMut.mutate({
											id: m.id,
											activa: !m.activa,
										});
									}}
								>
									{m.activa
										? "Desactivar (PATCH)"
										: "Activar (PATCH)"}
								</button>
								<button
									type="button"
									className="btn-danger"
									disabled={borrarMut.isPending}
									onClick={() => borrarMarca(m)}
								>
									Borrar (DELETE)
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}