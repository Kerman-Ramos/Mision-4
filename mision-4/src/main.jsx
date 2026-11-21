/* ============================================================================
	 4. ARCHIVO: src/main.jsx
	 PROPÓSITO: Punto de entrada que monta React en el DOM envuelto en StrictMode
	 y QueryClientProvider (con ReactQueryDevtools para inspeccionar la caché).
	 ============================================================================ */

// Modo estricto de React: mientras programas, revisa tus componentes por si hay fallos ocultos.
import { StrictMode } from "react";
// Herramienta que engancha React dentro de un elemento HTML real del navegador.
import { createRoot } from "react-dom/client";
// Trae el almacén de caché (QueryClient) y el envoltorio que lo reparte a toda la app.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Trae el botón flotante de la esquina para espiar qué hay en la caché en tiempo real.
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// Trae el componente principal de tu aplicación.
import App from "./App.jsx";
// Carga todos los estilos visuales (colores, fuentes, tarjetas).
import "./index.css";

// Crea la memoria caché vacía al arrancar la web.
const queryClient = new QueryClient();

// Busca en index.html la caja <div id="root"> y le dice a React que dibuje ahí dentro:
createRoot(document.getElementById("root")).render(
	// Activa el modo de comprobaciones extra.
	<StrictMode>
		{/* Comparte la caché con toda la app. */}
		<QueryClientProvider client={queryClient}>
			{/* Dibuja tu aplicación completa. */}
			<App />
			{/* Dibuja el panel flotante de depuración. */}
			<ReactQueryDevtools />
		{/* Cierra los envoltorios y termina el arranque. */}
		</QueryClientProvider>
	</StrictMode>
);
