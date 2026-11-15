# Habla con la Máquina (Token Lab) - Archivo de Contexto

## 1. Resumen del Proyecto

* **Descripción:** Este repositorio contiene **Token Lab**, un prototipo de interfaz de chat construido con Next.js y React, cuya interfaz inicial se generó con v0. La aplicación está pensada para conversar con un modelo de lenguaje real de Groq y mostrar información sobre el consumo de tokens y el rendimiento de las respuestas.
* **Objetivo principal:** Conectar el chat a la API de Groq y conseguir que el flujo asíncrono, los errores, las métricas por respuesta y los acumulados de sesión sean precisos, visibles y persistentes. El historial debe sobrevivir una recarga accidental de la página.
* El repositorio de GitHub ya está creado y conectado con este entorno local, y la interfaz base de v0 ya existe. El trabajo se centra en conectar y pulir la integración, no en iniciar el proyecto desde cero.

### Requisitos funcionales

* El usuario puede enviar mensajes y ver el historial completo, con mensajes de usuario y asistente diferenciados.
* Cada solicitud se envía con el historial pertinente de la conversación, en el formato de mensajes que espera la API de chat completions de Groq.
* La llamada HTTP se hace con `fetch` y `async/await`; no usar SDK de Groq, AI SDK ni librerías envoltorio para la integración con el modelo.
* La petición se realiza desde una ruta del servidor de Next.js. La clave de Groq nunca se expone al navegador.
* Mientras se procesa una respuesta, la interfaz indica que el modelo está trabajando y evita envíos incompatibles.
* El viewport no debe mostrar un scroll general: la columna de mensajes y el panel de métricas gestionan su desplazamiento de forma independiente. El auto-scroll del chat debe limitarse a la columna de mensajes.
* Los errores HTTP, de red y de respuesta se capturan y se comunican con un mensaje legible, sin romper la interfaz.
* Después de cada respuesta se registran los tokens de prompt, los tokens de completado y el total. El panel muestra los acumulados de la sesión y al menos una métrica adicional, como el modelo o el tiempo de respuesta.
* El historial y las estadísticas se guardan en `localStorage`, se restauran al montar la aplicación y sobreviven a una recarga.
* «Borrar conversación» reinicia mensajes, métricas y los datos persistidos de la sesión.

### Criterios de aceptación

* La API de Groq se llama correctamente con `fetch`, incluyendo `Authorization: Bearer <GROQ_API_KEY>` y `Content-Type: application/json` en cada petición del servidor al proveedor.
* En cada llamada se envía el historial completo disponible de la conversación. El endpoint es stateless y el cliente administra el historial enviado.
* La promesa se gestiona con `async/await` y la interfaz muestra un estado de carga mientras espera la respuesta.
* Los errores de API, red y formato se capturan y se presentan al usuario con mensajes comprensibles; no hay fallos silenciosos ni errores técnicos crudos en pantalla.
* `useState` administra los mensajes, el estado de carga y las métricas.
* `useEffect` carga y sincroniza el historial y las métricas de sesión con `localStorage` en el cliente.
* Los datos de tokens de `usage` se registran por respuesta y se acumulan correctamente durante toda la sesión.
* La conversación sobrevive una recarga y el usuario puede borrarla manualmente, incluyendo sus métricas persistidas.
* La interfaz muestra al menos una métrica de Groq adicional al conteo de tokens, por ejemplo modelo, tiempo de respuesta o tokens por segundo.
* No hay scroll general de página; los scrolls de mensajes y métricas se mantienen dentro de sus columnas, incluso cuando el chat se desplaza automáticamente al recibir mensajes.

## 2. Pila Tecnológica (Tech Stack)

* **Lenguaje(s):** TypeScript, JavaScript y CSS.
* **Framework / Librerías:** Next.js 16 (App Router), React 19, TypeScript 5.7.3 y Lucide React para iconos. El gestor declarado es pnpm (`pnpm-lock.yaml`).
* **Integración de IA:** API compatible con chat completions de Groq por HTTP `fetch` directo desde una ruta del servidor Next.js. No utilizar SDK de Groq, AI SDK ni librerías envoltorio en la integración final.
* **Base de datos / ORM:** No hay base de datos ni ORM configurados. La persistencia de la sesión del prototipo se realiza en `localStorage` del navegador.
* **Estilos / UI:** Tailwind CSS 4, componentes propios inspirados en shadcn/ui y Lucide React. La interfaz actual ya está implementada.
* **Infraestructura / Deploy:** Repositorio GitHub conectado al entorno local. La plataforma de despliegue no está especificada en el estado actual del proyecto.
* **Configuración de entorno:** el único archivo local de credenciales es `.env.local`, que contiene `GROQ_API_KEY=...` y permanece fuera del control de versiones. No usar `NEXT_PUBLIC_` para esta clave. No crear ni mantener `.env` como segundo archivo de configuración.

### Modelo y configuración de Groq

* Modelo integrado y verificado para esta cuenta: `qwen/qwen3.8-27b` (Qwen 3.8 27B).
* Endpoint de chat completions: `https://api.groq.com/openai/v1/chat/completions`.
* La ruta del servidor debe enviar `Authorization: Bearer <GROQ_API_KEY>` y `Content-Type: application/json`.
* La API devuelve `usage`; usar los valores devueltos por Groq en vez de estimar tokens en el frontend. Contemplar valores ausentes o inesperados de forma defensiva.

### Métricas y persistencia

* Acumular por respuesta `prompt_tokens`, `completion_tokens` y `total_tokens` (o los nombres equivalentes de la respuesta efectivamente recibida).
* El total de sesión es la suma de los valores por turno; no debe confundirse con los tokens del último turno.
* Guardar junto con la conversación los datos necesarios para reconstruir el panel de métricas al recargar. Validar la forma de los datos leídos de `localStorage` y manejar JSON corrupto sin bloquear el chat.
* En React/Next.js, acceder a `localStorage` únicamente en el cliente, por ejemplo mediante `useEffect`; evitar lecturas durante renderizado en servidor. Evitar que el guardado inicial antes de completar la restauración sobrescriba los datos existentes.
* Si una petición falla, mostrar el error y no registrar una respuesta/tokenización que Groq no haya confirmado.

## 3. Comandos Esenciales

El gestor recomendado es pnpm, de acuerdo con `pnpm-lock.yaml` y `package.json`.

* **Instalar dependencias:** `pnpm install`
* **Correr en desarrollo:** `pnpm dev`
* **Ejecutar tests:** No hay un script de tests configurado actualmente en `package.json`. No inventar ni asumir un comando de tests; si se incorporan pruebas, documentar el script real.
* **Construir / Build:** `pnpm build`

Scripts alternativos actualmente disponibles en `package.json`: `npm run dev` y `npm run build`. Mantener el gestor consistente con el lockfile y evitar generar lockfiles de distintos gestores.

## 4. Estructura de Directorios

* `app/page.tsx`: página principal que renderiza `ChatApp`.
* `app/layout.tsx`: layout raíz de Next.js.
* `app/globals.css`: estilos globales.
* `app/api/chat/route.ts`: ruta del servidor que procesa el chat y realiza la llamada `fetch` segura a Groq.
* `components/chat/chat-app.tsx`: estado principal y composición de la interfaz.
* `components/chat/chat-input.tsx`: entrada y envío de mensajes.
* `components/chat/message-list.tsx`: presentación de mensajes.
* `components/chat/stats-sidebar.tsx`: panel y visualizaciones de métricas.
* `components/ui/button.tsx`: componente reutilizable de botón.
* `lib/chat-types.ts`: tipos, modelo y estructuras de mensajes/estadísticas.
* `lib/format.ts`: formateo de números y métricas.
* `lib/utils.ts`: utilidades compartidas.
* `public/`: recursos estáticos.
* `context.md`: contexto, requisitos y convenciones del proyecto.

La interfaz base ya existe. Los cambios deben aprovechar sus componentes y mantener la presentación y accesibilidad existentes siempre que sea posible.

## 5. Reglas y Convenciones de Código

* **Estilo / Formato:** Mantener TypeScript y los estilos/patrones existentes. No introducir dependencias de formato o lint que no estén configuradas. Priorizar tipos explícitos y validar las entradas externas; evitar `any` salvo que exista una razón clara.
* **Nomenclatura:** Seguir las convenciones existentes: componentes React en `PascalCase` (por ejemplo, `ChatApp`), funciones/variables en `camelCase` y archivos de componentes/utilidades en `kebab-case`.
* **Manejo de errores:** Usar `async/await` y manejar errores de red, errores HTTP (`response.ok`) y respuestas inválidas. La interfaz debe recibir mensajes comprensibles; la ruta de servidor no debe filtrar secretos ni detalles sensibles.
* **Validación:** Validar el cuerpo de `POST /api/chat`; aceptar solo roles y contenido esperados y limitar entradas inválidas. Validar defensivamente datos restaurados desde `localStorage`.
* **Estado y métricas:** Asociar las estadísticas a su turno, evitar contabilizar respuestas dos veces y no registrar tokens no confirmados por Groq. Actualizar mensajes y métricas de manera coherente.
* **Persistencia / renderizado:** Leer y escribir `localStorage` solo en el cliente. Implementar la restauración y el guardado cuidando la hidratación de Next.js y evitando que el estado inicial vacío sobrescriba datos antes de cargarlos.
* **Scroll / viewport:** Mantener `html` y `body` al alto del viewport sin overflow general. Los contenedores de mensajes y métricas deben ser los únicos que se desplazan; el auto-scroll debe apuntar al contenedor de mensajes, no usar un desplazamiento que pueda mover ancestros o el documento.
* **Git / Commits:** No hay una convención de commits especificada en el repositorio. No asumir ni imponer una sin acordarlo. El remoto de GitHub ya está conectado.
* **Comprobación:** Probar estado vacío, conversación exitosa, errores de API/red, restauración tras recarga y borrado de sesión.

### Situación técnica observada al crear este contexto

* El proyecto usa Next.js 16, React 19 y TypeScript, con pnpm como gestor declarado (`pnpm-lock.yaml`).
* La llamada a Groq usa `fetch` directo desde `app/api/chat/route.ts`; el cliente llama a dicha ruta y no recibe la clave.
* `lib/chat-types.ts` define el modelo Groq `qwen/qwen3.8-27b`, que también se usa como modelo predeterminado en el endpoint.
* `ChatApp` mantiene mensajes/estadísticas con `useState` y restaura/persiste la sesión con `useEffect` y `localStorage`.
* `next.config.mjs` tiene `typescript.ignoreBuildErrors: true`. No confiar en el build como única comprobación de tipos; conviene ejecutar comprobaciones explícitas. No cambiar la configuración base sin autorización.

### Guía de implementación

1. Mantener la clave de Groq exclusivamente en el servidor y validar su existencia antes de llamar al proveedor.
2. Validar el cuerpo recibido por `POST /api/chat`; aceptar solo roles y contenido esperados y limitar entradas inválidas.
3. Desde la ruta Next.js usar `fetch` al endpoint de Groq, construir manualmente las cabeceras y el JSON, comprobar `response.ok` y normalizar tanto errores como la respuesta útil para el frontend.
4. Mantener los tipos de mensajes y estadísticas alineados con el formato interno elegido; no acoplar los componentes visuales innecesariamente al formato crudo de Groq.
5. Actualizar mensajes y métricas de manera coherente: asociar la estadística con su turno y evitar contabilizar dos veces una respuesta.
6. Implementar carga, persistencia y borrado de sesión con cuidado de la hidratación de Next.js.
7. No registrar la API key ni datos sensibles en consola. Los errores técnicos pueden registrarse en el servidor sin filtrar secretos.
8. Probar al menos el estado vacío, una conversación exitosa, errores de API/red, restauración tras recarga y borrado de sesión.

## 6. Lo que la IA NO debe hacer

* No modificar archivos de configuración base (`package.json`, `tsconfig.json`, `next.config.mjs`, configuraciones de PostCSS/Tailwind o lockfiles) sin preguntar o recibir autorización. Esto incluye no desactivar `typescript.ignoreBuildErrors` sin aprobación explícita.
* No inventar librerías ni comandos que no estén instalados o configurados.
* No añadir SDK de Groq, AI SDK ni librerías envoltorio para realizar la llamada al modelo; el requisito es `fetch` directo.
* No exponer la API key en el navegador, en variables `NEXT_PUBLIC_*`, en código fuente, logs o commits; no modificar ni mostrar secretos. Mantenerla en el único `.env.local` local, ignorado por Git.
* No dejar código comentado, credenciales de ejemplo reales ni logs de `console.log` en producción.
* No borrar requisitos o documentación existente al reorganizar este archivo; conservar el contexto y actualizarlo de forma acumulativa.
