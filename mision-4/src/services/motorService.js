// Trae los 6 libros de reglas del API para comprobar lo que devuelve el servidor.
import {
	listaMarcasSchema,
	marcaApiSchema,
	listaCochesSchema,
	cocheApiSchema,
	listaPropietariosSchema,
	propietarioApiSchema,
} from "../esquemas/motorEsquemas.js";


// Lee la dirección del servidor escrita en tu archivo .env. Si no hubiera .env,
// usa "http://localhost:3001" como plan B.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// --- Función central para hablar con el servidor ---
// Crea una función lenta (async) que pide una ruta (ej. "/coches") con opciones extra.
async function peticion(endpoint, opciones = {}) {
	// Llama al servidor con fetch() esperando (await) su respuesta. Le avisa en
	// "headers" de que los datos viajan en formato JSON y añade las opciones (POST, DELETE, etc.).
	const respuesta = await fetch(`${API_URL}${endpoint}`, {
		headers: { "Content-Type": "application/json" },
		...opciones,
	});


	// fetch NO da error solo si el servidor responde 404 o 500; por eso comprobamos
	// "respuesta.ok". Si algo salió mal, lanzamos un Error a propósito para avisar a la app.
	if (!respuesta.ok) {
		throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
	}

	// Si el servidor responde "204 Sin Contenido" (común al borrar), devolvemos null sin leer JSON.
	if (respuesta.status === 204) return null;
	// Convierte el texto JSON que devolvió el servidor en objetos reales de JavaScript.
	return respuesta.json();
// Cierra peticion().
}

// --- Función de seguridad/calidad del BONUS (aduana de entrada) ---

// Recibe una regla de Zod, los datos llegados del servidor y el nombre de la ruta.
function validarRespuesta(esquema, datos, origen) {
	// Revisa los datos con Zod sin explotar el programa; devuelve { success, data, error }.
	const resultado = esquema.safeParse(datos);
	// Si la revisión ha fallado (hay algún dato corrupto):
	if (!resultado.success) {

		// Recorre cada fallo encontrado, anota exactamente qué campo falló (ej. [7.precio])
		// y junta todos los mensajes separados por " | ".
		const detalle = resultado.error.issues
			.map((item) => `[${item.path.join(".") || "raíz"}] ${item.message}`)
			.join(" | ");
		// Lanza un error claro con todo ese detalle para que se muestre en rojo en pantalla.
		throw new Error(`Dato corrupto detectado por Zod en ${origen}: ${detalle}`);
	// }
	}
	// Si todo estaba perfecto, entrega los datos limpios y validados.
	return resultado.data;
// Cierra validarRespuesta().
}

// --- Funciones concretas para cada operación CRUD ---

// Hace GET /marcas y valida la lista con listaMarcasSchema.
export async function obtenerMarcas() {
	const json = await peticion("/marcas");
	return validarRespuesta(listaMarcasSchema, json, "GET /marcas");
}

// Hace PATCH /marcas/:id enviando solo { activa } pasado a texto con JSON.stringify().
// Valida la marca devuelta con marcaApiSchema.
export async function cambiarEstadoMarca({ id, activa }) {
	const json = await peticion(`/marcas/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ activa }),
	});
	return validarRespuesta(marcaApiSchema, json, `PATCH /marcas/${id}`);
}





// Hace GET /coches.
// -> Si simularCorrupto es true, copia los coches reales (...json) y añade al final
// un coche falso roto (anio: 1810, combustible: "Nuclear", precio: "gratis").
// -> Pasa la lista a validarRespuesta(): si estaba activado el modo corrupto, Zod lo caza aquí.
export async function obtenerCoches(simularCorrupto = false) {
	const json = await peticion("/coches");


	const datosAValidar = simularCorrupto
		? [
				...json,
				{
					id: 999,
					marcaId: 1,
					modelo: "Modelo Corrupto",
					anio: 1810,
					combustible: "Nuclear",
					precio: "gratis",
				},
			]
		: json;

	return validarRespuesta(listaCochesSchema, datosAValidar, "GET /coches");
}

// Hace POST /coches para guardar un coche nuevo y valida la respuesta.
export async function crearCoche(nuevoCoche) {
	const json = await peticion("/coches", {
		method: "POST",
		body: JSON.stringify(nuevoCoche),
	});
	return validarRespuesta(cocheApiSchema, json, "POST /coches");
}

// Hace PUT /coches/:id enviando todos los datos del coche para reemplazarlo entero.
export async function reemplazarCoche({ id, datos }) {
	const json = await peticion(`/coches/${id}`, {
		method: "PUT",
		body: JSON.stringify({ id, ...datos }),
	});
	return validarRespuesta(cocheApiSchema, json, `PUT /coches/${id}`);
}

// Hace PATCH /coches/:id enviando solo el nuevo precio para una edición parcial.
export async function actualizarPrecioCoche({ id, precio }) {
	const json = await peticion(`/coches/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ precio }),
	});
	return validarRespuesta(cocheApiSchema, json, `PATCH /coches/${id}`);
}

// Hace DELETE /coches/:id para borrarlo de db.json y devuelve el id borrado.
export async function eliminarCoche(id) {
	await peticion(`/coches/${id}`, { method: "DELETE" });
	return id;
}




// Hace GET /propietarios y valida la lista con listaPropietariosSchema.
export async function obtenerPropietarios() {
	const json = await peticion("/propietarios");
	return validarRespuesta(listaPropietariosSchema, json, "GET /propietarios");
}

// Hace POST /propietarios para registrar uno nuevo.
export async function crearPropietario(nuevoPropietario) {
	const json = await peticion("/propietarios", {
		method: "POST",
		body: JSON.stringify(nuevoPropietario),
	});
	return validarRespuesta(propietarioApiSchema, json, "POST /propietarios");
}

// Hace PUT /propietarios/:id para sustituir todos sus datos.
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

// Hace DELETE /propietarios/:id para eliminarlo.
export async function eliminarPropietario(id) {
	await peticion(`/propietarios/${id}`, { method: "DELETE" });
	return id;
}

// Hace POST /marcas para añadir una marca nueva.
export async function crearMarca(nuevaMarca) {
	const json = await peticion("/marcas", {
		method: "POST",
		body: JSON.stringify(nuevaMarca),
	});
	return validarRespuesta(marcaApiSchema, json, "POST /marcas");
}

// Hace PUT /marcas/:id para editar una marca entera.
export async function reemplazarMarca({ id, datos }) {
	const json = await peticion(`/marcas/${id}`, {
		method: "PUT",
		body: JSON.stringify({ id, ...datos }),
	});
	return validarRespuesta(marcaApiSchema, json, `PUT /marcas/${id}`);
}

// Hace DELETE /marcas/:id para borrar una marca.
export async function eliminarMarca(id) {
	await peticion(`/marcas/${id}`, { method: "DELETE" });
	return id;
}
