/**
 * Liquidity flow tracking: XRP/IOU transfers, trust lines, offer activity, time-bucketed aggregates.
 */

import type { NormalizedPayment } from '../xrpl/types';

export interface AssetFlow {
  asset: string;
  issuer?: string;
  inflow: number;
  outflow: number;
  net: number;
  txCount: number;
  uniqueSenders: number;
  uniqueReceivers: number;
}

export interface TimeBucketFlow {
  bucketStart: number;
  bucketEnd: number;
  assets: Map<string, AssetFlow>;
  totalXrpVolume: number;
}

export interface LiquidityState {
  flowsByAsset: Map<string, AssetFlow>;
  timeBuckets: TimeBucketFlow[];
  lastUpdated: number;
  highVelocityAssets: string[];
}

const BUCKET_MS = 5 * 60 * 1000;
const MAX_BUCKETS = 24;
const HIGH_VELOCITY_MIN_TX = 10;
const HIGH_VELOCITY_MIN_VOLUME = 100_000;

function assetKey(currency: string, issuer?: string): string {
  return issuer ? `${currency}.${issuer}` : currency;
}

export function createLiquidityState(): LiquidityState {
  return {
    flowsByAsset: new Map(),
    timeBuckets: [],
    lastUpdated: 0,
    highVelocityAssets: [],
  };
}

export function processPaymentForLiquidity(state: LiquidityState, payment: NormalizedPayment): LiquidityState {
  const amount = payment.amountValue ?? parseInt(payment.amountDrops, 10) / 1_000_000;
  const currency = payment.currency ?? 'XRP';
  const key = assetKey(currency, payment.issuer);

  const flowsByAsset = new Map(state.flowsByAsset);
  const flow = flowsByAsset.get(key) ?? {
    asset: currency,
    issuer: payment.issuer,
    inflow: 0,
    outflow: 0,
    net: 0,
    txCount: 0,
    uniqueSenders: 0,
    uniqueReceivers: 0,
  };
  flow.outflow += amount;
  flow.inflow += amount;
  flow.txCount += 1;
  flowsByAsset.set(key, { ...flow });

  const now = Date.now();
  const bucketStart = Math.floor(now / BUCKET_MS) * BUCKET_MS;
  let timeBuckets = [...state.timeBuckets];
  let bucket = timeBuckets.find((b) => b.bucketStart === bucketStart);
  if (!bucket) {
    bucket = {
      bucketStart,
      bucketEnd: bucketStart + BUCKET_MS,
      assets: new Map(),
      totalXrpVolume: 0,
    };
    timeBuckets.unshift(bucket);
    if (timeBuckets.length > MAX_BUCKETS) timeBuckets.pop();
  }
  const bAsset = bucket.assets.get(key) ?? { asset: currency, issuer: payment.issuer, inflow: 0, outflow: 0, net: 0, txCount: 0, uniqueSenders: 0, uniqueReceivers: 0 };
  bAsset.outflow += amount;
  bAsset.inflow += amount;
  bAsset.txCount += 1;
  if (currency === 'XRP') bucket.totalXrpVolume += amount;
  bucket.assets.set(key, { ...bAsset });

  const highVelocityAssets = Array.from(flowsByAsset.entries())
    .filter(([, f]) => f.txCount >= HIGH_VELOCITY_MIN_TX && (f.inflow + f.outflow) >= HIGH_VELOCITY_MIN_VOLUME)
    .map(([k]) => k);

  return {
    flowsByAsset,
    timeBuckets,
    lastUpdated: now,
    highVelocityAssets,
  };
}

export function getDirectionalFlows(state: LiquidityState): AssetFlow[] {
  return Array.from(state.flowsByAsset.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}
