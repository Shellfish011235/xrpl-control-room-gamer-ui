/**
 * Game Pathfinding – Liquidity Crush / Farm-style integration.
 * Wraps XRPL pathfinding for gamified flows: tile match → "Path found: USD → XRP → EUR" with
 * visual route and optional testnet execution via C2V.
 */

import { findPaymentPaths } from './xrplPathfinding';
import type { PathfindingResult, PathStep, PathAmount } from './xrplPathfinding';

const PLACEHOLDER_ACCOUNT = 'rN7n7otQDd6FczFgLdlqtyMVrn3e1DjxvK';

/** Game-friendly path result for UI and rewards */
export interface GamePathResult {
  success: boolean;
  pathLabel: string;
  pathSteps: string[];
  sourceCurrency: string;
  destCurrency: string;
  amount: string;
  estimatedSourceAmount?: string;
  effectiveRate?: number;
  hops?: number;
  liquidityScore?: number;
  savingsPercent?: number;
  error?: string;
  timestamp: Date;
}

/** Currencies we show as tiles in Liquidity Crush */
export const GAME_TILE_CURRENCIES = [
  { id: 'XRP', label: 'XRP', issuer: undefined },
  { id: 'USD', label: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' },
  { id: 'EUR', label: 'EUR', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq' },
  { id: 'BTC', label: 'BTC', issuer: 'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL' },
  { id: 'ETH', label: 'ETH', issuer: 'rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h' },
] as const;

function pathAmountToCurrency(amount: PathAmount): string {
  return amount.currency || 'XRP';
}

function formatPathSteps(steps: PathStep[][]): string[] {
  const out: string[] = [];
  const flat = steps.flat();
  for (const step of flat) {
    const part = step.currency || step.account || '';
    if (part && !out.includes(part)) out.push(part);
  }
  if (out.length === 0) return [];
  return out;
}

/**
 * Build human-readable path label, e.g. "USD → XRP → EUR (best rate!)"
 */
export function formatPathLabel(
  sourceCurrency: string,
  destCurrency: string,
  pathSteps: string[],
  bestRate?: boolean
): string {
  if (pathSteps.length >= 2) {
    const mid = pathSteps.join(' → ');
    return bestRate ? `${mid} (best rate!)` : mid;
  }
  return `${sourceCurrency} → ${destCurrency}`;
}

/**
 * Find path for game: on tile match or level win, call this to get real XRPL path and display it.
 * Uses mainnet/public pathfinding (book_offers). For testnet execution, route result through C2V.
 */
export async function findPathForGame(
  sourceCurrency: string,
  destCurrency: string,
  amount: string
): Promise<GamePathResult> {
  const timestamp = new Date();
  const numAmount = parseFloat(amount) || 0;
  if (numAmount <= 0) {
    return {
      success: false,
      pathLabel: '',
      pathSteps: [],
      sourceCurrency,
      destCurrency,
      amount,
      error: 'Invalid amount',
      timestamp,
    };
  }

  const sourceAsset: PathAmount =
    sourceCurrency === 'XRP'
      ? { currency: 'XRP', value: amount }
      : {
          currency: sourceCurrency,
          value: amount,
          issuer: GAME_TILE_CURRENCIES.find((c) => c.id === sourceCurrency)?.issuer,
        };

  const destAsset: PathAmount =
    destCurrency === 'XRP'
      ? { currency: 'XRP', value: amount }
      : {
          currency: destCurrency,
          value: amount,
          issuer: GAME_TILE_CURRENCIES.find((c) => c.id === destCurrency)?.issuer,
        };

  try {
    const result: PathfindingResult = await findPaymentPaths(
      PLACEHOLDER_ACCOUNT,
      PLACEHOLDER_ACCOUNT,
      destAsset,
      [sourceAsset]
    );

    if (!result.success || result.alternatives.length === 0) {
      return {
        success: false,
        pathLabel: `${sourceCurrency} → ${destCurrency}`,
        pathSteps: [],
        sourceCurrency,
        destCurrency,
        amount,
        error: result.error ?? 'No path found – liquidity low!',
        timestamp,
      };
    }

    const best = result.alternatives[0];
    let pathSteps =
      best.pathsComputed?.length > 0
        ? formatPathSteps(best.pathsComputed)
        : [sourceCurrency, destCurrency];
    if (pathSteps.length === 0) pathSteps = [sourceCurrency, destCurrency];
    const pathLabel = formatPathLabel(
      sourceCurrency,
      destCurrency,
      pathSteps,
      (best.effectiveRate ?? 0) > 0
    );

    return {
      success: true,
      pathLabel,
      pathSteps,
      sourceCurrency,
      destCurrency,
      amount,
      estimatedSourceAmount: best.sourceAmount?.value,
      effectiveRate: best.effectiveRate,
      hops: best.hops,
      liquidityScore: best.liquidityScore,
      savingsPercent: best.effectiveRate != null ? Math.round(best.effectiveRate * 100) / 100 : undefined,
      timestamp,
    };
  } catch (e) {
    return {
      success: false,
      pathLabel: '',
      pathSteps: [],
      sourceCurrency,
      destCurrency,
      amount,
      error: e instanceof Error ? e.message : 'Pathfinding failed',
      timestamp,
    };
  }
}
