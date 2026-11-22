/* ============================================================================
   2. ARCHIVO: src/services/motorService.js
   PROPÓSITO: Capa de servicios HTTP que centraliza todas las peticiones fetch
   y valida las respuestas del servidor mediante Zod (safeParse).
   ============================================================================ */

// Importa los 6 esquemas de contrato del API para validar lo que devuelve json-server.
import {
	listaMarcasSchema,
	marcaApiSchema,
	listaCochesSchema,
	cocheApiSchema,
	listaPropietariosSchema,
	propietarioApiSchema,
} from "../esquemas/motorEsquemas.js";

// Lee la URL base del servidor desde el archivo .env (o usa localhost:3001 por defecto).
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// --- Función central de transporte HTTP ---

// Envoltorio asíncrono sobre fetch() que añade cabeceras JSON y controla errores HTTP.
async function peticion(endpoint, opciones = {}) {
	// Ejecuta la llamada HTTP combinando la URL base, la ruta solicitada y las opciones (método y cuerpo).
	const respuesta = await fetch(`${API_URL}${endpoint}`, {
		headers: { "Content-Type": "application/json" },
		...opciones,
	});

	// fetch() no rechaza la promesa en códigos 4xx/5xx; por eso se verifica respuesta.ok manualmente.
	if (!respuesta.ok) {
		throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
	}

	// Si el servidor responde 204 (sin contenido, típico en DELETE), devuelve null sin parsear JSON.
	if (respuesta.status === 204) return null;
	// Deserializa el cuerpo JSON recibido en objetos o arrays de JavaScript.
	return respuesta.json();
}

// --- Aduana de validación con Zod (BONUS) ---

// Valida cualquier dato entrante del servidor con safeParse() antes de pasarlo a React.
function validarRespuesta(esquema, datos, origen) {
	// Ejecuta la validación sin lanzar una excepción automática; devuelve { success, data, error }.
	const resultado = esquema.safeParse(datos);
	// Si algún campo incumple el contrato del esquema, construye un mensaje detallado.
	if (!resultado.success) {
		// Extrae la ruta exacta y el mensaje de cada fallo detectado por Zod (ej. [7.precio] ...).
		const detalle = resultado.error.issues
			.map((item) => `[${item.path.join(".") || "raíz"}] ${item.message}`)
			.join(" | ");
		// Lanza un Error legible que TanStack Query captura y expone en el estado isError.
		throw new Error(`Dato corrupto detectado por Zod en ${origen}: ${detalle}`);
	}
	// Si la validación pasa, devuelve los datos limpios y conformes al esquema.
	return resultado.data;
}

// --- Operaciones CRUD sobre /marcas ---

// GET /marcas: obtiene el catálogo completo de marcas y lo valida contra listaMarcasSchema.
export async function obtenerMarcas() {
	const json = await peticion("/marcas");
	return validarRespuesta(listaMarcasSchema, json, "GET /marcas");
}

// POST /marcas: crea una nueva marca en db.json y valida el objeto devuelto.
export async function crearMarca(nuevaMarca) {
	const json = await peticion("/marcas", {
		method: "POST",
		body: JSON.stringify(nuevaMarca),
	});
	return validarRespuesta(marcaApiSchema, json, "POST /marcas");
}

// PUT /marcas/:id: reemplaza todos los campos de una marca existente.
export async function reemplazarMarca({ id, datos }) {
	const json = await peticion(`/marcas/${id}`, {
		method: "PUT",
		body: JSON.stringify({ id, ...datos }),
	});
	return validarRespuesta(marcaApiSchema, json, `PUT /marcas/${id}`);
}

// PATCH /marcas/:id: actualiza únicamente la propiedad booleana "activa" de una marca.
export async function cambiarEstadoMarca({ id, activa }) {
	const json = await peticion(`/marcas/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ activa }),
	});
	return validarRespuesta(marcaApiSchema, json, `PATCH /marcas/${id}`);
}

// DELETE /marcas/:id: elimina la marca en el servidor y devuelve su identificador.
export async function eliminarMarca(id) {
	await peticion(`/marcas/${id}`, { method: "DELETE" });
	return id;
}

// --- Operaciones CRUD sobre /coches ---

// GET /coches: obtiene exclusivamente los vehículos reales del servidor y los valida.
export async function obtenerCoches() {
	const json = await peticion("/coches");
	return validarRespuesta(listaCochesSchema, json, "GET /coches");
}

// Función aislada de demostración (BONUS): pide /coches, añade un registro corrupto en memoria
// y lo pasa por validarRespuesta() para demostrar que safeParse() bloquea datos rotos.
export async function probarDatoCorrupto() {
	const json = await peticion("/coches");
	const datosCorruptos = [
		...json,
		{
			id: 999,
			marcaId: 1,
			modelo: "Modelo Corrupto",
			anio: 1810,
			combustible: "Nuclear",
			precio: "gratis",
		},
	];
	return validarRespuesta(
		listaCochesSchema,
		datosCorruptos,
		"GET /coches (demo)"
	);
}

// POST /coches: guarda un nuevo vehículo y valida la respuesta devuelta por el API.
export async function crearCoche(nuevoCoche) {
	const json = await peticion("/coches", {
		method: "POST",
		body: JSON.stringify(nuevoCoche),
	});
	return validarRespuesta(cocheApiSchema, json, "POST /coches");
}

// PUT /coches/:id: sustituye el registro completo de un vehículo existente.
export async function reemplazarCoche({ id, datos }) {
	const json = await peticion(`/coches/${id}`, {
		method: "PUT",
		body: JSON.stringify({ id, ...datos }),
	});
	return validarRespuesta(cocheApiSchema, json, `PUT /coches/${id}`);
}

// PATCH /coches/:id: modifica parcialmente solo el campo "precio" del vehículo.
export async function actualizarPrecioCoche({ id, precio }) {
	const json = await peticion(`/coches/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ precio }),
	});
	return validarRespuesta(cocheApiSchema, json, `PATCH /coches/${id}`);
}

// DELETE /coches/:id: borra el vehículo en db.json y devuelve su ID.
export async function eliminarCoche(id) {
	await peticion(`/coches/${id}`, { method: "DELETE" });
	return id;
}

// --- Operaciones CRUD sobre /propietarios ---

// GET /propietarios: recupera el listado completo de propietarios y lo valida con Zod.
export async function obtenerPropietarios() {
	const json = await peticion("/propietarios");
	return validarRespuesta(listaPropietariosSchema, json, "GET /propietarios");
}

// POST /propietarios: registra un nuevo propietario vinculado a un coche.
export async function crearPropietario(nuevoPropietario) {
	const json = await peticion("/propietarios", {
		method: "POST",
		body: JSON.stringify(nuevoPropietario),
	});
	return validarRespuesta(propietarioApiSchema, json, "POST /propietarios");
}

// PUT /propietarios/:id: reemplaza todos los datos de un propietario existente.
export async function reemplazarPropietario({ id, datos }) {
	const json = await peticion(`/propietarios/${id}`, {
		method: "PUT",
		body: JSON.stringify({ id, ...datos }),
	});
	return validarRespuesta(
		propietarioApiSchema,
		json,
		`PUT /propietarios/${id}`
	);
}

// DELETE /propietarios/:id: elimina un propietario en db.json y devuelve su ID.
export async function eliminarPropietario(id) {
	await peticion(`/propietarios/${id}`, { method: "DELETE" });
	return id;
}