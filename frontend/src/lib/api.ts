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

export async function getAllPredictions(): Promise<ApiResult<Prediction[]>> {
  const res = await fetchFromApi("/api/v1/predictions/");
  if (!res) return { ok: false, error: "Could not reach the prediction service." };
  if (!res.ok) return { ok: false, error: "The prediction service returned an error." };
  return { ok: true, data: await res.json() };
}

export async function getPredictionsForPair(
  pair: string,
  hours = 24,
): Promise<ApiResult<Prediction[]>> {
  const res = await fetchFromApi(`/api/v1/predictions/${pair}?hours=${hours}`);
  if (!res) return { ok: false, error: "Could not reach the prediction service." };
  if (!res.ok) return { ok: false, error: "The prediction service returned an error." };
  return { ok: true, data: await res.json() };
}

export function getLatestPrediction(history: Prediction[]): Prediction | undefined {
  return history[history.length - 1];
}

export function groupPredictionsByPair(predictions: Prediction[]): Record<string, Prediction[]> {
  const grouped: Record<string, Prediction[]> = {};
  for (const prediction of predictions) {
    const pair = prediction.cryptocurrency_pair;
    (grouped[pair] ??= []).push(prediction);
  }
  return grouped;
}
