import type { RosterResponse } from "@/lib/api";

const STYLES = {
  table: "w-full text-left text-sm",
  th: "border-b border-[var(--border-strong)] pb-2 pr-4 font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]",
  td: "border-b border-[var(--border-subtle)] py-3 pr-4 text-[var(--text-primary)] tabular-nums",
};

export function PredictionTable({ history }: { history: RosterResponse[] }) {
  const rows = [...history].reverse();

  return (
    <div className="overflow-x-auto">
      <table className={STYLES.table}>
        <thead>
          <tr>
            <th className={STYLES.th}>Timestamp</th>
            <th className={STYLES.th}>GARCH</th>
            <th className={STYLES.th}>GRU</th>
            <th className={STYLES.th}>ST-GNN</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.timestamp}>
              <td className={STYLES.td}>{new Date(row.timestamp).toLocaleString()}</td>
              <td className={STYLES.td}>
                {row.models.garch?.predicted_volatility.toFixed(4) ?? "—"}
              </td>
              <td className={STYLES.td}>
                {row.models.gru?.predicted_volatility.toFixed(4) ?? "—"}
              </td>
              <td className={STYLES.td}>
                {row.models.stgnn?.predicted_volatility.toFixed(4) ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
