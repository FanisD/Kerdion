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

// ==========================================
// Price Data (public — no auth required)
// ==========================================

export type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  realized_volatility: number | null;
};
export type AccuracyStats = {
  [model: string]: {
    total: number;
    hits: number;
    hit_rate: number;
    rmse: number | null;
    mae: number | null;
    avg_qlike: number | null;
    n_evaluated: number;
  };
};

export async function getPredictionAccuracy(pair: string): Promise<{ ok: boolean; data: AccuracyStats; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/predictions/${pair}/accuracy`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) throw new Error("Failed to fetch accuracy stats");
    const data = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, data: {}, error: err.message };
  }
}
export async function getPricesForPair(
  pair: string,
  days = 30,
): Promise<ApiResult<Candle[]>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  let res: Response;
  try {
    res = await fetch(`${apiUrl}/api/v1/prices/${pair}?days=${days}`, {
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach the price service." };
  }
  if (!res.ok) return { ok: false, error: "The price service returned an error." };
  return { ok: true, data: await res.json() };
}
