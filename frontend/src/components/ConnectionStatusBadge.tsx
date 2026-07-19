"use client";

import { useEffect, useState } from "react";
import { LivePredictionsClient, type ConnectionStatus as WsConnectionStatus } from "@/lib/wsClient";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

const STYLES = {
  badge: "flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400",
  dot: (status: ConnectionStatus) =>
    [
      "h-2 w-2 rounded-full",
      status === "connected" && "bg-emerald-500",
      status === "reconnecting" && "bg-amber-500",
      status === "disconnected" && "bg-zinc-400 dark:bg-zinc-600",
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
