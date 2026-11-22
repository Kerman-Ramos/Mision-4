/* ============================================================================
   8. ARCHIVO: src/components/PropietarioForm.jsx
   PROPÓSITO: Formulario accesible con React Hook Form + Zod para registrar
   (POST) o editar (PUT) propietarios vinculados a un vehículo del inventario.
   ============================================================================ */

// Importa useEffect para sincronizar el formulario al recibir propietarioEditando.
import { useEffect } from "react";
// Importa React Hook Form y el conector de esquemas Zod.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Importa el esquema de validación de propietarios (con .trim() y z.iso.date()).
import { propietarioFormSchema } from "../esquemas/motorEsquemas.js";
// Importa los hooks de lectura de caché y mutaciones de propietarios.
import {
	useCoches,
	useMarcas,
	useCrearPropietario,
	useReemplazarPropietario,
} from "../hooks/useMotorData.js";

// Plantilla limpia para inicializar o vaciar el formulario.
const VALORES_INICIALES = {
	nombre: "",
	email: "",
	ciudad: "",
	cocheId: "",
	fechaCompra: "",
};

export default function PropietarioForm({
	propietarioEditando,
	mensajeExito,
	onMensajeExito,
	onCancelarEdicion,
	onEdicionCompletada,
}) {
	// Lee coches y marcas desde la caché compartida (claves ["coches"] y ["marcas"]).
	const { data: coches = [] } = useCoches();
	const { data: marcas = [] } = useMarcas();

	// Crea un Map para mostrar el nombre de la marca junto al modelo en el <select> de vehículos.
	const mapaMarcas = new Map(marcas.map((m) => [m.id, m.nombre]));

	// Conecta React Hook Form con propietarioFormSchema.
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

	// Mutación POST: muestra aviso verde y limpia el formulario.
	const crearMut = useCrearPropietario((creado) => {
		onMensajeExito(`Propietario "${creado.nombre}" registrado (POST).`);
		reset(VALORES_INICIALES);
	});

	// Mutación PUT: muestra aviso verde y sale del modo edición conservando la confirmación.
	const editarMut = useReemplazarPropietario((editado) => {
		onMensajeExito(`Propietario "${editado.nombre}" actualizado (PUT).`);
		onEdicionCompletada();
	});

	const esEdicion = Boolean(propietarioEditando);
	const mutacionActiva = esEdicion ? editarMut : crearMut;

	// Precarga los datos del propietario al editar y lleva el foco al campo "nombre".
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

	// Envía los datos ya validados y normalizados (.trim() aplicado por Zod) al servidor.
	function onSubmit(datosValidados) {
		onMensajeExito("");

		if (esEdicion) {
			editarMut.mutate({
				id: propietarioEditando.id,
				datos: datosValidados,
			});
		} else {
			crearMut.mutate(datosValidados);
		}
	}

	// Dirige el foco al primer campo erróneo si falla la validación.
	function onInvalid(errores) {
		const camposConError = Object.keys(errores);
		if (camposConError.length > 0) {
			setFocus(camposConError[0]);
		}
	}

	return (
		<section className="card">
			{/* Cabecera dinámica con opción de cancelar edición. */}
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
					{/* Campo 1: Nombre completo (exige nombre y apellido). */}
					<div className="field">
						<label htmlFor="prop-nombre">Nombre completo</label>
						<input
							id="prop-nombre"
							type="text"
							autoComplete="name"
							placeholder="Ej: Laura Martínez"
							aria-invalid={!!errors.nombre}
							aria-describedby={
								errors.nombre ? "error-prop-nombre" : undefined
							}
							{...register("nombre")}
						/>
						{errors.nombre && (
							<p
								id="error-prop-nombre"
								role="alert"
								className="field-error"
							>
								{errors.nombre.message}
							</p>
						)}
					</div>

					{/* Campo 2: Correo electrónico validado con z.email(). */}
					<div className="field">
						<label htmlFor="prop-email">Correo electrónico</label>
						<input
							id="prop-email"
							type="email"
							autoComplete="email"
							placeholder="nombre@ejemplo.com"
							aria-invalid={!!errors.email}
							aria-describedby={
								errors.email ? "error-prop-email" : undefined
							}
							{...register("email")}
						/>
						{errors.email && (
							<p
								id="error-prop-email"
								role="alert"
								className="field-error"
							>
								{errors.email.message}
							</p>
						)}
					</div>

					{/* Campo 3: Ciudad de residencia. */}
					<div className="field">
						<label htmlFor="prop-ciudad">Ciudad</label>
						<input
							id="prop-ciudad"
							type="text"
							placeholder="Ej: Madrid"
							aria-invalid={!!errors.ciudad}
							aria-describedby={
								errors.ciudad ? "error-prop-ciudad" : undefined
							}
							{...register("ciudad")}
						/>
						{errors.ciudad && (
							<p
								id="error-prop-ciudad"
								role="alert"
								className="field-error"
							>
								{errors.ciudad.message}
							</p>
						)}
					</div>

					{/* Campo 4: Desplegable de vehículos cruzados con su marca. */}
					<div className="field">
						<label htmlFor="prop-coche">Vehículo adquirido</label>
						<select
							id="prop-coche"
							aria-invalid={!!errors.cocheId}
							aria-describedby={
								errors.cocheId
									? "error-prop-cocheId"
									: undefined
							}
							{...register("cocheId")}
						>
							<option value="">Selecciona un vehículo</option>
							{coches.map((c) => (
								<option key={c.id} value={c.id}>
									{mapaMarcas.get(c.marcaId) ?? "Marca"}{" "}
									{c.modelo} ({c.anio})
								</option>
							))}
						</select>
						{errors.cocheId && (
							<p
								id="error-prop-cocheId"
								role="alert"
								className="field-error"
							>
								{errors.cocheId.message}
							</p>
						)}
					</div>

					{/* Campo 5: Fecha de compra validada por calendario real (z.iso.date) y regla no futura. */}
					<div className="field">
						<label htmlFor="prop-fecha">Fecha de compra</label>
						<input
							id="prop-fecha"
							type="date"
							aria-invalid={!!errors.fechaCompra}
							aria-describedby={
								errors.fechaCompra
									? "error-prop-fecha"
									: undefined
							}
							{...register("fechaCompra")}
						/>
						{errors.fechaCompra && (
							<p
								id="error-prop-fecha"
								role="alert"
								className="field-error"
							>
								{errors.fechaCompra.message}
							</p>
						)}
					</div>
				</div>

				{/* Botón de envío bloqueado únicamente mientras la mutación está en curso. */}
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

				{/* Banners accesibles de error de servidor y confirmación. */}
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