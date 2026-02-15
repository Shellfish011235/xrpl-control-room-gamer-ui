/**
 * DCAgent – DCA / dip-buy strategy on XRPL DEX.
 * If price < avg_cost * (1 - dip_pct), place buy Offer; track avg_cost in state.
 * Non-custodial: emits OFFER_MAKE intents for user to sign.
 */

import type { Agent, AgentContext } from '../orchestra/types';
import type { OfferMakeIntent } from '../types/agentIntents';

const AGENT_ID = 'agent_dca';
const DEFAULT_DIP_PCT = 0.02;   // 2% below avg cost → buy
const DCA_ORDER_SIZE_XRP = 25;
const MIN_INTERVAL_MS = 60_000;  // 1 min between DCA orders

export class DCAgent implements Agent {
  id = AGENT_ID;
  name = 'DCA Agent (Freqtrade/OctoBot-style)';
  role = 'Dollar-cost average and dip buys: place buy offers when price dips below avg cost';
  goal = 'Emit OFFER_MAKE buy intents on dip signals; user signs all txs';

  async tick(ctx: AgentContext): Promise<void> {
    const enabled = ctx.readState('strategy:dca:enabled') as boolean | undefined;
    if (enabled === false) return;

    const exposure = (ctx.readState('strategy:shared:exposureXRP') as number) ?? 0;
    const maxExposure = (ctx.readState('strategy:shared:maxExposureXRP') as number) ?? 1000;
    if (exposure >= maxExposure) return;

    const market = ctx.market;
    if (!market?.mid || market.mid <= 0) return;

    const avgCost = (ctx.readState('strategy:dca:avgCost') as number) ?? market.mid;
    const dipPct = (ctx.readState('strategy:dca:dipPct') as number) ?? DEFAULT_DIP_PCT;
    const threshold = avgCost * (1 - dipPct);

    if (market.mid >= threshold) return;

    const lastEmit = (ctx.readState('strategy:dca:lastEmit') as number) ?? 0;
    if (ctx.now() - lastEmit < MIN_INTERVAL_MS) return;

    const owner = (ctx.readState('wallet:address') as string) || 'rUSER0000000000000000000000000000000';
    const buyIntent: OfferMakeIntent = {
      id: crypto.randomUUID(),
      agentId: this.id,
      type: 'OFFER_MAKE',
      createdAt: ctx.now(),
      owner,
      takerGets: { asset: { kind: 'XRP' }, amount: DCA_ORDER_SIZE_XRP.toFixed(6) },
      takerPays: { asset: { kind: 'IOU', currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' }, amount: (DCA_ORDER_SIZE_XRP * market.mid).toFixed(2) },
      memo: 'dca_dip_buy',
    };
    ctx.emit(buyIntent);

    const totalQty = (ctx.readState('strategy:dca:totalQuantity') as number) ?? 0;
    const totalSpent = (ctx.readState('strategy:dca:totalSpent') as number) ?? 0;
    const newQty = totalQty + DCA_ORDER_SIZE_XRP;
    const newSpent = totalSpent + DCA_ORDER_SIZE_XRP * market.mid;
    const newAvgCost = newSpent / newQty;

    ctx.writeState('strategy:dca:lastEmit', ctx.now());
    ctx.writeState('strategy:dca:avgCost', newAvgCost);
    ctx.writeState('strategy:dca:totalQuantity', newQty);
    ctx.writeState('strategy:dca:totalSpent', newSpent);
  }
}
