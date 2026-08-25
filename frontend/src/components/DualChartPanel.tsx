"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import type { IChartApi } from "lightweight-charts";
import { PriceChart } from "@/components/PriceChart";
import { VolatilityChart } from "@/components/VolatilityChart";
import type { Candle, RosterResponse } from "@/lib/api";

const SECTION =
  "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950";

const COLORS = {
  stgnn: "#00E5FF",
  garch: "#FF7B00",
  gru: "#B528FF",
  truth: "#FFFFFF",
};

/**
 * Wraps both chart panels and synchronises their crosshairs.
 *
 * When the user hovers on one chart, a matching vertical guide
 * appears on the other chart at the exact same timestamp.
 */
export function DualChartPanel({
  pair,
  candles,
  history,
}: {
  pair: string;
  candles: Candle[];
  history: RosterResponse[];
}) {
  const priceChartRef = useRef<IChartApi | null>(null);
  const volChartRef = useRef<IChartApi | null>(null);

  // Flag to prevent infinite crosshair echo loops
  const isSyncing = useRef(false);

  // Selected model for the price chart markers
  const [activeModel, setActiveModel] = useState("stgnn");

  // Compute price header stats
  const priceStats = useMemo(() => {
    if (candles.length === 0) return null;
    const latest = candles[candles.length - 1];
    const prev = candles.length > 1 ? candles[candles.length - 2] : null;
    const currentPrice = latest.close;
    let change24h: number | null = null;
    if (prev) {
      change24h = ((currentPrice - prev.close) / prev.close) * 100;
    }
    return { currentPrice, change24h };
  }, [candles]);

  useEffect(() => {
    const priceChart = priceChartRef.current;
    const volChart = volChartRef.current;
    if (!priceChart || !volChart) return;

    // Price chart → Volatility chart
    const onPriceMove = (param: any) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (param.time) {
        volChart.setCrosshairPosition(NaN, param.time, volChart.timeScale());
      } else {
        volChart.clearCrosshairPosition();
      }
      isSyncing.current = false;
    };

    // Volatility chart → Price chart
    const onVolMove = (param: any) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (param.time) {
        priceChart.setCrosshairPosition(NaN, param.time, priceChart.timeScale());
      } else {
        priceChart.clearCrosshairPosition();
      }
      isSyncing.current = false;
    };

    priceChart.subscribeCrosshairMove(onPriceMove);
    volChart.subscribeCrosshairMove(onVolMove);

    return () => {
      priceChart.unsubscribeCrosshairMove(onPriceMove);
      volChart.unsubscribeCrosshairMove(onVolMove);
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top panel — Market Price ── */}
      <div className={SECTION}>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-black dark:text-zinc-50">
              Market Price
            </h2>
            {priceStats && (
              <div className="flex items-baseline gap-2">
                <span className="tabular-nums text-lg font-bold text-black dark:text-zinc-50">
                  ${priceStats.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
                {priceStats.change24h !== null && (
                  <span
                    className="tabular-nums text-xs font-semibold"
                    style={{
                      color: priceStats.change24h >= 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {priceStats.change24h >= 0 ? "+" : ""}
                    {priceStats.change24h.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 mr-2">Signals:</span>
            {(["stgnn", "garch", "gru"] as const).map((model) => (
              <button
                key={model}
                onClick={() => setActiveModel(model)}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  activeModel === model
                    ? "bg-zinc-800 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-900"
                    : "bg-black/5 text-zinc-500 hover:text-zinc-900 dark:bg-white/5 dark:hover:text-zinc-100"
                }`}
              >
                {model.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <PriceChart pair={pair} candles={candles} chartRef={priceChartRef} history={history} activeModel={activeModel} />
      </div>

      {/* ── Bottom panel — Volatility Arena ── */}
      <div className={SECTION}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-black dark:text-zinc-50">
            Volatility Arena – Model Comparison
          </h2>
          <div className="flex items-center gap-3 text-[10px] font-medium tracking-wide text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 rounded" style={{ backgroundColor: COLORS.truth }} />
              Truth
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.stgnn }} />
              ST-GNN
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.garch }} />
              GARCH
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.gru }} />
              GRU
            </span>
          </div>
        </div>
        <VolatilityChart
          pair={pair}
          history={history}
          candles={candles}
          chartRef={volChartRef}
        />
      </div>
    </div>
  );
}
