import anthropic

from app.config import Settings
from app.models import GeneratedPlan, TravelPlan, TravelRequest
from app.prompts.travel_agent import SYSTEM_PROMPT, build_generate_prompt, build_refine_prompt


class LLMError(Exception):
    """Raised for any failure obtaining a usable plan from the model."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


class PlanGenerator:
    def generate(self, req: TravelRequest) -> GeneratedPlan:
        raise NotImplementedError

    def refine(self, plan: TravelPlan, instruction: str, day_number: int | None) -> GeneratedPlan:
        raise NotImplementedError


class ClaudeService(PlanGenerator):
    def __init__(self, settings: Settings):
        self._s = settings
        self._client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY / profile

    def _run(self, prompt: str) -> GeneratedPlan:
        try:
            resp = self._client.messages.parse(
                model=self._s.claude_model,
                max_tokens=self._s.claude_max_tokens,
                thinking={"type": "adaptive"},
                output_config={"effort": self._s.claude_effort},
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                output_format=GeneratedPlan,
            )
        except anthropic.RateLimitError as e:
            raise LLMError("Rate limited by the model provider", 429) from e
        except anthropic.APIConnectionError as e:
            raise LLMError("Cannot reach the model provider") from e
        except anthropic.APIStatusError as e:
            raise LLMError(f"Model provider error ({e.status_code})") from e

        if resp.stop_reason == "refusal":
            raise LLMError("The model declined this request", 422)
        if resp.stop_reason == "max_tokens" or resp.parsed_output is None:
            raise LLMError("The model returned an incomplete plan; try fewer days")
        return resp.parsed_output

    def generate(self, req: TravelRequest) -> GeneratedPlan:
        gen = self._run(build_generate_prompt(req))
        self._check_days(gen, req.durationDays)
        return gen

    def refine(self, plan: TravelPlan, instruction: str, day_number: int | None) -> GeneratedPlan:
        if day_number and day_number > plan.totalDays:
            raise LLMError(f"Day {day_number} is outside the plan", 422)
        gen = self._run(build_refine_prompt(plan, instruction, day_number))
        self._check_days(gen, plan.totalDays)
        return gen

    @staticmethod
    def _check_days(gen: GeneratedPlan, expected: int) -> None:
        if len(gen.days) != expected:
            raise LLMError(f"Model returned {len(gen.days)} days, expected {expected}")
        for i, d in enumerate(gen.days, start=1):
            d.dayNumber = i


_MOCK_CATALOG = {
    "food": [("Market breakfast and coffee", "Start slowly at a busy local market: fresh pastries, strong coffee and people-watching.", 0.04),
             ("Street-food crawl", "Graze through the neighborhood's best stalls, three or four small tastings instead of one big meal.", 0.07),
             ("Dinner at a family-run restaurant", "A long, relaxed dinner built around regional specialties and the house wine.", 0.12)],
    "museums": [("Main city museum", "Go early to beat the crowds and focus on the two or three galleries you care about most.", 0.08),
                ("Small gallery and courtyard cafe", "A quieter, lesser-known collection followed by coffee in the courtyard.", 0.05),
                ("Late-opening exhibition", "Evening hours mean thinner crowds and a different light on the work.", 0.06)],
    "hiking": [("Sunrise trail to the viewpoint", "A moderate climb that rewards you with the best panorama of the area.", 0.02),
               ("Riverside or coastal walk", "Flat, scenic path with plenty of places to stop and swim or picnic.", 0.01),
               ("Golden-hour ridge walk", "Short evening hike timed for sunset; bring a light jacket.", 0.01)],
}
_MOCK_GENERIC = [
    ("Old town walking tour", "Wander the historic center with a local guide who knows the stories behind the buildings.", 0.06),
    ("Neighborhood lunch and a stroll", "Pick a busy lunch spot away from the main square, then explore the side streets.", 0.08),
    ("Sunset viewpoint and dinner", "Catch the sunset from the best lookout in town, then eat nearby.", 0.1),
]
_MOCK_PLACES = ["Old Town", "Central Market", "Riverfront", "Arts District", "Hilltop Park", "Harbor Quarter"]


class MockService(PlanGenerator):
    """Deterministic offline generator so the app runs without an API key."""

    def generate(self, req: TravelRequest) -> GeneratedPlan:
        per_day = req.totalBudget / req.durationDays
        interests = [i.lower() for i in req.interests] or [""]
        days = []
        for n in range(1, req.durationDays + 1):
            key = interests[(n - 1) % len(interests)]
            options = _MOCK_CATALOG.get(key, _MOCK_GENERIC)
            acts = []
            for i, slot in enumerate(["Morning", "Afternoon", "Evening"]):
                title, desc, share = options[i]
                place = _MOCK_PLACES[(n + i) % len(_MOCK_PLACES)]
                acts.append(
                    {
                        "timeSlot": slot,
                        "title": title,
                        "description": desc,
                        "estimatedCost": round(per_day * share, 2),
                        "locationName": f"{place}, {req.destination}",
                    }
                )
            routes = [
                {
                    "fromLocation": acts[i]["locationName"],
                    "toLocation": acts[i + 1]["locationName"],
                    "travelMode": "walk" if i == 0 else "transit",
                    "estimatedDurationMinutes": 12 + 8 * i,
                    "estimatedCost": 0 if i == 0 else round(per_day * 0.02, 2),
                }
                for i in range(2)
            ]
            theme = key.title() if key else "Highlights"
            days.append({"dayNumber": n, "theme": f"{theme} day in {req.destination}", "activities": acts, "routes": routes})
        return GeneratedPlan.model_validate(
            {
                "destination": req.destination,
                "days": days,
                "estimatedAccommodationTotal": round(req.totalBudget * 0.4, 2),
                "estimatedFoodTotal": round(req.totalBudget * 0.25, 2),
            }
        )

    def refine(self, plan: TravelPlan, instruction: str, day_number: int | None) -> GeneratedPlan:
        gen = GeneratedPlan(
            destination=plan.destination,
            days=[d.model_copy(deep=True) for d in plan.days],
            estimatedAccommodationTotal=plan.breakdown.accommodation,
            estimatedFoodTotal=plan.breakdown.food,
        )
        for d in gen.days:
            if day_number is None or d.dayNumber == day_number:
                d.theme = f"{d.theme} (revised: {instruction[:40]})"
        return gen


def build_generator(settings: Settings) -> PlanGenerator:
    return MockService() if settings.llm_mode == "mock" else ClaudeService(settings)
