# Paso a paso de lo construido

Idioma de trabajo con el usuario: español. Fecha de la sesión: 2026-10-06.

## 0. Punto de partida
El usuario pidió construir (como senior developer) una app **React Native + backend Python**, con almacenamiento local pero abierto a nubes, a partir de una especificación pegada: un "AI Travel Planner" originalmente en Node/TypeScript (CLI o Next.js) con modelos `TravelRequest`, `ActivityItem`, `RouteSegment`, `DayItinerary`, `TravelPlan`, un system prompt de agente de viajes, flujo de entrada → generación → ajuste interactivo, y estructura `src/…`. Se mantuvo el contrato de datos y el prompt; cambió el stack.

## 1. Scaffolding del backend (`backend/`)
Se creó FastAPI con:
- `app/models.py`: modelos Pydantic en **camelCase** (coinciden con el contrato JSON del móvil). Se añadieron `GeneratedPlan` (lo que devuelve el LLM), `CostBreakdown`, `RefineRequest`, `PlanSummary`.
- `app/prompts/travel_agent.py`: system prompt del spec + constructores de prompt para generar y refinar.
- `app/services/claude_service.py`: `PlanGenerator` (interfaz), `ClaudeService` (SDK `anthropic`, `messages.parse` con salida estructurada Pydantic, thinking adaptativo, effort configurable, manejo de errores/`refusal`/`max_tokens`), `MockService`, `build_generator`.
- `app/services/stats.py`: el **servidor calcula** costos diarios, totales, variación y `budgetStatus` (±5 % = on_budget). No se confía en la aritmética del LLM.
- `app/storage/`: protocolo `PlanRepository` (list/get/save/delete), `LocalJsonRepository` (un JSON por plan, escritura atómica, validación de id contra path traversal), `S3PlanRepository` (esqueleto, no probado) y fábrica en `__init__.py`.
- `app/deps.py`, `app/main.py`: endpoints `POST /plans`, `GET /plans`, `GET /plans/{id}`, `POST /plans/{id}/refine`, `DELETE /plans/{id}`, `GET /health`; API key opcional (`X-API-Key`); CORS configurable.
- `tests/test_api.py`: flujo completo contra el mock + validación + path traversal.
- Modelo por defecto: `claude-opus-5-5` (según la guía del skill `claude-api`; el spec decía Claude 3.5 Sonnet). Configurable por `CLAUDE_MODEL` / `CLAUDE_EFFORT`.

## 2. Scaffolding del móvil (`mobile/`)
Expo + TypeScript + React Navigation: `App.tsx`, 3 pantallas (Home, NewPlan, PlanDetail), `src/api/client.ts` (cliente tipado), `src/api/types.ts` (espejo de `models.py`).

## 3. Entorno y puesta en marcha
- La máquina solo tenía Python 3.9 → se instaló **Python 3.12 con Homebrew**; venv en `backend/.venv`; `pytest`: 2/2 OK.
- `npm install` en `mobile/` + `npx expo install react-dom react-native-web @expo/metro-runtime` para poder correr en navegador.
- Se añadió `babel-preset-expo` como dependencia directa (sin ella Metro fallaba con "Cannot find module 'babel-preset-expo'").
- **Puertos:** el 8000 y el 8081 estaban ocupados por procesos ajenos (no se tocaron). Backend en **8010**, front web en **8082**. `mobile/app.json` → `extra.apiUrl = http://localhost:8010`.
- `backend/.env` quedó con `LLM_MODE=mock` (está en `.gitignore`).
- Se sembraron viajes de ejemplo vía API (París, Londres, Lisboa, Kioto); esos JSON viven en `backend/data/` y **no viajan** (gitignored).

## 4. Aclaración sobre el origen de los datos
El usuario preguntó de dónde salían los textos de un plan ("Cafe stop 1", "London spot 1.1"). Respuesta: eran **plantillas del `MockService`**, no datos reales. Con `LLM_MODE=claude` el contenido lo genera Claude desde su conocimiento general (sin Google Places/Mapbox ni precios en vivo); son estimaciones.

## 5. Diseño para multi-LLM (solo discutido, NO implementado)
Plan acordado a nivel de diseño: clase base común + un adaptador por proveedor (`anthropic`, `openai`, `gemini`, opcional OpenAI-compatible para modelos locales) en `backend/app/services/llm/`, elegido por `LLM_PROVIDER`. Detalle en `02-arquitectura-y-decisiones.md`. Faltan 2 respuestas del usuario (ver `03`).

## 6. Rediseño de UI estilo Vercel
Pedido: UI más "global", humana, menos mock, usando herramientas tipo Vercel. No hay acceso a v0; se adoptó el lenguaje visual de Vercel:
- Tema (`src/theme/index.ts`): tokens claro/oscuro (sigue el sistema), tipografía **Geist** (`@expo-google-fonts/geist`), degradado estable por destino (`gradientFor`), colores por categoría de costo.
- Componentes (`src/components/`): `ui.tsx` (T, Screen, Card, Button, Field, Chip, StatusBadge, Banner, Skeleton, `confirmAction`), `TripBanner.tsx`, `BudgetBar.tsx`.
- Pantallas reescritas: Home (cuadrícula responsive, estado vacío, skeletons), NewPlan (stepper de días, monedas, estilos como tarjetas, chips de intereses, pantalla de progreso mientras genera), PlanDetail (total grande, barra de costos, pestañas por día, línea de tiempo con íconos, panel "Ask the agent to adjust" con sugerencias y alcance por día).
- Dependencias añadidas: `@expo-google-fonts/geist`, `expo-font`, `expo-linear-gradient`, `@expo/vector-icons`.
- `MockService` mejorado con un catálogo (food/museums/hiking/genérico) para que los datos de prueba suenen naturales.
- Se verificó en navegador (Chrome, vista móvil, modo oscuro): Home y Detalle. Se corrigió un desbordamiento del texto de variación de presupuesto (no revisado de nuevo visualmente). **No** se revisó visualmente NewPlan ni la vista ancha/escritorio ni el modo claro.

## Problemas encontrados y cómo se resolvieron
| Problema | Causa | Solución |
|---|---|---|
| `Cannot find module 'babel-preset-expo'` | No era dependencia directa | `npx expo install babel-preset-expo -- --save-dev` |
| Backend no arrancaba en 8000 | Puerto ocupado por proceso ajeno | Usar 8010 |
| Expo no arrancaba en 8081 | Puerto ocupado | Usar `--port 8082` |
| `Alert.alert` con botones no hace nada en web | Limitación de react-native-web | `confirmAction` usa `window.confirm` en web; errores como `Banner` |
| `headerBackTitleVisible` no existe | Cambio de API en native-stack v7 | Se eliminó la opción |
| Tests de FastAPI necesitan `httpx` | `TestClient` de Starlette | `httpx` en `requirements.txt` (el SDK `anthropic` 1.x usa `httpx2`, conviven) |
