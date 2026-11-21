/* ============================================================================
	  8. ARCHIVO: src/components/PropietarioForm.jsx
	  PROPÓSITO: Formulario accesible con React Hook Form + Zod para registrar
	  (POST) o editar (PUT) propietarios vinculados a un vehículo del inventario.
	  ============================================================================ */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propietarioFormSchema } from "../esquemas/motorEsquemas.js";
import {
	useCoches,
	useMarcas,
	useCrearPropietario,
	useReemplazarPropietario,
} from "../hooks/useMotorData.js";

const VALORES_INICIALES = {
	nombre: "",
	email: "",
	ciudad: "",
	cocheId: "",
	fechaCompra: "",
};

export default function PropietarioForm({
	propietarioEditando,
	onCancelarEdicion,
}) {
	const { data: coches = [] } = useCoches(false);
	const { data: marcas = [] } = useMarcas();
	const [mensajeExito, setMensajeExito] = useState("");

	const mapaMarcas = new Map(marcas.map((m) => [m.id, m.nombre]));

	const {
		register,
		handleSubmit,
		reset,
		setFocus,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(propietarioFormSchema),
		defaultValues: VALORES_INICIALES,
	});

	const crearMut = useCrearPropietario((creado) => {
		setMensajeExito(`Propietario "${creado.nombre}" registrado (POST).`);
		reset(VALORES_INICIALES);
	});

	const editarMut = useReemplazarPropietario((editado) => {
		setMensajeExito(`Propietario "${editado.nombre}" actualizado (PUT).`);
		onCancelarEdicion();
	});

	const esEdicion = Boolean(propietarioEditando);
	const mutacionActiva = esEdicion ? editarMut : crearMut;

	// Precarga los datos del propietario seleccionado para edición (PUT) mediante reset() y enfoca el campo nombre.
	useEffect(() => {
		if (propietarioEditando) {
			reset({
				nombre: propietarioEditando.nombre,
				email: propietarioEditando.email,
				ciudad: propietarioEditando.ciudad,
				cocheId: String(propietarioEditando.cocheId),
				fechaCompra: propietarioEditando.fechaCompra,
			});
			setFocus("nombre");
		} else {
			reset(VALORES_INICIALES);
		}
	}, [propietarioEditando, reset, setFocus]);

	function onSubmit(datosValidados) {
		// Limpia espacios de los textos validados antes de mutar (POST/PUT).
		setMensajeExito("");
		const payload = {
			...datosValidados,
			nombre: datosValidados.nombre.trim(),
			ciudad: datosValidados.ciudad.trim(),
		};

		if (esEdicion) {
			editarMut.mutate({ id: propietarioEditando.id, datos: payload });
		} else {
			crearMut.mutate(payload);
		}
	}

	// Dirige el foco al primer campo inválido si hay errores.
	function onInvalid(errores) {
		const camposConError = Object.keys(errores);
		if (camposConError.length > 0) {
			setFocus(camposConError[0]);
		}
	}

	return (
		<section className="card">
			<div className="card-header">
				<h2>
					{esEdicion
						? `Editar propietario #${propietarioEditando.id} (PUT)`
						: "Registrar propietario (POST)"}
				</h2>
				{esEdicion && (
					<button
						type="button"
						className="btn-secondary"
						onClick={onCancelarEdicion}
					>
						Cancelar edición
					</button>
				)}
			</div>

			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				<div className="form-grid">
					<div className="field">
						<label htmlFor="prop-nombre">Nombre completo</label>
						<input
							id="prop-nombre"
							type="text"
							autoComplete="name"
							placeholder="Ej: Laura Martínez"
							aria-invalid={!!errors.nombre}
							aria-describedby={errors.nombre ? "error-prop-nombre" : undefined}
							{...register("nombre")}
						/>
						{errors.nombre && (
							<p id="error-prop-nombre" role="alert" className="field-error">
								{errors.nombre.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="prop-email">Correo electrónico</label>
						<input
							id="prop-email"
							type="email"
							autoComplete="email"
							placeholder="nombre@ejemplo.com"
							aria-invalid={!!errors.email}
							aria-describedby={errors.email ? "error-prop-email" : undefined}
							{...register("email")}
						/>
						{errors.email && (
							<p id="error-prop-email" role="alert" className="field-error">
								{errors.email.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="prop-ciudad">Ciudad</label>
						<input
							id="prop-ciudad"
							type="text"
							placeholder="Ej: Madrid"
							aria-invalid={!!errors.ciudad}
							aria-describedby={errors.ciudad ? "error-prop-ciudad" : undefined}
							{...register("ciudad")}
						/>
						{errors.ciudad && (
							<p id="error-prop-ciudad" role="alert" className="field-error">
								{errors.ciudad.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="prop-coche">Vehículo adquirido</label>
						<select
							id="prop-coche"
							aria-invalid={!!errors.cocheId}
							aria-describedby={errors.cocheId ? "error-prop-cocheId" : undefined}
							{...register("cocheId")}
						>
							<option value="">Selecciona un vehículo</option>
							{coches.map((c) => (
								<option key={c.id} value={c.id}>
									{mapaMarcas.get(c.marcaId) ?? "Marca"} {c.modelo} ({c.anio})
								</option>
							))}
						</select>
						{errors.cocheId && (
							<p id="error-prop-cocheId" role="alert" className="field-error">
								{errors.cocheId.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="prop-fecha">Fecha de compra</label>
						<input
							id="prop-fecha"
							type="date"
							aria-invalid={!!errors.fechaCompra}
							aria-describedby={
								errors.fechaCompra ? "error-prop-fecha" : undefined
							}
							{...register("fechaCompra")}
						/>
						{errors.fechaCompra && (
							<p id="error-prop-fecha" role="alert" className="field-error">
								{errors.fechaCompra.message}
							</p>
						)}
					</div>
				</div>

				<div className="form-actions">
					<button
						type="submit"
						className="btn-primary"
						disabled={mutacionActiva.isPending}
					>
						{mutacionActiva.isPending
							? "Guardando..."
							: esEdicion
							? "Guardar propietario (PUT)"
							: "Registrar propietario (POST)"}
					</button>
				</div>

				{mutacionActiva.isError && (
					<p role="alert" className="banner-error">
						{mutacionActiva.error.message}
					</p>
				)}
				{mensajeExito && (
					<p role="status" className="banner-success">
						{mensajeExito}
					</p>
				)}
			</form>
		</section>
	);
}