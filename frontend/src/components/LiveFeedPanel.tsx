"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LivePredictionsClient, type ConnectionStatus, type LiveMessage } from "@/lib/wsClient";
import type { RosterResponse } from "@/lib/api";

type FeedItem = RosterResponse & { _id: string };

const STYLES = {
  section: "relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-xl hover:shadow-[var(--accent-primary)]/5",
  header: "mb-4 flex items-center justify-between",
  title: "text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]",
  status: (status: ConnectionStatus) =>
    [
      "flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider",
      status === "connected" && "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]",
      status === "reconnecting" && "text-amber-400",
      status === "auth-failed" && "text-red-400",
      status === "disconnected" && "text-zinc-500",
    ]
      .filter(Boolean)
      .join(" "),
  dot: (status: ConnectionStatus) =>
    [
      "h-2 w-2 rounded-full",
      status === "connected" && "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]",
      status === "reconnecting" && "bg-amber-400",
      status === "auth-failed" && "bg-red-400",
      status === "disconnected" && "bg-zinc-600",
    ]
      .filter(Boolean)
      .join(" "),
  empty: "text-sm text-[var(--text-secondary)]",
  list: "flex flex-col divide-y divide-[var(--border-subtle)]",
  row: "flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:bg-[var(--bg-surface-hover)] -mx-2 px-2 rounded-lg",
  pair: "font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors",
  authFailed: "text-sm text-red-400",
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
