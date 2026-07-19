# Kerdion Frontend - Real Auth & REST Integration (Phase 2)

## 📌 Overview
Phase 2 replaces every piece of Phase 0/1 scaffolding that assumed no real backend. The shared-credential login gate is replaced with real per-user JWT auth against the backend's `/auth/register` / `/auth/login` (see `backend/docs/PHASE_5_README.md`), and `src/lib/mockData.ts` is replaced with a typed REST client hitting the real predictions API. This phase absorbed what was originally a separate "wire login to the real backend" task, since the API client couldn't be built without first deciding how the JWT flows through it.

## 🏗️ Tech Stack Additions
* None. Reuses Next.js Route Handlers and Server Components already available, no new dependencies.

## 🚀 Key Features Implemented

### 1. Auth API Client & Token Storage (`src/lib/authClient.ts`, `src/lib/auth.ts`)
* `registerRequest` / `loginRequest` / `logoutRequest` / `getWsToken`: typed calls to same-origin Next.js Route Handlers.
* `src/app/api/auth/register/route.ts`, `.../login/route.ts`: proxy to the backend's `POST /auth/register` / `POST /auth/login` (converting JSON to the `OAuth2PasswordRequestForm` the backend's login endpoint expects).
* Login sets the JWT as an **httpOnly cookie** (`kerdion_token`) via the Route Handler response. The raw token is never exposed to client-side JS or `localStorage`.
* `src/app/api/auth/ws-token/route.ts`: reads the httpOnly cookie server-side and hands the same JWT to client code, for the WebSocket handshake in Phase 3 (browsers can't attach custom headers to a WS connection, so the token has to reach client JS some other way).
* `src/app/api/auth/logout/route.ts`: clears the cookie.

### 2. Real Login/Register Pages & Route Gate
* `src/app/login/page.tsx`: rewritten for email/password against `loginRequest`, with a link to `/register` and a success message after registering.
* `src/app/register/page.tsx` (new): register form calling `registerRequest`, redirects to `/login?registered=true` on success.
* `src/proxy.ts`: the route gate now checks for the real JWT cookie's presence instead of the Phase 0 `"authenticated"` sentinel, and exempts `/login`, `/register`, and `/api/auth/*` from the gate.
* `src/components/LogoutButton.tsx` (new): signs out and redirects to `/login`. Shown in the nav only when authenticated (`layout.tsx` checks the cookie server-side).
* Removed `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` and the Phase 0 login server action.

### 3. Typed Predictions Client (`src/lib/api.ts`)
* `getAllPredictions()` / `getPredictionsForPair(pair, hours)`: server-side fetch calls (Server Components only) attaching `Authorization: Bearer <token>` from the httpOnly cookie, so the JWT never touches client JS for REST calls.
* Both return a discriminated `ApiResult<T>` (`{ok: true, data}` or `{ok: false, error}`) instead of silently swallowing failures. Network errors (backend unreachable) and non-2xx responses are both surfaced as real errors, not empty arrays.
* A `401` clears nothing client-side (Server Components can't mutate cookies mid-render) but redirects to `/login`. The stale cookie gets overwritten on the next successful login.
* Overview (`src/app/page.tsx`) and Pair Detail (`src/app/pairs/[pair]/page.tsx`) pages now read real data instead of `mockData.ts`, which was deleted.

### 4. Historical Range Selector & Error States
* Pair Detail page adds a 24h/7d range selector (URL search param `?range=`), passed through to the backend's `hours` query param.
* `src/components/ErrorState.tsx` (new): shared friendly error component shown on both pages when the prediction service is unreachable or errors out, instead of a silent empty result or an unhandled crash.

## 🐛 Also Fixed: `.gitignore` Silently Hiding `frontend/src/lib/`
The repo's root `.gitignore` (generated from a Python + VSCode template) had a bare `lib/` rule intended for Python's `venv/lib/`-style directories. A bare `lib/` matches a directory of that name anywhere in the tree, so it silently excluded `frontend/src/lib/` from every `git add`. `auth.ts` and `authClient.ts` had been "committed" in earlier PRs (they showed up in the diffs) but never actually made it into the repo, leaving `dev` with broken imports. Fixed by scoping the rule to `/lib/` (repo root only).

## 📡 Auth Flow (Frontend Side)
1. **Register:** Client calls `registerRequest`, which posts to `/api/auth/register`, which proxies to the backend's `POST /auth/register`.
2. **Login:** Client calls `loginRequest`, which posts to `/api/auth/login`, which proxies to the backend's `POST /auth/login`. The Route Handler sets the httpOnly `kerdion_token` cookie from the returned JWT.
3. **Authenticated page loads:** Server Components call `src/lib/api.ts`, which reads the cookie server-side and attaches `Authorization: Bearer <token>` to backend REST calls. The token never reaches the browser for this path.
4. **WebSocket handshake (Phase 3):** Client calls `getWsToken()`, which fetches `/api/auth/ws-token`. That route reads the same httpOnly cookie server-side and relays the JWT to client code, since the WS connection is opened from the browser and needs the token as a query param.

## Next Steps
Phase 3 builds the live WebSocket feed on top of the token relay introduced here: a reconnecting WS client, a live feed panel, incremental chart updates, and a real connection status badge.
