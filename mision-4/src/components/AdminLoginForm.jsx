// Importa useState, useForm (React Hook Form), zodResolver (puente entre RHF y Zod)
// y adminLoginSchema (las reglas del login).
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "../esquemas/motorEsquemas.js";

// Recibe por props la función onLoginExito para avisar a App.jsx cuando entre el admin.
export default function AdminLoginForm({ onLoginExito }) {
	// Memoria para guardar el texto rojo si el usuario se equivoca de contraseña.
	const [errorCredenciales, setErrorCredenciales] = useState("");

	// Enciende React Hook Form conectado a adminLoginSchema:
	// - register: conecta cada <input> al formulario sin provocar repintados al teclear.
	// - handleSubmit: revisa las reglas de Zod antes de dejar enviar.
	// - setFocus: mueve el cursor automáticamente al campo que le digamos.
	// - errors: contiene los mensajes de error de cada campo que haya fallado.
	// - defaultValues: valores con los que arrancan vacías las cajas.
	const {
		register,
		handleSubmit,
		setFocus,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(adminLoginSchema),
		defaultValues: { usuario: "", password: "" },
	});

	// Solo se ejecuta si Zod confirma que no hay campos vacíos:
	// - Borra cualquier error previo.
	// - Comprueba si usuario (sin espacios) es "admin" Y password es "admin".
	// - Si acierta: llama a onLoginExito() para abrir el panel.
	// - Si falla: guarda el mensaje de error y devuelve el cursor al campo "usuario".
	function onSubmit(datos) {
		setErrorCredenciales("");
		if (datos.usuario.trim() === "admin" && datos.password === "admin") {
			onLoginExito();
		} else {
			setErrorCredenciales("Credenciales incorrectas. Acceso solo para administrador.");
			setFocus("usuario");
		}
	}

	// Se ejecuta si el usuario pulsa "Entrar" dejando campos vacíos.
	// Saca el nombre del primer campo con fallo (Object.keys(errores)[0]) y lleva
	// el cursor ahí con setFocus() (muy útil para quien navega solo con teclado).
	function onInvalid(errores) {
		const primerCampo = Object.keys(errores)[0];
		if (primerCampo) setFocus(primerCampo);
	}

	// Dibuja la tarjeta con título "Acceso de administrador" y texto explicativo.
	return (
		<section className="card">
			<div className="card-header">
				<h2>Acceso de administrador</h2>
			</div>
			<p className="subtitle" style={{ color: "var(--muted)", marginBottom: "18px" }}>
				Inicia sesión para añadir, editar, activar o eliminar marcas del catálogo.
			</p>

			{/* Al pulsar el botón o Enter, handleSubmit valida con Zod y llama a onSubmit (si ok) */}
			{/* o a onInvalid (si hay fallos). "noValidate" apaga los avisos feos del navegador */}
			{/* para que manden siempre nuestros mensajes de Zod. */}
			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				<div className="form-grid">
					{/* Campo "Usuario": */}
					{/* - <label htmlFor="admin-usuario"> se enlaza con id="admin-usuario". */}
					{/* - autoComplete="username" ayuda al navegador a sugerir usuarios. */}
					{/* - aria-invalid={!!errors.usuario} avisa a lectores de pantalla si está mal. */}
					{/* - aria-describedby conecta el input con el <p id="error-admin-usuario"> si hay fallo. */}
					{/* - {...register("usuario")} entrega el control del input a React Hook Form. */}
					{/* - {errors.usuario && <p role="alert">...}: si hay error, lo pinta y role="alert" */}
					{/* hace que un lector de pantalla lo lea inmediatamente. */}
					<div className="field">
						<label htmlFor="admin-usuario">Usuario</label>
						<input
							id="admin-usuario"
							type="text"
							autoComplete="username"
							placeholder="admin"
							aria-invalid={!!errors.usuario}
							aria-describedby={errors.usuario ? "error-admin-usuario" : undefined}
							{...register("usuario")}
						/>
						{errors.usuario && (
							<p id="error-admin-usuario" role="alert" className="field-error">
								{errors.usuario.message}
							</p>
						)}
					</div>

					{/* Campo "Contraseña": exactamente igual, pero con type="password" (oculta letras */}
					{/* con puntitos) y autoComplete="current-password". */}
					<div className="field">
						<label htmlFor="admin-password">Contraseña</label>
						<input
							id="admin-password"
							type="password"
							autoComplete="current-password"
							placeholder="•••••"
							aria-invalid={!!errors.password}
							aria-describedby={errors.password ? "error-admin-password" : undefined}
							{...register("password")}
						/>
						{errors.password && (
							<p id="error-admin-password" role="alert" className="field-error">
								{errors.password.message}
							</p>
						)}
					</div>
				</div>

				{/* Botón azul type="submit" que dispara el envío del formulario. */}
				<div className="form-actions">
					<button type="submit" className="btn-primary">
						Entrar como administrador
					</button>
				</div>

				{/* Si errorCredenciales tiene texto, muestra un cartel rojo con role="alert". */}
				{errorCredenciales && (
					<p role="alert" className="banner-error">
						{errorCredenciales}
					</p>
				)}
			</form>
		</section>
	);
}
