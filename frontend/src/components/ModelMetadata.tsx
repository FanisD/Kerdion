import type { Prediction } from "@/lib/mockData";

const STYLES = {
  grid: "grid grid-cols-2 gap-4 sm:grid-cols-4",
  item: "flex flex-col gap-1",
  label: "text-xs text-zinc-500 dark:text-zinc-500",
  value: "text-sm font-medium text-black dark:text-zinc-50",
};

export function ModelMetadata({ history }: { history: Prediction[] }) {
  const latest = history[history.length - 1];
  const earliest = history[0];
  const modelsUsed = [...new Set(history.map((p) => p.model_used))];

  return (
    <div className={STYLES.grid}>
      <div className={STYLES.item}>
        <span className={STYLES.label}>Current model</span>
        <span className={STYLES.value}>{latest?.model_used ?? "—"}</span>
      </div>
      <div className={STYLES.item}>
        <span className={STYLES.label}>Models used</span>
        <span className={STYLES.value}>{modelsUsed.join(", ") || "—"}</span>
      </div>
      <div className={STYLES.item}>
        <span className={STYLES.label}>Predictions</span>
        <span className={STYLES.value}>{history.length}</span>
      </div>
      <div className={STYLES.item}>
        <span className={STYLES.label}>Since</span>
        <span className={STYLES.value}>
          {earliest ? new Date(earliest.timestamp).toLocaleString() : "—"}
        </span>
      </div>
    </div>
  );
}
