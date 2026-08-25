"use client";

const MODEL_COLORS: Record<string, string> = {
  stgnn: "text-cyan-400",
  garch: "text-orange-400",
  gru: "text-purple-400",
};

const MODEL_GLOWS: Record<string, string> = {
  stgnn: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
  garch: "shadow-[0_0_15px_rgba(249,115,22,0.15)]",
  gru: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
};

function MetricPill({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-zinc-200">
        {value !== null ? `${value.toFixed(4)}${unit ?? ""}` : "—"}
      </span>
    </div>
  );
}

export function HitRateScoreboard({
  stats,
}: {
  stats: Record<string, { total: number; hits: number; hit_rate: number; rmse: number | null; mae: number | null; avg_qlike: number | null; n_evaluated: number }>;
}) {
  const models = ["stgnn", "garch", "gru"];

  // Find the model with the best (lowest) RMSE to highlight
  let bestRmseModel: string | null = null;
  let bestRmse = Infinity;
  for (const model of models) {
    const rmse = stats[model]?.rmse;
    if (rmse !== null && rmse !== undefined && rmse < bestRmse) {
      bestRmse = rmse;
      bestRmseModel = model;
    }
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {models.map((model) => {
        const data = stats[model] || { total: 0, hits: 0, hit_rate: 0, rmse: null, mae: null, avg_qlike: null, n_evaluated: 0 };
        const percentage = Math.round(data.hit_rate * 100);
        const isBest = model === bestRmseModel;

        let hitRateColor = "text-zinc-500";
        if (data.total > 0) {
          if (percentage >= 70) hitRateColor = "text-emerald-400";
          else if (percentage >= 50) hitRateColor = "text-yellow-400";
          else hitRateColor = "text-red-400";
        }

        return (
          <div
            key={model}
            className={`relative flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-300 ${
              isBest
                ? "border-amber-500/30 bg-amber-500/[0.03] " + (MODEL_GLOWS[model] ?? "")
                : "border-white/5 bg-zinc-950 hover:border-white/10"
            }`}
          >
            {/* Model Header */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold tracking-widest uppercase ${MODEL_COLORS[model] ?? "text-zinc-100"}`}>
                {model === "stgnn" ? "ST-GNN" : model.toUpperCase()}
              </span>
              {isBest && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                  Best
                </span>
              )}
            </div>

            {/* Hit Rate */}
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold tracking-tighter ${hitRateColor}`}>
                {data.total > 0 ? `${percentage}%` : "—"}
              </span>
              <span className="mb-1 text-sm text-zinc-500">
                hit rate ({data.hits}/{data.total})
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: percentage >= 70 ? "#34d399" : percentage >= 50 ? "#facc15" : "#f87171",
                }}
              />
            </div>

            {/* Metric Pills */}
            <div className="mt-1 flex flex-col gap-1.5">
              <MetricPill label="RMSE" value={data.rmse} />
              <MetricPill label="MAE" value={data.mae} />
              <MetricPill label="Avg QLIKE" value={data.avg_qlike} />
            </div>

            {data.n_evaluated > 0 && (
              <p className="text-[11px] text-zinc-600">
                Based on {data.n_evaluated} evaluated prediction{data.n_evaluated !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
