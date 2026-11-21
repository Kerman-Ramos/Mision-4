// Importa useEffect, useState, useForm, zodResolver, marcaFormSchema,
// useCrearMarca y useReemplazarMarca.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { marcaFormSchema } from "../esquemas/motorEsquemas.js";
import { useCrearMarca, useReemplazarMarca } from "../hooks/useMotorData.js";

// VALORES_INICIALES: campos vacíos, año por defecto 1950 y activa en true.
const VALORES_INICIALES = {
	nombre: "",
	paisOrigen: "",
	anioFundacion: 1950,
	sede: "",
	activa: true,
};

export default function MarcaForm({ marcaEditando, onCancelarEdicion }) {
	// Estado mensajeExito para confirmaciones verdes.
	const [mensajeExito, setMensajeExito] = useState("");

	// Configura useForm con marcaFormSchema y VALORES_INICIALES.
	const {
		register,
		handleSubmit,
		reset,
		setFocus,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(marcaFormSchema),
		defaultValues: VALORES_INICIALES,
	});

	// Configura crearMut (POST) y editarMut (PUT), con sus mensajes verdes y reset/cancelación.
	const crearMut = useCrearMarca((creada) => {
		setMensajeExito(`Marca "${creada.nombre}" registrada (POST).`);
		reset(VALORES_INICIALES);
	});

	const editarMut = useReemplazarMarca((editada) => {
		setMensajeExito(`Marca "${editada.nombre}" actualizada (PUT).`);
		onCancelarEdicion();
	});

	// Calcula esEdicion y mutacionActiva.
	const esEdicion = Boolean(marcaEditando);
	const mutacionActiva = esEdicion ? editarMut : crearMut;

	// useEffect: si llega marcaEditando, precarga los 5 campos con reset() y lleva el foco
	// a "nombre"; si pasa a null, devuelve el formulario a VALORES_INICIALES.
	useEffect(() => {
		if (marcaEditando) {
			reset({
				nombre: marcaEditando.nombre,
				paisOrigen: marcaEditando.paisOrigen,
				anioFundacion: marcaEditando.anioFundacion,
				sede: marcaEditando.sede,
				activa: marcaEditando.activa,
			});
			setFocus("nombre");
		} else {
			reset(VALORES_INICIALES);
		}
	}, [marcaEditando, reset, setFocus]);

	function onSubmit(datosValidados) {
		// onSubmit(datosValidados): limpia espacios (.trim()) en nombre, paisOrigen y sede,
		// y lanza editarMut (PUT) o crearMut (POST).
		setMensajeExito("");
		const payload = {
			nombre: datosValidados.nombre.trim(),
			paisOrigen: datosValidados.paisOrigen.trim(),
			anioFundacion: datosValidados.anioFundacion,
			sede: datosValidados.sede.trim(),
			activa: datosValidados.activa,
		};

		if (esEdicion) {
			editarMut.mutate({ id: marcaEditando.id, datos: payload });
		} else {
			crearMut.mutate(payload);
		}
	}

	// onInvalid(errores): lleva el foco al primer campo erróneo con setFocus().
	function onInvalid(errores) {
		const primerCampo = Object.keys(errores)[0];
		if (primerCampo) setFocus(primerCampo);
	}

	// Renderiza la tarjeta con título dinámico, botón "Cancelar edición" si aplica,
	// y los 5 campos accesibles:
	// - Nombre de la marca (text)
	// - País de origen (text)
	// - Año de fundación (number)
	// - Sede central (text)
	// - Checkbox "Marca activa en el catálogo"
	// - Botón submit (deshabilitado solo durante isPending) + banners de error y éxito.
	return (
		<section className="card">
			<div className="card-header">
				<h2>
					{esEdicion
						? `Editar marca #${marcaEditando.id} (PUT)`
						: "Registrar nueva marca (POST)"}
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
						<label htmlFor="marca-nombre">Nombre de la marca</label>
						<input
							id="marca-nombre"
							type="text"
							placeholder="Ej: Mazda, Honda, BMW"
							aria-invalid={!!errors.nombre}
							aria-describedby={errors.nombre ? "error-marca-nombre" : undefined}
							{...register("nombre")}
						/>
						{errors.nombre && (
							<p id="error-marca-nombre" role="alert" className="field-error">
								{errors.nombre.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="marca-pais">País de origen</label>
						<input
							id="marca-pais"
							type="text"
							placeholder="Ej: Japón, Alemania"
							aria-invalid={!!errors.paisOrigen}
							aria-describedby={errors.paisOrigen ? "error-marca-pais" : undefined}
							{...register("paisOrigen")}
						/>
						{errors.paisOrigen && (
							<p id="error-marca-pais" role="alert" className="field-error">
								{errors.paisOrigen.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="marca-anio">Año de fundación</label>
						<input
							id="marca-anio"
							type="number"
							aria-invalid={!!errors.anioFundacion}
							aria-describedby={errors.anioFundacion ? "error-marca-anio" : undefined}
							{...register("anioFundacion")}
						/>
						{errors.anioFundacion && (
							<p id="error-marca-anio" role="alert" className="field-error">
								{errors.anioFundacion.message}
							</p>
						)}
					</div>

					<div className="field">
						<label htmlFor="marca-sede">Sede central</label>
						<input
							id="marca-sede"
							type="text"
							placeholder="Ej: Hiroshima, Múnich"
							aria-invalid={!!errors.sede}
							aria-describedby={errors.sede ? "error-marca-sede" : undefined}
							{...register("sede")}
						/>
						{errors.sede && (
							<p id="error-marca-sede" role="alert" className="field-error">
								{errors.sede.message}
							</p>
						)}
					</div>
				</div>

				<div className="field checkbox-field">
					<label htmlFor="marca-activa" className="checkbox-label">
						<input
							id="marca-activa"
							type="checkbox"
							{...register("activa")}
						/>
						<span>Marca activa en el catálogo</span>
					</label>
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
							? "Guardar marca (PUT)"
							: "Registrar marca (POST)"}
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
