import json

from app.models import TravelPlan, TravelRequest

SYSTEM_PROMPT = """You are an expert, highly meticulous Travel Agent AI.
Your goal is to build an optimized, realistic day-by-day travel itinerary with sensible routes and accurate cost estimations based on the user's requirements.

Rules:
1. Ground all costs in realistic estimations for the given destination, expressed in the user's currency.
2. Group activities by geographical proximity each day to minimize travel time and transit costs.
3. Keep total costs (accommodation + food + activities + transit) within or close to the specified total budget.
4. Each day has Morning, Afternoon and Evening activities and route segments connecting consecutive locations.
5. estimatedAccommodationTotal and estimatedFoodTotal cover the whole trip; activity and route costs are per item.
6. Include approximate coordinates when you are confident of them; otherwise omit them."""


def build_generate_prompt(req: TravelRequest) -> str:
    return (
        "Create a travel plan for this request:\n"
        f"{req.model_dump_json(indent=2)}\n"
        f"The plan must contain exactly {req.durationDays} days, numbered from 1."
    )


def build_refine_prompt(plan: TravelPlan, instruction: str, day_number: int | None) -> str:
    scope = (
        f"Only change Day {day_number}; keep every other day identical."
        if day_number
        else "You may adjust any day if needed."
    )
    current = {
        "destination": plan.destination,
        "days": [d.model_dump(mode="json") for d in plan.days],
        "estimatedAccommodationTotal": plan.breakdown.accommodation,
        "estimatedFoodTotal": plan.breakdown.food,
    }
    return (
        f"Original request:\n{plan.request.model_dump_json(indent=2)}\n\n"
        f"Current plan:\n{json.dumps(current, ensure_ascii=False)}\n\n"
        f"User change request: {instruction}\n{scope}\n"
        "Return the complete updated plan."
    )
