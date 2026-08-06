"use client";

import { useState } from "react";

const COINS = ["BTC", "ETH", "XRP", "LTC", "ADA", "BNB", "SOL", "DOGE", "TRX", "LINK"];

function getColor(value: number) {
  // Map value (0.0 to 1.0) to an opacity scale with ST-GNN Cyan
  const val = Math.max(0, Math.min(1, value));
  return `rgba(0, 229, 255, ${val})`; // ST-GNN Neon Cyan
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
            <div key={`col-${c}`} className="w-10 text-center text-[10px] font-bold tracking-widest text-[var(--text-secondary)]">
              {c}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={`row-${i}`} className="flex items-center">
            <div className="w-12 pr-2 text-right text-[10px] font-bold tracking-widest text-[var(--text-secondary)]">
              {COINS[i]}
            </div>
            {row.map((val, j) => {
              const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
              const isOtherHovered = hoveredCell !== null && !isHovered;
              
              return (
                <div
                  key={`cell-${i}-${j}`}
                  className={`group relative h-10 w-10 cursor-pointer rounded-sm border border-[var(--border-subtle)] transition-all duration-300 ${
                    isOtherHovered ? "opacity-20 saturate-0" : "opacity-100 hover:z-10 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] hover:border-[var(--accent-primary)]"
                  }`}
                  style={{ backgroundColor: getColor(val) }}
                  onMouseEnter={() => setHoveredCell({ row: i, col: j, val })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold tabular-nums text-white backdrop-blur-sm">
                      {val.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className={`mt-4 min-h-[60px] w-full transition-opacity duration-300 ${hoveredCell ? "opacity-100" : "opacity-0"}`}>
        {hoveredCell && (
          <div className="glass-panel inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-[var(--text-secondary)] shadow-lg">
            <span className="font-semibold text-[var(--text-primary)]">
              {COINS[hoveredCell.row]} influence on {COINS[hoveredCell.col]}:
            </span>
            <span className="font-bold tabular-nums neon-text-primary text-lg">
              {hoveredCell.val.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
