import { ErrorState } from "@/components/ErrorState";
import { TopologyHeatmap } from "@/components/TopologyHeatmap";
import { getTopologyMatrix } from "@/lib/api";

const STYLES = {
  container: "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10",
  heading: "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50",
  subheading: "text-sm text-zinc-600 dark:text-zinc-400",
  section: "rounded-2xl border border-black/10 bg-white p-6 overflow-hidden dark:border-white/10 dark:bg-zinc-950",
};

export default async function TopologyPage() {
  const result = await getTopologyMatrix();

  return (
    <div className={STYLES.container}>
      <div>
        <h1 className={STYLES.heading}>Market Topology</h1>
        <p className={STYLES.subheading}>
          Learned correlation graph from the ST-GNN model
        </p>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error} />
      ) : (
        <div className={STYLES.section}>
          <TopologyHeatmap matrix={result.data} />
        </div>
      )}
    </div>
  );
}
