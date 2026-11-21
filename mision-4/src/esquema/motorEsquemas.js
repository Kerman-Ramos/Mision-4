import { z } from "zod";

const ANIO_ACTUAL = new Date().getFullYear();

export const COMBUSTIBLES = ["Híbrido", "Gasolina", "Diésel", "Eléctrico"];

// Funciones puras de validación (Temas 1 y 2: split, map, Number.isNaN, new Date)
function esFechaISOValida(texto) {
  const partes = texto.split("-");
  if (partes.length !== 3) return false;

  const [anio, mes, dia] = partes.map(Number);
  return (
    partes[0].length === 4 &&
    partes[1].length === 2 &&
    partes[2].length === 2 &&
    !Number.isNaN(anio) &&
    !Number.isNaN(mes) &&
    !Number.isNaN(dia) &&
    mes >= 1 &&
    mes <= 12 &&
    dia >= 1 &&
    dia <= 31
  );
}

function esFechaNoFutura(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  const fechaCompra = new Date(anio, mes - 1, dia);
  return fechaCompra <= new Date();
}

/* ============================================================================
   1. ESQUEMAS DE RESPUESTA DEL API (para validar con safeParse en servicios)
   ============================================================================ */

export const marcaApiSchema = z.object({
  id: z.number().int().min(1),
  nombre: z.string().min(1, "Nombre de marca vacío"),
  paisOrigen: z.string().min(1),
  anioFundacion: z
    .number()
    .int()
    .min(1880)
    .refine((a) => a <= ANIO_ACTUAL, { error: "Año de fundación inválido" }),
  sede: z.string().min(1),
  activa: z.boolean(), // Único método externo de Zod (campo booleano en db.json)
});

export const listaMarcasSchema = z.array(marcaApiSchema);

export const cocheApiSchema = z.object({
  id: z.number().int().min(1),
  marcaId: z.number().int().min(1),
  modelo: z.string().min(1, "Modelo vacío en el API"),
  anio: z
    .number()
    .int()
    .min(1900, "Año por debajo de 1900")
    .refine((a) => a <= ANIO_ACTUAL + 1, { error: "Año fuera de rango" }),
  combustible: z.string().refine((c) => COMBUSTIBLES.includes(c), {
    error: "Combustible no reconocido por el catálogo",
  }),
  precio: z.number().min(1, "El precio debe ser un número mayor que 0"),
});

export const listaCochesSchema = z.array(cocheApiSchema);

export const propietarioApiSchema = z.object({
  id: z.number().int().min(1),
  nombre: z.string().min(2),
  email: z.email("Email corrupto en respuesta del API"),
  ciudad: z.string().min(2),
  cocheId: z.number().int().min(1),
  fechaCompra: z.string().refine(esFechaISOValida, {
    error: "Fecha con formato distinto a YYYY-MM-DD",
  }),
});

export const listaPropietariosSchema = z.array(propietarioApiSchema);

/* ============================================================================
   2. ESQUEMAS DE FORMULARIO (conectados a React Hook Form con zodResolver)
   ============================================================================ */

export const cocheFormSchema = z
  .object({
    marcaId: z.coerce
      .number({ error: "Selecciona una marca del catálogo" })
      .int()
      .min(1, "Debes elegir una marca"),
    modelo: z
      .string()
      .refine((v) => v.trim().length >= 2, {
        error: "El modelo debe tener al menos 2 caracteres",
      })
      .refine((v) => v.trim().length <= 60, {
        error: "El modelo no puede superar los 60 caracteres",
      }),
    anio: z.coerce
      .number({ error: "Introduce un año numérico" })
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
      .min(1000, "El precio mínimo de catálogo es 1000 €")
      .refine((p) => p <= 500000, {
        error: "El precio máximo permitido es 500000 €",
      }),
    confirmaVeracidad: z.literal(true, {
      error: "Debes confirmar que los datos técnicos son veraces",
    }),
  })
  // Validación cruzada 1: coherencia entre combustible y año
  .refine((datos) => !(datos.combustible === "Eléctrico" && datos.anio < 2012), {
    error: "Un vehículo eléctrico moderno debe ser de 2012 o posterior",
    path: ["anio"],
  })
  // Validación cruzada 2: coherencia entre año reciente y precio
  .refine((datos) => !(datos.anio >= 2023 && datos.precio < 10000), {
    error: "Un vehículo de 2023 o posterior no puede costar menos de 10000 €",
    path: ["precio"],
  });

export const propietarioFormSchema = z
  .object({
    nombre: z
      .string()
      .refine((v) => v.trim().length >= 3, {
        error: "Introduce al menos 3 caracteres",
      })
      .refine((v) => v.trim().includes(" "), {
        error: "Introduce nombre y al menos un apellido",
      }),
    email: z.email("Email no válido (ejemplo: nombre@dominio.com)"),
    ciudad: z.string().refine((v) => v.trim().length >= 2, {
      error: "La ciudad debe tener al menos 2 caracteres",
    }),
    cocheId: z.coerce
      .number({ error: "Selecciona un vehículo" })
      .int()
      .min(1, "Debes asignar un vehículo del inventario"),
    fechaCompra: z.string().refine(esFechaISOValida, {
      error: "Selecciona una fecha de compra válida",
    }),
  })
  // Validación cruzada temporal: fecha no posterior a hoy
  .refine((datos) => esFechaNoFutura(datos.fechaCompra), {
    error: "La fecha de compra no puede ser posterior a hoy",
    path: ["fechaCompra"],
  });