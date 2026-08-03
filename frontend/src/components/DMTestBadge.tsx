import { ModelRosterMetrics } from "@/lib/api";

export function DMTestBadge({ metrics }: { metrics: ModelRosterMetrics }) {
  if (!metrics.dm_significance_vs_naive) return null;

  let color =
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700/50";
  let label = "Not Significant";

  if (metrics.dm_significance_vs_naive === "better") {
    color =
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50";
    label = "ST-GNN Significantly Better";
  } else if (metrics.dm_significance_vs_naive === "worse") {
    color =
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50";
    label = "ST-GNN Significantly Worse";
  } else if (metrics.dm_significance_vs_naive !== "not_significant") {
    label = metrics.dm_significance_vs_naive;
  }

  return (
    <div
      className={`inline-flex items-center gap-4 rounded-lg border px-3 py-2 text-xs shadow-sm ${color}`}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
          Diebold-Mariano Test
        </span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex flex-col border-l border-current/20 pl-4 text-right tabular-nums opacity-80">
        <span>DM: {metrics.dm_statistic?.toFixed(3) ?? "—"}</span>
        <span>p: {metrics.dm_p_value?.toFixed(4) ?? "—"}</span>
      </div>
    </div>
  );
}
