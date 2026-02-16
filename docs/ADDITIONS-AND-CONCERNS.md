# Additions & Concerns (from roadmap pass)

Things that were added or that we think should be added / we’re concerned about, as of this pass.

---

## Implemented today

1. **WebSocket price feed (Terminal)**  
   - `useXRPPrice()` in `websocketPriceFeeds.ts`: WebSocket-first (Binance), REST fallback (CoinGecko → Binance → fallback).  
   - Terminal uses it; price source label can show “Binance (WebSocket)” when WS is active.  
   - **Consider:** Use the same hook in Navigation header so the whole app gets WS price (would need to add `change24h` to the hook if header shows 24h change).

2. **Loading & error states**  
   - **Terminal:** Plan-sign error shown under “Sign in Xaman” (rejected, expired, or request failed). Price feed error shown in header when `useXRPPrice()` reports one.  
   - **Strategies panel:** AMM quote (for arb) shows “Loading…”, “$x.xx”, or “Unavailable” / “Failed to load” under the strategy cards.  
   - **Consider:** Add skeletons for LiquidationHeatmap / RiskDashboard if they have slow async data (LiquidationHeatmap already has loading/error).

3. **Multi-channel alerts (Telegram / Discord)**  
   - Delivery was already implemented in `alertNotifications.ts`.  
   - **Added:** `sendTestTelegram()` and `sendTestDiscord()` on `alertEngine`; AlertBuilder → Settings has “Test Telegram” and “Test Discord” when token/chatId or webhook are set.  
   - **Concern:** Telegram bot token and Discord webhook are stored in the client (Zustand persist). For production, a backend/serverless proxy is safer so tokens are not in the frontend. Doc comment in code already notes this.

---

## Suggested additions

- **Navigation header:** Switch to `useXRPPrice()` from `websocketPriceFeeds` so the header gets WebSocket price when available. Extend the hook to return `change24h` (e.g. from aggregated `priceChangePercent24h` or keep from REST) so the header can keep showing 24h change.
- **Alert delivery:** Optional serverless route (e.g. `POST /api/alert`) that accepts channel + message and uses server-side env for `ALERT_TELEGRAM_BOT_TOKEN` and `ALERT_DISCORD_WEBHOOK`; frontend would call that instead of Telegram/Discord directly.
- **useXRPPrice error:** Today we only set `error` in the hook in edge cases. Consider setting `error` when REST returns fallback (e.g. “Using fallback price”) so the UI can show a gentle warning.
- **Plan sign (LIVE):** Only the first tx in a plan is sent to Xaman. If a plan has multiple txs, we’d need a flow to “Sign next” for each (or batch where supported).
- **E2E tests:** Playwright/Cypress for connect wallet, paper trade, run Orchestra, enable strategy (from roadmap).

---

## Concerns

- **Telegram/Discord secrets:** Stored in client (localStorage via Zustand persist). Anyone with device access can see them. Prefer backend proxy for production.
- **CORS / rate limits:** Telegram and Discord are called from the browser. Telegram Bot API and Discord webhooks are usually CORS-friendly; if you hit rate limits, consider the proxy above.
- **AMM quote polling:** StrategiesPanel polls `getAmmPriceXRPUSD()` every 25s. No loading state on first paint before first result (we show “Loading…” then value/error). Fine for now; if XRPL or network is slow, consider longer initial timeout or retry.
- **WebSocket singleton:** `wsFeeds` is a singleton; `useXRPPrice()` and `useRealtimePrices()` both start it. If no component uses them, the WS never starts. If both Terminal and Navigation use `useXRPPrice()`, only one WS connection is used. Good.

---

*Last updated from roadmap implementation pass.*
