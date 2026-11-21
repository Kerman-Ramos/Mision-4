import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "../esquemas/motorEsquemas.js";

export default function AdminLoginForm({ onLoginExito }) {
	const [errorCredenciales, setErrorCredenciales] = useState("");

	const {
		register,
		handleSubmit,
		setFocus,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(adminLoginSchema),
		defaultValues: { usuario: "", password: "" },
	});

	function onSubmit(datos) {
		setErrorCredenciales("");
		if (datos.usuario.trim() === "admin" && datos.password === "admin") {
			onLoginExito();
		} else {
			setErrorCredenciales("Credenciales incorrectas. Acceso solo para administrador.");
			setFocus("usuario");
		}
	}

	function onInvalid(errores) {
		const primerCampo = Object.keys(errores)[0];
		if (primerCampo) setFocus(primerCampo);
	}

	return (
		<section className="card">
			<div className="card-header">
				<h2>Acceso de administrador</h2>
			</div>
			<p className="subtitle" style={{ color: "var(--muted)", marginBottom: "18px" }}>
				Inicia sesión para añadir, editar, activar o eliminar marcas del catálogo.
			</p>

			<form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
				<div className="form-grid">
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

				<div className="form-actions">
					<button type="submit" className="btn-primary">
						Entrar como administrador
					</button>
				</div>

				{errorCredenciales && (
					<p role="alert" className="banner-error">
						{errorCredenciales}
					</p>
				)}
			</form>
		</section>
	);
}