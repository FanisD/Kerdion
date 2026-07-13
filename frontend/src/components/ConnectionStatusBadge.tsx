export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

const STYLES = {
  badge: "flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-500",
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

export function ConnectionStatusBadge({
  status = "disconnected",
}: {
  status?: ConnectionStatus;
}) {
  return (
    <span className={STYLES.badge}>
      <span className={STYLES.dot(status)} />
      {LABELS[status]}
    </span>
  );
}
