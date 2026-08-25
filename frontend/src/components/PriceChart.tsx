"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  type IChartApi,
  type UTCTimestamp,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { RosterResponse } from "@/lib/api";

export type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  realized_volatility: number | null;
};

const STYLES = {
  wrapper: "relative w-full rounded-xl overflow-hidden glass-panel",
  container: "h-96 w-full",
};

export function PriceChart({
  pair,
  candles,
  history,
  activeModel,
  chartRef: externalChartRef,
}: {
  pair: string;
  candles: Candle[];
  history?: RosterResponse[];
  activeModel?: string;
  /** Exposed so the parent can synchronize crosshairs between panels. */
  chartRef?: React.MutableRefObject<IChartApi | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalChartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      timeScale: { timeVisible: false },
    });

    internalChartRef.current = chart;
    if (externalChartRef) externalChartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    const data = candles.map((c) => ({
      time: (new Date(c.timestamp).getTime() / 1000) as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candlestickSeries.setData(data);

    // Apply markers based on history
    if (history && activeModel) {
      const markers: SeriesMarker<Time>[] = [];
      history.forEach((h) => {
        const time = (new Date(h.timestamp).getTime() / 1000) as UTCTimestamp;
        const modelData = h.models[activeModel];
        if (modelData && modelData.signal) {
          const predVol = modelData.predicted_volatility.toFixed(2);
          if (modelData.signal === "spike") {
            markers.push({
              time,
              position: "aboveBar",
              color: "#f97316", // orange-500
              shape: "arrowUp",
              text: `⚡ Spike (${predVol}%)`,
            });
          } else if (modelData.signal === "calm") {
            markers.push({
              time,
              position: "belowBar",
              color: "#0ea5e9", // sky-500
              shape: "arrowDown",
              text: `😴 Calm (${predVol}%)`,
            });
          }
        }
      });
      candlestickSeries.setMarkers(markers);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      internalChartRef.current = null;
      if (externalChartRef) externalChartRef.current = null;
    };
  }, [candles, history, activeModel, externalChartRef]);

  return (
    <div className={STYLES.wrapper}>
      <div ref={containerRef} className={STYLES.container} />
    </div>
  );
}
