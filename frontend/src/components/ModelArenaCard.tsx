import { ModelRosterMetrics } from "@/lib/api";

const MODEL_COLORS: Record<string, string> = {
  garch: "bg-orange-500",
  gru: "bg-purple-500",
  stgnn: "bg-cyan-500",
};

const STYLES = {
  card: "relative flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950",
  header: "flex items-center justify-between",
  titleWrap: "flex items-center gap-2",
  dot: (modelName: string) => `h-2.5 w-2.5 rounded-full ${MODEL_COLORS[modelName.toLowerCase()] || "bg-zinc-500"}`,
  title: "text-sm font-medium uppercase tracking-wider text-black dark:text-zinc-50",
  crown: "text-lg",
  valueWrap: "flex flex-col gap-1",
  valueLabel: "text-xs text-zinc-500 dark:text-zinc-400",
  value: "text-3xl font-bold tabular-nums text-black dark:text-zinc-50",
  footer: "mt-2 flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/5",
  row: "flex items-center justify-between text-xs",
  rowLabel: "text-zinc-600 dark:text-zinc-400",
  qlikeBadge: (isBest: boolean) =>
    `rounded-md px-2 py-1 font-medium tabular-nums ${
      isBest
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    }`,
  ciValue: "font-medium tabular-nums text-zinc-700 dark:text-zinc-300",
};

export function ModelArenaCard({
  modelName,
  metrics,
  isBest = false,
}: {
  modelName: string;
  metrics: ModelRosterMetrics;
  isBest?: boolean;
}) {
  return (
    <div className={STYLES.card}>
      <div className={STYLES.header}>
        <div className={STYLES.titleWrap}>
          <span className={STYLES.dot(modelName)} />
          <h3 className={STYLES.title}>{modelName}</h3>
        </div>
        {isBest && <span className={STYLES.crown} title="Best Model">👑</span>}
      </div>

      <div className={STYLES.valueWrap}>
        <span className={STYLES.valueLabel}>Predicted Volatility</span>
        <span className={STYLES.value}>
          {metrics.predicted_volatility.toFixed(4)}
        </span>
      </div>

      <div className={STYLES.footer}>
        <div className={STYLES.row}>
          <span className={STYLES.rowLabel}>QLIKE Score</span>
          {metrics.qlike_score != null ? (
            <span className={STYLES.qlikeBadge(isBest)}>
              {metrics.qlike_score.toFixed(6)}
            </span>
          ) : (
            <span className={STYLES.rowLabel}>N/A</span>
          )}
        </div>
        
        <div className={STYLES.row}>
          <span className={STYLES.rowLabel}>95% CI</span>
          <span className={STYLES.ciValue}>
            {metrics.ci_lower_bound != null && metrics.ci_upper_bound != null
              ? `[${metrics.ci_lower_bound.toFixed(4)} — ${metrics.ci_upper_bound.toFixed(4)}]`
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
