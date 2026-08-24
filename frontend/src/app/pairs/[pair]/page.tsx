import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ErrorState";
import { DualChartPanel } from "@/components/DualChartPanel";
import { PredictionTable } from "@/components/PredictionTable";
import { ModelArenaCard } from "@/components/ModelArenaCard";
import { DMTestBadge } from "@/components/DMTestBadge";
import { getPredictionsForPair, getPricesForPair } from "@/lib/api";

const STYLES = {
  container: "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10",
  back: "text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-500 dark:hover:text-zinc-50",
  headerRow: "flex items-end justify-between gap-4",
  heading: "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50",
  subheading: "text-sm text-zinc-600 dark:text-zinc-400",
  section: "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950",
  sectionTitle: "mb-3 text-sm font-medium text-black dark:text-zinc-50",
  rangeGroup: "flex gap-1 rounded-lg border border-black/10 p-1 dark:border-white/10",
  rangeLink: (active: boolean) =>
    [
      "rounded-md px-3 py-1 text-sm font-medium transition-colors",
      active
        ? "bg-black text-white dark:bg-zinc-50 dark:text-black"
        : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50",
    ].join(" "),
};

const RANGES = {
  "24h": { hours: 24, days: 7 },
  "7d": { hours: 24 * 7, days: 14 },
  "30d": { hours: 24 * 30, days: 30 },
} as const;

type RangeKey = keyof typeof RANGES;

function isRangeKey(value: string | undefined): value is RangeKey {
  return value === "24h" || value === "7d" || value === "30d";
}

export default async function PairDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pair: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { pair } = await params;
  const { range: rangeParam } = await searchParams;
  const range: RangeKey = isRangeKey(rangeParam) ? rangeParam : "24h";

  // Fetch predictions and prices in parallel
  const [result, priceResult] = await Promise.all([
    getPredictionsForPair(pair, RANGES[range].hours),
    getPricesForPair(pair, RANGES[range].days),
  ]);

  if (result.ok && result.data.length === 0) {
    notFound();
  }

  let latest = null;
  let bestModel = "";
  if (result.ok && result.data.length > 0) {
    latest = result.data[result.data.length - 1];
    let minQlike = Infinity;
    for (const [name, metrics] of Object.entries(latest.models)) {
      if (metrics.qlike_score != null && metrics.qlike_score < minQlike) {
        minQlike = metrics.qlike_score;
        bestModel = name;
      }
    }
  }

  return (
    <div className={STYLES.container}>
      <Link href="/" className={STYLES.back}>
        ← Overview
      </Link>

      <div className={STYLES.headerRow}>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className={STYLES.heading}>{pair}</h1>
            <p className={STYLES.subheading}>
              Predicted vs. actual volatility
            </p>
          </div>
          {latest?.models?.stgnn && (
            <DMTestBadge metrics={latest.models.stgnn} />
          )}
        </div>

        <div className={STYLES.rangeGroup}>
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <Link
              key={key}
              href={`/pairs/${pair}?range=${key}`}
              className={STYLES.rangeLink(key === range)}
            >
              {key}
            </Link>
          ))}
        </div>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {latest ? (
              Object.entries(latest.models).map(([modelName, metrics]) => (
                <ModelArenaCard
                  key={modelName}
                  modelName={modelName}
                  metrics={metrics}
                  isBest={modelName === bestModel}
                />
              ))
            ) : (
              <p className="text-sm text-zinc-500">No predictions available.</p>
            )}
          </div>

          {/* Synchronized Dual-Panel: Price Chart + Volatility Arena */}
          {priceResult.ok ? (
            <DualChartPanel
              pair={pair}
              candles={priceResult.data}
              history={result.data}
            />
          ) : (
            <ErrorState message={priceResult.error} />
          )}

          <div className={STYLES.section}>
            <h2 className={STYLES.sectionTitle}>Prediction history</h2>
            <PredictionTable history={result.data} />
          </div>
        </>
      )}
    </div>
  );
}
