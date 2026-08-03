import { ModelRosterMetrics } from "@/lib/api";

const MODEL_COLORS: Record<string, string> = {
  garch: "bg-orange-500",
  gru: "bg-purple-500",
  stgnn: "bg-cyan-500",
};

const STYLES = {
  card: "relative flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl hover:shadow-[var(--accent-primary)]/10",
  header: "flex items-center justify-between",
  titleWrap: "flex items-center gap-2",
  dot: (modelName: string) => `h-2.5 w-2.5 rounded-full shadow-sm ${MODEL_COLORS[modelName.toLowerCase()] || "bg-zinc-500"}`,
  title: "text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]",
  crown: "text-lg animate-pulse drop-shadow-md",
  valueWrap: "flex flex-col gap-1",
  valueLabel: "text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]",
  value: "text-3xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]",
  footer: "mt-2 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-3",
  row: "flex items-center justify-between text-xs",
  rowLabel: "font-medium text-[var(--text-secondary)]",
  qlikeBadge: (isBest: boolean) =>
    `rounded-md px-2 py-1 font-bold tabular-nums shadow-sm transition-colors ${
      isBest
        ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30"
        : "bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
    }`,
  ciValue: "font-mono font-medium tabular-nums text-[var(--text-primary)]/80",
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
