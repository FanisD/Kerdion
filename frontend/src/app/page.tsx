import Link from "next/link";
import { getLatestPrediction, getMockPairs } from "@/lib/mockData";

const STYLES = {
  container: "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10",
  heading: "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50",
  subheading: "text-sm text-zinc-600 dark:text-zinc-400",
  grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  card: "flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20",
  cardPair: "text-lg font-semibold text-black dark:text-zinc-50",
  cardModel: "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500",
  cardVolatility: "text-2xl font-semibold tabular-nums text-black dark:text-zinc-50",
  cardLabel: "text-xs text-zinc-500 dark:text-zinc-500",
  empty: "text-sm text-zinc-500 dark:text-zinc-500",
};

export default function OverviewPage() {
  const pairs = getMockPairs();

  return (
    <div className={STYLES.container}>
      <div>
        <h1 className={STYLES.heading}>Overview</h1>
        <p className={STYLES.subheading}>
          Predicted volatility across tracked pairs (mock data)
        </p>
      </div>

      {pairs.length === 0 ? (
        <p className={STYLES.empty}>No tracked pairs yet.</p>
      ) : (
        <div className={STYLES.grid}>
          {pairs.map((pair) => {
            const latest = getLatestPrediction(pair);
            return (
              <Link key={pair} href={`/pairs/${pair}`} className={STYLES.card}>
                <span className={STYLES.cardPair}>{pair}</span>
                <span className={STYLES.cardModel}>
                  {latest?.model_used ?? "—"}
                </span>
                <span className={STYLES.cardVolatility}>
                  {latest ? latest.predicted_volatility.toFixed(4) : "—"}
                </span>
                <span className={STYLES.cardLabel}>predicted volatility</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
