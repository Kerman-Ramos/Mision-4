// Trae las 3 piezas clave de TanStack Query:
// - useQuery: para LEER datos (GET).
// - useMutation: para MODIFICAR datos (POST, PUT, PATCH, DELETE).
// - useQueryClient: acceso al almacén de caché para avisarle cuándo debe refrescar.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Trae las 14 funciones del mensajero (motorService.js).
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

// --- Queries (Leer datos con caché) ---
// Llama a useQuery con:
// - queryKey: ["marcas"] -> Etiqueta única en la caché para guardar estas marcas.
// - queryFn: obtenerMarcas -> Función que hace el GET.
// - staleTime: 60000 -> Durante 60.000 ms (1 minuto) los datos se consideran "frescos"
// y no vuelve a pedirlos innecesariamente.
export function useMarcas() {
	return useQuery({
		queryKey: ["marcas"],
		queryFn: obtenerMarcas,
		staleTime: 60000,
	});
}

// Igual que useMarcas, pero la etiqueta incluye simularCorrupto: ["coches", false]
// o ["coches", true]. Cuando el usuario marca la casilla, la etiqueta cambia y
// TanStack Query hace automáticamente una nueva petición con el valor nuevo.
export function useCoches(simularCorrupto = false) {
	return useQuery({

		queryKey: ["coches", simularCorrupto],
		queryFn: () => obtenerCoches(simularCorrupto),
		staleTime: 30000,
	});
}

// Lee /propietarios bajo la etiqueta ["propietarios"] (frescos 30 segundos).
export function usePropietarios() {
	return useQuery({
		queryKey: ["propietarios"],
		queryFn: obtenerPropietarios,
		staleTime: 30000,
	});
}

// --- Mutations (Escribir datos y refrescar la caché) ---
// const queryClient = useQueryClient(): agarra el controlador de caché.
// -> useMutation({ mutationFn: cambiarEstadoMarca, onSuccess: ... }):
// Cuando el PATCH sale bien (onSuccess), ejecuta
// queryClient.invalidateQueries({ queryKey: ["marcas"] }), que significa:
// "Oye caché, las marcas cambiaron; vuelve a pedirlas para actualizar la pantalla".
export function useCambiarEstadoMarca() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cambiarEstadoMarca,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["marcas"] });
		},
	});
}

// Ejecuta crearCoche (POST). Si sale bien, invalida ["coches"] para que el coche
// nuevo aparezca en la lista y, si el formulario pasó un aviso (onExito), lo ejecuta.
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

// Ejecuta reemplazarCoche (PUT), invalida ["coches"] y avisa con onExito.
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

// Ejecuta actualizarPrecioCoche (PATCH), invalida ["coches"] y avisa con onExito.
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


// Ejecuta eliminarCoche (DELETE). Invalida ["coches"] Y TAMBIÉN ["propietarios"]
// porque si borras un coche, el propietario que lo tenía debe reflejar "Vehículo eliminado".
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


// POST de propietario + invalida ["propietarios"] + llama a onExito.
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

// PUT de propietario + invalida ["propietarios"] + llama a onExito.
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

// DELETE de propietario + invalida ["propietarios"] + llama a onExito.
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

// POST de marca + invalida ["marcas"] + llama a onExito.
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

// PUT de marca + invalida ["marcas"] + llama a onExito.
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

// DELETE de marca + invalida ["marcas"] y ["coches"] + llama a onExito.
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
