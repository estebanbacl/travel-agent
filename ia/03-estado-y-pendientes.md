# Estado actual y pendientes

_Última actualización: 2026-10-06._

## Estado
| Área | Estado |
|---|---|
| Backend FastAPI + tests | Funciona; `pytest` 2/2 con mock |
| Generación con Claude real | **Implementada pero nunca ejecutada** (no se usó API key en la sesión) |
| Almacenamiento local JSON | Funciona |
| Almacenamiento S3 | Esqueleto sin probar |
| Front Expo (web) | Funciona con backend mock; revisados Home y Detalle |
| Multi-LLM (OpenAI/Gemini) | Solo diseño, sin código |
| Repositorio git | **No existe** (no se hizo `git init`) |

## Retomar en otro computador
1. **Copiar el proyecto** (no es un repo git): llevar `travel-agent-app/` completo, excluyendo `backend/.venv`, `mobile/node_modules`, `backend/.env` y `backend/data/*.json`. Recomendado: `git init` y subirlo a un repo privado.
2. **Requisitos:** Python ≥ 3.10 (en macOS: `brew install python@3.12`), Node 20+ y npm.
3. **Backend:**
   ```bash
   cd backend
   python3.12 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env        # LLM_MODE=mock para trabajar sin clave; o poner ANTHROPIC_API_KEY
   uvicorn app.main:app --reload --port 8010
   pytest
   ```
4. **Front:**
   ```bash
   cd mobile
   npm install
   npx expo install --fix       # alinea versiones con el SDK de Expo
   npx expo start --web --port 8082
   ```
   Si cambias el puerto del backend, edita `mobile/app.json` → `extra.apiUrl` (en teléfono físico, usa la IP LAN; en emulador Android, `10.0.2.2`).
5. **Datos de ejemplo:** `backend/data/` no viaja; crea viajes desde la app o con `curl -X POST localhost:8010/plans -H 'Content-Type: application/json' -d '{"destination":"Lisbon, Portugal","durationDays":4,"totalBudget":1400,"travelStyle":"budget","interests":["food","museums"]}'`.
6. Los puertos 8000/8081 estaban ocupados en el equipo original; en otro equipo se pueden usar los de siempre.

## Pendientes (por prioridad sugerida)
1. **Probar con Claude real:** poner `ANTHROPIC_API_KEY`, `LLM_MODE=claude`, generar un plan y validar calidad, tiempos (puede tardar ~1 min) y que el esquema estructurado sea aceptado. Es la mayor incógnita.
2. **Multi-LLM** (OpenAI, Gemini, opcional compatible-OpenAI): decisión abierta del usuario — (a) ¿proveedor por despliegue o elegible por viaje desde la app?; (b) ¿empezar por OpenAI y Gemini, o incluir también modelos locales? Ver diseño en `02`.
3. **`git init`** y repo remoto; CI básico (pytest + `tsc --noEmit`).
4. **Revisión visual pendiente:** pantalla NewPlan, modo claro, vista ancha (escritorio), pantalla de progreso de generación, y re-verificar el arreglo del desborde en la tarjeta de total.
5. **Deploy opcional** del front web en Vercel (ofrecido; requiere confirmación del usuario porque publica código externamente) y del backend (Fly/Render/Cloud Run).
6. **Fotos reales de destino** (p. ej. Unsplash) en lugar de degradados — añade dependencia externa.
7. **Datos reales:** rutas/coordenadas con OpenStreetMap o Mapbox y tipos de cambio (marcado opcional en el spec).
8. **Probar y endurecer `S3PlanRepository`**; añadir otros backends si se necesitan.
9. **Auth real de usuarios** antes de exponer el backend públicamente; hoy solo hay `X-API-Key` opcional.
10. Mejoras de producto: streaming de progreso real en la generación, exportar a PDF, editar manualmente actividades, `fallbacks` del servidor para rechazos del modelo.

## Notas para quien continúe
- Antes de tocar el SDK de Claude, consultar el skill `claude-api` (los modelos y parámetros cambian; p. ej. con `claude-opus-5-5` no se puede desactivar el thinking ni forzar `tool_choice`).
- El usuario prefiere respuestas en español, directas, y que se verifique en el navegador lo que se construye.
- Acciones externas (deploy, subir código, instalar software global) se piden con confirmación; `brew install python@3.12` ya se hizo con su aprobación implícita ("continúa con la instalación de py").
