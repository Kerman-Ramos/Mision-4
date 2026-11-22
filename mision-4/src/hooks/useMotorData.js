/* ============================================================================
   3. ARCHIVO: src/hooks/useMotorData.js
   PROPÓSITO: Hooks personalizados de TanStack Query v5 que encapsulan la
   lectura con caché (useQuery) y la escritura con invalidación (useMutation).
   ============================================================================ */

// Importa los 3 hooks principales de TanStack Query v5 para leer, mutar e invalidar caché.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Importa todas las funciones HTTP de la capa de servicios.
import {
	obtenerMarcas,
	crearMarca,
	reemplazarMarca,
	cambiarEstadoMarca,
	eliminarMarca,
	obtenerCoches,
	probarDatoCorrupto,
	crearCoche,
	reemplazarCoche,
	actualizarPrecioCoche,
	eliminarCoche,
	obtenerPropietarios,
	crearPropietario,
	reemplazarPropietario,
	eliminarPropietario,
} from "../services/motorService.js";

// --- QUERIES (lectura de datos con caché compartida) ---

// Lee /marcas bajo la clave ["marcas"] y mantiene los datos frescos durante 60 segundos.
export function useMarcas() {
	return useQuery({
		queryKey: ["marcas"],
		queryFn: obtenerMarcas,
		staleTime: 60000,
	});
}

// Lee los vehículos reales bajo la clave única ["coches"], compartida entre todas las pestañas.
export function useCoches() {
	return useQuery({
		queryKey: ["coches"],
		queryFn: obtenerCoches,
		staleTime: 30000,
	});
}

// Query aislada para el interruptor demo del BONUS:
// - queryKey independiente ["demo-corrupto"] para no contaminar la caché real de coches.
// - enabled: activo hace que solo se dispare cuando el usuario marca la casilla.
// - retry: false evita reintentos automáticos y muestra el error de Zod al instante.
export function useDemoDatoCorrupto(activo) {
	return useQuery({
		queryKey: ["demo-corrupto"],
		queryFn: probarDatoCorrupto,
		enabled: activo,
		retry: false,
	});
}

// Lee /propietarios bajo la clave ["propietarios"] con 30 segundos de frescura.
export function usePropietarios() {
	return useQuery({
		queryKey: ["propietarios"],
		queryFn: obtenerPropietarios,
		staleTime: 30000,
	});
}

// --- MUTATIONS (escritura en servidor e invalidación de caché) ---

// PATCH de marca: al completarse, invalida ["marcas"] para refrescar chips y formularios.
export function useCambiarEstadoMarca() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cambiarEstadoMarca,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
		},
	});
}

// POST de marca: invalida ["marcas"] y ejecuta el callback onExito del formulario.
export function useCrearMarca(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: crearMarca,
		onSuccess: (creada) => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
			if (onExito) onExito(creada);
		},
	});
}

// PUT de marca: invalida ["marcas"] y notifica al formulario mediante onExito.
export function useReemplazarMarca(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reemplazarMarca,
		onSuccess: (editada) => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
			if (onExito) onExito(editada);
		},
	});
}

// DELETE de marca: invalida las 3 colecciones (marcas -> coches -> propietarios)
// para garantizar coherencia relacional en toda la interfaz.
export function useEliminarMarca(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: eliminarMarca,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
			queryClient.invalidateQueries({ queryKey: ["coches"] });
			queryClient.invalidateQueries({ queryKey: ["propietarios"] });
			if (onExito) onExito();
		},
	});
}

// POST de coche: invalida ["coches"] para mostrar el alta en el listado y resetea el formulario.
export function useCrearCoche(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: crearCoche,
		onSuccess: (cocheCreado) => {
			queryClient.invalidateQueries({ queryKey: ["coches"] });
			if (onExito) onExito(cocheCreado);
		},
	});
}

// PUT de coche: invalida ["coches"] y avisa al formulario tras guardar el reemplazo completo.
export function useReemplazarCoche(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reemplazarCoche,
		onSuccess: (cocheEditado) => {
			queryClient.invalidateQueries({ queryKey: ["coches"] });
			if (onExito) onExito(cocheEditado);
		},
	});
}

// PATCH de precio de coche: invalida ["coches"] y actualiza el mensaje de feedback.
export function useActualizarPrecioCoche(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: actualizarPrecioCoche,
		onSuccess: (cocheEditado) => {
			queryClient.invalidateQueries({ queryKey: ["coches"] });
			if (onExito) onExito(cocheEditado);
		},
	});
}

// DELETE de coche: invalida ["coches"] y ["propietarios"] para actualizar referencias de vehículos borrados.
export function useEliminarCoche(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: eliminarCoche,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["coches"] });
			queryClient.invalidateQueries({ queryKey: ["propietarios"] });
			if (onExito) onExito();
		},
	});
}

// POST de propietario: invalida ["propietarios"] y ejecuta onExito.
export function useCrearPropietario(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: crearPropietario,
		onSuccess: (creado) => {
			queryClient.invalidateQueries({ queryKey: ["propietarios"] });
			if (onExito) onExito(creado);
		},
	});
}

// PUT de propietario: invalida ["propietarios"] y ejecuta onExito.
export function useReemplazarPropietario(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reemplazarPropietario,
		onSuccess: (editado) => {
			queryClient.invalidateQueries({ queryKey: ["propietarios"] });
			if (onExito) onExito(editado);
		},
	});
}

// DELETE de propietario: invalida ["propietarios"] y ejecuta onExito.
export function useEliminarPropietario(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: eliminarPropietario,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["propietarios"] });
			if (onExito) onExito();
		},
	});
}