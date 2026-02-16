/**
 * Liquidity Path Optimizer – aggregate XRPL path_find (book_offers), AMM, bridge routes.
 * Phase 1: Rank by cost, speed, risk for Revenue MVP.
 */

import { findPaymentPaths } from './xrplPathfinding';
import { getAmmPriceXRPUSD } from './xrplDex';
import { fetchBridgeRoutes } from './bridgeService';
import type { RankedPath } from '../store/optimizerStore';

const PLACEHOLDER_ACCOUNT = 'rN7n7otQDd6FczFgLdlqtyMVrn3e1DjxvK';

export interface OptimizerInput {
  sourceAsset: string;
  destAsset: string;
  amount: string;
}

/**
 * Fetch and rank paths: XRPL native (book_offers), AMM quote, bridge routes.
 * Returns sorted by composite score (cost + speed − risk).
 */
export async function fetchRankedPaths(input: OptimizerInput): Promise<RankedPath[]> {
  const { sourceAsset, destAsset, amount } = input;
  const paths: RankedPath[] = [];
  const numAmount = parseFloat(amount) || 0;

  if (numAmount <= 0) return [];

  try {
    if (sourceAsset === 'XRP' && (destAsset === 'USD' || destAsset === 'XRP')) {
      const destAmount = destAsset === 'USD'
        ? { currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', value: amount }
        : { currency: 'XRP', value: amount };
      const result = await findPaymentPaths(PLACEHOLDER_ACCOUNT, PLACEHOLDER_ACCOUNT, destAmount);
      if (result.success && result.alternatives.length > 0) {
        const alt = result.alternatives[0];
        paths.push({
          id: `xrpl_${Date.now()}_0`,
          source: sourceAsset,
          dest: destAsset,
          amount,
          type: 'xrpl_native',
          costScore: alt.effectiveRate != null ? Math.min(100, alt.effectiveRate * 10) : 50,
          speedScore: (alt.hops != null ? 100 - alt.hops * 15 : 70),
          riskScore: alt.liquidityScore ?? 50,
          hops: alt.hops,
          estimatedSourceAmount: alt.sourceAmount?.value,
          effectiveRate: alt.effectiveRate,
          label: 'XRPL DEX (book_offers)',
        });
      }
    }

    if (sourceAsset === 'XRP' && destAsset === 'USD') {
      const ammPrice = await getAmmPriceXRPUSD();
      if (ammPrice != null) {
        const estimatedUsd = numAmount * ammPrice;
        paths.push({
          id: `amm_${Date.now()}`,
          source: 'XRP',
          dest: 'USD',
          amount,
          type: 'amm',
          costScore: Math.min(100, ammPrice * 5),
          speedScore: 85,
          riskScore: 60,
          effectiveRate: ammPrice,
          label: 'AMM (XRP/USD Bitstamp)',
        });
      }
    }

    const bridgeRoutes = await fetchBridgeRoutes();
    bridgeRoutes.slice(0, 2).forEach((r, i) => {
      paths.push({
        id: `bridge_${Date.now()}_${i}`,
        source: r.fromAsset,
        dest: r.toAsset,
        amount,
        type: 'bridge',
        costScore: 70 - r.estimatedTimeMinutes * 2,
        speedScore: Math.max(20, 80 - r.estimatedTimeMinutes * 10),
        riskScore: 50,
        label: `${r.fromChain} → ${r.toChain}`,
      });
    });
  } catch (e) {
    console.warn('[Optimizer] fetch error:', e);
  }

  const composite = (p: RankedPath) => (p.costScore * 0.4 + p.speedScore * 0.35 - (100 - p.riskScore) * 0.25);
  paths.sort((a, b) => composite(b) - composite(a));
  return paths.map((p, i) => ({ ...p, id: `${p.type}_${i}_${Date.now()}` }));
}
