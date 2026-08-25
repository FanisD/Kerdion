export const metadata = {
  title: "About — Kerdion",
  description: "Learn about Kerdion, the real-time crypto volatility prediction platform.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-14">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          About Kerdion
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Real-time cryptocurrency volatility forecasting, powered by deep learning.
        </p>
      </header>

      {/* What is Kerdion */}
      <section className="glass-panel rounded-2xl p-8">
        <h2 className="mb-4 text-xl font-bold text-[var(--text-primary)]">What is Kerdion?</h2>
        <p className="leading-relaxed text-[var(--text-secondary)]">
          Kerdion is an end-to-end analytics platform that predicts the future volatility of
          cryptocurrency markets in real time. Built as a thesis project, it ingests live market data
          for <strong className="text-[var(--text-primary)]">10 major crypto pairs</strong>, runs them
          through multiple forecasting models, and presents the results in a sleek, dark-mode
          Command Center dashboard.
        </p>
      </section>

      {/* The Models */}
      <section className="glass-panel rounded-2xl p-8">
        <h2 className="mb-4 text-xl font-bold text-[var(--text-primary)]">The Model Arena</h2>
        <p className="mb-6 leading-relaxed text-[var(--text-secondary)]">
          Kerdion doesn't rely on a single model. It runs a <strong className="text-[var(--text-primary)]">three-model arena</strong> and
          lets the data decide which one wins:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">ST-GNN</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A Spatio-Temporal Graph Neural Network that learns hidden correlations between coins
              through an adaptive adjacency matrix — the &quot;brain&quot; of the platform.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--accent-garch)] shadow-[0_0_10px_var(--accent-garch)]" />
              <h3 className="font-bold text-[var(--text-primary)]">GARCH</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A classical econometric baseline that models volatility clustering — widely used in
              quantitative finance as a benchmark.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--accent-gru)] shadow-[0_0_10px_var(--accent-gru)]" />
              <h3 className="font-bold text-[var(--text-primary)]">GRU</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A Gated Recurrent Unit neural network that captures sequential patterns in volatility
              time series.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="glass-panel rounded-2xl p-8">
        <h2 className="mb-4 text-xl font-bold text-[var(--text-primary)]">Key Features</h2>
        <ul className="flex flex-col gap-3 text-[var(--text-secondary)]">
          <li className="flex items-start gap-3">
            <span className="mt-1 text-[var(--accent-primary)]">●</span>
            <span><strong className="text-[var(--text-primary)]">Live WebSocket Streaming</strong> — predictions arrive in real time, with pulse animations on every tick.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-[var(--accent-primary)]">●</span>
            <span><strong className="text-[var(--text-primary)]">QLIKE Scoring</strong> — each model is scored using the QLIKE loss function, automatically crowning the best performer.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-[var(--accent-primary)]">●</span>
            <span><strong className="text-[var(--text-primary)]">Confidence Intervals</strong> — the ST-GNN provides 95% CI bands, visualising prediction uncertainty.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-[var(--accent-primary)]">●</span>
            <span><strong className="text-[var(--text-primary)]">Topology Heatmap</strong> — an interactive 10×10 matrix showing the learned inter-coin correlations.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-[var(--accent-primary)]">●</span>
            <span><strong className="text-[var(--text-primary)]">Diebold-Mariano Testing</strong> — statistical significance badges proving whether the ST-GNN truly outperforms baselines.</span>
          </li>
        </ul>
      </section>

      {/* Tech Stack */}
      <section className="glass-panel rounded-2xl p-8">
        <h2 className="mb-4 text-xl font-bold text-[var(--text-primary)]">Technology Stack</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Backend</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Python · FastAPI · PyTorch · Redis · MongoDB · Docker
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Frontend</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Next.js · React · TypeScript · Tailwind CSS · Lightweight Charts
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
