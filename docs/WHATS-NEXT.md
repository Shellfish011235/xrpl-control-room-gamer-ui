# What’s Next – XRPL Control Room

Short list of suggested next steps, in priority order. See [ROADMAP-CONSOLIDATED.md](../ROADMAP-CONSOLIDATED.md) for the full checklist.

---

## Already in place (no action needed)

- Wallet address → strategy store (on Xaman connect/disconnect in App)
- Orchestra with strategy agents on Terminal (`useOrchestra({ includeStrategyAgents: true })`)
- Real AMM quote for ArbitrageAgent (StrategiesPanel polls, `ammQuoteFromLedger`)
- Phase 0: Disclaimer, testnet/mainnet toggle, Free/Premium badge, compliance docs
- Phase 1: NFT Arena (mint with safety), Bridges, Liquidity Optimizer
- Phase 8: Agent Hub, skills (path-optimizer, nft-raider, bridge-query)
- Compliance: Platform fee OFF by default; COMPLIANCE-CHECKLIST; LICENSES-AND-COMPLIANCE
- Regulations dashboard: data-as-of, real dates for alerts, “curated” copy
- NFT mint: URI validation (HTTPS/IPFS only), anti-snipe guidance, opaque panels
- UI: NFT Arena header/tabs and mint form legibility (solid backgrounds)
- WebSocket price feed: Terminal uses `useXRPPrice()` (Binance WS first, REST fallback); label shows “Binance (WebSocket)” when live.
- Loading & error states: Plan-sign error in Terminal LIVE bar; price error in header when set; Strategies panel AMM quote status (Loading / $x.xx / Unavailable).
- Multi-channel alerts: Telegram and Discord delivery in AlertBuilder; Settings has “Test Telegram” and “Test Discord” when configured. See [ADDITIONS-AND-CONCERNS.md](ADDITIONS-AND-CONCERNS.md) for production proxy recommendation.

---

## Next (recommended order)

### 1. **Strategy fill tracking & PnL** (P1)

When a user signs and a strategy fill happens (or you reconcile from ledger), update:

- `strategyStore.addExposure`, `updatePnL(strategyId, …)`
- For DCA: `addDCAEntry` / `setDCAAvgCost`

So the Strategies panel (PnL gauge, DCA chart, ladder) stays in sync with real or simulated fills. Today the UI shows structure but not live reconciliation after sign.

### 2. **Plan → sign → submit (LIVE)** (P1)

In LIVE mode, after the user signs in Xaman, actually submit the `PlannedTx` via xrpl.js and reconcile with `account_tx`. Right now execution is “plan ready for sign” only; the signed blob isn’t submitted to the ledger by the app (Xaman may submit depending on flow—clarify and document).

### 3. **Orchestra kill switch in UI** (from roadmap)

Expose the Orchestra kill switch in a visible control (e.g. Terminal or Agent Economy) so users can pause all agent emissions in one place.

### 4. **Multi-channel alerts** (P2) ✅

AlertBuilder delivers to Telegram and Discord when configured; Test buttons in Settings. Email still “coming soon.” For production, use a backend proxy for tokens (see ADDITIONS-AND-CONCERNS.md).

### 5. **WebSocket price feeds** (P2) ✅

Terminal uses `useXRPPrice()` (Binance WebSocket first, REST fallback). Optional: use same hook in Navigation and add order book depth (L2) in Terminal.

### 6. **Order book depth (L2)** (P2)

Live bid/ask from XRPL DEX (`book_offers`) or CEX; show in Terminal and in the strategy ladder.

### 7. **UX & polish**

- **Mobile responsive:** Navigation, Terminal, Strategies panel, key modals for small screens and touch.
- **Loading & error states:** Consistent skeletons/spinners and messages for XRPL, price feeds, strategy/orchestra.
- **Accessibility:** Keyboard nav, focus states, contrast (WCAG 2.1 AA where feasible).

### 8. **Compliance & docs**

- **AI explainability:** “Last decisions” / audit panel (which agent, which intent, why) for EU AI Act / Colorado readiness.
- **Expand COMPLIANCE docs:** AI risk policy, explainability protocol, incident reporting; keep in sync with roadmap.

### 9. **Optional / later**

- Grid strategy agent (read `strategy:grid:enabled`, emit OFFER_MAKE / OFFER_CANCEL).
- TrustGraph in UI (read-only graph or “context for this address”).
- Backtesting multi-strategy + real XRPL history.
- E2E tests (Playwright/Cypress): connect wallet, paper trade, run Orchestra, enable strategy.
- Export: paper trading history, backtest results, strategy PnL to CSV.
- Stripe (or other) for Premium if you add paid tiers—after legal sign-off.

---

## Deploy

- **GitHub:** Commit is done locally. Run `git push origin main` from the repo (push failed from this environment due to 127.0.0.1:9 proxy).
- **Vercel:** If the project is linked to GitHub, pushing `main` will trigger a deploy. Or run `npx vercel --prod` from the repo.

---

*Last updated from ROADMAP-CONSOLIDATED.md and current codebase.*
