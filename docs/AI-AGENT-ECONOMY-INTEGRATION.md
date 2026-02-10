# AI Payments, OpenClaw & Agent Economy — How They Fit Together

This doc describes how the three pillars of the **AI agent economy** in the Control Room app are connected and where they live in the UI.

**Regulatory scope:** All features below are designed to stay within applicable regulations and laws. See [Regulatory scope](#regulatory-scope--applicable-laws) and the compliance docs linked there. This document is not legal advice.

---

## Regulatory scope & applicable laws

Use of AI payments, OpenClaw, and Agent Economy in this app must stay within **laws and regulations applicable to you** (e.g. US federal, your state including Florida, EU if you operate there, and any other jurisdiction where you or your users are located).

**How this app is designed to support that:**

- **No custody** — Users sign with their own Xaman wallet; the app does not hold funds.
- **User-initiated only** — Payments require user confirmation and Xaman signing. No autonomous execution without user approval.
- **Human-in-the-loop** — AI suggests; user confirms and signs. Audit trails and caps (SafetyLayer, Agent Economy) support oversight.
- **No intermediation of funds** — Payments go directly wallet-to-wallet; the app facilitates signing only.

Whether your specific use case (e.g. OpenClaw fee wallet, agent payments, pay-per-skill) requires a money transmitter license or other registration is **jurisdiction- and fact-specific**. You are responsible for compliance; consult qualified counsel in your jurisdiction.

**Where this is documented in the repo:**

- **[COMPLIANCE-GLOBAL-US-FLORIDA.md](../COMPLIANCE-GLOBAL-US-FLORIDA.md)** — Global, US, and Florida (crypto + AI); not legal advice.
- **[OPENCLAW-COMPLIANCE-AND-USE.md](../OPENCLAW-COMPLIANCE-AND-USE.md)** — OpenClaw, money transmission, royalties, AI agent economy.
- **[REGULATORY-WATCH.md](../REGULATORY-WATCH.md)** — Where to check for regulatory updates.
- **[SAFETY-AUDIT.md](../SAFETY-AUDIT.md)** — Security and payment flows.

---

## 1. AI payments (how agents pay)

| Piece | Where | What it does |
|-------|--------|----------------|
| **Secure Payment Agent** | **CARV** page (`/carv`) | AI-powered payment flow: user says "Pay $50 to rABC…" in chat → plan built → user signs in Xaman → payment sent. Rate limits, audit log, human-in-the-loop. |
| **AI Agent Payments (orchestra)** | **Micropayments** → **AI Agents** tab | Demo: multi-step "AI orchestra" (data → reasoning → tools); each step recorded as a micropayment. Shows machine-to-machine payment flows. |
| **Streaming / channels** | **Micropayments** → Streams, Channels tabs | Payment channels and streams (ILP/XRPL); use case `ai_agent_payment` for agent-to-agent micropayments. |

**In short:** AI payments = **Secure Payment Agent** (real Xaman signing) + **AI Agent Payments** (sim/demo streams) + **payment channels** (infrastructure).

---

## 2. OpenClaw (earn from the agent ecosystem)

| Piece | Where | What it does |
|-------|--------|----------------|
| **OpenClaw dashboard** | **Micropayments** → **OpenClaw** tab | Tracks **real** platform revenue: 1% fee on OpenClaw plugin transactions. Live mainnet data for wallet `ra7Zj3G…`. |
| **OpenClaw integration** | `src/integrations/openclaw/` | `OpenClawXRPL.ts` (payments, channels), `SafetyLayer.ts` (rate limits, kill switch). Plugin lives in `openclaw-xrpl-plugin/`. |

**In short:** OpenClaw = viral AI agent (134k+ GitHub stars); the app **earns** when others use the plugin. Dashboard = revenue and tx history.

---

## 3. Agent Economy (receipts, caps, paid actions)

| Piece | Where | What it does |
|-------|--------|----------------|
| **Agent Economy page** | **Agents** (`/agent-economy`) | Structured paid actions: list agents, pending requests, **spend caps** (daily/weekly XRP), **receipts**. Power Mode Unlock and other jobs → Xaman sign → receipt. |
| **Store** | `src/store/agentEconomyStore.ts` | Receipts, pending requests, spend caps; persisted. |

**In short:** Agent Economy = **control and audit**: caps, receipts, and a clear list of paid actions. No custody; user signs in Xaman.

---

## How they’re connected in the app

- **Agent Economy** page includes an **“AI agent economy in this app”** card with links to:
  - **Micropayments** (OpenClaw + AI streams)
  - **OpenClaw revenue** (deep link to Micropayments with OpenClaw tab open)
  - **Secure Payment Agent** (CARV)
- **Micropayments** header includes short links to **Agent Economy (receipts & caps)** and **Secure Payment Agent (CARV)**.
- Navigating from Agent Economy with “OpenClaw revenue” opens Micropayments with the **OpenClaw** tab selected (via `location.state.tab`).

So: **pay** (CARV + streams) → **earn** (OpenClaw) → **track & cap** (Agent Economy).

---

## Run the Orchestra: build vs integrate, and testing

The **“Run the Orchestra”** demo (Micropayments → AI Agents tab) uses **agents that mirror the dashboard's data sources**: a list (`DASHBOARD_AGENTS` in `AIAgentPayments.tsx`) and simulated micropayment steps. Only the “XRP price check” task calls a real API (e.g. CoinGecko); the tasks XRP price, Ledger + fee, Sentiment, and Pipeline call the same APIs as the rest of the app (CoinGecko, s1.ripple.com, SentiCrypt).

**Do we build an orchestra of our own or grab agents from somewhere?**

- **Build our own:** Implement each “agent” as a service (e.g. data API, LLM wrapper, code executor). The orchestrator calls these services and records payments (sim or real). Full control; more engineering. The CARV Secure Payment Agent is an example of a real “agent” we built (LLM + regime + PIE + XRPL).
- **Grab from somewhere:** Integrate with external agent registries or pay-per-call APIs. Examples: **x402**-style APIs (Solana/Base, pay-per-request), **OpenClaw** plugins (we already integrate for revenue; could add “run a task via OpenClaw + pay in XRP”), or a future **XRPL agent registry**. We’d discover or configure agents by URL/API and pay them via XRPL/ILP.
- **Hybrid:** Our orchestrator + a mix of our own agents (e.g. XRP price, internal tools) and external ones (e.g. an LLM behind an x402 or OpenClaw pay-per-call endpoint).

So: we can **build**, **integrate**, or **mix**. The current UI is “build a demo in-app”; going real means either adding real backend agents we own or wiring to external agent APIs and paying them on XRPL.

**How do we test them?**

- **Current demo:** Manual testing only — run “Run orchestra,” pick tasks, check result and transaction list. No automated tests for the demo orchestra.
- **If we build real agents:** Unit tests per agent (mock inputs, assert outputs); integration tests for the orchestrator with mock agents; E2E with testnet if we add real XRPL micropayments.
- **If we integrate external agents:** Contract tests (mock their API); sandbox/testnet for payment flow; optional live tests with small amounts and rate limits.

Adding automated tests (e.g. Jest for orchestrator + mock agents, or Playwright for “Run orchestra” flow) is recommended when moving from demo to real agents.

---

## Orchestra: based on dashboard data

The orchestra agents are **based on data incorporated throughout the dashboard**:

| Agent | Dashboard use |
|-------|----------------|
| **Price Feed (CoinGecko/Binance)** | Navigation, WalletConnect, Terminal, livePrices, MemeticLab, analyticsService, CARV accountingLedger |
| **XRPL Ledger (RPC)** | liveXRPLData (server_info, fee, account_channels), xrplService |
| **XRPScan** | Network page (validators, nodes, agreement), LedgerImpactTool (amendments), freeDataFeeds (metrics) |
| **Reasoning (LLM)** | CARV Secure Payment Agent (llmAgent) |
| **DEX Pathfinder** | xrplPathfinding, xrplDex (pathfinding, quotes) |
| **Sentiment (SentiCrypt)** | freeDataFeeds (crypto sentiment) |
| **Tx History (xrplcluster)** | OpenClawDashboard, tx history |
| **Regulatory Watch (Compliance)** | REGULATORY-WATCH.md, COMPLIANCE-GLOBAL-US-FLORIDA.md; watches rules and regulations to stay in law |

Orchestra tasks (XRP price, Ledger + fee, Sentiment, XRPScan, Pathfinder, Tx history, **Compliance snapshot**, Pipeline) call these same APIs or compliance stance where applicable; payments remain simulated.

---

## Other agents we recommend (already in the dashboard)

These data sources or capabilities exist elsewhere in the app and would fit the orchestra as additional “pay per call” agents. Listed in rough priority.

| Agent | What it is | Where it lives | Why add it |
|-------|------------|----------------|------------|
| **Prediction markets (Polymarket)** | Crypto/XRP-relevant prediction market data, probabilities, signals | `predictionMarkets.ts` (gamma-api.polymarket.com) | “Pay per prediction signal”; different from price/sentiment; already integrated. |
| **Analytics / screener** | CoinGecko search, top movers, XRPL ledger stats, potential score, recommendation | `analyticsService.ts`, `cryptoScreener.ts` | One “analysis” call = one micropayment; feeds MemeticLab / Analytics Lab. |
| **Order book** | Binance XRP/USDT depth (bids/asks) | `OrderBookDepth.tsx`, `websocketPriceFeeds.ts` | “Pay per order-book snapshot”; complements Price Feed. |
| **ILP pathfinding (CAR)** | ILP path alternatives, CAR-validated routes (uses XRPL `ripple_path_find`) | `ilp/carPathfinding.ts` | XRPL-native pathfinding with compliance layer; distinct from DEX pathfinder. |
| **Alerts / monitor** | Price/ledger triggers, Telegram/webhook notifications | `alertNotifications.ts` | “Pay per alert” or “Alerting agent”; event-driven; fits paper trading. |
| **NFT metadata** | NFT details from xrplMeta / XRPScan / Bithomp | `assetsStore`, `lib/constants.ts` (NFT_AGGREGATORS) | “Pay per NFT lookup”; useful if the app expands NFT or character features. |

**Suggested order to add:** (1) **Prediction markets** or **Analytics** for a second “insight” agent alongside Sentiment; (2) **Order book** to round out market data; (3) **ILP pathfinding** if you want a second pathfinding agent (DEX vs ILP); (4) **Alerts** when you want event-driven flows; (5) **NFT metadata** if NFT use cases grow.

---

## Recommended orchestra (what to have)

Recommendation: keep the orchestra **small, XRPL-centric, and buildable** so it tells the Control Room story and can move from demo to real without scope creep.

**Tier 1 – Core (keep and wire to real where possible)**

| Agent | Role | Why | Real next step |
|-------|------|-----|----------------|
| **Orchestrator** | Routes tasks, records micropayments | Central to the story | Already logic-only; add testnet payment recording later. |
| **Market / price data** | XRP (and optionally other) prices | Already used by "XRP price check"; universal need | Keep CoinGecko (or similar); add optional order-book from `xrplDex` / public API. |
| **Ledger reader** | Account info, ledger index, fee stats | XRPL-native; different from "market" | New agent calling public RPC (`account_info`, `ledger`, `server_info`). Reuse `xrplService` patterns. |
| **Reasoning (LLM)** | Summarize, format, decide | Makes "AI pays for thinking" concrete | Keep mock for demo; later wire CARV LLM or an x402 LLM with pay-per-call. |
| **Code executor** | Run transform / script step | Good for "data to transform to answer" pipelines | Keep in demo; real = sandboxed backend (e.g. isolated runner) or drop if not needed for Phase 1. |

**Tier 2 – Add for XRPL/Control Room story**

| Agent | Role | Why | Real next step |
|-------|------|-----|----------------|
| **Pathfinder / quote** | "Best path A to B" or "quote XRP to USD" | Uses XRPL pathfinding; we have `xrplPathfinding` / `xrplDex`. One call = one micropayment. | Thin wrapper over existing pathfinding; orchestrator pays this agent per quote. |
| **Alert / monitor** | "Notify when condition (e.g. price above X, ledger above N)" | Event-driven agent payment; fits paper trading / Phase 1 sim. | Simulated at first (e.g. rule engine); later optional push or polling. |

**Tier 3 – Later / optional**

| Agent | Role | Why |
|-------|------|-----|
| **GPU compute** | Heavy inference / training | Keeps "swarm" narrative in demo; real offering is heavier to operate. |
| **OpenClaw bridge** | "Run OpenClaw skill, pay in XRP" | Ties to existing OpenClaw integration; good when we add task-to-payment flow. |

**Summary**

- **Minimum viable orchestra:** Orchestrator + **price data** + **ledger reader** + **reasoning (LLM)**. That's four "agents" plus orchestrator; all can be built or mocked in-app and one day wired to real APIs/testnet.
- **Strong XRPL story:** Add **pathfinder/quote** (and optionally **alert/monitor**) so the orchestra clearly does "pay per XRPL-native call."
- **Keep GPU and OpenClaw** as demo or Phase 2+ so the narrative stays broad without blocking ship.

---

## Roadmap tie-in (Phase 1)

- **Simulations:** AI Agent Payments (orchestra) and paper trading can be extended with more AI-driven scenarios; OpenClaw stays mainnet for real revenue.
- **Mock agents:** Rule-based agents that “transact” in sim can later plug into the same Agent Economy receipts/caps model for consistency.
- **Testnet (Phase 2):** Secure Payment Agent and OpenClaw flows can add a testnet mode; Agent Economy receipts can label network (mainnet vs testnet).

---

---

*See also: [ROADMAP.md](../ROADMAP.md), [OPENCLAW-COMPLIANCE-AND-USE.md](../OPENCLAW-COMPLIANCE-AND-USE.md), [COMPLIANCE-GLOBAL-US-FLORIDA.md](../COMPLIANCE-GLOBAL-US-FLORIDA.md).*
