"""Server-side cost aggregation. The LLM estimates items; we do the arithmetic."""
import uuid

from app.models import (
    CostBreakdown,
    GeneratedPlan,
    TravelPlan,
    TravelRequest,
)

ON_BUDGET_TOLERANCE = 0.05


def finalize_plan(
    gen: GeneratedPlan,
    request: TravelRequest,
    plan_id: str | None = None,
    created_at: str | None = None,
) -> TravelPlan:
    activities = transit = 0.0
    for day in gen.days:
        a = sum(x.estimatedCost for x in day.activities)
        t = sum(r.estimatedCost for r in day.routes)
        day.dailyCostTotal = round(a + t, 2)
        activities += a
        transit += t

    total = round(
        activities + transit + gen.estimatedAccommodationTotal + gen.estimatedFoodTotal, 2
    )
    budget = request.totalBudget
    ratio = total / budget
    if ratio > 1 + ON_BUDGET_TOLERANCE:
        status = "over_budget"
    elif ratio < 1 - ON_BUDGET_TOLERANCE:
        status = "under_budget"
    else:
        status = "on_budget"

    extra = {"createdAt": created_at} if created_at else {}
    return TravelPlan(
        id=plan_id or uuid.uuid4().hex,
        request=request,
        destination=gen.destination,
        totalDays=len(gen.days),
        totalEstimatedCost=total,
        budgetStatus=status,
        breakdown=CostBreakdown(
            accommodation=round(gen.estimatedAccommodationTotal, 2),
            activities=round(activities, 2),
            transit=round(transit, 2),
            food=round(gen.estimatedFoodTotal, 2),
            total=total,
            budget=budget,
            variance=round(total - budget, 2),
        ),
        days=gen.days,
        **extra,
    )
