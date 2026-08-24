export function HitRateScoreboard({
  stats,
}: {
  stats: Record<string, { total: number; hits: number; hit_rate: number }>;
}) {
  const models = ["stgnn", "garch", "gru"];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {models.map((model) => {
        const data = stats[model] || { total: 0, hits: 0, hit_rate: 0 };
        const percentage = Math.round(data.hit_rate * 100);
        
        let colorClass = "text-zinc-500 bg-zinc-500/10";
        if (data.total > 0) {
          if (percentage >= 70) colorClass = "text-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
          else if (percentage >= 50) colorClass = "text-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
          else colorClass = "text-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
        }

        return (
          <div
            key={model}
            className={`flex flex-col gap-3 rounded-2xl border border-black/5 p-5 transition-all dark:border-white/5 dark:bg-zinc-950 ${
              data.total > 0 ? "hover:border-white/20" : ""
            } ${colorClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase text-zinc-900 dark:text-zinc-100">
                {model}
              </span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                30-Day Hit Rate
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tighter">
                {data.total > 0 ? `${percentage}%` : "—"}
              </span>
              <span className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                ({data.hits}/{data.total})
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-900">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: data.total > 0 ? "currentColor" : "transparent",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
