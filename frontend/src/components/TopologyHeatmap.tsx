"use client";

import { useState } from "react";

const COINS = ["BTC", "ETH", "XRP", "LTC", "ADA", "BNB", "SOL", "DOGE", "TRX", "LINK"];

function getColor(value: number) {
  // Map value (-1 to 1) to an opacity scale
  // Negative = Blue, Positive = Red
  const val = Math.max(-1, Math.min(1, value));
  if (val > 0) {
    return `rgba(239, 68, 68, ${val})`; // Tailwind red-500
  } else {
    return `rgba(59, 130, 246, ${-val})`; // Tailwind blue-500
  }
}

export function TopologyHeatmap({ matrix }: { matrix: number[][] }) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; val: number } | null>(null);

  if (!matrix || matrix.length === 0) {
    return <p className="text-sm text-zinc-500">No topology data available.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="relative inline-block overflow-x-auto">
        <div className="flex">
          <div className="w-12" />
          {COINS.map((c) => (
            <div key={`col-${c}`} className="w-10 text-center text-[10px] font-medium text-zinc-500">
              {c}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={`row-${i}`} className="flex items-center">
            <div className="w-12 pr-2 text-right text-[10px] font-medium text-zinc-500">
              {COINS[i]}
            </div>
            {row.map((val, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="group relative h-10 w-10 cursor-pointer rounded-sm border border-black/5 transition-transform hover:z-10 hover:scale-110 dark:border-white/5"
                style={{ backgroundColor: getColor(val) }}
                onMouseEnter={() => setHoveredCell({ row: i, col: j, val })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <div className="absolute inset-0 hidden items-center justify-center bg-black/80 text-[9px] font-bold tabular-nums text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 dark:bg-white/90 dark:text-black">
                  {val.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {hoveredCell && (
        <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="font-semibold text-black dark:text-zinc-50">
            {COINS[hoveredCell.row]} ↔ {COINS[hoveredCell.col]}
          </span>
          <span className="ml-2">
            Weight: {hoveredCell.val.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
