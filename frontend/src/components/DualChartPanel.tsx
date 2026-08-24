"use client";

import { useRef, useEffect } from "react";
import type { IChartApi } from "lightweight-charts";
import { PriceChart } from "@/components/PriceChart";
import { VolatilityChart } from "@/components/VolatilityChart";
import type { Candle, RosterResponse } from "@/lib/api";

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
      {/* Top panel — Market Price */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-medium text-black dark:text-zinc-50">
          Market Price
        </h2>
        <PriceChart pair={pair} candles={candles} chartRef={priceChartRef} />
      </div>

      {/* Bottom panel — Volatility Arena */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-medium text-black dark:text-zinc-50">
          Volatility Arena – Model Comparison
        </h2>
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
