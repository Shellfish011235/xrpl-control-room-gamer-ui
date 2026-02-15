/**
 * ArbitrageAgent – Bitsgap-style CLOB vs AMM arbitrage (XRPL DEX).
 * Compare CLOB mid vs AMM quote; if spread > minProfit, emit AMM_SWAP or OFFER path.
 * Non-custodial: emits intents for user to sign.
 */

import type { Agent, AgentContext } from '../orchestra/types';
import type { OfferMakeIntent, AMMSwapIntent } from '../types/agentIntents';

const AGENT_ID = 'agent_arbitrage';
const MIN_PROFIT_BPS = 15;         // 0.15% min edge to act
const ARB_ORDER_SIZE_XRP = 50;
const COOLDOWN_MS = 30_000;

export class ArbitrageAgent implements Agent {
  id = AGENT_ID;
  name = 'Arbitrage Agent (Bitsgap-style)';
  role = 'CLOB vs AMM spread capture: execute path when CLOB mid vs AMM quote is profitable';
  goal = 'Emit OFFER_MAKE or AMM_SWAP intents when edge > minProfit; user signs all txs';

  async tick(ctx: AgentContext): Promise<void> {
    const enabled = ctx.readState('strategy:arb:enabled') as boolean | undefined;
    if (enabled === false) return;

    const exposure = (ctx.readState('strategy:shared:exposureXRP') as number) ?? 0;
    const maxExposure = (ctx.readState('strategy:shared:maxExposureXRP') as number) ?? 1000;
    if (exposure >= maxExposure) return;

    const clobMid = ctx.readState('strategy:arb:clobMid') as number | undefined;
    const ammQuote = ctx.readState('strategy:arb:ammQuote') as number | undefined;
    if (clobMid == null || ammQuote == null || clobMid <= 0) return;

    const c = clobMid as number;
    const a = ammQuote as number;
    const spreadBps = Math.abs(c - a) / c * 10000;
    if (spreadBps < MIN_PROFIT_BPS) return;

    const lastEmit = (ctx.readState('strategy:arb:lastEmit') as number) ?? 0;
    if (ctx.now() - lastEmit < COOLDOWN_MS) return;

    const owner = (ctx.readState('wallet:address') as string) || 'rUSER0000000000000000000000000000000';
    const buyCheapSellDear = a < c;

    if (buyCheapSellDear) {
      const intent: OfferMakeIntent = {
        id: crypto.randomUUID(),
        agentId: this.id,
        type: 'OFFER_MAKE',
        createdAt: ctx.now(),
        owner,
        takerGets: { asset: { kind: 'XRP' }, amount: ARB_ORDER_SIZE_XRP.toFixed(6) },
        takerPays: { asset: { kind: 'IOU', currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' }, amount: (ARB_ORDER_SIZE_XRP * a).toFixed(2) },
        memo: `arb_buy_${spreadBps.toFixed(0)}bps`,
      };
      ctx.emit(intent);
    } else {
      const intent: OfferMakeIntent = {
        id: crypto.randomUUID(),
        agentId: this.id,
        type: 'OFFER_MAKE',
        createdAt: ctx.now(),
        owner,
        takerGets: { asset: { kind: 'IOU', currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' }, amount: (ARB_ORDER_SIZE_XRP * c).toFixed(2) },
        takerPays: { asset: { kind: 'XRP' }, amount: ARB_ORDER_SIZE_XRP.toFixed(6) },
        memo: `arb_sell_${spreadBps.toFixed(0)}bps`,
      };
      ctx.emit(intent);
    }

    ctx.writeState('strategy:arb:lastEmit', ctx.now());
    ctx.writeState('strategy:arb:lastSpreadBps', spreadBps);
    ctx.writeState('strategy:arb:lastOpportunity', { clobMid: c, ammQuote: a, bps: spreadBps, ts: ctx.now() });
  }
}
