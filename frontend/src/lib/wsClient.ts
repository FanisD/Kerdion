import { getWsToken } from "@/lib/authClient";
import type { RosterResponse } from "@/lib/api";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected" | "auth-failed";

export type LiveMessage =
  | { type: "system"; message: string }
  | ({ type: "new_prediction" } & RosterResponse);

const WS_AUTH_FAILURE_CODE = 1008;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

export class LivePredictionsClient {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private backoffMs = INITIAL_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private messageListeners = new Set<(message: LiveMessage) => void>();

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onMessage(listener: (message: LiveMessage) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  connect(): void {
    this.stopped = false;
    void this.openSocket();
  }

  disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  private async openSocket(): Promise<void> {
    // Re-checked on every attempt (not just the first): a WebSocket close/error
    // event can't tell us whether the handshake was rejected for auth (403) or
    // the server is simply unreachable -- browsers hide the handshake's HTTP
    // status from script for security reasons, so both look identical. The
    // httpOnly session cookie is the one signal we can actually inspect, so we
    // treat "no token" as the sole auth-failure signal and let connection
    // failures with a token present just be normal reconnect/backoff.
    const token = await getWsToken();
    if (!token) {
      this.setStatus("auth-failed");
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const socket = new WebSocket(`${wsUrl}/api/v1/ws/live-predictions?token=${token}`);
    this.socket = socket;

    socket.onopen = () => {
      this.backoffMs = INITIAL_BACKOFF_MS;
      this.setStatus("connected");
    };

    socket.onmessage = (event) => {
      const message: LiveMessage = JSON.parse(event.data);
      for (const listener of this.messageListeners) listener(message);
    };

    let settled = false;
    const handleClosed = (closeCode?: number) => {
      if (settled) return;
      settled = true;
      this.socket = null;
      if (this.stopped) return;

      if (closeCode === WS_AUTH_FAILURE_CODE) {
        this.setStatus("auth-failed");
        return;
      }

      this.setStatus("reconnecting");
      this.scheduleReconnect();
    };

    socket.onclose = (event) => handleClosed(event.code);
    // Some runtimes fire only onerror (never onclose) for a handshake that's
    // rejected outright; handleClosed is idempotent so whichever fires first wins.
    socket.onerror = () => handleClosed();
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
      void this.openSocket();
    }, this.backoffMs);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }
}
