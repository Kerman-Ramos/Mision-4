/* ============================================================================
   10. ARCHIVO: src/components/MarcaForm.jsx
   PROPÓSITO: Formulario accesible con React Hook Form + Zod para crear (POST)
   o editar completamente (PUT) marcas en el panel de administrador.
   ============================================================================ */

// Importa useEffect para sincronizar el formulario cuando llega marcaEditando.
import { useEffect } from "react";
// Importa React Hook Form y el conector de Zod.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Importa las reglas de validación de marcas (con .trim() incluido).
import { marcaFormSchema } from "../esquemas/motorEsquemas.js";
// Importa las mutaciones POST y PUT de marcas.
import { useCrearMarca, useReemplazarMarca } from "../hooks/useMotorData.js";

// Valores iniciales limpios del formulario.
const VALORES_INICIALES = {
	nombre: "",
	paisOrigen: "",
	anioFundacion: 1950,
	sede: "",
	activa: true,
};

export default function MarcaForm({
	marcaEditando,
	mensajeExito,
	onMensajeExito,
	onCancelarEdicion,
	onEdicionCompletada,
}) {
	// Configura React Hook Form conectado a marcaFormSchema.
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

	// Mutación POST: muestra aviso verde y limpia el formulario.
	const crearMut = useCrearMarca((creada) => {
		onMensajeExito(`Marca "${creada.nombre}" registrada (POST).`);
		reset(VALORES_INICIALES);
	});

	// Mutación PUT: muestra aviso verde y cierra el modo edición conservando la confirmación.
	const editarMut = useReemplazarMarca((editada) => {
		onMensajeExito(`Marca "${editada.nombre}" actualizada (PUT).`);
		onEdicionCompletada();
	});

	const esEdicion = Boolean(marcaEditando);
	const mutacionActiva = esEdicion ? editarMut : crearMut;

	// Precarga los 5 campos al pulsar Editar y enfoca "nombre"; si se cancela, vuelve a los valores iniciales.
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

	// Envía los datos ya validados y normalizados por Zod (POST o PUT según el modo).
	function onSubmit(datosValidados) {
		onMensajeExito("");

		if (esEdicion) {
			editarMut.mutate({ id: marcaEditando.id, datos: datosValidados });
		} else {
			crearMut.mutate(datosValidados);
		}
	}

	// Dirige el foco al primer campo inválido si falla la validación.
	function onInvalid(errores) {
		const primerCampo = Object.keys(errores)[0];
		if (primerCampo) setFocus(primerCampo);
	}

	return (
		<section className="card">
			{/* Cabecera dinámica con botón para cancelar edición. */}
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
					{/* Campo 1: Nombre de la marca. */}
					<div className="field">
						<label htmlFor="marca-nombre">Nombre de la marca</label>
						<input
							id="marca-nombre"
							type="text"
							placeholder="Ej: Mazda, Honda, BMW"
							aria-invalid={!!errors.nombre}
							aria-describedby={
								errors.nombre ? "error-marca-nombre" : undefined
							}
							{...register("nombre")}
						/>
						{errors.nombre && (
							<p
								id="error-marca-nombre"
								role="alert"
								className="field-error"
							>
								{errors.nombre.message}
							</p>
						)}
					</div>

					{/* Campo 2: País de origen. */}
					<div className="field">
						<label htmlFor="marca-pais">País de origen</label>
						<input
							id="marca-pais"
							type="text"
							placeholder="Ej: Japón, Alemania"
							aria-invalid={!!errors.paisOrigen}
							aria-describedby={
								errors.paisOrigen
									? "error-marca-pais"
									: undefined
							}
							{...register("paisOrigen")}
						/>
						{errors.paisOrigen && (
							<p
								id="error-marca-pais"
								role="alert"
								className="field-error"
							>
								{errors.paisOrigen.message}
							</p>
						)}
					</div>

					{/* Campo 3: Año de fundación. */}
					<div className="field">
						<label htmlFor="marca-anio">Año de fundación</label>
						<input
							id="marca-anio"
							type="number"
							aria-invalid={!!errors.anioFundacion}
							aria-describedby={
								errors.anioFundacion
									? "error-marca-anio"
									: undefined
							}
							{...register("anioFundacion")}
						/>
						{errors.anioFundacion && (
							<p
								id="error-marca-anio"
								role="alert"
								className="field-error"
							>
								{errors.anioFundacion.message}
							</p>
						)}
					</div>

					{/* Campo 4: Sede central. */}
					<div className="field">
						<label htmlFor="marca-sede">Sede central</label>
						<input
							id="marca-sede"
							type="text"
							placeholder="Ej: Hiroshima, Múnich"
							aria-invalid={!!errors.sede}
							aria-describedby={
								errors.sede ? "error-marca-sede" : undefined
							}
							{...register("sede")}
						/>
						{errors.sede && (
							<p
								id="error-marca-sede"
								role="alert"
								className="field-error"
							>
								{errors.sede.message}
							</p>
						)}
					</div>
				</div>

				{/* Campo 5: Checkbox para marcar si la marca está activa en el catálogo. */}
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

				{/* Botón de envío bloqueado solo durante isPending. */}
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

				{/* Banners de error y confirmación accesibles. */}
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