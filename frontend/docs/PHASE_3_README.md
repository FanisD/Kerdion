# Kerdion Frontend - Live WebSocket Feed (Phase 3)

## 📌 Overview
Phase 3 wires the dashboard up to the backend's live WebSocket stream (`ws://.../api/v1/ws/live-predictions`, see `backend/docs/PHASE_4_README.md` / `PHASE_5_README.md`). This includes a reconnecting client wrapper, a live feed panel, incremental chart updates, and a real connection status indicator, replacing every "static for now" placeholder left over from Phase 1.

## 🏗️ Tech Stack Additions
* None. Native `WebSocket`, no client library.

## 🚀 Key Features Implemented

### 1. `LivePredictionsClient` (`src/lib/wsClient.ts`)
* Connects to `ws://.../api/v1/ws/live-predictions?token=<jwt>`, re-fetching a fresh token via `getWsToken()` on **every** connection attempt (not cached once), since the httpOnly cookie is the one signal the client can actually inspect.
* Exponential backoff reconnect (1s to a 30s cap) on disconnects.
* `onStatusChange(cb)` / `onMessage(cb)` subscriptions, `connect()` / `disconnect()` lifecycle methods.
* **Auth-failure detection had to be redesigned after live testing against the real backend.** Browsers deliberately hide the HTTP status code of a failed WebSocket handshake from script, so a rejected token (backend returns `403` at the handshake) and a genuinely unreachable server are indistinguishable at the `onclose`/`onerror` event level. Both just look like "never opened." Treating that ambiguity as an auth failure would misclassify a down server as an expired session. The client instead treats **"no session cookie" (`getWsToken()` returns `null`)** as the only reliable auth-failure signal, and lets every other connection failure fall through to normal reconnect/backoff, including the true WebSocket close code `1008` (policy violation) for the case where the backend does complete the handshake before rejecting.

### 2. Live Feed Panel (`src/components/LiveFeedPanel.tsx`)
* Client component subscribing to `LivePredictionsClient`. Shows the 20 most recent `new_prediction` broadcasts, newest first, each linking to its pair's detail page.
* Mounted on the Overview page above the pair grid.
* Shows connection status (Live / Reconnecting / Offline / Session expired) and an empty state while waiting for the first broadcast.

### 3. Incremental `VolatilityChart` Updates
* `VolatilityChart` now takes a `pair` prop and opens its own `LivePredictionsClient` in a **separate** effect from chart creation. The original history-driven effect (which does a full `setData()`) is untouched, so switching the 24h/7d range selector still does a correct full reload.
* Live ticks matching the current pair are appended via the chart series' `.update()` method instead of a full refetch or chart teardown. Broadcasts for other pairs are filtered out.

### 4. Real `ConnectionStatusBadge`
* Converted to a client component. Takes a `trackLiveStatus` boolean prop. When true, it opens its own `LivePredictionsClient` purely to track connection state (ignoring messages) and reflects real `connected` / `reconnecting` / `disconnected` status instead of the Phase 1 hardcoded "Offline".
* `layout.tsx` passes `trackLiveStatus={isAuthenticated}` (reusing the existing server-side auth check), so the badge never attempts a connection on `/login` or `/register`, only on authenticated pages.
* Each of the three components above (`LiveFeedPanel`, `VolatilityChart`, `ConnectionStatusBadge`) opens its **own** WebSocket connection rather than sharing one. This is the simplest correct option for this phase's scope. Consolidating into a single shared connection is a possible future optimization, not required by any current task.

## 📡 Live Data Flow
1. **Worker to Redis:** Celery publishes a `{"type": "new_prediction", "data": {...}}` payload to the `live-predictions-channel` Redis channel (see `backend/docs/PHASE_4_README.md`).
2. **Backend to client:** The FastAPI WebSocket endpoint broadcasts that payload to every connected client.
3. **Client to UI:** `LivePredictionsClient.onMessage` fires in each subscribing component. `LiveFeedPanel` prepends it to its list, `VolatilityChart` appends it to its series if the pair matches, and `ConnectionStatusBadge` only cares about connection state, not message content.

## 🧪 Verification Notes
Several behaviors in this phase could only be confirmed by testing directly against the live backend rather than static analysis, because the WebSocket API's browser-visible behavior didn't match what the backend's Python source suggested.
* A bad or expired token causes an HTTP `403` at the handshake (connection never opens), not an accepted-then-closed-with-`1008` sequence. Confirmed via a direct WebSocket test client against the running backend.
* Node's `WebSocket` implementation (undici) only fires `onerror` for a failed handshake, never `onclose`. This is a real divergence from browser spec that shaped how defensively the client's failure-handling had to be written, with idempotent handling shared between both event handlers.

## Next Steps
Phase 4 (polish and hardening) covers responsive and accessibility passes and error boundaries across the whole app, not specific to the live feed.
