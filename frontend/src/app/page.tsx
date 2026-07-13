import { PairCard } from "@/components/PairCard";
import { getLatestPrediction, getMockPairs, getPredictionHistory } from "@/lib/mockData";

const STYLES = {
  container: "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10",
  heading: "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50",
  subheading: "text-sm text-zinc-600 dark:text-zinc-400",
  grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
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
          {pairs.map((pair) => (
            <PairCard
              key={pair}
              pair={pair}
              latest={getLatestPrediction(pair)}
              history={getPredictionHistory(pair)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
