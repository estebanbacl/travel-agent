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


class MockService(PlanGenerator):
    """Deterministic offline generator so the app runs without an API key."""

    def generate(self, req: TravelRequest) -> GeneratedPlan:
        per_day = req.totalBudget / req.durationDays
        days = []
        for n in range(1, req.durationDays + 1):
            theme = (req.interests[(n - 1) % len(req.interests)] if req.interests else "Highlights").title()
            slots = ["Morning", "Afternoon", "Evening"]
            acts = [
                {
                    "timeSlot": s,
                    "title": f"{theme} stop {i + 1}",
                    "description": f"Mock {s.lower()} activity in {req.destination}.",
                    "estimatedCost": round(per_day * 0.08, 2),
                    "locationName": f"{req.destination} spot {n}.{i + 1}",
                }
                for i, s in enumerate(slots)
            ]
            routes = [
                {
                    "fromLocation": acts[i]["locationName"],
                    "toLocation": acts[i + 1]["locationName"],
                    "travelMode": "walk" if i == 0 else "transit",
                    "estimatedDurationMinutes": 15 + 5 * i,
                    "estimatedCost": 0 if i == 0 else round(per_day * 0.02, 2),
                }
                for i in range(2)
            ]
            days.append({"dayNumber": n, "theme": f"{theme} in {req.destination}", "activities": acts, "routes": routes})
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
