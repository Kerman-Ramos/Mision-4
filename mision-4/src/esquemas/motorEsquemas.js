/* ============================================================================
      1. ARCHIVO: src/esquemas/motorEsquemas.js
      PROPÓSITO: Única fuente de verdad para validar tanto los formularios del
      cliente como las respuestas del API.
      ============================================================================ */

// Trae la herramienta "z" de la librería Zod, que sirve para crear reglas de validación.
import { z } from "zod";

// Mira el reloj del ordenador, saca el año actual (ej. 2026) y lo guarda en ANIO_ACTUAL.
const ANIO_ACTUAL = new Date().getFullYear();

// Crea y comparte la lista oficial con los 4 únicos combustibles permitidos.
export const COMBUSTIBLES = ["Híbrido", "Gasolina", "Diésel", "Eléctrico"];

// Crea una comprobación llamada esFechaISOValida que recibe un texto (ej. "2024-02-27").
// --- Función auxiliar 1: comprobar si una fecha tiene pinta de "AAAA-MM-DD" ---
function esFechaISOValida(texto) {

    // Parte el texto por los guiones: "2024-02-27" se convierte en ["2024", "02", "27"].
    const partes = texto.split("-");
    // Si no salieron exactamente 3 trozos (año, mes, día), dice "falso" (fecha mala).
    if (partes.length !== 3) return false;

    // Convierte los 3 trozos de texto a números y los guarda en anio, mes y dia.
    const [anio, mes, dia] = partes.map(Number);
    // Va a devolver verdadero (true) SOLO si se cumplen TODAS estas condiciones (&& = "y"):
    return (
        // El primer trozo (año) debe tener exactamente 4 cifras.
        partes[0].length === 4 &&
        // El segundo trozo (mes) debe tener 2 cifras.
        partes[1].length === 2 &&
        // El tercer trozo (día) debe tener 2 cifras.
        partes[2].length === 2 &&
        // El año debe ser un número de verdad (no texto raro convertido a NaN).
        !Number.isNaN(anio) &&
        // El mes debe ser un número de verdad.
        !Number.isNaN(mes) &&
        // El día debe ser un número de verdad.
        !Number.isNaN(dia) &&
        // El mes debe estar entre 1 (enero) y 12 (diciembre).
        mes >= 1 &&
        mes <= 12 &&
        // El día debe estar entre 1 y 31.
        dia >= 1 &&
        dia <= 31
    // Termina la comprobación y cierra la función.
    );
}

// --- Función auxiliar 2: comprobar que la fecha no está en el futuro ---
// Crea otra comprobación para asegurarse de que nadie ponga una compra de mañana.
function esFechaNoFutura(texto) {
    // Saca el año, mes y día como números.
    const [anio, mes, dia] = texto.split("-").map(Number);
    // Construye una fecha real de calendario (se resta 1 al mes porque en JS enero es el mes 0).
    const fechaCompra = new Date(anio, mes - 1, dia);
    // Devuelve verdadero si esa fecha es anterior o igual al momento actual.
    return fechaCompra <= new Date();
    // Cierra la función.
}

// --- BLOQUE 1: Reglas para los datos que llegan desde el servidor (db.json) ---
// Define cómo debe ser obligatoriamente una "marca" que llegue del servidor:
export const marcaApiSchema = z.object({
    // "id" debe ser un número entero (sin decimales) de 1 en adelante.
    id: z.number().int().min(1),
    // "nombre" debe ser texto con al menos 1 letra.
    nombre: z.string().min(1, "Nombre de marca vacío"),
    // "paisOrigen" debe ser texto no vacío.
    paisOrigen: z.string().min(1),
    // "anioFundacion" debe ser número entero >= 1880 y, con .refine(), no mayor al año actual.
    anioFundacion: z
        .number()
        .int()
        .min(1880)
        .refine((a) => a <= ANIO_ACTUAL, { error: "Año de fundación inválido" }),
    // "sede" debe ser texto no vacío.
    sede: z.string().min(1),
    // "activa" debe ser estrictamente true (sí) o false (no).
    activa: z.boolean(),
// Cierra la regla de una marca.
});

// Regla para una LISTA completa de marcas: todos sus elementos deben cumplir marcaApiSchema.
export const listaMarcasSchema = z.array(marcaApiSchema);


// Define cómo debe ser un "coche" que llegue del servidor:
export const cocheApiSchema = z.object({
    // Identificador entero >= 1.
    id: z.number().int().min(1),
    // Número que enlaza el coche con su marca.
    marcaId: z.number().int().min(1),
    // Nombre del modelo no vacío.
    modelo: z.string().min(1, "Modelo vacío en el API"),
    // Año entero entre 1900 y el año que viene como máximo.
    anio: z
        .number()
        .int()
        .min(1900, "Año por debajo de 1900")
        .refine((a) => a <= ANIO_ACTUAL + 1, { error: "Año fuera de rango" }),
    // Debe ser un texto que esté dentro de la lista COMBUSTIBLES.
    // Debe ser una de las 4 opciones válidas.
    combustible: z.string().refine((c) => COMBUSTIBLES.includes(c), {
        error: "Combustible no reconocido por el catálogo",
    }),
    // Debe ser un número (no texto como "gratis") mayor o igual a 1.
    precio: z.number().min(1, "El precio debe ser un número mayor que 0"),
// Cierra la regla de un coche.
});

// Regla para la lista entera de coches del servidor.
export const listaCochesSchema = z.array(cocheApiSchema);


// Define cómo debe ser un "propietario" que llegue del servidor:
export const propietarioApiSchema = z.object({
    // Entero >= 1.
    id: z.number().int().min(1),
    // Texto de mínimo 2 letras.
    nombre: z.string().min(2),
    // Formato válido de correo.
    email: z.email("Email corrupto en respuesta del API"),
    // Texto de mínimo 2 letras.
    ciudad: z.string().min(2),
    // ID numérico del coche que posee.
    cocheId: z.number().int().min(1),
    // Texto que pase nuestra función esFechaISOValida (AAAA-MM-DD).
    fechaCompra: z.string().refine(esFechaISOValida, {
        error: "Fecha con formato distinto a YYYY-MM-DD",
    }),
});
// Cierra la regla de propietario.

export const listaPropietariosSchema = z.array(propietarioApiSchema);
// Regla para la lista entera de propietarios.
// --- BLOQUE 2: Reglas para lo que escribe el usuario en los formularios ---
export const cocheFormSchema = z
    .object({
        // Reglas para el formulario de crear/editar coche:
        marcaId: z.coerce
            .number({ error: "Selecciona una marca del catálogo" })
            // Los campos HTML siempre dan texto ("1"). z.coerce.number() lo convierte
            // primero a número (1) y luego exige que sea entero >= 1.
            .int()
            .min(1, "Debes elegir una marca"),
        modelo: z
            .string()
            // Quita espacios sobrantes (.trim()) y exige que el modelo tenga entre 2 y 60 letras.
            .refine((v) => v.trim().length >= 2, {
                error: "El modelo debe tener al menos 2 caracteres",
            })
            .refine((v) => v.trim().length <= 60, {
                error: "El modelo no puede superar los 60 caracteres",
            }),
        anio: z.coerce
            .number({ error: "Introduce un año numérico" })
            // Convierte el año a número entero entre 1950 y el año siguiente al actual.
            .int("El año debe ser un número entero")
            .min(1950, "El año mínimo permitido es 1950")
            .refine((a) => a <= ANIO_ACTUAL + 1, {
                error: `El año no puede superar ${ANIO_ACTUAL + 1}`,
            }),
        combustible: z.string().refine((c) => COMBUSTIBLES.includes(c), {
            error: "Selecciona un tipo de combustible válido",
        }),
        precio: z.coerce
            .number({ error: "Introduce un precio numérico" })
            // Convierte el precio a número entre 1.000 € y 500.000 €.
            .min(1000, "El precio mínimo de catálogo es 1000 €")
            .refine((p) => p <= 500000, {
                error: "El precio máximo permitido es 500000 €",
            }),
        // Exige que la casilla de verificación esté marcada (tiene que valer exactamente true).
        confirmaVeracidad: z.literal(true, {
            error: "Debes confirmar que los datos técnicos son veraces",
        }),
    })

    // Regla que cruza DOS campos a la vez: prohíbe poner Eléctrico con año menor a 2012.
    // "path: ['anio']" indica que el mensaje rojo debe salir debajo del campo Año.
    .refine((datos) => !(datos.combustible === "Eléctrico" && datos.anio < 2012), {
        error: "Un vehículo eléctrico moderno debe ser de 2012 o posterior",
        path: ["anio"],
    })
    // Segunda regla cruzada: un coche de 2023 o más nuevo no puede costar menos de 10.000 €.
    // Muestra el error debajo del campo Precio.
    .refine((datos) => !(datos.anio >= 2023 && datos.precio < 10000), {
        error: "Un vehículo de 2023 o posterior no puede costar menos de 10000 €",
        path: ["precio"],
    });


export const propietarioFormSchema = z
    .object({
        // Reglas para el formulario de crear/editar propietario:
        // nombre: texto de mínimo 3 letras que ADEMÁS contenga un espacio (nombre y apellido).
        nombre: z
            .string()
            .refine((v) => v.trim().length >= 3, {
                error: "Introduce al menos 3 caracteres",
            })
            .refine((v) => v.trim().includes(" "), {
                error: "Introduce nombre y al menos un apellido",
            }),
        // Debe tener formato de correo (con @ y dominio).
        email: z.email("Email no válido (ejemplo: nombre@dominio.com)"),
        // ciudad: texto de mínimo 2 letras sin contar espacios.
        ciudad: z.string().refine((v) => v.trim().length >= 2, {
            error: "La ciudad debe tener al menos 2 caracteres",
        }),
        // cocheId: convierte el valor del desplegable a número entero >= 1.
        cocheId: z.coerce
            .number({ error: "Selecciona un vehículo" })
            .int()
            .min(1, "Debes asignar un vehículo del inventario"),
        // fechaCompra: debe pasar esFechaISOValida.
        fechaCompra: z.string().refine(esFechaISOValida, {
            error: "Selecciona una fecha de compra válida",
        }),
    })

    .refine((datos) => esFechaNoFutura(datos.fechaCompra), {
        error: "La fecha de compra no puede ser posterior a hoy",
        // Prohíbe poner una fecha futura y pinta el error debajo del campo fechaCompra.
        path: ["fechaCompra"],
    });

// Reglas del login de administrador: exige que ni el usuario ni la contraseña estén vacíos.
export const adminLoginSchema = z.object({
    usuario: z.string().refine((v) => v.trim().length >= 1, {
        error: "Introduce el nombre de usuario",
    }),
    password: z.string().refine((v) => v.length >= 1, {
        error: "Introduce la contraseña",
    }),
});

// Reglas del formulario de marcas: nombre, país y sede de mínimo 2 letras;
// anioFundacion convertido a número entre 1880 y el año actual; activa sí/no.
export const marcaFormSchema = z.object({
    nombre: z.string().refine((v) => v.trim().length >= 2, {
        error: "El nombre de la marca debe tener al menos 2 caracteres",
    }),
    paisOrigen: z.string().refine((v) => v.trim().length >= 2, {
        error: "Introduce el país de origen",
    }),
    anioFundacion: z.coerce
        .number({ error: "Introduce un año numérico" })
        .int("El año debe ser un número entero")
        .min(1880, "El año mínimo permitido es 1880")
        .refine((a) => a <= ANIO_ACTUAL, {
            error: `El año no puede ser superior a ${ANIO_ACTUAL}`,
        }),
    sede: z.string().refine((v) => v.trim().length >= 2, {
        error: "Introduce la ciudad de la sede central",
    }),
    activa: z.boolean(),
});
