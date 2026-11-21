import {
  listaMarcasSchema,
  marcaApiSchema,
  listaCochesSchema,
  cocheApiSchema,
  listaPropietariosSchema,
  propietarioApiSchema,
} from "./../esquemas/motorEsquemas.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function peticion(endpoint, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });

  // fetch no rechaza con 4xx/5xx: hay que comprobar respuesta.ok siempre
  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
  }

  if (respuesta.status === 204) return null;
  return respuesta.json();
}

// BONUS: valida la respuesta del API con safeParse para atrapar datos corruptos
function validarRespuesta(esquema, datos, origen) {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    // .issues (avisado al principio) extrae el detalle exacto de cada fallo
    const detalle = resultado.error.issues
      .map((item) => `[${item.path.join(".") || "raíz"}] ${item.message}`)
      .join(" | ");
    throw new Error(`Dato corrupto detectado por Zod en ${origen}: ${detalle}`);
  }
  return resultado.data;
}

/* ==================== MARCAS (GET + PATCH) ==================== */

export async function obtenerMarcas() {
  const json = await peticion("/marcas");
  return validarRespuesta(listaMarcasSchema, json, "GET /marcas");
}

export async function cambiarEstadoMarca({ id, activa }) {
  const json = await peticion(`/marcas/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ activa }),
  });
  return validarRespuesta(marcaApiSchema, json, `PATCH /marcas/${id}`);
}

/* ============ COCHES (GET + POST + PUT + PATCH + DELETE) ============ */

export async function obtenerCoches(simularCorrupto = false) {
  const json = await peticion("/coches");

  // Si se activa el modo demo del BONUS, inyectamos un objeto con datos rotos
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

export async function crearCoche(nuevoCoche) {
  const json = await peticion("/coches", {
    method: "POST",
    body: JSON.stringify(nuevoCoche),
  });
  return validarRespuesta(cocheApiSchema, json, "POST /coches");
}

export async function reemplazarCoche({ id, datos }) {
  const json = await peticion(`/coches/${id}`, {
    method: "PUT",
    body: JSON.stringify({ id, ...datos }),
  });
  return validarRespuesta(cocheApiSchema, json, `PUT /coches/${id}`);
}

export async function actualizarPrecioCoche({ id, precio }) {
  const json = await peticion(`/coches/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ precio }),
  });
  return validarRespuesta(cocheApiSchema, json, `PATCH /coches/${id}`);
}

export async function eliminarCoche(id) {
  await peticion(`/coches/${id}`, { method: "DELETE" });
  return id;
}

/* =========== PROPIETARIOS (GET + POST + PUT + DELETE) =========== */

export async function obtenerPropietarios() {
  const json = await peticion("/propietarios");
  return validarRespuesta(listaPropietariosSchema, json, "GET /propietarios");
}

export async function crearPropietario(nuevoPropietario) {
  const json = await peticion("/propietarios", {
    method: "POST",
    body: JSON.stringify(nuevoPropietario),
  });
  return validarRespuesta(propietarioApiSchema, json, "POST /propietarios");
}

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

export async function eliminarPropietario(id) {
  await peticion(`/propietarios/${id}`, { method: "DELETE" });
  return id;
}