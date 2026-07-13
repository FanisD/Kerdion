"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Prediction } from "@/lib/mockData";

const STYLES = {
  container: "h-64 w-full",
};

const PREDICTED_COLOR = "#0891b2";
const ACTUAL_COLOR = "#a1a1aa";

function toChartTime(timestamp: string): UTCTimestamp {
  return Math.floor(new Date(timestamp).getTime() / 1000) as UTCTimestamp;
}

export function VolatilityChart({ history }: { history: Prediction[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

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
    };
  }, [history]);

  return <div ref={containerRef} className={STYLES.container} />;
}
