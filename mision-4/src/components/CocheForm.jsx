/* ============================================================================
   6. ARCHIVO: src/components/CocheForm.jsx
   PROPÓSITO: Formulario no controlado con React Hook Form + zodResolver que
   gestiona tanto el alta (POST) como la edición completa (PUT) de vehículos.
   ============================================================================ */

// Importa useEffect, useState, useForm, zodResolver, las reglas cocheFormSchema,
// la lista COMBUSTIBLES y los hooks useMarcas, useCrearCoche y useReemplazarCoche.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cocheFormSchema, COMBUSTIBLES } from "../esquemas/motorEsquemas.js";
import {
	useMarcas,
	useCrearCoche,
	useReemplazarCoche,
} from "../hooks/useMotorData.js";

// Plantilla limpia para cuando el formulario está vacío o acaba de enviarse.
const VALORES_INICIALES = {
	marcaId: "",
	modelo: "",
	anio: new Date().getFullYear(),
	combustible: "Híbrido",
	precio: "",
	confirmaVeracidad: false,
};

// Recibe el coche a editar (o null si estamos creando) y la función para salir de edición.
export default function CocheForm({ cocheEditando, onCancelarEdicion }) {
	// Pide las marcas para rellenar el desplegable y guarda si aún están cargando.
	const { data: marcas = [], isPending: cargandoMarcas } = useMarcas();
	// Guarda el texto verde de confirmación ("Vehículo registrado...").
	const [mensajeExito, setMensajeExito] = useState("");

	// Conecta el formulario con las reglas de Zod (incluidas las reglas cruzadas).
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

	// Prepara el POST: cuando el servidor confirme que se guardó, muestra el mensaje
	// verde y vacía el formulario con reset(VALORES_INICIALES).
	const crearMut = useCrearCoche((cocheCreado) => {
		setMensajeExito(`Vehículo "${cocheCreado.modelo}" registrado (POST).`);
		reset(VALORES_INICIALES);
	});

	// Prepara el PUT: cuando termine, muestra mensaje verde y llama a onCancelarEdicion().
	const editarMut = useReemplazarCoche((cocheActualizado) => {
		setMensajeExito(`Vehículo "${cocheActualizado.modelo}" actualizado (PUT).`);
		onCancelarEdicion();
	});

	// Verdadero (true) si hay un coche en edición; falso (false) si estamos creando uno nuevo.
	const esEdicion = Boolean(cocheEditando);
	// Elige qué mutación vigilar (para saber si está enviando o si dio error).
	const mutacionActiva = esEdicion ? editarMut : crearMut;


	// Vigila la prop cocheEditando. Cada vez que el usuario pulsa "Editar (PUT)" en
	// una tarjeta, rellena automáticamente todas las cajas con reset({...}) convirtiendo
	// marcaId a texto para que el <select> lo marque, deja el checkbox en false para
	// volver a confirmar y pone el cursor en "modelo". Si se cancela, limpia todo.
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
// Borra mensajeExito anterior.
// -> Crea el objeto "payload" SOLO con los 5 campos que existen en db.json (dejando
// fuera confirmaVeracidad, que era solo una casilla de validación en pantalla) y
// quitando espacios al modelo con .trim().
// -> Si esEdicion es true dispara editarMut.mutate (PUT); si no, crearMut.mutate (POST).

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


	function onInvalid(errores) {
		// Si Zod detecta errores, mueve el cursor al primer campo erróneo.
		const camposConError = Object.keys(errores);
		if (camposConError.length > 0) {
			setFocus(camposConError[0]);
		}
	}

	return (
		// Cabecera de la tarjeta: cambia el título entre "Editar vehículo #X (PUT)" y
		// "Registrar nuevo vehículo (POST)". Si está editando, muestra el botón "Cancelar edición".
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


			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				<div className="form-grid">
					<div className="field">
						{/* Se deshabilita mientras cargandoMarcas es true. */}
						{/* -> Con marcas.map() pinta cada marca como <option>. Si una marca tiene activa === false, */}
						{/* le añade disabled={!m.activa} y el texto "— Inactiva" para que no puedas elegirla. */}
						{/* -> Si hay error (errors.marcaId), lo muestra en <p role="alert">. */}
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
						{/* Campo 2 (Modelo): <input type="text"> con {...register("modelo")} y su error accesible. */}
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
						{/* Campo 3 (Año): <input type="number"> con {...register("anio")} y su error accesible. */}
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
						{/* Campo 4 (Precio): <input type="number"> con {...register("precio")} y su error accesible. */}
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

				{/* Envuelve los 4 botones de radio dentro de <fieldset> con su título <legend>. */}
				{/* Regla de accesibilidad para agrupar opciones relacionadas. */}
				{/* Recorre COMBUSTIBLES con .map() creando un <input type="radio"> para cada uno. */}
				{/* Todos quedan registrados bajo el mismo nombre "combustible". */}
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
						{/* Campo 6 (Confirmación): <input type="checkbox"> conectado a "confirmaVeracidad". */}
						{/* Su mensaje de error aparece debajo si intentan enviar sin marcarlo. */}
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
					{/* disabled={mutacionActiva.isPending}: solo se bloquea mientras viaja la petición. */}
					{/* Evita que un doble clic cree el coche dos veces y cambia el texto dinámicamente. */}
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
						{/* Si mutacionActiva.isError es true: cartel rojo con role="alert". */}
						{/* -> Si mensajeExito tiene texto: cartel verde con role="status" (los lectores de */}
						{/* pantalla lo anuncian amablemente al terminar de hablar). */}
						{mensajeExito}
					</p>
				)}
			</form>
		</section>
	);
}
