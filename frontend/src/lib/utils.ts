import type { RosterResponse } from "@/lib/api";

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
