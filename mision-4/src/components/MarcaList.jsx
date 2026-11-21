import { useState } from "react";
import {
	useMarcas,
	useCambiarEstadoMarca,
	useEliminarMarca,
} from "../hooks/useMotorData.js";

export default function MarcaList({ onEditarMarca }) {
	const { data: marcas = [], isPending, isError, error } = useMarcas();
	const [feedback, setFeedback] = useState("");

	const toggleMut = useCambiarEstadoMarca();
	const borrarMut = useEliminarMarca(() => {
		setFeedback("Marca eliminada del catálogo (DELETE).");
	});

	function borrarMarca(id) {
		setFeedback("");
		borrarMut.mutate(id);
	}

	return (
		<section className="card">
			<h2>Catálogo de marcas ({marcas.length})</h2>

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

			{isPending && (
				<p role="status" className="state-box">
					Cargando marcas...
				</p>
			)}
			{isError && (
				<p role="alert" className="banner-error">
					Error al cargar marcas: {error.message}
				</p>
			)}

			{!isPending && !isError && marcas.length > 0 && (
				<ul className="items-grid">
					{marcas.map((m) => (
						<li key={m.id} className="item-card">
							<div className="item-top">
								<div>
									<span className="eyebrow">
										{m.paisOrigen} · Fundada en {m.anioFundacion}
									</span>
									<h3>{m.nombre}</h3>
								</div>
								<span className="badge">{m.activa ? "Activa" : "Inactiva"}</span>
							</div>

							<p className="meta-line">
								<strong>Sede:</strong> {m.sede}
							</p>

							<div className="item-actions">
								<button
									type="button"
									className="btn-secondary"
									onClick={() => onEditarMarca(m)}
								>
									Editar (PUT)
								</button>
								<button
									type="button"
									className="btn-ghost"
									disabled={toggleMut.isPending}
									onClick={() =>
										toggleMut.mutate({ id: m.id, activa: !m.activa })
									}
								>
									{m.activa ? "Desactivar (PATCH)" : "Activar (PATCH)"}
								</button>
								<button
									type="button"
									className="btn-danger"
									disabled={borrarMut.isPending}
									onClick={() => borrarMarca(m.id)}
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