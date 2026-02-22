# Tasks to Do — Within Florida / Non–Money-Transmitter Boundaries

All items below stay within [FLORIDA-NOT-MONEY-TRANSMITTER.md](./FLORIDA-NOT-MONEY-TRANSMITTER.md): **we are a software tool; user signs in their own wallet; we do not custody, receive, or transmit on behalf of others.** No new flows where the platform receives value from user payments without legal sign-off.

---

## 1. Display & data (read-only — always in scope)

- [ ] **WebSocket price feeds (sub-100ms)**  
  Binance/Kraken/Coinbase WebSocket + aggregated best bid/ask for Terminal/Strategies. Display only.

- [ ] **Order book depth (L2)**  
  Live bid/ask from XRPL `book_offers` or CEX; show in Terminal and strategy ladder. Display only.

- [ ] **TrustGraph in UI**  
  Read-only graph explorer or “context for this address” from TrustGraph API. Display only.

- [x] **Price source badge**  
  Show “CoinGecko” / “Binance” / “WebSocket” wherever price is shown so users know the data source.

- [ ] **REST API (read-only or controlled)**  
  Expose read-only (or clearly non-custodial) endpoints for dashboards/alerts. No receipt or transmission of user funds.

---

## 2. Paper trading & simulation (no real funds — in scope)

- [ ] **Backtesting: multi-strategy**  
  Extend backtesting engine to run grid/DCA/MM over historical or simulated data; equity curve and stats. Sim only.

- [ ] **Paper trading: finish sim scenarios**  
  Any missing AI-driven or scenario-based paper trading cases. Sim only.

- [ ] **Export paper trading / backtest results**  
  Export history or backtest results to CSV. Data export only; no movement of value.

---

## 3. Suggest / prepare transactions (user signs — in scope)

- [x] **Wire wallet address into strategy store**  
  When user connects (Xaman), set `strategyStore.walletAddress` so suggested intents use the correct `owner`. Still user signs.

- [x] **Run Orchestra with strategy agents on Terminal**  
  Use `useOrchestra({ includeStrategyAgents: true })` so MM/DCA/Arb agents emit intents; user still approves and signs each plan.

- [ ] **Real AMM quote for ArbitrageAgent**  
  Use real `amm_info` or AMM quote API for CLOB vs AMM display and arb **suggestions**. User still signs any resulting offer.

- [ ] **Strategy fill tracking & PnL (display)**  
  On fill (ledger subscription or after user signs and tx confirms), update strategy store for **display** (exposure, PnL, DCA entries). We do not execute; we reflect what the user’s signed txs did.

- [ ] **Grid strategy agent**  
  GridStrategyAgent that emits `OFFER_MAKE` / `OFFER_CANCEL` **intents**; user approves and signs. Non-custodial.

- [ ] **Offer cancel in strategy agents**  
  Allow agents to emit `OFFER_CANCEL` intents; plan builds real `OfferCancel`; user signs.

- [ ] **Plan → sign → submit (LIVE)**  
  After **user signs in Xaman**, the signed transaction can be submitted to the ledger (by wallet or by us relaying the user-signed payload). We do not sign for the user.

- [ ] **Advanced order types (suggest only)**  
  Limit, stop-limit, trailing stop as **suggested** orders; user signs each. No autonomous execution.

---

## 4. Orchestra & agents (intents only — user approves/signs)

- [x] **Orchestra kill switch in UI**  
  Expose kill switch so user can pause all agent intent emission. User remains in control.

- [ ] **More “Run the Orchestra” tasks**  
  Add tasks that call pathfinding, AMM quote, or TrustGraph for **suggestions**; user still approves and signs any resulting plan.

- [ ] **Netting for OFFER_MAKE (optional)**  
  Net multiple offer intents into fewer txs when building the **plan**; user still signs the resulting txs. We do not sign.

---

## 5. Alerts & notifications (no value movement)

- [ ] **Multi-channel alerts (Telegram, Discord, email)**  
  Wire AlertBuilder to Telegram/Discord bots and optional email. Notifications only; no custody or transmission.

---

## 6. Compliance, docs & safety (within scope)

- [ ] **AI risk & explainability**  
  Document which agent suggested which intent and why; add “last decisions” / audit panel. Supports human-in-the-loop and regulatory readiness.

- [ ] **Expand COMPLIANCE docs**  
  AI risk policy, explainability protocol, incident reporting; keep REGULATORY-WATCH and COMPLIANCE-GLOBAL-US-FLORIDA in sync.

- [ ] **Logging for sim and testnet**  
  Log intents, plans, approvals (no real funds). For mock audits and support.

- [ ] **No platform fees or royalties (removed)**  
  Get Florida/US legal opinion on existing 1%/3% platform fee flow, or disable that flow in production until approved. Do not add new “we receive value from user payments” flows without sign-off.

---

## 7. UX & polish (no value movement)

- [ ] **Mobile responsive**  
  Optimize Navigation, Terminal, Strategies panel for small screens and touch.

- [ ] **“Grandma” simplicity**  
  One-tap flows, clear labels (“Free to use”, “Simulated”), advanced options behind “More options.”

- [ ] **Accessibility (a11y)**  
  Keyboard nav, focus states, ARIA, contrast for cyber theme (WCAG 2.1 AA where feasible).

- [ ] **Loading & error states**  
  Consistent skeletons/spinners and error messages for XRPL, price feeds, and strategy/orchestra actions.

- [x] **In-app disclaimer on all payment-related pages**  
  “We do not transmit money or hold your funds. You sign all transactions in your own wallet.” (Agent Economy, Micropayments, CARV, OpenClaw dashboard.)

---

## 8. Optional (within boundaries)

- [ ] **Strategy summary on Home**  
  Small card: which strategies are on, current exposure, last PnL (sim). Links to Terminal → Strategies. Display only.

- [ ] **Demo mode / tour**  
  Guided tour of Terminal → Paper Trading → Run the Orchestra → Strategies. Education only.

- [ ] **Export**  
  Export paper trading history, backtest results, or strategy PnL to CSV. Data only.

- [ ] **i18n**  
  Extract strings; add one language (e.g. Spanish or Japanese). No impact on payments.

- [ ] **E2E tests**  
  Playwright/Cypress: connect wallet, paper trade, run Orchestra, enable strategy. No real funds.

- [ ] **Orchestra Python ↔ frontend**  
  API or events to trigger or **display** anomaly/context results. Display/trigger only; no custody or transmission.

---

## Explicitly out of scope (do not add without legal sign-off)

- **Platform receiving value from user payments** — None in this project. Do not add fee/royalty flows without Florida/US counsel approval.
- **Custody or pooled funds** — No holding or controlling user funds.
- **Signing or submitting for the user without their signature** — Every real value movement requires user sign in their own wallet.
- **Autonomous execution** — No transfers without a clear user approval step per payment/plan.

---

## Priority order (Florida-safe only)

| Priority | Task |
|----------|------|
| **P0** | ~~Wire wallet into strategy store; Run Orchestra with strategy agents on Terminal (user still signs).~~ ✅ |
| **P0** | ~~Review platform fee wallet~~ — No platform fees or royalties; removed. |
| **P1** | Strategy fill tracking & PnL (display); real AMM quote for arb suggestions. |
| **P1** | Plan → sign → submit (LIVE): after user signs in Xaman, submit signed tx; we do not sign. |
| **P2** | WebSocket price feeds; order book depth (display). |
| **P2** | Grid strategy agent (intents only); ~~Orchestra kill switch in UI.~~ ✅ |
| **P2** | Multi-channel alerts (Telegram/Discord). |
| **P3** | TrustGraph in UI (read-only); REST API (read-only); mobile responsive. |
| **P3** | Backtesting multi-strategy; export paper/backtest to CSV. |
| **P4** | AI explainability/audit panel; compliance docs; E2E tests; i18n; ~~disclaimer on all payment pages.~~ ✅ |

Use this list as the single source of tasks; before adding anything new that touches payments or value, check [FLORIDA-NOT-MONEY-TRANSMITTER.md](./FLORIDA-NOT-MONEY-TRANSMITTER.md) and the “Explicitly out of scope” section above.
