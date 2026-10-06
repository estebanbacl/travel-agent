"""Domain models. Field names are camelCase on purpose: they match the JSON
contract shared with the mobile app (mobile/src/api/types.ts)."""
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

TravelStyle = Literal["budget", "balanced", "luxury", "adventure"]
BudgetStatus = Literal["under_budget", "on_budget", "over_budget"]


class TravelRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    durationDays: int = Field(ge=1, le=21)
    totalBudget: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    travelStyle: TravelStyle = "balanced"
    interests: list[str] = Field(default_factory=list, max_length=15)
    startingPoint: Optional[str] = None


class Coordinates(BaseModel):
    lat: float
    lng: float


class ActivityItem(BaseModel):
    timeSlot: Literal["Morning", "Afternoon", "Evening"]
    title: str
    description: str
    estimatedCost: float
    locationName: str
    coordinates: Optional[Coordinates] = None


class RouteSegment(BaseModel):
    fromLocation: str
    toLocation: str
    travelMode: Literal["walk", "transit", "taxi", "drive"]
    estimatedDurationMinutes: int
    estimatedCost: float


class DayItinerary(BaseModel):
    dayNumber: int
    theme: str
    activities: list[ActivityItem]
    routes: list[RouteSegment]
    dailyCostTotal: float = 0  # recomputed server-side; never trusted from the LLM


class GeneratedPlan(BaseModel):
    """What the LLM returns (structured output schema)."""

    destination: str
    days: list[DayItinerary]
    estimatedAccommodationTotal: float
    estimatedFoodTotal: float


class CostBreakdown(BaseModel):
    accommodation: float
    activities: float
    transit: float
    food: float
    total: float
    budget: float
    variance: float  # total - budget (positive = over)


class TravelPlan(BaseModel):
    id: str
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    request: TravelRequest
    destination: str
    totalDays: int
    totalEstimatedCost: float
    budgetStatus: BudgetStatus
    breakdown: CostBreakdown
    days: list[DayItinerary]


class RefineRequest(BaseModel):
    instruction: str = Field(min_length=3, max_length=1000)
    dayNumber: Optional[int] = Field(default=None, ge=1)


class PlanSummary(BaseModel):
    id: str
    createdAt: str
    destination: str
    totalDays: int
    totalEstimatedCost: float
    currency: str
    budgetStatus: BudgetStatus
