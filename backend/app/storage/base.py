from typing import Protocol

from app.models import PlanSummary, TravelPlan


class PlanRepository(Protocol):
    """Storage contract. Implement this to plug in any cloud backend
    (S3, GCS, Azure Blob, Firestore, DynamoDB, Postgres...)."""

    def list(self) -> list[PlanSummary]: ...
    def get(self, plan_id: str) -> TravelPlan | None: ...
    def save(self, plan: TravelPlan) -> None: ...
    def delete(self, plan_id: str) -> bool: ...


def summarize(plan: TravelPlan) -> PlanSummary:
    return PlanSummary(
        id=plan.id,
        createdAt=plan.createdAt,
        destination=plan.destination,
        totalDays=plan.totalDays,
        totalEstimatedCost=plan.totalEstimatedCost,
        currency=plan.request.currency,
        budgetStatus=plan.budgetStatus,
    )
