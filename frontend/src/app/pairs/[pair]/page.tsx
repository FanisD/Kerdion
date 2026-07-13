import Link from "next/link";
import { notFound } from "next/navigation";
import { VolatilityChart } from "@/components/VolatilityChart";
import { getMockPairs, getPredictionHistory } from "@/lib/mockData";

const STYLES = {
  container: "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10",
  back: "text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-500 dark:hover:text-zinc-50",
  heading: "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50",
  subheading: "text-sm text-zinc-600 dark:text-zinc-400",
  section: "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950",
  sectionTitle: "mb-3 text-sm font-medium text-black dark:text-zinc-50",
  table: "w-full text-left text-sm",
  th: "border-b border-black/10 pb-2 pr-4 font-medium text-zinc-500 dark:border-white/10 dark:text-zinc-500",
  td: "border-b border-black/5 py-2 pr-4 text-black dark:border-white/5 dark:text-zinc-100",
};

export function generateStaticParams() {
  return getMockPairs().map((pair) => ({ pair }));
}

export default async function PairDetailPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const history = getPredictionHistory(pair);

  if (history.length === 0) {
    notFound();
  }

  const rows = [...history].reverse();

  return (
    <div className={STYLES.container}>
      <Link href="/" className={STYLES.back}>
        ← Overview
      </Link>

      <div>
        <h1 className={STYLES.heading}>{pair}</h1>
        <p className={STYLES.subheading}>
          Predicted vs. actual volatility (mock data)
        </p>
      </div>

      <div className={STYLES.section}>
        <h2 className={STYLES.sectionTitle}>Volatility chart</h2>
        <VolatilityChart history={history} />
      </div>

      <div className={STYLES.section}>
        <h2 className={STYLES.sectionTitle}>Prediction history</h2>
        <table className={STYLES.table}>
          <thead>
            <tr>
              <th className={STYLES.th}>Timestamp</th>
              <th className={STYLES.th}>Model</th>
              <th className={STYLES.th}>Predicted</th>
              <th className={STYLES.th}>Actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={STYLES.td}>
                  {new Date(row.timestamp).toLocaleString()}
                </td>
                <td className={STYLES.td}>{row.model_used}</td>
                <td className={STYLES.td}>{row.predicted_volatility.toFixed(4)}</td>
                <td className={STYLES.td}>
                  {row.actual_volatility_later?.toFixed(4) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
