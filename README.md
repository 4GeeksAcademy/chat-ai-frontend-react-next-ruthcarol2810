# Habla con la Máquina — Token Lab

Token Lab es un prototipo de chat con IA construido con Next.js y React. Su objetivo es permitir explorar conversaciones con un modelo de Groq y hacer visible el consumo de tokens y otras métricas de cada sesión.

> El chat está integrado con Groq mediante una ruta de servidor de Next.js. Revisa `context.md` para consultar los requisitos técnicos y los criterios de aceptación completos.

## 🚀 Características principales

* **Interfaz de chat:** permite escribir mensajes y consultar el historial de la conversación con una presentación diferenciada para usuario y asistente.
* **Integración con Groq:** la ruta de servidor llama a chat completions con `fetch`, conserva la API key en el servidor y envía el historial completo desde el cliente.
* **Métricas de uso:** el panel muestra tokens de prompt, tokens de completado, totales acumulados y métricas como modelo, tiempo de respuesta y tokens por segundo.
* **Persistencia de sesión:** mensajes y estadísticas se guardan en `localStorage`, sobreviven a recargas y se pueden borrar manualmente.
* **Manejo de estados y errores:** se muestra el estado de espera y se presentan errores comprensibles al usuario.
* **Desplazamiento:** no hay scroll general de página; el historial de mensajes y el panel de métricas se desplazan en sus propias columnas, y el auto-scroll permanece limitado al historial.

## 🛠️ Tecnologías utilizadas

* TypeScript y JavaScript.
* Next.js 16 con App Router y React 19.
* Tailwind CSS 4 para estilos.
* Lucide React para iconos.
* Groq API como proveedor de inferencia previsto.
* pnpm como gestor recomendado por el proyecto (`pnpm-lock.yaml`).

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

* Node.js compatible con la versión de Next.js instalada (Node.js 20 o superior recomendado).
* pnpm 12.3.4, o Corepack habilitado para activar la versión declarada por el proyecto.
* Git.
* Una cuenta y una API key de Groq para ejecutar el chat.

## 🔧 Instalación y configuración

1. **Clona el repositorio:**

   ```bash
  git clone https://github.com/4GeeksAcademy/chat-ai-frontend-react-next-ruthcarol2810.git
   cd chat-ai-frontend-react-next-ruthcarol2810
   ```

   Si ya tienes el repositorio clonado, actualiza tu rama con los cambios del remoto (si corresponde):

   ```bash
   git pull origin main
   ```

2. **Instala las dependencias:**

   ```bash
   pnpm install
   ```

3. **Configura las variables de entorno:**

  Crea el único archivo local de entorno, `.env.local`, en la raíz del proyecto y agrega tu clave:

   ```dotenv
   GROQ_API_KEY=tu_clave_de_groq
   ```

  La clave debe mantenerse exclusivamente en el servidor: **no** uses el prefijo `NEXT_PUBLIC_`, no la incluyas en el código fuente y no la compartas en commits. `.env.local` está ignorado por Git. No mantengas una copia paralela en `.env`. No existe actualmente un archivo `.env.example`.

   El endpoint de Groq para chat completions es:

   ```text
   https://api.groq.com/openai/v1/chat/completions
   ```

  El modelo integrado y verificado con esta cuenta es `qwen/qwen3.8-27b` (Qwen 3.8 27B).

  Después de crear o cambiar `.env.local`, reinicia el servidor de desarrollo para que Next.js vuelva a cargar la variable.

## ✅ Criterios de aceptación

* La API de Groq se llama con `fetch` desde el servidor, con las cabeceras `Authorization: Bearer <GROQ_API_KEY>` y `Content-Type: application/json`.
* Cada petición incluye el historial completo de conversación disponible; la ruta API no mantiene estado entre peticiones.
* Las llamadas asíncronas se gestionan con `async/await` y se muestra un indicador de carga mientras se espera.
* Los errores de API, red y respuestas inválidas se muestran con mensajes comprensibles, sin fallos silenciosos ni errores técnicos crudos en pantalla.
* `useState` gestiona mensajes, estado de carga y métricas; `useEffect` restaura y sincroniza la sesión con `localStorage`.
* Los tokens de prompt, completado y total se obtienen de `usage` y se acumulan correctamente durante toda la sesión.
* La conversación persiste al recargar y puede borrarse manualmente, junto con sus métricas.
* La interfaz muestra al menos una métrica adicional al conteo de tokens; actualmente muestra modelo, tiempo de respuesta y tokens por segundo.

## 💻 Uso

Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Luego abre [http://localhost:3000](http://localhost:3000) en el navegador.

Para crear una compilación de producción y ejecutarla localmente:

```bash
pnpm build
pnpm start
```

También hay scripts npm (`npm run dev`, `npm run build` y `npm start`), pero se recomienda usar pnpm para mantener coherencia con `pnpm-lock.yaml`.

## 🗂️ Estructura del proyecto

```text
app/
  api/chat/route.ts       Ruta de servidor para el chat y la integración con Groq
  globals.css             Estilos globales
  layout.tsx              Layout raíz
  page.tsx                Página principal
components/
  chat/                   Interfaz de chat, entrada, mensajes y estadísticas
  ui/                     Componentes de interfaz reutilizables
lib/
  chat-types.ts           Tipos, modelos y métricas del chat
  format.ts               Formateo de valores
  utils.ts                Utilidades compartidas
public/                   Recursos estáticos
context.md                Requisitos y contexto técnico del proyecto
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas proponer cambios:

1. Haz un **Fork** del repositorio (o crea una rama en tu copia de trabajo).
2. Crea una rama para tu cambio, por ejemplo: `git checkout -b feature/nueva-funcionalidad`.
3. Realiza y prueba tus cambios.
4. Crea un commit descriptivo, por ejemplo: `git commit -m "feat: agrega nueva funcionalidad"`.
5. Publica tu rama con `git push origin feature/nueva-funcionalidad`.
6. Abre un Pull Request explicando el cambio.

No hay una suite de tests ni un script `test` configurado actualmente. Como mínimo, comprueba que el proyecto compila con `pnpm build` y verifica manualmente los flujos afectados.

## 📄 Licencia

No se ha definido una licencia para este repositorio y no hay un archivo `LICENSE` en el estado actual. Hasta que se añada una licencia, no debe asumirse que el proyecto se distribuye bajo MIT, Apache 2.0 u otra licencia de código abierto.
