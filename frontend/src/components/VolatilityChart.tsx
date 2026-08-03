"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { LivePredictionsClient, type LiveMessage } from "@/lib/wsClient";
import type { RosterResponse } from "@/lib/api";

const STYLES = {
  wrapper: "relative w-full",
  container: "h-64 w-full",
  legend: "absolute top-2 left-2 z-10 flex flex-col gap-1 rounded bg-white/80 p-2 text-xs backdrop-blur dark:bg-zinc-950/80 shadow-sm border border-black/5 dark:border-white/5",
  legendItem: "flex items-center gap-2",
};

const COLORS = {
  garch: "#f97316",
  gru: "#a855f7",
  stgnn: "#06b6d4",
  actual: "#a1a1aa",
};

function toChartTime(timestamp: string): UTCTimestamp {
  return Math.floor(new Date(timestamp).getTime() / 1000) as UTCTimestamp;
}

export function VolatilityChart({ pair, history }: { pair: string; history: RosterResponse[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const garchSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const gruSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stgnnSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const actualSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(0, 0, 0, 0.06)" },
      },
      timeScale: { timeVisible: true },
    });
    chartRef.current = chart;

    const garchSeries = chart.addSeries(LineSeries, { color: COLORS.garch, lineWidth: 2, title: "GARCH" });
    const gruSeries = chart.addSeries(LineSeries, { color: COLORS.gru, lineWidth: 2, title: "GRU" });
    const stgnnSeries = chart.addSeries(LineSeries, { color: COLORS.stgnn, lineWidth: 2, title: "ST-GNN" });

    garchSeriesRef.current = garchSeries;
    gruSeriesRef.current = gruSeries;
    stgnnSeriesRef.current = stgnnSeries;

    const garchData: { time: UTCTimestamp; value: number }[] = [];
    const gruData: { time: UTCTimestamp; value: number }[] = [];
    const stgnnData: { time: UTCTimestamp; value: number }[] = [];
    const actualData: { time: UTCTimestamp; value: number }[] = [];

    history.forEach((p) => {
      const time = toChartTime(p.timestamp);
      if (p.models.garch) garchData.push({ time, value: p.models.garch.predicted_volatility });
      if (p.models.gru) gruData.push({ time, value: p.models.gru.predicted_volatility });
      if (p.models.stgnn) stgnnData.push({ time, value: p.models.stgnn.predicted_volatility });

      // @ts-expect-error fallback if actual_volatility_later is still present in payload
      const actual = p.actual_volatility_later;
      if (actual !== undefined && actual !== null) {
        actualData.push({ time, value: actual });
      }
    });

    garchSeries.setData(garchData);
    gruSeries.setData(gruData);
    stgnnSeries.setData(stgnnData);

    if (actualData.length > 0) {
      const actualSeries = chart.addSeries(LineSeries, {
        color: COLORS.actual,
        lineWidth: 2,
        lineStyle: 2,
        title: "Actual",
      });
      actualSeriesRef.current = actualSeries;
      actualSeries.setData(actualData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      predictedSeriesRef.current = null;
      garchSeriesRef.current = null;
      gruSeriesRef.current = null;
      stgnnSeriesRef.current = null;
      actualSeriesRef.current = null;
    };
  }, [history]);

  // Separate from the effect above: live ticks append onto whatever series
  // is currently rendered via .update(), without rebuilding the chart or
  // refetching history. An explicit range switch still goes through the
  // effect above (history reference changes) for a correct full reload.
  useEffect(() => {
    const client = new LivePredictionsClient();

    const unsubscribe = client.onMessage((message: LiveMessage) => {
      if (message.type !== "new_prediction") return;
      if (message.cryptocurrency_pair !== pair) return;

      const time = toChartTime(message.timestamp);
      
      if (message.models.garch) {
        garchSeriesRef.current?.update({ time, value: message.models.garch.predicted_volatility });
      }
      if (message.models.gru) {
        gruSeriesRef.current?.update({ time, value: message.models.gru.predicted_volatility });
      }
      if (message.models.stgnn) {
        stgnnSeriesRef.current?.update({ time, value: message.models.stgnn.predicted_volatility });
      }

      // @ts-expect-error fallback
      const actual = message.actual_volatility_later;
      if (actual !== undefined && actual !== null) {
        actualSeriesRef.current?.update({ time, value: actual });
      }
    });

    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [pair]);

  return (
    <div className={STYLES.wrapper}>
      <div className={STYLES.legend}>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.stgnn }} />
          <span className="text-zinc-700 dark:text-zinc-300">ST-GNN</span>
        </div>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.garch }} />
          <span className="text-zinc-700 dark:text-zinc-300">GARCH</span>
        </div>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.gru }} />
          <span className="text-zinc-700 dark:text-zinc-300">GRU</span>
        </div>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 border-b-2 border-dashed" style={{ borderColor: COLORS.actual }} />
          <span className="text-zinc-700 dark:text-zinc-300">Actual</span>
        </div>
      </div>
      <div ref={containerRef} className={STYLES.container} />
    </div>
  );
}
