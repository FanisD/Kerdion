import type { RosterResponse } from "@/lib/api";

const STYLES = {
  table: "w-full text-left text-sm",
  th: "border-b border-black/10 pb-2 pr-4 font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-400",
  td: "border-b border-black/5 py-2 pr-4 text-black dark:border-white/5 dark:text-zinc-50",
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
