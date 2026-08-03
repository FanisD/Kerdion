import Link from "next/link";
import type { RosterResponse } from "@/lib/api";

const STYLES = {
  card: "group flex flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl hover:shadow-[var(--accent-primary)]/10",
  pair: "text-lg font-bold tracking-wider text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]",
  model: "text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]",
  volatility: "text-2xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]",
  label: "text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]",
  sparkline: "text-[var(--accent-primary)] transition-all duration-300 drop-shadow-[0_0_8px_var(--accent-primary)] opacity-80 group-hover:opacity-100",
};

const SPARKLINE_WIDTH = 200;
const SPARKLINE_HEIGHT = 40;

function buildSparklinePath(values: number[]): string {
  if (values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * SPARKLINE_WIDTH;
    const y = SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return `M${points.join(" L")}`;
}

function Sparkline({ history }: { history: RosterResponse[] }) {
  const values = history
    .map((p) => p.models?.stgnn?.predicted_volatility)
    .filter((v): v is number => v !== undefined);
  const path = buildSparklinePath(values);

  if (!path) return null;

  return (
    <svg
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      className={`h-10 w-full ${STYLES.sparkline}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

export function PairCard({
  pair,
  latest,
  history,
}: {
  pair: string;
  latest: RosterResponse | undefined;
  history: RosterResponse[];
}) {
  const modelKeys = latest?.models ? Object.keys(latest.models) : [];
  const modelCount = modelKeys.length;

  const summaryParts = modelKeys.map((k) => {
    const val = latest!.models[k].predicted_volatility.toFixed(2);
    return `${k.toUpperCase()}: ${val}`;
  });

  const summaryString = summaryParts.join(" | ") || "—";

  return (
    <Link href={`/pairs/${pair}`} className={STYLES.card}>
      <div className="flex items-center justify-between">
        <span className={STYLES.pair}>{pair}</span>
        {modelCount > 0 && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {modelCount} Models
          </span>
        )}
      </div>
      <span className={STYLES.model}>{summaryString}</span>
      <span className={STYLES.volatility}>
        {latest?.models?.stgnn
          ? latest.models.stgnn.predicted_volatility.toFixed(4)
          : "—"}
      </span>
      <span className={STYLES.label}>predicted volatility (ST-GNN)</span>
      <Sparkline history={history} />
    </Link>
  );
}
