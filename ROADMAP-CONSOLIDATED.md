# XRPL Control Room – Roadmap & To-Do List

Single list of what’s left to do and suggested priorities. Use with [ROADMAP.md](./ROADMAP.md) (phases) and [INSTITUTIONAL-UPGRADE-PLAN.md](./INSTITUTIONAL-UPGRADE-PLAN.md) (institutional gaps).

**Florida / US – not a money transmitter:** All new features that touch payments or value movement must stay within [docs/FLORIDA-NOT-MONEY-TRANSMITTER.md](./docs/FLORIDA-NOT-MONEY-TRANSMITTER.md). No custody, no transmission on behalf of others, no platform receipt of user payment flows without legal sign-off.

---

## Done recently (for context)

- [x] Strategy fill tracking & PnL: EXECUTION_RESULT (sim + LIVE after Xaman sign) updates strategyStore (addExposure, updatePnL, addDCAEntry); Terminal shows "Verified on ledger" after reconcile.
- [x] Plan → sign → submit (LIVE): Xaman auto-submits; Terminal gets txHash, publishes EXECUTION_RESULT, reconciles via getTransaction; execution.ts doc updated.
- [x] Orchestra kill switch in UI: Terminal has Pause/Resume (Agents: Paused/Running) next to Strategy mode; persisted in strategy store.
- [x] Paper trading: TWAP & Iceberg (sim), backtest equity curve
- [x] Orchestra: LoopJam Sentinel, Wall Street Elite, VentureEval agents; Run the Orchestra link + cost clarity (drops/XRP, free sim)
- [x] Strategy agents: MarketMaker, DCA, Arbitrage (modular, event-based); strategy store; Strategies panel (Terminal) with PnL gauge, DCA chart, arb heatmap, ladder
- [x] TrustGraph (backend): FastAPI, ingest worker, orchestra-python; doc only (no UI)
- [x] Ethereum L1 cost copy updated site-wide (~$0.12, ~$120/min)

---

## 1. Product & features

### Terminal & trading

- [ ] **Run Orchestra with strategy agents on Terminal**  
  Use `useOrchestra({ includeStrategyAgents: true })` (e.g. on Terminal or a dedicated Strategies page) so MM/DCA/Arb agents tick and emit intents when strategies are enabled.

- [ ] **Wire wallet address into strategy store**  
  On connect (Xaman/wallet), set `strategyStore.walletAddress` so strategy intents use the correct `owner`.

- [ ] **Real AMM quote for ArbitrageAgent**  
  Replace synthetic AMM quote with real `amm_info` or AMM quote API; feed into strategy state so arb logic uses real CLOB vs AMM spread.

- [x] **Strategy fill tracking & PnL**  
  On fill (post-sign): `EXECUTION_RESULT` in useOrchestra updates `strategyStore.addExposure`, `updatePnL`, `addDCAEntry`; Terminal publishes EXECUTION_RESULT with plan + txHashes after Xaman sign; reconcile runs and UI shows "Verified on ledger."

- [ ] **Grid strategy agent**  
  Add a GridStrategyAgent (or plug existing grid logic into Orchestra) that reads `strategy:grid:enabled` and shared exposure, emits `OFFER_MAKE` / `OFFER_CANCEL` for re-grids; keep 100% non-custodial.

- [ ] **Advanced order types (live)**  
  TWAP/Iceberg exist in paper trading; add limit, stop-limit, trailing stop (and optionally OCO/bracket) for when you move to testnet/mainnet execution.

- [ ] **Backtesting engine**  
  Historical data + run strategies (grid, DCA, MM) over past data; already have `backtestingEngine` and equity curve—extend to multi-strategy and real XRPL history if available.

### Data & infra

- [ ] **WebSocket price feeds (sub-100ms)**  
  Binance/Kraken/Coinbase WebSocket + aggregated best bid/ask; reduce reliance on 30s polling for Terminal/strategies.

- [ ] **Order book depth (L2)**  
  Live bid/ask ladder from XRPL DEX (`book_offers`) or CEX; show in Terminal and in strategy ladder.

- [ ] **REST API for external integrations**  
  Expose read-only or controlled endpoints for dashboards, alerts, or third-party tools.

- [ ] **PostgreSQL/TimescaleDB for tick data**  
  Persist ticks, trades, and backtest runs for analytics and replay (optional, post–Phase 2).

### Alerts & notifications

- [ ] **Multi-channel alerts (Telegram, Discord, email)**  
  AlertBuilder exists; wire to actual Telegram/Discord bots and optional email so users get real notifications.

---

## 2. Orchestra & agents

- [x] **Plan → sign → submit flow (LIVE)**  
  When mode is LIVE, after user signs (Xaman), submit `PlannedTx` via xrpl.js and reconcile with `account_tx`; today execution is “plan ready for sign” only.

- [ ] **Offer cancel in strategy agents**  
  Allow agents to emit `OFFER_CANCEL` (e.g. MM/DCA when conditions change); ensure plan builds real `OfferCancel` (already in plan.ts).

- [ ] **Netting for OFFER_MAKE**  
  Optional: net multiple offer intents into fewer txs where possible (e.g. same pair/side); currently each intent → one tx.

- [x] **Orchestra kill switch in UI**  
  Terminal has Pause/Resume next to Strategy mode (Agents: Paused/Running); persisted in strategy store; useOrchestra applies killSwitch to orchestra.

- [ ] **More “Run the Orchestra” tasks**  
  Add tasks that call pathfinding, AMM quote, or TrustGraph when backend is available; keep Learn/Pay agents page as single entry point.

---

## 3. TrustGraph & backend

- [ ] **TrustGraph in UI**  
  Optional read-only view: graph explorer or “context for this address” powered by TrustGraph API (see [TRUSTGRAPH-ORCHESTRA.md](./docs/TRUSTGRAPH-ORCHESTRA.md)).

- [ ] **Orchestra Python ↔ frontend**  
  If you use orchestra-python for anomaly/context workflows, define a small API or event contract so the Control Room can trigger or display results.

---

## 4. Compliance, safety & docs

- [ ] **AI risk & explainability**  
  Document AI agent decisions (which agent, which intent, why); add a simple “last decisions” / audit panel for explainability (EU AI Act / Colorado readiness).

- [ ] **Expand COMPLIANCE docs**  
  AI-specific risk policy, explainability protocol, incident reporting; keep REGULATORY-WATCH and COMPLIANCE-GLOBAL-US-FLORIDA in sync with roadmap phases.

- [ ] **Logging for sim and testnet**  
  Log all sim and testnet actions (intents, plans, approvals) for mock audits and support.

---

## 5. Phased rollout (from ROADMAP.md)

- [ ] **Phase 1 (sim):** AI-driven paper trading + mock agents ✅ largely done; finish backtesting + any missing sim scenarios.
- [ ] **Phase 2 (testnet):** Dedicated testnet branch; connect UI to XRPL Testnet; supervised agents (Xaman QR); optional mock AML in Underworld.
- [ ] **Phase 3 (compliant tools):** Ripple WaaS/policy mocks, trust layers, then sandbox when ready.
- [ ] **Phase 4 (funding):** XRPL Grants AI Fund (Spring 2026), accelerator, community feedback—ongoing.
- [ ] **Phase 5 (audit):** AI risk docs, explainability, audit logging—ongoing.

---

## 6. UX & polish

- [ ] **Mobile responsive**  
  Optimize Navigation, Terminal, Strategies panel, and key modals for small screens and touch.

- [ ] **“Grandma” simplicity**  
  Keep one-tap flows (e.g. Run the Orchestra default task), clear labels (“Free to use”, “Simulated”), and hide advanced options behind “More options” or similar.

- [ ] **Accessibility (a11y)**  
  Keyboard nav, focus states, ARIA where needed, and contrast checks for cyber theme (WCAG 2.1 AA where feasible).

- [ ] **Loading & error states**  
  Consistent skeletons/spinners and error messages for XRPL, price feeds, and strategy/orchestra actions.

---

## 7. Suggestions (optional)

- **Live strategy summary on Home**  
  Small “Strategy status” card on Home: which strategies are on, current exposure, last PnL (sim)—links to Terminal → Strategies.

- **Demo mode / tour**  
  First-time or “Demo” mode: short guided tour of Terminal → Paper Trading → Run the Orchestra → Strategies so new users see value fast.

- **Price source badge**  
  Show “CoinGecko” / “Binance” / “WebSocket” consistently where price is shown (Terminal, Strategies, Navigation) so users know the data source.

- **Export**  
  Export paper trading history, backtest results, or strategy PnL to CSV for tax or analysis.

- **i18n**  
  If you target non-English users, extract strings and add one language (e.g. Spanish or Japanese) as a pilot.

- **E2E tests**  
  Playwright or Cypress for critical paths: connect wallet, place paper trade, run Orchestra, enable strategy—catches regressions before deploy.

---

## Priority order (suggested)

| Priority | Item |
|----------|------|
| **P0** | Wire wallet into strategy store; Run Orchestra with strategy agents on Terminal (or Strategies page). |
| **P1** | Strategy fill tracking & PnL updates; real AMM quote for arb. |
| **P1** | Plan → sign → submit (LIVE) so signed txs actually hit the ledger. |
| **P2** | WebSocket price feeds; order book depth in Terminal. |
| **P2** | Grid strategy agent; advanced order types for live execution. |
| **P2** | Multi-channel alerts (Telegram/Discord). |
| **P3** | TrustGraph in UI; REST API; mobile responsive. |
| **P3** | Backtesting multi-strategy; PostgreSQL/tick storage. |
| **P4** | Compliance/AI docs; E2E tests; i18n; export. |

You can paste this into issues, a project board, or keep it as a single checklist and tick items as you go.
