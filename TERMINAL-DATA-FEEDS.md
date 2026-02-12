# Terminal – Live Data Feed Reference

This doc lists **each section** on the Trading Terminal and **where its data comes from**, so you can see at a glance which feeds are live and which are static or fallback.

---

## 1. Liquidation Heatmap (XRP Estimated)

| What | Source |
|------|--------|
| **Price** | Terminal fetches XRP price: **CoinGecko** → **Binance** → **Fallback** (static) |
| **Liquidation levels** | `liquidationHeatmap` service (estimated from price + open interest style data) |
| **UI label** | Under the chart: *"Price: CoinGecko (live)"* / *"Binance (live)"* / *"Fallback (APIs unavailable)"* / *"Loading…"* |

---

## 2. XRPL Pathfinding

| What | Source |
|------|--------|
| **Connection** | **WebSocket** to XRPL Mainnet (xrplcluster.com) |
| **Pathfinding** | `ripple_path_find` (live RPC) |
| **UI label** | Header: **LIVE** badge. Footer: *"🟢 XRPL Mainnet via WebSocket (xrplcluster.com)"* (or ⚪ when disconnected) |

---

## 3. Risk Dashboard (Paper Trading)

| What | Source |
|------|--------|
| **Data** | **Paper trading store** (positions, cash, PnL, trade history) |
| **Metrics** | `advancedRiskMetrics` (VaR, CVaR, Sharpe, etc.) computed from that store |
| **UI label** | Footer: *"Data: Paper trading store"* |

No separate price feed; it uses whatever prices are in the paper trading store (static by default, or live if Paper Trading has live feeds enabled).

---

## 4. Position Liquidation Risk

| What | Source |
|------|--------|
| **Price** | Same as **Liquidation Heatmap** (Terminal’s XRP price: CoinGecko → Binance → Fallback) |
| **Positions** | Paper trading store |
| **UI label** | Footer: *"Price: CoinGecko (live)"* / *"Binance (live)"* / *"Fallback (APIs unavailable)"* / *"Loading…"* (when provided by Terminal) |

---

## 5. Alerts

| What | Source |
|------|--------|
| **Alert definitions** | Local store (alert builder) |
| **Trigger checks** | Use **paper trading store** prices (and any future price/API you wire in) |

No standalone live feed label in UI; alerts fire against the same price source as Paper Trading when evaluated.

---

## 6. Ledger Impact Tool

| What | Source |
|------|--------|
| **Amendments** | **XRPScan** (live) or **fallback** list |
| **UI label** | Header: **LIVE** when from XRPScan. Footer: *"Data: XRPScan (live)"* or *"Data: Fallback"* |

---

## 7. Paper Trading

| What | Source |
|------|--------|
| **Prices (default)** | **Static** (default 24-pair list). No live feed by default so the panel loads reliably. |
| **Prices (optional)** | When *"Live prices"* is enabled: **WebSocket (Binance)** + **CoinGecko** (30s poll), merged. |
| **UI label** | Under *"Practice without risk"*: *"Live prices"* (when live) or *"Prices: Static"* (when not). |

To use live feeds: pass `useLiveFeeds={true}` to `PaperTradingPanel` or add an in-app toggle that does so.

---

## Summary

| Section              | Primary feed              | Live?                    |
|----------------------|---------------------------|--------------------------|
| Liquidation Heatmap  | CoinGecko / Binance / Fallback | Yes when APIs up        |
| XRPL Pathfinding    | WebSocket (xrplcluster.com)   | Yes when connected      |
| Risk Dashboard      | Paper trading store       | N/A (derived)           |
| Position Liq Risk    | Same as Liquidation Heatmap   | Same as above           |
| Alerts              | Paper trading store (prices)  | Same as Paper Trading   |
| Ledger Impact Tool  | XRPScan or fallback       | Yes when XRPScan used    |
| Paper Trading       | Static or WS + CoinGecko  | Optional (off by default)|

---

*Last updated: February 2026. For compliance and regulatory context see [COMPLIANCE-GLOBAL-US-FLORIDA.md](./COMPLIANCE-GLOBAL-US-FLORIDA.md) and [REGULATORY-WATCH.md](./REGULATORY-WATCH.md).*
