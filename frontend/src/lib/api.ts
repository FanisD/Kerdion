import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/auth";

export type Prediction = {
  id: number;
  timestamp: string;
  cryptocurrency_pair: string;
  model_used: string;
  predicted_volatility: number;
  actual_volatility_later: number | null;
};

export type ModelRosterMetrics = {
  predicted_volatility: number;
  qlike_score?: number | null;
  ci_lower_bound?: number | null;
  ci_upper_bound?: number | null;
  dm_statistic?: number | null;
  dm_p_value?: number | null;
  dm_significance_vs_naive?: string | null;
};

export type RosterResponse = {
  timestamp: string;
  cryptocurrency_pair: string;
  models: Record<string, ModelRosterMetrics>;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function fetchFromApi(path: string): Promise<Response | null> {
  const token = await getServerToken();
  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (res.status === 401) {
    redirect("/login");
  }

  return res;
}

export async function getAllPredictions(): Promise<ApiResult<RosterResponse[]>> {
  const res = await fetchFromApi("/api/v1/predictions/");
  if (!res) return { ok: false, error: "Could not reach the prediction service." };
  if (!res.ok) return { ok: false, error: "The prediction service returned an error." };
  return { ok: true, data: await res.json() };
}

export async function getPredictionsForPair(
  pair: string,
  hours = 24,
): Promise<ApiResult<RosterResponse[]>> {
  const res = await fetchFromApi(`/api/v1/predictions/${pair}?hours=${hours}`);
  if (!res) return { ok: false, error: "Could not reach the prediction service." };
  if (!res.ok) return { ok: false, error: "The prediction service returned an error." };
  return { ok: true, data: await res.json() };
}

export async function getTopologyMatrix(): Promise<ApiResult<number[][]>> {
  const res = await fetchFromApi("/api/v1/predictions/topology");
  if (!res) return { ok: false, error: "Could not reach the prediction service." };
  if (!res.ok) return { ok: false, error: "The prediction service returned an error." };
  return { ok: true, data: await res.json() };
}

export async function getDieboldMarianoResult(): Promise<ApiResult<any>> {
  const res = await fetchFromApi("/api/v1/predictions/dm-test");
  if (!res) return { ok: false, error: "Could not reach the prediction service." };
  if (!res.ok) return { ok: false, error: "The prediction service returned an error." };
  return { ok: true, data: await res.json() };
}

export function getLatestPrediction(history: RosterResponse[]): RosterResponse | undefined {
  return history[history.length - 1];
}

export function groupPredictionsByPair(predictions: RosterResponse[]): Record<string, RosterResponse[]> {
  const grouped: Record<string, RosterResponse[]> = {};
  for (const prediction of predictions) {
    const pair = prediction.cryptocurrency_pair;
    (grouped[pair] ??= []).push(prediction);
  }
  return grouped;
}