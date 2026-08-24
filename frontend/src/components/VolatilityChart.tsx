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
import type { RosterResponse, Candle } from "@/lib/api";

const STYLES = {
  wrapper: "relative w-full rounded-xl overflow-hidden glass-panel",
  container: "h-96 w-full",
  legend: "absolute top-4 left-4 z-10 flex flex-col gap-2 rounded-lg bg-[var(--bg-surface)]/80 p-3 text-xs backdrop-blur-md shadow-lg border border-[var(--border-subtle)]",
  legendItem: "flex items-center gap-2 font-medium tracking-wide text-[var(--text-primary)]",
};

const COLORS = {
  garch: "#FF7B00",
  gru: "#B528FF",
  stgnn: "#00E5FF",
  truth: "#FFFFFF",
};

function toChartTime(timestamp: string): UTCTimestamp {
  return Math.floor(new Date(timestamp).getTime() / 1000) as UTCTimestamp;
}

export function VolatilityChart({
  pair,
  history,
  candles,
  chartRef: externalChartRef,
}: {
  pair: string;
  history: RosterResponse[];
  /** Price candles containing realized_volatility for the Truth Line. */
  candles?: Candle[];
  /** Exposed so the parent can synchronize crosshairs between panels. */
  chartRef?: React.MutableRefObject<IChartApi | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalChartRef = useRef<IChartApi | null>(null);
  const garchSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const gruSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stgnnSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stgnnGlowSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stgnnCiUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stgnnCiLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const actualSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const truthSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

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
      timeScale: { timeVisible: true },
    });

    internalChartRef.current = chart;
    if (externalChartRef) externalChartRef.current = chart;

    // --- Truth Line (realized volatility from price data) ---
    const truthSeries = chart.addSeries(LineSeries, {
      color: COLORS.truth,
      lineWidth: 3,
      lineStyle: 0,
      title: "Truth",
      crosshairMarkerVisible: true,
    });
    truthSeriesRef.current = truthSeries;

    if (candles && candles.length > 0) {
      const truthData = candles
        .filter((c) => c.realized_volatility != null)
        .map((c) => ({
          time: (new Date(c.timestamp).getTime() / 1000) as UTCTimestamp,
          value: c.realized_volatility as number,
        }));
      truthSeries.setData(truthData);
    }

    // --- Model prediction lines ---
    const garchSeries = chart.addSeries(LineSeries, { color: COLORS.garch, lineWidth: 1, lineStyle: 2, title: "GARCH" });
    const gruSeries = chart.addSeries(LineSeries, { color: COLORS.gru, lineWidth: 1, lineStyle: 2, title: "GRU" });
    const stgnnGlowSeries = chart.addSeries(LineSeries, { color: "rgba(0, 229, 255, 0.2)", lineWidth: 8 as any, title: "", crosshairMarkerVisible: false, lastValueVisible: false });
    const stgnnSeries = chart.addSeries(LineSeries, { color: COLORS.stgnn, lineWidth: 3, title: "ST-GNN" });
    
    const stgnnCiUpperSeries = chart.addSeries(LineSeries, {
      color: "rgba(6, 182, 212, 0.4)",
      lineWidth: 1,
      lineStyle: 3,
      title: "ST-GNN Upper CI",
    });
    const stgnnCiLowerSeries = chart.addSeries(LineSeries, {
      color: "rgba(6, 182, 212, 0.4)",
      lineWidth: 1,
      lineStyle: 3,
      title: "ST-GNN Lower CI",
    });

    garchSeriesRef.current = garchSeries;
    gruSeriesRef.current = gruSeries;
    stgnnSeriesRef.current = stgnnSeries;
    stgnnGlowSeriesRef.current = stgnnGlowSeries;
    stgnnCiUpperRef.current = stgnnCiUpperSeries;
    stgnnCiLowerRef.current = stgnnCiLowerSeries;

    const garchData: { time: UTCTimestamp; value: number }[] = [];
    const gruData: { time: UTCTimestamp; value: number }[] = [];
    const stgnnData: { time: UTCTimestamp; value: number }[] = [];
    const stgnnCiUpperData: { time: UTCTimestamp; value: number }[] = [];
    const stgnnCiLowerData: { time: UTCTimestamp; value: number }[] = [];
    const actualData: { time: UTCTimestamp; value: number }[] = [];

    history.forEach((p) => {
      const time = toChartTime(p.timestamp);
      if (p.models.garch) garchData.push({ time, value: p.models.garch.predicted_volatility });
      if (p.models.gru) gruData.push({ time, value: p.models.gru.predicted_volatility });
      if (p.models.stgnn) {
        stgnnData.push({ time, value: p.models.stgnn.predicted_volatility });
        if (p.models.stgnn.ci_upper_bound != null) {
          stgnnCiUpperData.push({ time, value: p.models.stgnn.ci_upper_bound });
        }
        if (p.models.stgnn.ci_lower_bound != null) {
          stgnnCiLowerData.push({ time, value: p.models.stgnn.ci_lower_bound });
        }
      }

      // @ts-expect-error fallback if actual_volatility_later is still present in payload
      const actual = p.actual_volatility_later;
      if (actual !== undefined && actual !== null) {
        actualData.push({ time, value: actual });
      }
    });

    garchSeries.setData(garchData);
    gruSeries.setData(gruData);
    stgnnSeries.setData(stgnnData);
    stgnnGlowSeries.setData(stgnnData);
    stgnnCiUpperSeries.setData(stgnnCiUpperData);
    stgnnCiLowerSeries.setData(stgnnCiLowerData);

    if (actualData.length > 0) {
      const actualSeries = chart.addSeries(LineSeries, {
        color: "#FACC15",
        lineWidth: 2,
        lineStyle: 2,
        title: "Actual (backfill)",
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
      internalChartRef.current = null;
      if (externalChartRef) externalChartRef.current = null;
      garchSeriesRef.current = null;
      gruSeriesRef.current = null;
      stgnnSeriesRef.current = null;
      stgnnGlowSeriesRef.current = null;
      stgnnCiUpperRef.current = null;
      stgnnCiLowerRef.current = null;
      actualSeriesRef.current = null;
      truthSeriesRef.current = null;
    };
  }, [history, candles, externalChartRef]);

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
        stgnnGlowSeriesRef.current?.update({ time, value: message.models.stgnn.predicted_volatility });
        if (message.models.stgnn.ci_upper_bound != null) {
          stgnnCiUpperRef.current?.update({ time, value: message.models.stgnn.ci_upper_bound });
        }
        if (message.models.stgnn.ci_lower_bound != null) {
          stgnnCiLowerRef.current?.update({ time, value: message.models.stgnn.ci_lower_bound });
        }
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
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COLORS.truth }} />
          <span>Truth (Realized)</span>
        </div>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 rounded-full shadow-[0_0_8px_var(--accent-primary)]" style={{ backgroundColor: COLORS.stgnn }} />
          <span>ST-GNN</span>
        </div>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 rounded-full shadow-[0_0_8px_var(--accent-garch)]" style={{ backgroundColor: COLORS.garch }} />
          <span>GARCH</span>
        </div>
        <div className={STYLES.legendItem}>
          <span className="h-2 w-2 rounded-full shadow-[0_0_8px_var(--accent-gru)]" style={{ backgroundColor: COLORS.gru }} />
          <span>GRU</span>
        </div>
      </div>
      <div ref={containerRef} className={STYLES.container} />
    </div>
  );
}
