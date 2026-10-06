# Carpeta `ia/` — Documento de conocimiento del proyecto

Esta carpeta es la memoria del proyecto. Sirve para retomar el trabajo en otro computador (o en otra sesión de Claude Code) sin perder contexto.

**Cómo usarla en una sesión nueva:** abre Claude Code en la raíz de `travel-agent-app/` y pídele: *"Lee la carpeta `ia/` y continúa desde `03-estado-y-pendientes.md`"*.

| Archivo | Contenido |
|---|---|
| `01-paso-a-paso.md` | Historia cronológica de lo construido, con comandos y problemas encontrados |
| `02-arquitectura-y-decisiones.md` | Cómo está armado el sistema y por qué se decidió así |
| `03-estado-y-pendientes.md` | Dónde quedamos, cómo levantar todo y qué sigue |

**Regla de mantenimiento:** al cerrar cada sesión, actualizar `03-estado-y-pendientes.md` y añadir lo hecho a `01-paso-a-paso.md`.

## Resumen en 5 líneas
- App de **planificación de viajes con IA**: el usuario da destino, días, presupuesto, estilo e intereses; Claude genera un itinerario día a día con rutas y costos, y se puede ajustar ("hazlo más barato").
- **Backend:** Python + FastAPI (`backend/`). **Front:** React Native con Expo + TypeScript (`mobile/`), también corre en navegador.
- Almacenamiento **local en JSON**, detrás de una interfaz para conectar nubes (S3 u otras) sin tocar el resto.
- El LLM está detrás de una interfaz (`PlanGenerator`); hoy: Claude y un modo `mock` sin API key. Está planeado soportar OpenAI y Gemini.
- La especificación original (Node/TypeScript CLI) se **reinterpretó** como React Native + Python por pedido del usuario.
