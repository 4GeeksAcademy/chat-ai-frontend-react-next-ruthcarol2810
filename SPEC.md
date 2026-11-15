# SPEC: Token Lab — Chat con IA y métricas de uso

* **Estado:** Borrador basado en la implementación y documentación actuales.
* **Autor:** No especificado.
* **Fecha:** 2026-11-15.

---

## 1. Resumen Ejecutivo y Objetivo

* **Problema:** Al integrar un modelo de lenguaje en una interfaz de chat, el usuario no solo necesita ver respuestas: también debe poder entender el consumo de tokens, el rendimiento y el comportamiento básico de la sesión. Además, un fallo o una recarga accidental no debería hacer perder la conversación.
* **Solución:** Token Lab es una aplicación web de chat que envía las conversaciones a Groq mediante una ruta de servidor Next.js. Presenta las respuestas y sus métricas de uso, acumula los tokens durante la sesión y conserva el estado en el navegador.
* **Usuario objetivo:** Personas que exploran o evalúan una integración conversacional con IA, como integrantes de un equipo de producto o desarrollo, y que necesitan observar el uso del modelo.
* **Métrica de éxito (KPI):** Completar conversaciones de extremo a extremo con respuesta del modelo y `usage` visible; conservar historial y estadísticas tras recargar; y comunicar de forma comprensible los errores de proveedor o red. No hay objetivos cuantitativos de latencia, retención o costo definidos en el alcance actual.

## 2. Alcance del MVP (Scope)

### ✅ Qué SÍ incluye (In-Scope)

* Interfaz de chat para enviar texto y distinguir visualmente los mensajes de usuario y asistente.
* Envío del historial completo disponible con cada solicitud; el endpoint no mantiene estado de conversación.
* Integración del servidor con Groq Chat Completions usando `fetch` y cabeceras `Authorization: Bearer <GROQ_API_KEY>` y `Content-Type: application/json`.
* Modelo configurado y verificado para esta cuenta: `qwen/qwen3.8-27b` (Qwen 3.8 27B).
* Indicador de carga y bloqueo de envíos simultáneos mientras se espera. Permite cancelar la petición en curso.
* Captura de errores HTTP, de red y de respuestas inválidas, con mensajes legibles en la interfaz.
* Métricas de tokens de prompt, tokens de completado y total, obtenidas del objeto `usage` y acumuladas durante la sesión.
* Métricas adicionales de respuesta: modelo, duración y tokens por segundo.
* Persistencia local de mensajes y métricas con `localStorage`, incluida restauración al volver a abrir o recargar la página.
* Acción manual para borrar mensajes, métricas y el estado persistido.
* Diseño adaptable con panel de estadísticas para pantallas amplias y acceso al panel en pantallas pequeñas.
* El viewport de la aplicación no tiene scroll general; los mensajes y las métricas se desplazan dentro de sus propias columnas. El auto-scroll de conversación actúa solo sobre la columna de mensajes.

### ❌ Qué NO incluye por ahora (Out-of-Scope)

* Autenticación, perfiles de usuario o sincronización entre dispositivos.
* Base de datos o almacenamiento remoto de conversaciones; el historial es local al navegador.
* Aplicación móvil nativa.
* Carga de documentos, PDF, imágenes, URL, búsqueda web, embeddings o RAG.
* Herramientas, llamadas a funciones, agentes o ejecución de código por el modelo.
* Streaming de tokens. La ruta solicita una respuesta completa (`stream: false`) y muestra un indicador de espera.
* Límites de cuota por usuario, rate limiting propio, facturación, suscripciones o analítica de producto.
* Garantías de latencia, disponibilidad del proveedor o costo máximo.
* Suite automatizada de pruebas: no hay actualmente un script de tests definido en el proyecto.

## 3. Flujos de Usuario (User Flows)

1. **Inicio:** El usuario abre `/` y ve una conversación vacía o la sesión previamente guardada en el mismo navegador.
2. **Enviar mensaje:** El usuario escribe texto en el cuadro de entrada y envía con el botón o con Enter. Shift+Enter permite una nueva línea.
3. **Interacción con IA:** El cliente agrega el mensaje al historial, envía a `POST /api/chat` los mensajes disponibles y el identificador del modelo; muestra un estado de espera mientras el endpoint llama a Groq.
4. **Respuesta correcta:** El servidor valida la solicitud, envía el historial a Groq, recibe respuesta y `usage`, y devuelve texto y metadatos normalizados. El cliente presenta la respuesta y agrega métricas de ese turno a los acumulados.
5. **Error o cancelación:** El usuario recibe un mensaje comprensible si la petición falla. Si cancela, se aborta la solicitud del navegador. Un mensaje de usuario ya enviado puede permanecer en el historial; no se añade respuesta ni consumo de tokens si Groq no confirmó una respuesta exitosa.
6. **Continuar conversación:** En el siguiente envío, el cliente vuelve a enviar la conversación disponible, incluyendo turnos anteriores.
7. **Persistencia:** Los cambios de mensajes y métricas se guardan en `localStorage`. Al recargar, el cliente valida y restaura los datos. Si el JSON guardado es inválido, se limpia y la aplicación continúa con una sesión vacía.
8. **Borrar sesión:** El usuario selecciona «Borrar conversación»; la petición en curso se cancela y se limpian mensajes, métricas y almacenamiento local.

## 4. Arquitectura de IA y Prompts

* **Proveedor y endpoint:** Groq, `https://api.groq.com/openai/v1/chat/completions`.
* **Modelo seleccionado:** `qwen/qwen3.8-27b` (Qwen 3.8 27B), configurado como modelo único actual del selector y del endpoint.
* **Estrategia de contexto / RAG:** Sin RAG. El cliente envía el historial de la sesión como contexto de cada solicitud; el servidor no conserva estado entre llamadas.
* **Formato de entrada:** JSON con `model`, `messages` (roles `user` y `assistant`, contenido de texto) y `stream: false`. La ruta añade el mensaje de sistema.
* **Formato de salida:** JSON normalizado para el cliente con `message` y `metadata` que incluye modelo, fecha, contadores de tokens y tiempos/velocidad. Las respuestas de Groq se procesan como JSON no streaming.
* **System prompt actual:**
  > Eres un asistente útil y conciso. Responde en el idioma del usuario. Usa texto claro con párrafos cortos y listas simples cuando ayuden.
* **Manejo de fallos de IA:** La ruta captura fallos de conexión, errores HTTP, errores de autenticación, modelo o solicitud, JSON inválido y respuesta sin texto. Devuelve un error para que el cliente lo muestre con un mensaje comprensible. No se define un umbral fijo de timeout ni reintentos automáticos.
* **Métricas:** Se usan los valores `usage.prompt_tokens`, `usage.completion_tokens` y `usage.total_tokens` de Groq. Cuando un campo de uso falta o no es válido, la ruta lo normaliza de forma defensiva (con cero o suma de prompt y completado para el total). La UI acumula esos valores por respuesta.

## 5. Modelo de Datos (Esquema Base)

No existe base de datos ni ORM. El modelo es local al cliente y se conserva como JSON en `localStorage` bajo la clave `token-lab-session-v1`.

* **`ChatMessage`:**
  * `id`: identificador local de mensaje.
  * `role`: `user` o `assistant`.
  * `content`: texto del mensaje.
  * `metadata` (opcional, principalmente en respuestas): modelo, fecha de creación, tokens de prompt/completado/total, duración de respuesta y tokens por segundo.
* **`TurnStats`:**
  * `id`: identificador asociado a la respuesta.
  * `model`: modelo que generó la respuesta.
  * `promptTokens`, `completionTokens`, `totalTokens`: uso reportado por Groq.
  * `responseTimeMs`, `tokensPerSecond`: métricas temporales/derivadas.
  * `timeToFirstTokenMs` es opcional en el tipo compartido; el flujo no streaming actual no mide TTFB de tokens.
* **`StoredSession`:** objeto persistido con `messages: ChatMessage[]` y `turns: TurnStats[]`.
* **`GroqMessage` (solicitud):** objeto temporal enviado al proveedor con `role` y `content`. No se persiste fuera del historial local.
* No hay entidades `User`, `Project` o sesión remota en la versión actual.

## 6. Endpoints / Acciones del Backend

### `POST /api/chat`

* **Responsabilidad:** Validar una conversación, invocar Groq y normalizar la respuesta.
* **Entrada:** JSON con `messages` (no vacío, máximo 100; cada mensaje debe tener un rol permitido y texto de hasta 20 000 caracteres) y `model` opcional. Los roles aceptados son `user` y `assistant`.
* **Autenticación con proveedor:** La ruta lee `GROQ_API_KEY` del entorno del servidor y llama a Groq con `Authorization: Bearer ...` y `Content-Type: application/json`. No se requiere cuenta de usuario para esta aplicación local.
* **Salida exitosa:** JSON `{ message, metadata }`, incluyendo modelo, `promptTokens`, `completionTokens`, `totalTokens`, `responseTimeMs` y `tokensPerSecond`.
* **Errores:** JSON `{ error }` con un estado HTTP apropiado para cuerpo inválido, falta de configuración, rechazo de credenciales, modelo/solicitud no válida, proveedor no disponible o respuesta inválida.
* **Estado:** Stateless; el cliente debe enviar el historial de conversación completo en cada llamada.

### Acciones del cliente

* **Enviar:** agregar el texto del usuario, llamar `POST /api/chat`, incorporar respuesta y registrar sus estadísticas.
* **Cancelar:** abortar la solicitud de navegador que está en curso.
* **Borrar conversación:** vaciar estado de mensajes y estadísticas, abortar una petición activa y eliminar `token-lab-session-v1` de `localStorage`.
* No existen endpoints `GET /api/history` o `DELETE /api/session/:id`; la persistencia es local y no hay sesiones remotas.

## 7. Requisitos No Funcionales y Seguridad

* **Latencia:** Se mide y presenta la duración total de cada petición. No se establece un SLA ni un límite de latencia. No hay streaming ni medición real de Time to First Token.
* **Seguridad y privacidad:** La API key solo se lee desde `process.env.GROQ_API_KEY` en la ruta de servidor. La clave local se guarda en `.env.local`, excluido por `.gitignore`; no se debe usar `NEXT_PUBLIC_`, exponerla al cliente o escribirla en logs/commits.
* **Validación:** La ruta valida JSON, roles, tipos, contenido, cantidad de mensajes y longitud máxima de contenido. El cliente valida la estructura restaurada desde `localStorage` y trata JSON corrupto sin bloquear el chat.
* **Control de errores:** No se añaden secretos o datos crudos de autenticación a los mensajes de error del cliente. Los fallos de proveedor deben tener manejo visible y no producir estadísticas para respuestas fallidas.
* **Privacidad del historial:** Los mensajes se guardan en el almacenamiento local del navegador. No existe sincronización ni persistencia en servidor; los datos pueden borrarse con la acción de limpieza o desde el navegador.
* **Costo y cuota:** El prototipo no implementa rate limiting ni presupuesto de tokens. El consumo depende de la cuenta y políticas de Groq.
* **Compatibilidad:** Aplicación web Next.js responsive; interacción adaptada para escritorio y pantallas pequeñas. `html` y `body` ocupan el viewport y no crean scroll general; mensajes y métricas mantienen scroll independiente y el auto-scroll queda confinado a la columna de mensajes.

## 8. Criterios de Aceptación (Checklist para dar por terminado)

- [ ] La API de Groq se llama con `fetch` desde el servidor y cada petición al proveedor incluye `Authorization: Bearer <GROQ_API_KEY>` y `Content-Type: application/json`.
- [ ] El cliente envía el historial completo disponible en cada llamada; la ruta opera stateless.
- [ ] La llamada asíncrona se gestiona con `async/await` y se muestra un indicador de carga hasta resolver o fallar.
- [ ] Los errores de Groq, red y respuestas inválidas se muestran como mensajes claros y legibles, sin silencios ni errores técnicos crudos en pantalla.
- [ ] `useState` administra mensajes, estado de carga y métricas de sesión.
- [ ] `useEffect` restaura y sincroniza historial y métricas mediante `localStorage`, sin sobrescribir el estado guardado antes de restaurarlo.
- [ ] Los tokens de prompt, completado y total se toman de `usage`, se muestran por turno y se acumulan correctamente durante toda la sesión.
- [ ] Mensajes y estadísticas persisten tras recargar y la acción de borrar limpia tanto el estado como el almacenamiento local.
- [ ] La interfaz expone al menos una métrica adicional a los tokens; el estado actual presenta modelo, tiempo de respuesta y velocidad.
- [ ] La API key está documentada como `GROQ_API_KEY` en `.env.local`, permanece en el servidor y el archivo está excluido del control de versiones.
- [ ] La interfaz se puede utilizar en viewport grande y pequeño, y se puede cancelar una petición en curso.
- [ ] No aparece un scroll general de página: los desplazamientos de mensajes y métricas ocurren únicamente dentro de sus respectivas columnas; el auto-scroll no desplaza el documento.

## 9. Componentes y Responsabilidades

* **`app/page.tsx`:** entrada de la página que representa la aplicación de chat.
* **`app/api/chat/route.ts`:** validación y llamada servidor-servidor a Groq; normaliza errores, respuesta y métricas.
* **`components/chat/chat-app.tsx` (`ChatApp`):** estado principal, coordinación de solicitudes, gestión de errores, acumulación de estadísticas y persistencia de sesión.
* **`components/chat/chat-input.tsx` (`ChatInput`):** captura texto, envía con Enter o botón y permite cancelar cuando hay una solicitud activa.
* **`components/chat/message-list.tsx` (`MessageList`):** lista de mensajes, sugerencias iniciales, estado visual «pensando» y métricas por respuesta.
* **`components/chat/stats-sidebar.tsx` (`StatsSidebar`):** totales de sesión, visualización acumulada, rendimiento y registro de peticiones.
* **`components/ui/button.tsx` (`Button`):** botón reutilizable de la interfaz.
* **`lib/chat-types.ts`:** identificador del modelo, tipos de mensajes, metadatos y estadísticas por turno.
* **`lib/format.ts`:** funciones de formato para números, tiempos y nombres de modelo.
* **`lib/utils.ts`:** utilidades de UI compartidas.

## 10. Configuración y Operación

* **Único archivo de entorno local:** `.env.local` en la raíz del proyecto:

  ```dotenv
  GROQ_API_KEY=tu_clave_de_groq
  ```

* No mantener una copia paralela en `.env`; no usar `NEXT_PUBLIC_GROQ_API_KEY`.
* `.env.local` está excluido por `.gitignore`. No añadir la clave al repositorio.
* Tras crear o modificar el archivo, reiniciar el servidor de desarrollo.
* **Instalar:** `pnpm install`
* **Desarrollo:** `pnpm dev`
* **Validar tipos:** `npx tsc --noEmit`
* **Build:** `pnpm build`
* El proyecto no tiene un script automatizado de tests configurado en `package.json`.
