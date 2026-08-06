# Kerdion Frontend Design Roadmap

## Vision Statement
To build an ultra-premium, dark-mode analytics dashboard (a "Command Center") that visually proves the superiority of the ST-GNN model by comparing it against baseline models and ground-truth market volatility.

*Note: The backend is already 100% capable of supporting this design. It provides the multi-model Roster predictions, Confidence Intervals, backfilled Actual Volatilities, the Topology Matrix, and WebSocket streams.*

---

## Phase 1: Foundation & "Glassmorphism" Design System
*Goal: Set up the global CSS, colors, typography, and animation tokens that will give the platform its premium feel.*

- [ ] **Task 1.1: Global Theming (Dark Slate & Neon)**
  - Update `tailwind.config.ts` (or global CSS) with the deep slate background (`#0F111A`).
  - Define the neon accent colors: ST-GNN (Cyan), GARCH (Orange), GRU (Purple), Actual/Truth (Stark White).
- [ ] **Task 1.2: Glassmorphism Utilities**
  - Create reusable CSS classes for translucent panels (backdrop-blur, subtle white borders at 10% opacity, drop shadows).
- [ ] **Task 1.3: Typography Upgrade**
  - Integrate a modern sans-serif (e.g., `Inter` or `Outfit`) for headers/text.
  - Integrate a monospace font (e.g., `JetBrains Mono` or `Roboto Mono`) specifically for data tables and metric cards to ensure numbers align perfectly.
- [ ] **Task 1.4: Base Components**
  - Refactor basic components (buttons, nav bars, loading states) to use the new glassmorphism and hover effects (buttons shifting gradients or lifting on hover).

## Phase 2: The "Live Pulse" Overview Page
*Goal: Redesign the main dashboard to feel like a real-time trading floor tracking all 10 coins.*

- [ ] **Task 2.1: The Grid Layout**
  - Replace the current list with a responsive "Bento Grid" displaying all 10 tracked coins.
- [ ] **Task 2.2: Coin "Bento" Cards**
  - Design cards that show the coin name, the latest predicted volatility, and the trend (up/down arrow).
- [ ] **Task 2.3: Micro-Sparklines**
  - Integrate a tiny, simplified line chart (sparkline) inside each card showing the last 7 days of volatility to provide instant visual context.
- [ ] **Task 2.4: WebSocket "Pulse" Animation**
  - When the WebSocket pushes a new prediction, trigger a CSS keyframe animation that briefly pulses the specific coin's card with a neon glow, proving the data is live.

## Phase 3: The "Model Arena" (Coin Detail Page)
*Goal: Build the ultimate visual proving ground comparing predictions vs. reality.*

- [ ] **Task 3.1: The Main Stage Chart (Lightweight Charts Upgrade)**
  - Style the chart background to be fully transparent (glass).
  - Plot the **"Truth Line" (Actual Volatility)** as a thick, solid, crisp white line.
  - Plot the **ST-GNN** line as glowing Cyan, with a translucent shaded region representing its Confidence Interval.
  - Plot **GARCH** and **GRU** as thinner, dashed lines in Orange and Purple.
- [ ] **Task 3.2: The Scoreboard (Data Table)**
  - Build a sleek, dark table below the chart comparing the models' performance metrics (Predicted Vol, QLIKE score, CI bounds).
  - Highlight the "winning" model (lowest QLIKE) with a glowing border or gold text.
- [ ] **Task 3.3: Diebold-Mariano Badge**
  - Create a visual badge that reads "Statistically Significant" (glowing green) if ST-GNN beats the baseline, based on the backend's DM test payload.

## Phase 4: The Topology Matrix (The "Brain")
*Goal: Visualize the complex ST-GNN relationships between coins.*

- [ ] **Task 4.1: Heatmap Implementation**
  - Build a grid/heatmap component where the X and Y axes are the 10 coins.
  - Map the backend `adjacency_matrix` values (0.0 to 1.0) to color intensity (e.g., dark slate to bright cyan).
- [ ] **Task 4.2: Interactive Tooltips**
  - Add hover states to the heatmap squares. When hovering, dim the rest of the board and show a sleek tooltip: *"BTC influence on ETH: 0.85"*.

## Phase 5: Polish & UX Details
*Goal: Add the final micro-interactions that elevate the platform to a professional tier.*

- [ ] **Task 5.1: Animated Number Counters**
  - Implement a React hook or library so that when volatility numbers change, they visually "roll" or count up/down to the new number rather than instantly snapping.
- [ ] **Task 5.2: Skeleton Loaders**
  - Remove all generic text "Loading..." states.
  - Replace them with shimmering, translucent wireframes of the charts and cards while waiting for API data.
- [ ] **Task 5.3: Error States (Graceful Degradation)**
  - Design beautiful glassmorphism error modals (like the Topology 500 error) that explain the issue clearly (e.g., "Awaiting first pipeline run...") instead of breaking the UI.
