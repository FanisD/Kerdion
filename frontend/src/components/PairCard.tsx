import Link from "next/link";
import type { Prediction } from "@/lib/mockData";

const STYLES = {
  card: "flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20",
  pair: "text-lg font-semibold text-black dark:text-zinc-50",
  model: "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500",
  volatility: "text-2xl font-semibold tabular-nums text-black dark:text-zinc-50",
  label: "text-xs text-zinc-500 dark:text-zinc-500",
  sparkline: "text-cyan-600 dark:text-cyan-400",
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

function Sparkline({ history }: { history: Prediction[] }) {
  const values = history.map((p) => p.predicted_volatility);
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
  latest: Prediction | undefined;
  history: Prediction[];
}) {
  return (
    <Link href={`/pairs/${pair}`} className={STYLES.card}>
      <span className={STYLES.pair}>{pair}</span>
      <span className={STYLES.model}>{latest?.model_used ?? "—"}</span>
      <span className={STYLES.volatility}>
        {latest ? latest.predicted_volatility.toFixed(4) : "—"}
      </span>
      <span className={STYLES.label}>predicted volatility</span>
      <Sparkline history={history} />
    </Link>
  );
}
