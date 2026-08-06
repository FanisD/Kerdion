import { ModelRosterMetrics } from "@/lib/api";

export function DMTestBadge({ metrics }: { metrics: ModelRosterMetrics }) {
  if (!metrics.dm_significance_vs_naive) return null;

  let containerClass = "glass-panel border-[var(--border-subtle)]";
  let label = "Not Significant";
  let glowClass = "";

  if (metrics.dm_significance_vs_naive === "better") {
    containerClass = "glass-panel border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
    label = "Statistically Significant (Better)";
    glowClass = "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]";
  } else if (metrics.dm_significance_vs_naive === "worse") {
    containerClass = "glass-panel border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]";
    label = "Statistically Significant (Worse)";
    glowClass = "text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.8)]";
  } else if (metrics.dm_significance_vs_naive !== "not_significant") {
    label = metrics.dm_significance_vs_naive;
  }

  return (
    <div className={`inline-flex items-center gap-4 rounded-xl px-4 py-2 ${containerClass}`}>
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Diebold-Mariano Test
        </span>
        <span className={`font-bold tracking-wide ${glowClass || "text-[var(--text-primary)]"}`}>
          {label}
        </span>
      </div>
      <div className="flex flex-col border-l border-[var(--border-strong)] pl-4 text-right tabular-nums text-xs text-[var(--text-secondary)]">
        <span>DM: {metrics.dm_statistic?.toFixed(3) ?? "—"}</span>
        <span>p: {metrics.dm_p_value?.toFixed(4) ?? "—"}</span>
      </div>
    </div>
  );
}
