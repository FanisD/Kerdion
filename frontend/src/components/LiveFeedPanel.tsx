"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LivePredictionsClient, type ConnectionStatus, type LiveMessage } from "@/lib/wsClient";
import type { RosterResponse } from "@/lib/api";

type FeedItem = RosterResponse & { _id: string };

const STYLES = {
  section: "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950",
  header: "mb-3 flex items-center justify-between",
  title: "text-sm font-medium text-black dark:text-zinc-50",
  status: (status: ConnectionStatus) =>
    [
      "flex items-center gap-2 text-xs font-medium",
      status === "connected" && "text-emerald-600 dark:text-emerald-400",
      status === "reconnecting" && "text-amber-600 dark:text-amber-400",
      status === "auth-failed" && "text-red-600 dark:text-red-400",
      status === "disconnected" && "text-zinc-500 dark:text-zinc-500",
    ]
      .filter(Boolean)
      .join(" "),
  dot: (status: ConnectionStatus) =>
    [
      "h-2 w-2 rounded-full",
      status === "connected" && "bg-emerald-500",
      status === "reconnecting" && "bg-amber-500",
      status === "auth-failed" && "bg-red-500",
      status === "disconnected" && "bg-zinc-400 dark:bg-zinc-600",
    ]
      .filter(Boolean)
      .join(" "),
  empty: "text-sm text-zinc-600 dark:text-zinc-400",
  list: "flex flex-col divide-y divide-black/10 dark:divide-white/10",
  row: "flex items-center justify-between gap-4 py-2 text-sm",
  pair: "font-medium text-black hover:underline dark:text-zinc-50",
  model: "text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500",
  volatility: "tabular-nums text-black dark:text-zinc-50",
  authFailed: "text-sm text-red-600 dark:text-red-400",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: "Live",
  reconnecting: "Reconnecting",
  disconnected: "Offline",
  "auth-failed": "Session expired",
};

const MAX_FEED_ITEMS = 20;

export function LiveFeedPanel() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const clientRef = useRef<LivePredictionsClient | null>(null);

  useEffect(() => {
    const client = new LivePredictionsClient();
    clientRef.current = client;

    const unsubscribeStatus = client.onStatusChange(setStatus);
    const unsubscribeMessage = client.onMessage((message: LiveMessage) => {
      if (message.type !== "new_prediction") return;
      
      const newItem: FeedItem = {
        ...message,
        _id: `${message.cryptocurrency_pair}-${message.timestamp}-${Math.random()}`,
      };

      setFeed((prev) => [newItem, ...prev].slice(0, MAX_FEED_ITEMS));
    });

    client.connect();

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      client.disconnect();
    };
  }, []);

  return (
    <div className={STYLES.section}>
      <div className={STYLES.header}>
        <h2 className={STYLES.title}>Live feed</h2>
        <span className={STYLES.status(status)}>
          <span className={STYLES.dot(status)} />
          {STATUS_LABELS[status]}
        </span>
      </div>

      {status === "auth-failed" ? (
        <p className={STYLES.authFailed}>Your session expired. Please sign in again.</p>
      ) : feed.length === 0 ? (
        <p className={STYLES.empty}>Waiting for live predictions…</p>
      ) : (
        <div className={STYLES.list}>
          {feed.map((item) => {
            let bestModel = "";
            let minQlike = Infinity;
            for (const [name, metrics] of Object.entries(item.models)) {
              if (metrics.qlike_score != null && metrics.qlike_score < minQlike) {
                minQlike = metrics.qlike_score;
                bestModel = name;
              }
            }

            return (
              <div key={item._id} className={STYLES.row}>
                <Link href={`/pairs/${item.cryptocurrency_pair}`} className={STYLES.pair}>
                  {item.cryptocurrency_pair}
                </Link>
                <div className="flex items-center gap-2 text-xs">
                  {Object.entries(item.models).map(([name, metrics], i, arr) => {
                    const isBest = name === bestModel;
                    return (
                      <span key={name} className="flex items-center gap-1">
                        <span
                          className={`font-medium uppercase ${
                            isBest ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
                          }`}
                        >
                          {name}:
                        </span>
                        <span
                          className={`tabular-nums ${
                            isBest ? "font-semibold text-black dark:text-white" : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {metrics.predicted_volatility.toFixed(4)}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="mx-1 text-zinc-300 dark:text-zinc-700">|</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
