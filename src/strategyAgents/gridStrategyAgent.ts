/**
 * GridStrategyAgent – adaptive offer ladder (grid) around mid price.
 * Places buy offers below mid and sell offers above mid; spacing from gridStepPct.
 * Non-custodial: emits OFFER_MAKE intents for user to sign (e.g. via Xaman).
 * Inspired by jordantete/grid_trading_bot, OctoBot grid mode.
 */

import type { Agent, AgentContext } from '../orchestra/types';
import type { OfferMakeIntent } from '../types/agentIntents';

const AGENT_ID = 'agent_grid';
const DEFAULT_GRID_STEP_PCT = 0.005;   // 0.5% between levels
const GRID_LEVELS_BELOW = 2;           // buy levels below mid
const GRID_LEVELS_ABOVE = 2;            // sell levels above mid
const ORDER_SIZE_XRP = 20;
const MIN_INTERVAL_MS = 90_000;        // 1.5 min between grid refreshes
const USD_ISSUER = 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B';

export class GridStrategyAgent implements Agent {
  id = AGENT_ID;
  name = 'Grid (adaptive offer ladder)';
  role = 'Range/volatility grid: place buy offers below mid and sell offers above mid';
  goal = 'Emit OFFER_MAKE intents for grid ladder; user signs all txs in Xaman';

  async tick(ctx: AgentContext): Promise<void> {
    const enabled = ctx.readState('strategy:grid:enabled') as boolean | undefined;
    if (enabled === false) return;

    const exposure = (ctx.readState('strategy:shared:exposureXRP') as number) ?? 0;
    const maxExposure = (ctx.readState('strategy:shared:maxExposureXRP') as number) ?? 1000;
    if (exposure >= maxExposure) return;

    const market = ctx.market;
    if (!market?.mid || market.mid <= 0) return;

    const lastEmit = (ctx.readState('strategy:grid:lastEmit') as number) ?? 0;
    if (ctx.now() - lastEmit < MIN_INTERVAL_MS) return;

    const owner = (ctx.readState('wallet:address') as string) || 'rUSER0000000000000000000000000000000';
    const stepPct = (ctx.readState('strategy:grid:stepPct') as number) ?? DEFAULT_GRID_STEP_PCT;
    const mid = market.mid;

    // Buy levels: below mid (e.g. -0.5%, -1.0%)
    for (let i = 1; i <= GRID_LEVELS_BELOW; i++) {
      const pctBelow = -i * stepPct;
      const price = mid * (1 + pctBelow);
      const buyIntent: OfferMakeIntent = {
        id: crypto.randomUUID(),
        agentId: this.id,
        type: 'OFFER_MAKE',
        createdAt: ctx.now(),
        owner,
        takerGets: { asset: { kind: 'XRP' }, amount: ORDER_SIZE_XRP.toFixed(6) },
        takerPays: { asset: { kind: 'IOU', currency: 'USD', issuer: USD_ISSUER }, amount: (ORDER_SIZE_XRP * price).toFixed(2) },
        memo: `grid_buy_${i}`,
      };
      ctx.emit(buyIntent);
    }

    // Sell levels: above mid (e.g. +0.5%, +1.0%)
    for (let i = 1; i <= GRID_LEVELS_ABOVE; i++) {
      const pctAbove = i * stepPct;
      const price = mid * (1 + pctAbove);
      const sellIntent: OfferMakeIntent = {
        id: crypto.randomUUID(),
        agentId: this.id,
        type: 'OFFER_MAKE',
        createdAt: ctx.now(),
        owner,
        takerGets: { asset: { kind: 'IOU', currency: 'USD', issuer: USD_ISSUER }, amount: (ORDER_SIZE_XRP * price).toFixed(2) },
        takerPays: { asset: { kind: 'XRP' }, amount: ORDER_SIZE_XRP.toFixed(6) },
        memo: `grid_sell_${i}`,
      };
      ctx.emit(sellIntent);
    }

    ctx.writeState('strategy:grid:lastEmit', ctx.now());
    ctx.writeState('strategy:grid:lastMid', mid);
    ctx.writeState('strategy:grid:stepPct', stepPct);
  }
}
