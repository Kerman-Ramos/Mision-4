/* ============================================================================
   12. ARCHIVO: src/components/AdminLoginForm.jsx
   PROPÓSITO: Formulario accesible de acceso simulado (admin / admin) conectado
   a React Hook Form + Zod para desbloquear el panel de gestión de marcas.
   ============================================================================ */

// Importa useState para guardar el mensaje de error cuando las credenciales no coinciden.
import { useState } from "react";
// Importa useForm de React Hook Form para gestionar el formulario con inputs no controlados.
import { useForm } from "react-hook-form";
// Importa zodResolver, el adaptador que conecta el esquema de Zod con React Hook Form.
import { zodResolver } from "@hookform/resolvers/zod";
// Importa el esquema de validación del login (normaliza usuario con .trim() y exige campos no vacíos).
import { adminLoginSchema } from "../esquemas/motorEsquemas.js";

// Declara el componente recibiendo por props el callback onLoginExito enviado desde App.jsx.
export default function AdminLoginForm({ onLoginExito }) {
	// Estado local que almacena el texto del aviso rojo si el usuario o la contraseña son incorrectos.
	const [errorCredenciales, setErrorCredenciales] = useState("");

	// Inicializa React Hook Form extrayendo las herramientas necesarias:
	// - register: enlaza cada <input> al DOM sin disparar re-renders al teclear.
	// - handleSubmit: ejecuta la validación de Zod antes de permitir el envío.
	// - setFocus: mueve el foco del teclado automáticamente a un campo concreto.
	// - errors: objeto con los mensajes de error generados por Zod para cada campo.
	const {
		register,
		handleSubmit,
		setFocus,
		formState: { errors },
	} = useForm({
		// Conecta el esquema adminLoginSchema como única fuente de verdad de validación.
		resolver: zodResolver(adminLoginSchema),
		// Define los valores iniciales vacíos para evitar campos indefinidos.
		defaultValues: { usuario: "", password: "" },
	});

	// Se ejecuta únicamente cuando Zod valida que ambos campos tienen contenido.
	function onSubmit(datos) {
		// Limpia cualquier aviso de error previo antes de volver a comprobar.
		setErrorCredenciales("");
		// Comprueba las credenciales simuladas (datos.usuario ya llega limpio gracias a .trim() en Zod).
		if (datos.usuario === "admin" && datos.password === "admin") {
			// Avisa al componente padre (App.jsx) para activar el modo administrador.
			onLoginExito();
		} else {
			// Muestra el mensaje de acceso denegado en el banner inferior.
			setErrorCredenciales(
				"Credenciales incorrectas. Acceso solo para administrador."
			);
			// Devuelve el foco al campo "usuario" para facilitar el reintento con teclado.
			setFocus("usuario");
		}
	}

	// Se ejecuta si el usuario intenta enviar el formulario con errores de validación de Zod.
	function onInvalid(errores) {
		// Obtiene el nombre del primer campo que ha fallado.
		const primerCampo = Object.keys(errores)[0];
		// Si existe un campo erróneo, coloca el cursor directamente sobre él (accesibilidad).
		if (primerCampo) setFocus(primerCampo);
	}

	// Devuelve la estructura visual (JSX) de la tarjeta de inicio de sesión.
	return (
		<section className="card">
			{/* Cabecera de la tarjeta con el título principal del formulario. */}
			<div className="card-header">
				<h2>Acceso de administrador</h2>
			</div>

			{/* Texto descriptivo que explica qué acciones desbloquea este acceso simulado. */}
			<p
				className="subtitle"
				style={{ color: "var(--muted)", marginBottom: "18px" }}
			>
				Inicia sesión para añadir, editar, activar o eliminar marcas del
				catálogo.
			</p>

			{/* Intercepta el envío con handleSubmit y desactiva la validación nativa con noValidate para que mande Zod. */}
			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				{/* Rejilla adaptable que distribuye los dos campos del formulario. */}
				<div className="form-grid">
					{/* Bloque del campo Usuario. */}
					<div className="field">
						{/* Etiqueta semántica vinculada al input mediante htmlFor="admin-usuario". */}
						<label htmlFor="admin-usuario">Usuario</label>
						{/* Input de texto con autocompletado del navegador, atributos ARIA de error y registro en RHF. */}
						<input
							id="admin-usuario"
							type="text"
							autoComplete="username"
							placeholder="admin"
							aria-invalid={!!errors.usuario}
							aria-describedby={
								errors.usuario
									? "error-admin-usuario"
									: undefined
							}
							{...register("usuario")}
						/>
						{/* Si existe error en usuario, muestra el mensaje con role="alert" para lectores de pantalla. */}
						{errors.usuario && (
							<p
								id="error-admin-usuario"
								role="alert"
								className="field-error"
							>
								{errors.usuario.message}
							</p>
						)}
					</div>

					{/* Bloque del campo Contraseña. */}
					<div className="field">
						{/* Etiqueta semántica vinculada al input mediante htmlFor="admin-password". */}
						<label htmlFor="admin-password">Contraseña</label>
						{/* Input oculto (type="password") con autocompletado de contraseña actual y registro en RHF. */}
						<input
							id="admin-password"
							type="password"
							autoComplete="current-password"
							placeholder="•••••"
							aria-invalid={!!errors.password}
							aria-describedby={
								errors.password
									? "error-admin-password"
									: undefined
							}
							{...register("password")}
						/>
						{/* Si existe error en contraseña, lo anuncia de inmediato mediante role="alert". */}
						{errors.password && (
							<p
								id="error-admin-password"
								role="alert"
								className="field-error"
							>
								{errors.password.message}
							</p>
						)}
					</div>
				</div>

				{/* Contenedor de acciones con el botón submit siempre habilitado para permitir validar al pulsar. */}
				<div className="form-actions">
					<button type="submit" className="btn-primary">
						Entrar como administrador
					</button>
				</div>

				{/* Si las credenciales fallan, renderiza un banner rojo accesible con role="alert". */}
				{errorCredenciales && (
					<p role="alert" className="banner-error">
						{errorCredenciales}
					</p>
				)}
			</form>
		</section>
	);
}