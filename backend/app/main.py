from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.deps import get_generator, get_repo, require_api_key
from app.models import PlanSummary, RefineRequest, TravelPlan, TravelRequest
from app.services.claude_service import LLMError, PlanGenerator
from app.services.stats import finalize_plan
from app.storage.base import PlanRepository

app = FastAPI(title="AI Travel Planner API", version="0.1.0")
_origins = [o.strip() for o in get_settings().cors_origins.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(LLMError)
async def llm_error_handler(_, exc: LLMError):
    return JSONResponse({"detail": str(exc)}, status_code=exc.status_code)


@app.get("/health")
def health():
    s = get_settings()
    return {"status": "ok", "llmMode": s.llm_mode, "storage": s.storage_backend}


api = [Depends(require_api_key)]


@app.post("/plans", response_model=TravelPlan, status_code=201, dependencies=api)
def create_plan(
    req: TravelRequest,
    gen: PlanGenerator = Depends(get_generator),
    repo: PlanRepository = Depends(get_repo),
):
    plan = finalize_plan(gen.generate(req), req)
    repo.save(plan)
    return plan


@app.get("/plans", response_model=list[PlanSummary], dependencies=api)
def list_plans(repo: PlanRepository = Depends(get_repo)):
    return repo.list()


@app.get("/plans/{plan_id}", response_model=TravelPlan, dependencies=api)
def get_plan(plan_id: str, repo: PlanRepository = Depends(get_repo)):
    plan = repo.get(plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    return plan


@app.post("/plans/{plan_id}/refine", response_model=TravelPlan, dependencies=api)
def refine_plan(
    plan_id: str,
    body: RefineRequest,
    gen: PlanGenerator = Depends(get_generator),
    repo: PlanRepository = Depends(get_repo),
):
    plan = repo.get(plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    new_gen = gen.refine(plan, body.instruction, body.dayNumber)
    updated = finalize_plan(new_gen, plan.request, plan_id=plan.id, created_at=plan.createdAt)
    repo.save(updated)
    return updated


@app.delete("/plans/{plan_id}", status_code=204, dependencies=api)
def delete_plan(plan_id: str, repo: PlanRepository = Depends(get_repo)):
    if not repo.delete(plan_id):
        raise HTTPException(404, "Plan not found")
