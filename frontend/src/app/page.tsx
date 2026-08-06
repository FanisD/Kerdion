import { ErrorState } from "@/components/ErrorState";
import { LiveFeedPanel } from "@/components/LiveFeedPanel";
import { LiveBentoGrid } from "@/components/LiveBentoGrid";
import { getAllPredictions } from "@/lib/api";

const STYLES = {
  container: "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10",
  heading: "text-3xl font-bold tracking-tight text-[var(--text-primary)]",
  subheading: "text-sm text-[var(--text-secondary)]",
};

export default async function OverviewPage() {
  const result = await getAllPredictions();

  return (
    <div className={STYLES.container}>
      <div>
        <h1 className={STYLES.heading}>Overview</h1>
        <p className={STYLES.subheading}>
          Predicted volatility across tracked pairs
        </p>
      </div>

      <LiveFeedPanel />

      {!result.ok ? <ErrorState message={result.error} /> : <LiveBentoGrid initialPredictions={result.data} />}
    </div>
  );
}
