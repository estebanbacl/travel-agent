# Arquitectura y decisiones

## Mapa del repositorio
```
travel-agent-app/
├── README.md                     # arranque rápido
├── ia/                           # ESTA carpeta: memoria del proyecto
├── backend/                      # FastAPI (Python >= 3.10)
│   ├── app/
│   │   ├── main.py               # rutas HTTP
│   │   ├── deps.py               # inyección: repo, generador, API key
│   │   ├── config.py             # Settings (pydantic-settings, lee .env)
│   │   ├── models.py             # contrato de datos (camelCase)
│   │   ├── prompts/travel_agent.py
│   │   ├── services/claude_service.py   # PlanGenerator, ClaudeService, MockService
│   │   ├── services/stats.py     # cálculo de costos y estado de presupuesto
│   │   └── storage/              # base.py (protocolo), local.py, s3.py, __init__.py (fábrica)
│   ├── tests/test_api.py
│   └── .env.example
└── mobile/                       # Expo + TypeScript
    ├── App.tsx                   # navegación, fuentes, tema
    └── src/{api,components,screens,theme}
```

## Flujo de datos
`NewPlanScreen` → `POST /plans` → `PlanGenerator.generate()` (LLM → `GeneratedPlan`) → `finalize_plan()` (costos calculados en servidor) → `PlanRepository.save()` → `TravelPlan` al cliente.
Ajuste: `POST /plans/{id}/refine {instruction, dayNumber?}` → el LLM recibe plan actual + instrucción y devuelve el plan completo → mismo `finalize_plan` conservando `id` y `createdAt`.

## Decisiones clave (y por qué)
1. **Stack Python + React Native** en lugar del Node CLI del spec: pedido explícito del usuario. Se conservó el contrato de datos y el prompt.
2. **JSON camelCase en el backend** (no snake_case + alias): un solo modelo, contrato idéntico al `types.ts` del spec, y el esquema estructurado que ve el LLM no depende de alias.
3. **El servidor calcula los totales**: el LLM estima ítems pero la suma, la variación y `budgetStatus` se recalculan siempre (`stats.py`). Los LLM se equivocan sumando. Umbral ±5 % = `on_budget`.
4. **Salida estructurada con Pydantic** (`messages.parse(output_format=GeneratedPlan)`) en vez de pedir JSON en texto: validación automática y menos fallos de parseo. Se valida además el nº de días y se renumeran.
5. **Almacenamiento tras un protocolo** (`PlanRepository`): local JSON hoy; para otra nube se implementan 4 métodos y se añade una rama en `storage/__init__.py`. Ids hex de 32 caracteres validados por regex (evita path traversal).
6. **LLM tras una interfaz** (`PlanGenerator`) + `MockService`: desarrollo/tests sin API key y base para multi-proveedor.
7. **Modelo por defecto `claude-opus-5-5`**, thinking adaptativo, `effort=medium` (default de ese modelo). No se activó el parámetro de *fallbacks* del servidor (opcional; se puede añadir).
8. **Auth mínima** por `X-API-Key` opcional; es un placeholder, no autenticación de usuarios.
9. **UI:** estilo Vercel/Geist; claro/oscuro automático; contenido responsive (máx. 760 px en detalle, 960 px en lista).

## Diseño planeado: multi-LLM (pendiente de implementar)
- `backend/app/services/llm/`: `base.py` (clase `StructuredLLMPlanGenerator` con un único método abstracto `_complete(system, prompt) -> GeneratedPlan`; lógica común de prompts, validación de días, mapeo a `LLMError`), `anthropic.py`, `openai.py` (Structured Outputs con el modelo Pydantic), `gemini.py` (`google-genai` con `response_schema`), opcional `openai_compatible.py` (Ollama/vLLM/Groq/OpenRouter vía `base_url`).
- `build_generator` elige por `LLM_PROVIDER=anthropic|openai|gemini|mock`; `config.py` y `.env.example` ganan `LLM_PROVIDER`, `LLM_MODEL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`.
- Opcional: campo `provider` en `POST /plans` + selector en `NewPlanScreen`.
- **Riesgos:** cada proveedor soporta un subconjunto distinto de JSON Schema (campos opcionales y `Literal` en OpenAI/Gemini) → puede requerir simplificar `GeneratedPlan` o adaptar el esquema; calidad de costos/rutas varía → comparar con el mismo destino; los adaptadores se prueban con respuestas simuladas.
- No cambian: `models.py`, `stats.py`, `storage/`, pantallas (salvo el selector opcional).

## Convenciones
- Contrato de API: cambiar `backend/app/models.py` ⇒ actualizar `mobile/src/api/types.ts`.
- Cliente móvil lee `extra.apiUrl` / `extra.apiKey` de `mobile/app.json`.
- No guardar claves en el repo: `.env` está en `.gitignore`.
