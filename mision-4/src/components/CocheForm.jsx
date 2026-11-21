/* ============================================================================
   6. ARCHIVO: src/components/CocheForm.jsx
   PROPÓSITO: Formulario no controlado con React Hook Form + zodResolver que
   gestiona tanto el alta (POST) como la edición completa (PUT) de vehículos.
   ============================================================================ */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cocheFormSchema, COMBUSTIBLES } from "../esquemas/motorEsquemas.js";
import {
	useMarcas,
	useCrearCoche,
	useReemplazarCoche,
} from "../hooks/useMotorData.js";

const VALORES_INICIALES = {
	marcaId: "",
	modelo: "",
	anio: new Date().getFullYear(),
	combustible: "Híbrido",
	precio: "",
	confirmaVeracidad: false,
};

export default function CocheForm({ cocheEditando, onCancelarEdicion }) {
	const { data: marcas = [], isPending: cargandoMarcas } = useMarcas();
	const [mensajeExito, setMensajeExito] = useState("");

	const {
		register,
		handleSubmit,
		reset,
		setFocus,
		formState: { errors },
	} = useForm({
		// Conecta el esquema cocheFormSchema vía zodResolver; al usar inputs no controlados con register, evita re-renders en cada pulsación.
		resolver: zodResolver(cocheFormSchema),
		defaultValues: VALORES_INICIALES,
	});

	const crearMut = useCrearCoche((cocheCreado) => {
		setMensajeExito(`Vehículo "${cocheCreado.modelo}" registrado (POST).`);
		reset(VALORES_INICIALES);
	});

	const editarMut = useReemplazarCoche((cocheActualizado) => {
		setMensajeExito(`Vehículo "${cocheActualizado.modelo}" actualizado (PUT).`);
		onCancelarEdicion();
	});

	const esEdicion = Boolean(cocheEditando);
	const mutacionActiva = esEdicion ? editarMut : crearMut;

	// Cuando llega un cocheEditando por props, precarga el formulario con reset() y mueve el foco al campo modelo.
	useEffect(() => {
		if (cocheEditando) {
			reset({
				marcaId: String(cocheEditando.marcaId),
				modelo: cocheEditando.modelo,
				anio: cocheEditando.anio,
				combustible: cocheEditando.combustible,
				precio: cocheEditando.precio,
				confirmaVeracidad: false,
			});
			setFocus("modelo");
		} else {
			reset(VALORES_INICIALES);
		}
	}, [cocheEditando, reset, setFocus]);

	function onSubmit(datosValidados) {
		// Solo se ejecuta si Zod valida todos los campos. Construye el payload sin el checkbox de confirmación y dispara POST o PUT según el modo.
		setMensajeExito("");
		const payload = {
			marcaId: datosValidados.marcaId,
			modelo: datosValidados.modelo.trim(),
			anio: datosValidados.anio,
			combustible: datosValidados.combustible,
			precio: datosValidados.precio,
		};

		if (esEdicion) {
			editarMut.mutate({ id: cocheEditando.id, datos: payload });
		} else {
			crearMut.mutate(payload);
		}
	}

	// Accesibilidad por teclado: si falla la validación al enviar, lleva automáticamente el foco al primer campo erróneo con setFocus().
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
						? `Editar vehículo #${cocheEditando.id} (PUT)`
						: "Registrar nuevo vehículo (POST)"}
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

			{/* Usa noValidate para que mande Zod, etiquetas label/htmlFor, fieldset/legend para radios, aria-invalid/aria-describedby y regiones role="alert" / role="status". */}
			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				<div className="form-grid">
					<div className="field">
						<label htmlFor="coche-marca">Marca</label>
						<select
							id="coche-marca"
							disabled={cargandoMarcas}
							aria-invalid={!!errors.marcaId}
							aria-describedby={
								errors.marcaId ? "error-marcaId" : undefined
							}
							{...register("marcaId")}
						>
							<option value="">
								{cargandoMarcas
									? "Cargando marcas..."
									: "Selecciona una marca"}
							</option>
							{marcas.map((m) => (
								<option
									key={m.id}
									value={m.id}
									disabled={!m.activa}
								>
									{m.nombre} ({m.paisOrigen}){" "}
									{!m.activa ? "— Inactiva" : ""}
								</option>
							))}
						</select>
						{errors.marcaId && (
							<p
								id="error-marcaId"
								role="alert"
								className="field-error"
							>
								{errors.marcaId.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="coche-modelo">Modelo</label>
						<input
							id="coche-modelo"
							type="text"
							placeholder="Ej: Corolla, León, ID.3"
							aria-invalid={!!errors.modelo}
							aria-describedby={
								errors.modelo ? "error-modelo" : undefined
							}
							{...register("modelo")}
						/>
						{errors.modelo && (
							<p
								id="error-modelo"
								role="alert"
								className="field-error"
							>
								{errors.modelo.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="coche-anio">Año de fabricación</label>
						<input
							id="coche-anio"
							type="number"
							aria-invalid={!!errors.anio}
							aria-describedby={
								errors.anio ? "error-anio" : undefined
							}
							{...register("anio")}
						/>
						{errors.anio && (
							<p
								id="error-anio"
								role="alert"
								className="field-error"
							>
								{errors.anio.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="coche-precio">Precio (€)</label>
						<input
							id="coche-precio"
							type="number"
							placeholder="Ej: 24500"
							aria-invalid={!!errors.precio}
							aria-describedby={
								errors.precio ? "error-precio" : undefined
							}
							{...register("precio")}
						/>
						{errors.precio && (
							<p
								id="error-precio"
								role="alert"
								className="field-error"
							>
								{errors.precio.message}
							</p>
						)}
					</div>
				</div>

				<fieldset
					className="radio-fieldset"
					aria-invalid={!!errors.combustible}
					aria-describedby={
						errors.combustible
							? "error-combustible"
							: undefined
					}
				>
					<legend>Tipo de combustible</legend>
					<div className="radio-group">
						{COMBUSTIBLES.map((tipo) => (
							<label key={tipo} className="radio-option">
								<input
									type="radio"
									value={tipo}
									{...register("combustible")}
								/>
								<span>{tipo}</span>
							</label>
						))}
					</div>
					{errors.combustible && (
						<p
							id="error-combustible"
							role="alert"
							className="field-error"
						>
							{errors.combustible.message}
						</p>
					)}
				</fieldset>

				<div className="field checkbox-field">
					<label htmlFor="coche-confirma" className="checkbox-label">
						<input
							id="coche-confirma"
							type="checkbox"
							aria-invalid={!!errors.confirmaVeracidad}
							aria-describedby={
								errors.confirmaVeracidad
									? "error-confirmaVeracidad"
									: undefined
							}
							{...register("confirmaVeracidad")}
						/>
						<span>
							Confirmo que los datos técnicos y el precio son
							veraces
						</span>
					</label>
					{errors.confirmaVeracidad && (
						<p
							id="error-confirmaVeracidad"
							role="alert"
							className="field-error"
						>
							{errors.confirmaVeracidad.message}
						</p>
					)}
				</div>

				<div className="form-actions">
					<button
						type="submit"
						className="btn-primary"
						disabled={mutacionActiva.isPending}
					>
						{mutacionActiva.isPending
							? esEdicion
								? "Guardando cambios..."
								: "Registrando..."
							: esEdicion
							  ? "Guardar cambios (PUT)"
							  : "Registrar vehículo (POST)"}
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
