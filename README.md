# MotorRegistry (Práctica M4 · Full Contact Forms)

Esta es la aplicación web de la práctica **M4 · Full Contact Forms**, hecha con **React 19** y **Vite 8** en JavaScript. Sirve para gestionar un inventario de vehículos, sus propietarios y el catálogo de marcas haciendo operaciones CRUD completas (`GET`, `POST`, `PUT`, `PATCH` y `DELETE`) contra un API simulado con `json-server`.

Para montarla he usado **React Hook Form** junto con **Zod v4** para las validaciones y **TanStack Query v5** para manejar la caché y las peticiones al servidor.

---

## Cómo arrancar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar el archivo `.env`

En la raíz del proyecto hace falta un archivo `.env` con la dirección del API:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Levantar la app y la base de datos

Hay que abrir **dos terminales** a la vez:

**Terminal 1 (base de datos con `json-server`):**

```bash
npm run api
```

**Terminal 2 (servidor de Vite):**

```bash
npm run dev
```

- Web en local: `http://localhost:5173`
- Rutas del API:
  - `http://localhost:3001/coches`
  - `http://localhost:3001/marcas`
  - `http://localhost:3001/propietarios`
  - `http://localhost:3001/db`

> **Nota:** si abres `http://localhost:3001` directamente en el navegador sale `{}`. Es normal al usar `json-server` 0.17.4 junto a Vite (por la carpeta `public/`). Los datos se ven entrando directamente a `/coches`, `/marcas` o `/propietarios`.

---

## Cómo está organizado el código

He separado el proyecto en carpetas para no mezclar el diseño, las peticiones HTTP y las reglas de validación en el mismo sitio:

```text
├── db.json                      # Base de datos mock (marcas, coches y propietarios)
├── .env                         # URL del API (VITE_API_URL)
├── package.json                 # Dependencias y scripts
└── src/
    ├── main.jsx                 # Punto de entrada con StrictMode, QueryClientProvider y Devtools
    ├── App.jsx                  # Pestañas, estado de edición y control de sesión admin
    ├── index.css                # Estilos responsive y estilos de foco accesible
    ├── esquemas/
    │   └── motorEsquemas.js     # Todas las reglas de Zod (formularios y respuestas del API)
    ├── services/
    │   └── motorService.js      # Todas las llamadas fetch, comprobación de response.ok y safeParse
    ├── hooks/
    │   └── useMotorData.js      # Hooks de TanStack Query (useQuery, useMutation e invalidaciones)
    └── components/
        ├── CocheForm.jsx        # Formulario para crear (POST) y editar (PUT) vehículos
        ├── CocheList.jsx        # Lista de vehículos, filtros, ajuste de precio (PATCH) y borrado
        ├── PropietarioForm.jsx  # Formulario para crear (POST) y editar (PUT) propietarios
        ├── PropietarioList.jsx  # Lista de propietarios con buscador, filtro de ciudad y borrado
        ├── AdminLoginForm.jsx   # Login de administrador para la gestión de marcas
        ├── MarcaForm.jsx        # Formulario para crear (POST) y editar (PUT) marcas
        └── MarcaList.jsx        # Lista de marcas con editar, activar/desactivar (PATCH) y borrar
```

---

## Qué hace la aplicación (CRUD y pestañas)

La web está dividida en tres pestañas principales más una barra superior con el estado de las marcas:

- **Vehículos (`CocheForm` y `CocheList`):**
  - Permite registrar vehículos (`POST`), editarlos completos (`PUT`), ajustar su precio un `-5%` o `+5%` al vuelo (`PATCH`) y borrarlos (`DELETE`).
  - Incluye un buscador por marca, modelo o año y un filtro por tipo de combustible. Todo el filtrado se calcula directamente al renderizar, sin `useEffect` ni estados duplicados.
  - Al borrar un coche, se invalida tanto la caché de `["coches"]` como la de `["propietarios"]` para que si algún propietario tenía ese coche asignado se actualice al momento.

- **Propietarios (`PropietarioForm` y `PropietarioList`):**
  - Permite crear (`POST`), editar (`PUT`) y borrar (`DELETE`) propietarios vinculados a un coche del inventario.
  - Cruza los datos de `propietarios`, `coches` y `marcas` usando `Map` para mostrar el vehículo asignado a cada persona.
  - Tiene su propio buscador (por nombre, email o vehículo) y un desplegable de ciudades que se genera automáticamente con `Set` y `toSorted()` a partir de los datos actuales.

- **Marcas y acceso de administrador (`AdminLoginForm`, `MarcaForm` y `MarcaList`):**
  - Para poder añadir, editar, borrar o activar/desactivar marcas (tanto en la pestaña de Marcas como en los chips `PATCH` de la barra superior) hay que iniciar sesión como administrador.
  - **Credenciales:** usuario `admin` y contraseña `admin`.
  - **Nota de seguridad:** comprobar `admin`/`admin` en React sirve solo para esta práctica con `json-server` y como control visual, pero no es seguridad real porque cualquiera puede ver el código desde el navegador. En una app real la validación del login siempre iría en el servidor usando cookies `httpOnly` + `SameSite`.

---

## Validaciones con Zod v4 y Bonus del API

Todas las validaciones salen de `src/esquemas/motorEsquemas.js`:

### En los formularios

- Se usa `z.coerce.number()` porque los inputs HTML siempre devuelven texto y así Zod los convierte a número antes de validar rangos.
- Se usa `z.email()` para correos y `z.literal(true)` para obligar a marcar el checkbox de confirmación en vehículos.
- **Validaciones cruzadas con `.refine()`:**
  - Un coche **Eléctrico** tiene que ser del año **2012 o posterior** (si no, marca el error en el campo año).
  - Un coche de **2023 en adelante** no puede costar menos de **10.000 €** (marca el error en el campo precio).
  - El propietario debe tener nombre y al menos un apellido, y la fecha de compra debe tener formato `YYYY-MM-DD` y no puede ser posterior al día de hoy.

### Bonus: validación de respuestas del API (`safeParse`)

En `src/services/motorService.js`, todas las respuestas que llegan de `json-server` pasan por `validarRespuesta()` usando `esquema.safeParse()` antes de llegar a React.

- **Cómo probarlo:** en la cabecera hay una casilla que pone **"Simular dato corrupto del API (Bonus Zod)"**.
- Al marcarla cambia la `queryKey` de TanStack Query (`["coches", false]` pasa a `["coches", true]`), se vuelve a lanzar el `GET /coches` e inyecta un coche falso con datos rotos (`anio: 1810`, `combustible: "Nuclear"`, `precio: "gratis"`).
- Zod detecta los tres fallos, bloquea el renderizado de datos corruptos y TanStack Query muestra el aviso rojo con el detalle exacto de qué campos fallaron. Al desmarcarla vuelve a cargar la lista normal desde la caché.

---

## Accesibilidad

He tenido en cuenta varios detalles para que los formularios funcionen bien con teclado y lectores de pantalla:

- Todos los `<form>` llevan `noValidate` para desactivar los avisos por defecto del navegador y mostrar siempre los de Zod.
- Todos los campos tienen su `<label htmlFor="...">` asociado y los botones de radio de combustible van agrupados en un `<fieldset>` con su `<legend>`.
- Los campos con error marcan `aria-invalid` y enlazan su mensaje con `aria-describedby`.
- Los errores usan `role="alert"` y los mensajes de éxito o carga usan `role="status"`.
- Los botones de envío no se deshabilitan mientras faltan campos (solo mientras se está enviando la petición con `isPending`). Si hay fallos al enviar, `setFocus()` mueve el cursor automáticamente al primer campo que falló.
- En `src/index.css` se mantiene un foco visible claro (`:focus-visible`) y soporte para `prefers-reduced-motion`.

---

## Uso de IA

Durante el desarrollo de esta práctica he utilizado herramientas de IA (**Gemini** y **GitHub Copilot**) como apoyo en varias partes del proceso:

- **Arquitectura y dudas del temario:** me ayudó a estructurar las carpetas del proyecto (`esquemas`, `services`, `hooks`, `components`) y a conectar bien React Hook Form, Zod v4 y TanStack Query v5 siguiendo los contenidos de clase sin meter librerías externas innecesarias.
- **Nuevas funcionalidades y diseño:** la usé para mejorar bastante el aspecto visual en `src/index.css`, añadir el buscador y filtro de ciudades en la pestaña de propietarios y montar el panel de administración de marcas con el acceso `admin`/`admin`.
- **Resolución de problemas:** me sirvió para depurar fallos puntuales, como entender por qué `localhost:3001` devolvía `{}` en `json-server`, corregir avisos de ESLint y configurar el reenvío de puertos en VS Code para poder probar la web desde el móvil estando en una red restringida.
- **Documentación y comprensión del código:** generé una explicación línea a línea de los archivos para asegurarme de entender bien qué hace cada parte y usé GitHub Copilot para insertar los comentarios en el código, revisando después a mano los comentarios mal puestos en JSX (`//` en lugar de `{/* ... */}`) y reordenando los que habían quedado desplazados. También me he apoyado en la IA para redactar y ordenar este `README.md`.

Todo el código generado y modificado se ha revisado y probado en local (todas las operaciones CRUD, filtros, el interruptor del bonus de Zod, el login de admin y la comprobación con `npm run lint`).

---

## Scripts disponibles

- `npm run api` — Arranca `json-server` en el puerto `3001` escuchando `db.json`.
- `npm run dev` — Arranca Vite en modo desarrollo en el puerto `5173`.
- `npm run lint` — Ejecuta ESLint para revisar errores en el código.
- `npm run build` — Genera el build de producción en `dist/`.
- `npm run preview` — Permite previsualizar el build de producción en local.
