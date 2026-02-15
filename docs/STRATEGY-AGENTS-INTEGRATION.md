# Strategy Agents Integration (DCA, Market Maker, Arbitrage)

## Overview

Modular strategy agents inspired by Hummingbot (market making), Freqtrade/OctoBot (DCA), and Bitsgap (arbitrage) are integrated into the XRPL Control Room Orchestra. All strategies are **non-custodial**: agents emit intents; the user signs all transactions (Xaman/wallet).

## Additions

### 1. Agent modules (`src/strategyAgents/`)

- **MarketMakerAgent** (`marketMakerAgent.ts`)  
  Hummingbot-style adaptive market making. Places buy/sell offers around mid; widens spread when `ctx.market.volatility` is high. Reads `strategy:mm:enabled`, `strategy:shared:exposureXRP`, `strategy:shared:maxExposureXRP`, `wallet:address` from context.

- **DCAgent** (`dcaAgent.ts`)  
  DCA / dip-buy: if `price < avg_cost * (1 - dip_pct)`, emits `OFFER_MAKE` buy. Tracks `avgCost`, `totalQuantity`, `totalSpent` in agent/state. Uses `strategy:dca:enabled` and shared exposure.

- **ArbitrageAgent** (`arbitrageAgent.ts`)  
  CLOB vs AMM: compares `strategy:arb:clobMid` and `strategy:arb:ammQuote`; if spread > `MIN_PROFIT_BPS`, emits `OFFER_MAKE` (buy cheap / sell dear). Uses `strategy:arb:enabled` and shared exposure.

### 2. Orchestra updates

- **Market + strategy context**  
  `Orchestra.setMarketGetter()` and `Orchestra.setStrategyStateGetter()` inject market (mid, spreadBps, volatility) and strategy toggles/exposure/wallet into `AgentContext` each tick. Agents read via `ctx.readState('strategy:...')` and `ctx.market`.

- **Plan building**  
  `plan.ts` now converts `OFFER_MAKE` and `OFFER_CANCEL` intents into full XRPL `OfferCreate` / `OfferCancel` payloads (TakerGets, TakerPays in drops or IOU format).

- **useOrchestra**  
  `useOrchestra({ includeStrategyAgents: true })` registers MarketMakerAgent, DCAgent, ArbitrageAgent and wires getters from `useStrategyStore` (market snapshot, enabled flags, max exposure, wallet address). AMM quote for arb is currently derived from market snapshot (mid + spread) for demo; replace with real AMM quote when available.

### 3. Strategy store (`src/store/strategyStore.ts`)

- **Enabled toggles**: `grid`, `dca`, `mm`, `arbitrage`.
- **Risk**: `maxExposureXRP`, `exposureXRP`, `addExposure(delta)`.
- **Market snapshot**: `marketSnapshot` (mid, spreadBps, volatility) for Orchestra context.
- **DCA**: `dcaEntries[]`, `dcaAvgCost` for chart and ladder.
- **Arb**: `arbOpportunities[]` for heatmap.
- **PnL**: `pnlByStrategy` for shared PnL gauge.
- **Wallet**: `walletAddress` for intent `owner` (set from wallet store or UI).

Persisted (partial): `enabled`, `maxExposureXRP`.

### 4. Frontend

- **StrategiesPanel** (`src/components/strategies/StrategiesPanel.tsx`)  
  Rendered on **Terminal** when price is available. Provides:
  - Strategy unlock toggles (Grid, DCA, Market Maker, Arbitrage).
  - Optional “Risk & exposure” section: max exposure (XRP), current exposure.
  - Syncs `marketSnapshot` from Terminal’s XRP price so agents get `mid`.

- **SharedPnLGauge**  
  Aggregates realized + unrealized PnL across strategies (sim).

- **DCAChart**  
  Recharts area of DCA entry prices; reference line for avg cost.

- **ArbitrageHeatmap**  
  List of recent arb opportunities (spread bps, time).

- **StrategyLadder**  
  DCA entry levels and arb alerts plus current mid.

## Integration steps

1. **Terminal**  
   - Strategies panel is already added; it syncs price to `strategyStore.marketSnapshot`.  
   - Optionally run the Orchestra with strategy agents on this page:
     - In `Terminal.tsx`, call `useOrchestra({ includeStrategyAgents: true, startImmediately: true })` so agents tick and emit intents when conditions are met. Plans then go to PLAN_READY_FOR_SIGN for user sign.

2. **Wallet address**  
   - Set `strategyStore.walletAddress` from your wallet (e.g. `useWalletStore` or connect component) so intents use the correct `owner`.

3. **Real AMM quote**  
   - When you have `amm_info` or AMM quote API, feed it into the store (e.g. `strategy:arb:ammQuote`) or extend the strategy state getter in `useOrchestra` so ArbitrageAgent sees a real CLOB vs AMM spread.

4. **Fills and PnL**  
   - On fill (ledger subscription or post-sign reconciliation), call `useStrategyStore.getState().addExposure(delta)` and `updatePnL(strategyId, { ... })` so exposure and PnL stay in sync.

5. **Grid strategy**  
   - Grid is toggled in the same panel; the existing grid logic (if any) can be moved into a `GridStrategyAgent` that also reads `strategy:grid:enabled` and shared exposure, and emits `OFFER_MAKE` / `OFFER_CANCEL` for re-grids.

## XRPL usage

- **book_offers**: Used by existing DEX/pathfinding services; agents do not call it directly (they use context from the store).
- **AMM**: ArbitrageAgent currently uses a synthetic AMM quote; replace with real AMM quote when available.
- **OfferCreate / OfferCancel**: Built in `plan.ts` from `OFFER_MAKE` and `OFFER_CANCEL` intents; user signs via PLAN_READY_FOR_SIGN.

## Risk

- **Shared max exposure** applies across all agents; each agent checks `exposureXRP < maxExposureXRP` before emitting.
- Throttling: MarketMaker (15s), DCA (1 min), Arbitrage (30s) to avoid spam.
