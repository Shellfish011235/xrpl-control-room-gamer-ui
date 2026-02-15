/**
 * MarketMakerAgent – Hummingbot-inspired adaptive market making on XRPL DEX.
 * Places buy/sell offers around mid; widens spread when volatility is high.
 * Non-custodial: emits OFFER_MAKE intents for user to sign.
 */

import type { Agent, AgentContext } from '../orchestra/types';
import type { OfferMakeIntent } from '../types/agentIntents';

const AGENT_ID = 'agent_market_maker';
const DEFAULT_SPREAD_BPS = 30;      // 0.30% each side
const VOL_WIDER_BPS = 80;          // when vol high, spread each side
const MIN_ORDER_SIZE_XRP = 10;
const MAX_ORDER_SIZE_XRP = 500;
const VOLATILITY_THRESHOLD = 0.02;  // 2% → switch to wider spread

export class MarketMakerAgent implements Agent {
  id = AGENT_ID;
  name = 'Market Maker (Hummingbot-style)';
  role = 'Adaptive DEX market making: place symmetric offers around mid, widen on vol';
  goal = 'Emit OFFER_MAKE intents when spread/vol regime allows; user signs all txs';

  async tick(ctx: AgentContext): Promise<void> {
    const enabled = ctx.readState('strategy:mm:enabled') as boolean | undefined;
    if (enabled === false) return;

    const exposure = (ctx.readState('strategy:shared:exposureXRP') as number) ?? 0;
    const maxExposure = (ctx.readState('strategy:shared:maxExposureXRP') as number) ?? 1000;
    if (exposure >= maxExposure) return;

    const market = ctx.market;
    if (!market?.mid || market.mid <= 0) return;

    const mid = market.mid;
    const vol = market.volatility ?? 0;
    const spreadBps = vol >= VOLATILITY_THRESHOLD ? VOL_WIDER_BPS : (market.spreadBps ?? DEFAULT_SPREAD_BPS);
    const halfSpread = (spreadBps / 10000) * mid;
    const buyPrice = mid - halfSpread;
    const sellPrice = mid + halfSpread;

    const orderSize = Math.min(MAX_ORDER_SIZE_XRP, Math.max(MIN_ORDER_SIZE_XRP, 50));
    const lastEmit = (ctx.readState('strategy:mm:lastEmit') as number) ?? 0;
    if (ctx.now() - lastEmit < 15_000) return; // throttle 15s

    const owner = (ctx.readState('wallet:address') as string) || 'rUSER0000000000000000000000000000000';
    const takerGetsXRP = orderSize.toFixed(6);
    const takerPaysUSD = (orderSize * buyPrice).toFixed(2);

    const buyIntent: OfferMakeIntent = {
      id: crypto.randomUUID(),
      agentId: this.id,
      type: 'OFFER_MAKE',
      createdAt: ctx.now(),
      owner,
      takerGets: { asset: { kind: 'XRP' }, amount: takerGetsXRP },
      takerPays: { asset: { kind: 'IOU', currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' }, amount: takerPaysUSD },
      memo: `mm_buy_${spreadBps}bps`,
    };
    ctx.emit(buyIntent);

    const sellIntent: OfferMakeIntent = {
      id: crypto.randomUUID(),
      agentId: this.id,
      type: 'OFFER_MAKE',
      createdAt: ctx.now(),
      owner,
      takerGets: { asset: { kind: 'IOU', currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' }, amount: (orderSize * sellPrice).toFixed(2) },
      takerPays: { asset: { kind: 'XRP' }, amount: takerGetsXRP },
      memo: `mm_sell_${spreadBps}bps`,
    };
    ctx.emit(sellIntent);

    ctx.writeState('strategy:mm:lastEmit', ctx.now());
    ctx.writeState('strategy:mm:lastSpreadBps', spreadBps);
    ctx.writeState('strategy:mm:lastMid', mid);
  }
}
