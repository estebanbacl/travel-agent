# AI Travel Planner

React Native (Expo) app + FastAPI backend. Claude generates day-by-day itineraries with routes and itemized costs; the user can refine them ("make day 2 cheaper").

```
backend/   FastAPI, Anthropic SDK (structured outputs), pluggable storage
mobile/    Expo + TypeScript (React Navigation)
```

## Backend
Requires Python >= 3.10.
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set ANTHROPIC_API_KEY, or LLM_MODE=mock to run offline
uvicorn app.main:app --reload --host 0.0.0.0
pytest                      # runs against the mock generator
```
Endpoints: `POST /plans`, `GET /plans`, `GET /plans/{id}`, `POST /plans/{id}/refine`, `DELETE /plans/{id}`, `GET /health`. Docs at `/docs`.

## Mobile
```bash
cd mobile
npm install
npx expo install --fix      # aligns native package versions with the installed Expo SDK
# set extra.apiUrl in app.json (use your machine's LAN IP on a physical device, 10.0.2.2 on Android emulator)
npx expo start
```

## Design notes
- **Server owns the math.** Claude estimates item costs; `services/stats.py` computes daily/total costs, variance and `budgetStatus` (±5% = on budget).
- **Storage is a `PlanRepository` protocol** (`backend/app/storage/`). Local JSON files by default; `s3.py` is a scaffold. To add GCS/Azure/Firestore/Postgres, implement the 4 methods and add a branch in `storage/__init__.py`.
- **LLM is behind `PlanGenerator`**; `LLM_MODE=mock` gives deterministic plans for dev/tests. Model and effort come from env (`CLAUDE_MODEL`, `CLAUDE_EFFORT`).
- Optional shared-secret auth via `APP_API_KEY` / `X-API-Key` (set `extra.apiKey` in the app). Replace with real user auth before a public deploy.
- Not yet included: user accounts, streaming progress during generation, real routing/pricing APIs (Mapbox/OSM, exchange rates), PDF export.
