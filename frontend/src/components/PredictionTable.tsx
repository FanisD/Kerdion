import type { RosterResponse } from "@/lib/api";

const STYLES = {
  wrapper: "overflow-x-auto rounded-2xl glass-panel",
  table: "w-full text-left text-sm",
  th: "border-b border-[var(--border-strong)] p-4 font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]",
  td: "border-b border-[var(--border-subtle)] p-4 text-[var(--text-primary)] tabular-nums",
  winner: "text-amber-400 font-bold drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]",
};

export function PredictionTable({ history }: { history: RosterResponse[] }) {
  // Show last 20 ticks
  const rows = [...history].reverse().slice(0, 20);

  return (
    <div className={STYLES.wrapper}>
      <table className={STYLES.table}>
        <thead>
          <tr>
            <th className={STYLES.th}>Timestamp</th>
            <th className={STYLES.th}>Model</th>
            <th className={STYLES.th}>Predicted Volatility</th>
            <th className={STYLES.th}>QLIKE Score</th>
            <th className={STYLES.th}>95% CI</th>
          </tr>
        </thead>
        <tbody>
          {rows.flatMap((row) => {
            const models = row.models;
            let bestModel = "";
            let minQlike = Infinity;
            for (const [name, metrics] of Object.entries(models)) {
              if (metrics.qlike_score != null && metrics.qlike_score < minQlike) {
                minQlike = metrics.qlike_score;
                bestModel = name;
              }
            }

            return Object.entries(models).map(([name, metrics]) => {
              const isBest = name === bestModel;
              const textClass = isBest ? STYLES.winner : "";
              return (
                <tr key={`${row.timestamp}-${name}`} className="transition-colors hover:bg-[var(--bg-surface-hover)]">
                  <td className={STYLES.td}>{new Date(row.timestamp).toLocaleTimeString()}</td>
                  <td className={`${STYLES.td} font-semibold uppercase ${textClass}`}>{name}</td>
                  <td className={`${STYLES.td} ${textClass}`}>{metrics.predicted_volatility.toFixed(4)}</td>
                  <td className={`${STYLES.td} ${textClass}`}>{metrics.qlike_score?.toFixed(6) ?? "—"}</td>
                  <td className={`${STYLES.td} text-[var(--text-secondary)] text-xs`}>
                    {metrics.ci_lower_bound != null && metrics.ci_upper_bound != null 
                      ? `[${metrics.ci_lower_bound.toFixed(4)} - ${metrics.ci_upper_bound.toFixed(4)}]` 
                      : "—"}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}
