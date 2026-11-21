/* ============================================================================
	  3. ARCHIVO: src/hooks/useMotorData.js
	  PROPÓSITO: Hooks personalizados que encapsulan TanStack Query v5 (caché,
	  dedupe, estados e invalidación) para mantener los componentes limpios.
	  ============================================================================ */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	obtenerMarcas,
	cambiarEstadoMarca,
	obtenerCoches,
	crearCoche,
	reemplazarCoche,
	actualizarPrecioCoche,
	eliminarCoche,
	obtenerPropietarios,
	crearPropietario,
	reemplazarPropietario,
	eliminarPropietario,
	crearMarca,
	reemplazarMarca,
	eliminarMarca,
} from "../services/motorService.js";

/* ==================== QUERIES (GET) ==================== */

// Queries (GET) indexadas por queryKey. Al cambiar un parámetro de la key (ej. simularCorrupto), Query lanza una nueva petición automáticamente.
export function useMarcas() {
	return useQuery({
		queryKey: ["marcas"],
		queryFn: obtenerMarcas,
		staleTime: 60000, // 1 minuto como datos "fresh"
	});
}

export function useCoches(simularCorrupto = false) {
	return useQuery({
		// Al cambiar la key, TanStack Query vuelve a pedir automáticamente
		queryKey: ["coches", simularCorrupto],
		queryFn: () => obtenerCoches(simularCorrupto),
		staleTime: 30000,
	});
}

export function usePropietarios() {
	return useQuery({
		queryKey: ["propietarios"],
		queryFn: obtenerPropietarios,
		staleTime: 30000,
	});
}

/* ==================== MUTATIONS (POST, PUT, PATCH, DELETE) ==================== */

// Mutaciones (POST/PUT/PATCH) que al completarse ejecutan invalidateQueries() para refrescar la caché y sincronizar la UI con el servidor.
export function useCambiarEstadoMarca() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cambiarEstadoMarca,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
		},
	});
}

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

// Mutación DELETE que invalida tanto ["coches"] como ["propietarios"] para mantener coherencia relacional en pantalla.
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

// Mutaciones CRUD sobre /propietarios con invalidación automática de la clave ["propietarios"].
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

export function useEliminarMarca(onExito) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: eliminarMarca,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
			queryClient.invalidateQueries({ queryKey: ["coches"] });
			if (onExito) onExito();
		},
	});
}