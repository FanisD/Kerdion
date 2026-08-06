"use client";

import { useState, useEffect } from "react";
import { PairCard } from "./PairCard";
import { LivePredictionsClient, type LiveMessage } from "@/lib/wsClient";
import type { RosterResponse } from "@/lib/api";
import { groupPredictionsByPair } from "@/lib/api";

export function LiveBentoGrid({ initialPredictions }: { initialPredictions: RosterResponse[] }) {
  const [historyByPair, setHistoryByPair] = useState(() => groupPredictionsByPair(initialPredictions));
  const [pulsePair, setPulsePair] = useState<string | null>(null);

  useEffect(() => {
    const client = new LivePredictionsClient();
    const unsubscribe = client.onMessage((msg: LiveMessage) => {
      if (msg.type === "new_prediction") {
        const pair = msg.cryptocurrency_pair;
        setHistoryByPair((prev) => {
          const pairHistory = prev[pair] || [];
          return {
            ...prev,
            [pair]: [...pairHistory, msg as RosterResponse].slice(-100), // keep last 100 for sparkline
          };
        });
        
        // Trigger pulse
        setPulsePair(pair);
        setTimeout(() => setPulsePair(null), 300); // 300ms pulse
      }
    });

    client.connect();
    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  const pairs = Object.keys(historyByPair).sort();

  if (pairs.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No tracked pairs yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {pairs.map((pair) => {
        const history = historyByPair[pair];
        const latest = history[history.length - 1];

        return (
          <PairCard 
            key={pair} 
            pair={pair} 
            latest={latest} 
            history={history} 
            isPulsing={pulsePair === pair}
          />
        );
      })}
    </div>
  );
}
