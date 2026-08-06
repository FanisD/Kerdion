import Link from "next/link";
import type { RosterResponse } from "@/lib/api";

const STYLES = {
  card: (isPulsing: boolean) => `group relative flex flex-col gap-3 rounded-2xl border bg-[var(--bg-surface)]/60 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
    isPulsing 
      ? "border-[var(--accent-primary)] shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-[1.02] bg-[var(--bg-surface-hover)]" 
      : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-[var(--accent-primary)]/10"
  }`,
  header: "flex items-center justify-between",
  pair: "text-lg font-bold tracking-wider text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]",
  trendUp: "text-emerald-400 font-bold",
  trendDown: "text-rose-400 font-bold",
  trendFlat: "text-[var(--text-secondary)] font-bold",
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
  isPulsing = false,
}: {
  pair: string;
  latest: RosterResponse | undefined;
  history: RosterResponse[];
  isPulsing?: boolean;
}) {
  const prev = history.length >= 2 ? history[history.length - 2] : undefined;
  const currentVol = latest?.models?.stgnn?.predicted_volatility ?? 0;
  const prevVol = prev?.models?.stgnn?.predicted_volatility ?? currentVol;
  const trend = currentVol > prevVol ? "up" : currentVol < prevVol ? "down" : "flat";

  return (
    <Link href={`/pairs/${pair}`} className={STYLES.card(isPulsing)}>
      <div className={STYLES.header}>
        <span className={STYLES.pair}>{pair}</span>
        {trend === "up" && <span className={STYLES.trendUp}>↗</span>}
        {trend === "down" && <span className={STYLES.trendDown}>↘</span>}
        {trend === "flat" && <span className={STYLES.trendFlat}>→</span>}
      </div>
      
      <div className="flex flex-col">
        <span className={STYLES.volatility}>
          {latest?.models?.stgnn
            ? latest.models.stgnn.predicted_volatility.toFixed(4)
            : "—"}
        </span>
        <span className={STYLES.label}>ST-GNN Volatility</span>
      </div>
      
      <div className="mt-2 h-10 w-full overflow-hidden">
        <Sparkline history={history} />
      </div>
    </Link>
  );
}
