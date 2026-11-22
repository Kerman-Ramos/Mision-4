/* ============================================================================
   6. ARCHIVO: src/components/CocheForm.jsx
   PROPÓSITO: Formulario no controlado con React Hook Form + zodResolver que
   gestiona tanto el alta (POST) como la edición completa (PUT) de vehículos.
   ============================================================================ */

// Importa useEffect para sincronizar el formulario al cambiar cocheEditando.
import { useEffect } from "react";
// Importa React Hook Form y el conector oficial de esquemas Zod.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Importa las reglas de validación y el catálogo de combustibles.
import { cocheFormSchema, COMBUSTIBLES } from "../esquemas/motorEsquemas.js";
// Importa los hooks de TanStack Query para leer marcas y mutar vehículos.
import {
	useMarcas,
	useCrearCoche,
	useReemplazarCoche,
} from "../hooks/useMotorData.js";

// Valores por defecto para inicializar o vaciar el formulario.
const VALORES_INICIALES = {
	marcaId: "",
	modelo: "",
	anio: new Date().getFullYear(),
	combustible: "Híbrido",
	precio: "",
	confirmaVeracidad: false,
};

export default function CocheForm({
	cocheEditando,
	mensajeExito,
	onMensajeExito,
	onCancelarEdicion,
	onEdicionCompletada,
}) {
	// Obtiene la lista de marcas para poblar el desplegable <select>.
	const { data: marcas = [], isPending: cargandoMarcas } = useMarcas();

	// Inicializa React Hook Form conectado al esquema cocheFormSchema.
	const {
		register,
		handleSubmit,
		reset,
		setFocus,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(cocheFormSchema),
		defaultValues: VALORES_INICIALES,
	});

	// Mutación POST: al guardar con éxito muestra el aviso verde y resetea los campos.
	const crearMut = useCrearCoche((cocheCreado) => {
		onMensajeExito(`Vehículo "${cocheCreado.modelo}" registrado (POST).`);
		reset(VALORES_INICIALES);
	});

	// Mutación PUT: al actualizar muestra el aviso verde y sale del modo edición sin borrar el mensaje.
	const editarMut = useReemplazarCoche((cocheActualizado) => {
		onMensajeExito(`Vehículo "${cocheActualizado.modelo}" actualizado (PUT).`);
		onEdicionCompletada();
	});

	// Determina si el formulario opera en modo edición (PUT) o creación (POST).
	const esEdicion = Boolean(cocheEditando);
	// Selecciona la mutación activa para leer su estado isPending e isError.
	const mutacionActiva = esEdicion ? editarMut : crearMut;

	// Precarga los valores del coche seleccionado en el formulario y enfoca el campo "modelo".
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

	// Solo se ejecuta cuando Zod aprueba todos los campos (incluyendo .trim() y validaciones cruzadas).
	function onSubmit(datosValidados) {
		onMensajeExito("");
		// Construye el payload excluyendo confirmaVeracidad (campo exclusivo de validación en UI).
		const payload = {
			marcaId: datosValidados.marcaId,
			modelo: datosValidados.modelo,
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

	// Si falla la validación al enviar, dirige automáticamente el foco al primer campo con error.
	function onInvalid(errores) {
		const camposConError = Object.keys(errores);
		if (camposConError.length > 0) {
			setFocus(camposConError[0]);
		}
	}

	return (
		<section className="card">
			{/* Cabecera dinámica con botón para cancelar la edición cuando corresponda. */}
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

			{/* noValidate desactiva los avisos nativos del navegador para que mande siempre Zod. */}
			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				<div className="form-grid">
					{/* Campo 1: Marca (deshabilita visualmente las marcas inactivas). */}
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

					{/* Campo 2: Modelo (texto normalizado automáticamente por Zod con .trim()). */}
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

					{/* Campo 3: Año de fabricación (convertido a número por z.coerce.number()). */}
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

					{/* Campo 4: Precio en euros (sujeto a rango y regla cruzada con el año). */}
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

				{/* Campo 5: Combustible. El <fieldset> aporta el <legend> y el div interno con role="radiogroup" lleva aria-invalid y aria-describedby. */}
				<fieldset className="radio-fieldset">
					<legend>Tipo de combustible</legend>
					<div
						className="radio-group"
						role="radiogroup"
						aria-invalid={!!errors.combustible}
						aria-describedby={
							errors.combustible
								? "error-combustible"
								: undefined
						}
					>
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

				{/* Campo 6: Casilla obligatoria validada con z.literal(true). */}
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

				{/* Botón de envío: solo se deshabilita mientras la petición está en curso (isPending). */}
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

				{/* Regiones vivas ARIA para anunciar errores del servidor (alert) o confirmaciones (status). */}
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