import Constants from 'expo-constants';
import type { PlanSummary, TravelPlan, TravelRequest } from './types';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; apiKey?: string };
const BASE_URL = extra.apiUrl ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(extra.apiKey ? { 'X-API-Key': extra.apiKey } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  listPlans: () => request<PlanSummary[]>('/plans'),
  getPlan: (id: string) => request<TravelPlan>(`/plans/${id}`),
  createPlan: (req: TravelRequest) =>
    request<TravelPlan>('/plans', { method: 'POST', body: JSON.stringify(req) }),
  refinePlan: (id: string, instruction: string, dayNumber?: number) =>
    request<TravelPlan>(`/plans/${id}/refine`, {
      method: 'POST',
      body: JSON.stringify({ instruction, dayNumber }),
    }),
  deletePlan: (id: string) => request<void>(`/plans/${id}`, { method: 'DELETE' }),
};
