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
import type { Prediction } from "@/lib/api";

const STYLES = {
  container: "h-64 w-full",
};

const PREDICTED_COLOR = "#0891b2";
const ACTUAL_COLOR = "#a1a1aa";

function toChartTime(timestamp: string): UTCTimestamp {
  return Math.floor(new Date(timestamp).getTime() / 1000) as UTCTimestamp;
}

export function VolatilityChart({ pair, history }: { pair: string; history: Prediction[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const predictedSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
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

    const predictedSeries = chart.addSeries(LineSeries, {
      color: PREDICTED_COLOR,
      lineWidth: 2,
      title: "Predicted",
    });
    predictedSeriesRef.current = predictedSeries;
    predictedSeries.setData(
      history.map((p) => ({
        time: toChartTime(p.timestamp),
        value: p.predicted_volatility,
      })),
    );

    const actualPoints = history.filter((p) => p.actual_volatility_later !== null);
    if (actualPoints.length > 0) {
      const actualSeries = chart.addSeries(LineSeries, {
        color: ACTUAL_COLOR,
        lineWidth: 2,
        lineStyle: 2,
        title: "Actual",
      });
      actualSeriesRef.current = actualSeries;
      actualSeries.setData(
        actualPoints.map((p) => ({
          time: toChartTime(p.timestamp),
          value: p.actual_volatility_later as number,
        })),
      );
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

      const stgnn = message.models?.stgnn;
      if (!stgnn) return;

      predictedSeriesRef.current?.update({
        time: toChartTime(message.timestamp),
        value: stgnn.predicted_volatility,
      });
    });

    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [pair]);

  return <div ref={containerRef} className={STYLES.container} />;
}
