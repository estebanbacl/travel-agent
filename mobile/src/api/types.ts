// Mirrors backend/app/models.py
export type TravelStyle = 'budget' | 'balanced' | 'luxury' | 'adventure';
export type BudgetStatus = 'under_budget' | 'on_budget' | 'over_budget';

export interface TravelRequest {
  destination: string;
  durationDays: number;
  totalBudget: number;
  currency: string;
  travelStyle: TravelStyle;
  interests: string[];
  startingPoint?: string;
}

export interface ActivityItem {
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  estimatedCost: number;
  locationName: string;
  coordinates?: { lat: number; lng: number } | null;
}

export interface RouteSegment {
  fromLocation: string;
  toLocation: string;
  travelMode: 'walk' | 'transit' | 'taxi' | 'drive';
  estimatedDurationMinutes: number;
  estimatedCost: number;
}

export interface DayItinerary {
  dayNumber: number;
  theme: string;
  activities: ActivityItem[];
  routes: RouteSegment[];
  dailyCostTotal: number;
}

export interface CostBreakdown {
  accommodation: number;
  activities: number;
  transit: number;
  food: number;
  total: number;
  budget: number;
  variance: number;
}

export interface TravelPlan {
  id: string;
  createdAt: string;
  request: TravelRequest;
  destination: string;
  totalDays: number;
  totalEstimatedCost: number;
  budgetStatus: BudgetStatus;
  breakdown: CostBreakdown;
  days: DayItinerary[];
}

export interface PlanSummary {
  id: string;
  createdAt: string;
  destination: string;
  totalDays: number;
  totalEstimatedCost: number;
  currency: string;
  budgetStatus: BudgetStatus;
}
