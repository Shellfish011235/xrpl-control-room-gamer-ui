# XRPL Intelligence Layer

Modular analytics layer that turns raw XRPL node data into actionable intelligence for the Control Room dashboard.

## Architecture Summary

- **Transport** (`src/lib/xrpl/`): RPC client and WebSocket client with reconnect, event parsing, connection health. Uses existing `config/xrplNode` and `lib/xrplClient` / `lib/xrplWebsocket`.
- **Intelligence modules** (`src/lib/intelligence/`):
  - **validators** – server_info, quorum, peers, ledger timing, network health.
  - **whales** – balance thresholds, large transfers, inflow/outflow, whale score and category (heuristic).
  - **liquidity** – flows by asset, time buckets, high-velocity assets.
  - **bots** – patterned tx, offer cycles, timing regularity, burst detection (heuristic).
  - **aiAgents** – regular cadence, micro bursts, recurring routes (heuristic; probabilistic).
- **Unified hook** (`hooks/useXRPLIntelligence.ts`): Connects WS, subscribes to `ledger` + `transactions`, exposes connection state and optional validator summary.
- **UI** (`src/components/intelligence/`, `src/pages/IntelligencePage.tsx`): ValidatorMonitor, WhaleTracker, LiquidityFlowPanel, BotClusterPanel, AIAgentActivityPanel; one page at `/intelligence`.

All detection is **read-only** and **analytics-only** (no signing, no seeds, no admin RPC).

## File Tree (New / Changed)

```
src/
  lib/
    xrpl/
      types.ts          # Shared types (RPC, WS events, normalized payment/ledger)
      rpcClient.ts      # Typed RPC (server_info, ledger, account_tx, tx, …)
      wsClient.ts       # WS connect/subscribe, event parsing, connection health
      index.ts
    intelligence/
      validators.ts     # Node/validator snapshot, network health
      whales.ts         # Whale state, scoring, leaderboard, transfers
      liquidity.ts     # Flow by asset, time buckets, high velocity
      bots.ts           # Bot/cluster scoring, patterns
      aiAgents.ts       # Agent-like pattern heuristics
      index.ts
  components/
    intelligence/
      ValidatorMonitor.tsx
      WhaleTracker.tsx
      LiquidityFlowPanel.tsx
      BotClusterPanel.tsx
      AIAgentActivityPanel.tsx
  hooks/
    useXRPLIntelligence.ts
  pages/
    IntelligencePage.tsx
  App.tsx               # + route /intelligence
  components/Navigation.tsx  # + nav item Intelligence
docs/
  XRPL-INTELLIGENCE.md  # This file
```

## Environment Variables

Same as the existing node setup; no new secrets.

- `VITE_XRPL_RPC_URL` – HTTP JSON-RPC (e.g. `http://192.168.5.43:5005`)
- `VITE_XRPL_WS_URL` – WebSocket (e.g. `ws://192.168.5.43:6007`)
- `VITE_XRPL_PROXY_URL` – Optional proxy for production (see XRPL-NODE-SETUP.md)

## Setup

1. Ensure `.env` has `VITE_XRPL_RPC_URL` and `VITE_XRPL_WS_URL` for your node (see XRPL-NODE-SETUP.md).
2. `npm install` and `npm run dev`.
3. Open **Intelligence** in the nav or go to `/intelligence`.

## Local Test

1. Start the app and your private rippled node.
2. Go to **Intelligence**.
3. Check: connection shows **connected**, Ledger # updates, Validator & Network panel shows server state and peers.
4. Whale / Liquidity / Bot / AI-Agent panels fill as **transactions** stream events arrive (live traffic).

## Production Limitations (Private Node)

- The app runs in the **browser**. If the dashboard is deployed (e.g. Vercel), users’ browsers cannot reach a private `192.168.x.x` node.
- For a **public** deployment use `VITE_XRPL_PROXY_URL` to a server that forwards to your node, or leave RPC/WS unset so the app uses public XRPL endpoints.
- Local use on the same LAN as the Mac Mini works with direct RPC/WS URLs.

## False Positives / Heuristics

- **Whales**: Threshold and category are heuristic; exchange/institution labels are inferred from balance and activity, not verified.
- **Bots**: Score and pattern (market_maker, recurring_interval, burst) are heuristic; high tx count or regular timing can be human or other software.
- **AI-Agent**: “Agent-like” patterns (regular cadence, micro tx, recurring routes) are probabilistic; many false positives possible (e.g. payroll, subscriptions).

Panels that use heuristics are labeled **Heuristic** in the UI; do not treat scores as definitive.

## TODOs (in code / future work)

- **validators**: Track ledger close interval over time; persist quorum history.
- **whales**: Optional balance refresh via `account_info` for top N; persist wallet reputation; graph clustering.
- **liquidity**: Trust line and AMM event handling; directional flow by issuer.
- **bots**: Multi-wallet cluster grouping; anomaly detection; ML scoring.
- **aiAgents**: Configurable detection rules; wallet interaction graph; recurring route persistence.
