"use client";

import { useEffect, useState } from "react";
import { LivePredictionsClient, type ConnectionStatus as WsConnectionStatus } from "@/lib/wsClient";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

const STYLES = {
  badge: "flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] shadow-sm backdrop-blur-md transition-all hover:border-[var(--border-strong)]",
  dot: (status: ConnectionStatus) =>
    [
      "h-2 w-2 rounded-full",
      status === "connected" && "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]",
      status === "reconnecting" && "bg-amber-400",
      status === "disconnected" && "bg-zinc-500",
    ]
      .filter(Boolean)
      .join(" "),
};

const LABELS: Record<ConnectionStatus, string> = {
  connected: "Live",
  reconnecting: "Reconnecting",
  disconnected: "Offline",
};

function toDisplayStatus(status: WsConnectionStatus): ConnectionStatus {
  return status === "connected" || status === "reconnecting" ? status : "disconnected";
}

export function ConnectionStatusBadge({ trackLiveStatus = false }: { trackLiveStatus?: boolean }) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (!trackLiveStatus) return;

    const client = new LivePredictionsClient();
    const unsubscribe = client.onStatusChange((wsStatus) => setStatus(toDisplayStatus(wsStatus)));
    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [trackLiveStatus]);

  return (
    <span className={STYLES.badge}>
      <span className={STYLES.dot(status)} />
      {LABELS[status]}
    </span>
  );
}
