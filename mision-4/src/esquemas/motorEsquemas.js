/* ============================================================================
   1. ARCHIVO: src/esquemas/motorEsquemas.js
   PROPÓSITO: Única fuente de verdad para validar y normalizar tanto los
   formularios del cliente como las respuestas recibidas desde el API.
   ============================================================================ */

// Importa el objeto principal "z" de Zod para construir todos los esquemas de validación.
import { z } from "zod";

// Obtiene el año actual del sistema (por ejemplo, 2026) para fijar límites dinámicos.
const ANIO_ACTUAL = new Date().getFullYear();

// Lista oficial con los 4 únicos tipos de combustible admitidos en toda la aplicación.
export const COMBUSTIBLES = ["Híbrido", "Gasolina", "Diésel", "Eléctrico"];

// --- Función auxiliar: comprobar que una fecha válida no esté en el futuro ---
// Recibe un texto con formato garantizado "AAAA-MM-DD" (ya validado por z.iso.date()).
function esFechaNoFutura(texto) {
	// Separa año, mes y día por los guiones y convierte cada parte a número.
	const [anio, mes, dia] = texto.split("-").map(Number);
	// Construye la fecha local (se resta 1 al mes porque en JavaScript enero es 0).
	const fechaCompra = new Date(anio, mes - 1, dia);
	// Devuelve true solo si la fecha de compra es anterior o igual al momento actual.
	return fechaCompra <= new Date();
}

// --- BLOQUE 1: Esquemas de respuesta del API (contrato con db.json) ---

// Define la estructura exacta que debe cumplir cada marca devuelta por json-server.
export const marcaApiSchema = z.object({
	// Identificador numérico entero mayor o igual que 1.
	id: z.number().int().min(1),
	// Nombre de la marca como cadena de texto no vacía.
	nombre: z.string().min(1, "Nombre de marca vacío"),
	// País de origen como cadena de texto no vacía.
	paisOrigen: z.string().min(1),
	// Año entero entre 1880 y el año actual como máximo.
	anioFundacion: z
		.number()
		.int()
		.min(1880)
		.refine((a) => a <= ANIO_ACTUAL, { error: "Año de fundación inválido" }),
	// Ciudad de la sede central como texto no vacío.
	sede: z.string().min(1),
	// Estado booleano estricto (true o false) que indica si la marca está activa.
	activa: z.boolean(),
});

// Valida un array completo de marcas aplicando marcaApiSchema a cada elemento.
export const listaMarcasSchema = z.array(marcaApiSchema);

// Define la estructura exacta que debe cumplir cada vehículo devuelto por el API.
export const cocheApiSchema = z.object({
	// Identificador entero >= 1.
	id: z.number().int().min(1),
	// Clave foránea entera que vincula el vehículo con su marca.
	marcaId: z.number().int().min(1),
	// Nombre del modelo no vacío.
	modelo: z.string().min(1, "Modelo vacío en el API"),
	// Año entero entre 1900 y el año siguiente al actual.
	anio: z
		.number()
		.int()
		.min(1900, "Año por debajo de 1900")
		.refine((a) => a <= ANIO_ACTUAL + 1, { error: "Año fuera de rango" }),
	// Exige que el combustible coincida con alguno de los valores de COMBUSTIBLES.
	combustible: z.string().refine((c) => COMBUSTIBLES.includes(c), {
		error: "Combustible no reconocido por el catálogo",
	}),
	// Exige un número real (rechaza strings como "gratis") mayor o igual que 1.
	precio: z.number().min(1, "El precio debe ser un número mayor que 0"),
});

// Valida la lista completa de vehículos recibida del servidor.
export const listaCochesSchema = z.array(cocheApiSchema);

// Define la estructura exacta que debe cumplir cada propietario devuelto por el API.
export const propietarioApiSchema = z.object({
	// Identificador entero >= 1.
	id: z.number().int().min(1),
	// Nombre completo de al menos 2 caracteres.
	nombre: z.string().min(2),
	// Validador nativo de Zod 4 para formato de correo electrónico.
	email: z.email("Email corrupto en respuesta del API"),
	// Ciudad de al menos 2 caracteres.
	ciudad: z.string().min(2),
	// Clave foránea entera que vincula al propietario con su vehículo.
	cocheId: z.number().int().min(1),
	// Validador nativo de Zod 4: exige formato YYYY-MM-DD y comprueba calendario real (ej. rechaza 31 de febrero).
	fechaCompra: z.iso.date("Fecha con formato o calendario inválido (YYYY-MM-DD)"),
});

// Valida la lista completa de propietarios recibida del servidor.
export const listaPropietariosSchema = z.array(propietarioApiSchema);

// --- BLOQUE 2: Esquemas de formulario (conectados a React Hook Form vía zodResolver) ---

// Reglas para crear (POST) o editar (PUT) un vehículo desde CocheForm.
export const cocheFormSchema = z
	.object({
		// Convierte el texto del <select> HTML a número y exige un ID de marca válido.
		marcaId: z.coerce
			.number({ error: "Selecciona una marca del catálogo" })
			.int()
			.min(1, "Debes elegir una marca"),
		// Elimina espacios iniciales/finales (.trim()) y exige entre 2 y 60 caracteres.
		modelo: z
			.string()
			.trim()
			.min(2, "El modelo debe tener al menos 2 caracteres")
			.max(60, "El modelo no puede superar los 60 caracteres"),
		// Convierte el valor del input numérico a entero entre 1950 y el año siguiente.
		anio: z.coerce
			.number({ error: "Introduce un año numérico" })
			.int("El año debe ser un número entero")
			.min(1950, "El año mínimo permitido es 1950")
			.refine((a) => a <= ANIO_ACTUAL + 1, {
				error: `El año no puede superar ${ANIO_ACTUAL + 1}`,
			}),
		// Exige que la opción seleccionada pertenezca al catálogo COMBUSTIBLES.
		combustible: z.string().refine((c) => COMBUSTIBLES.includes(c), {
			error: "Selecciona un tipo de combustible válido",
		}),
		// Convierte el texto a número y valida el rango permitido (1.000 € a 500.000 €).
		precio: z.coerce
			.number({ error: "Introduce un precio numérico" })
			.min(1000, "El precio mínimo de catálogo es 1000 €")
			.refine((p) => p <= 500000, {
				error: "El precio máximo permitido es 500000 €",
			}),
		// Exige que la casilla de confirmación valga exactamente true.
		confirmaVeracidad: z.literal(true, {
			error: "Debes confirmar que los datos técnicos son veraces",
		}),
	})
	// Regla cruzada 1: impide registrar un eléctrico con año anterior a 2012 y asocia el error al campo "anio".
	.refine((datos) => !(datos.combustible === "Eléctrico" && datos.anio < 2012), {
		error: "Un vehículo eléctrico moderno debe ser de 2012 o posterior",
		path: ["anio"],
	})
	// Regla cruzada 2: impide precios menores de 10.000 € en coches de 2023 o posteriores y marca el campo "precio".
	.refine((datos) => !(datos.anio >= 2023 && datos.precio < 10000), {
		error: "Un vehículo de 2023 o posterior no puede costar menos de 10000 €",
		path: ["precio"],
	});

// Reglas para crear (POST) o editar (PUT) un propietario desde PropietarioForm.
export const propietarioFormSchema = z
	.object({
		// Limpia espacios sobrantes, exige mínimo 3 caracteres y al menos un espacio intermedio (nombre y apellido).
		nombre: z
			.string()
			.trim()
			.min(3, "Introduce al menos 3 caracteres")
			.refine((v) => v.includes(" "), {
				error: "Introduce nombre y al menos un apellido",
			}),
		// Valida que el correo cumpla la sintaxis estándar de email.
		email: z.email("Email no válido (ejemplo: nombre@dominio.com)"),
		// Limpia espacios y exige mínimo 2 caracteres para la ciudad.
		ciudad: z.string().trim().min(2, "La ciudad debe tener al menos 2 caracteres"),
		// Convierte el valor del desplegable de vehículos a número entero >= 1.
		cocheId: z.coerce
			.number({ error: "Selecciona un vehículo" })
			.int()
			.min(1, "Debes asignar un vehículo del inventario"),
		// Exige una fecha real de calendario con formato YYYY-MM-DD.
		fechaCompra: z.iso.date("Selecciona una fecha de compra válida (YYYY-MM-DD)"),
	})
	// Regla temporal: solo se ejecuta si la fecha es válida y rechaza fechas posteriores a hoy.
	.refine((datos) => esFechaNoFutura(datos.fechaCompra), {
		error: "La fecha de compra no puede ser posterior a hoy",
		path: ["fechaCompra"],
	});

// Reglas para el formulario simulado de inicio de sesión de administrador.
export const adminLoginSchema = z.object({
	// Limpia espacios en el nombre de usuario y exige que no esté vacío.
	usuario: z.string().trim().min(1, "Introduce el nombre de usuario"),
	// Exige contraseña no vacía sin aplicar .trim() para respetar posibles espacios reales.
	password: z.string().min(1, "Introduce la contraseña"),
});

// Reglas para crear (POST) o editar (PUT) una marca desde MarcaForm.
export const marcaFormSchema = z.object({
	// Limpia espacios y exige al menos 2 caracteres para el nombre de la marca.
	nombre: z
		.string()
		.trim()
		.min(2, "El nombre de la marca debe tener al menos 2 caracteres"),
	// Limpia espacios y exige al menos 2 caracteres para el país de origen.
	paisOrigen: z.string().trim().min(2, "Introduce el país de origen"),
	// Convierte el año a entero entre 1880 y el año actual.
	anioFundacion: z.coerce
		.number({ error: "Introduce un año numérico" })
		.int("El año debe ser un número entero")
		.min(1880, "El año mínimo permitido es 1880")
		.refine((a) => a <= ANIO_ACTUAL, {
			error: `El año no puede ser superior a ${ANIO_ACTUAL}`,
		}),
	// Limpia espacios y exige al menos 2 caracteres para la sede central.
	sede: z.string().trim().min(2, "Introduce la ciudad de la sede central"),
	// Valor booleano que controla el checkbox de marca activa.
	activa: z.boolean(),
});