import Link from "next/link";
import { notFound } from "next/navigation";
import { VolatilityChart } from "@/components/VolatilityChart";
import { PredictionTable } from "@/components/PredictionTable";
import { ModelMetadata } from "@/components/ModelMetadata";
import { getPredictionsForPair } from "@/lib/api";

const STYLES = {
  container: "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10",
  back: "text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-500 dark:hover:text-zinc-50",
  heading: "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50",
  subheading: "text-sm text-zinc-600 dark:text-zinc-400",
  section: "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950",
  sectionTitle: "mb-3 text-sm font-medium text-black dark:text-zinc-50",
};

export default async function PairDetailPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const history = await getPredictionsForPair(pair);

  if (history.length === 0) {
    notFound();
  }

  return (
    <div className={STYLES.container}>
      <Link href="/" className={STYLES.back}>
        ← Overview
      </Link>

      <div>
        <h1 className={STYLES.heading}>{pair}</h1>
        <p className={STYLES.subheading}>
          Predicted vs. actual volatility
        </p>
      </div>

      <div className={STYLES.section}>
        <h2 className={STYLES.sectionTitle}>Model metadata</h2>
        <ModelMetadata history={history} />
      </div>

      <div className={STYLES.section}>
        <h2 className={STYLES.sectionTitle}>Volatility chart</h2>
        <VolatilityChart history={history} />
      </div>

      <div className={STYLES.section}>
        <h2 className={STYLES.sectionTitle}>Prediction history</h2>
        <PredictionTable history={history} />
      </div>
    </div>
  );
}
