// XRPL Pathfinding Service
// Uses native XRPL pathfinding via free public servers
// No external packages required - uses native WebSocket!

// ==================== TYPES ====================

export interface PathfindingResult {
  success: boolean;
  sourceAccount: string;
  destinationAccount: string;
  destinationAmount: PathAmount;
  alternatives: PaymentPath[];
  destinationCurrencies: string[];
  error?: string;
  timestamp: Date;
}

export interface PaymentPath {
  pathsComputed: PathStep[][];
  sourceAmount: PathAmount;
  // Calculated fields
  effectiveRate?: number;
  slippage?: number;
  hops?: number;
  liquidityScore?: number;
}

export interface PathStep {
  account?: string;
  currency?: string;
  issuer?: string;
  type?: number;
  type_hex?: string;
}

export interface PathAmount {
  currency: string;
  issuer?: string;
  value: string;
}

export interface LiquidityAnalysis {
  pair: string;
  bestRate: number;
  worstRate: number;
  avgRate: number;
  spread: number;
  spreadPercent: number;
  pathCount: number;
  maxLiquidity: string;
  recommendedPath: PaymentPath | null;
  timestamp: Date;
}

export interface PopularPair {
  source: { currency: string; issuer?: string };
  destination: { currency: string; issuer?: string };
  name: string;
  description: string;
}

// ==================== CONSTANTS ====================

// Free public XRPL servers (JSON-RPC endpoints)
const PUBLIC_SERVERS = [
  'https://xrplcluster.com/',
  'https://s1.ripple.com:51234/',
  'https://s2.ripple.com:51234/',
];

// Popular trading pairs for quick lookup
export const POPULAR_PAIRS: PopularPair[] = [
  {
    source: { currency: 'XRP' },
    destination: { currency: 'USD', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq' },
    name: 'XRP → USD',
    description: 'XRP to GateHub USD'
  },
  {
    source: { currency: 'XRP' },
    destination: { currency: 'EUR', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq' },
    name: 'XRP → EUR',
    description: 'XRP to GateHub EUR'
  },
  {
    source: { currency: 'USD', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq' },
    destination: { currency: 'XRP' },
    name: 'USD → XRP',
    description: 'GateHub USD to XRP'
  },
  {
    source: { currency: 'XRP' },
    destination: { currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' },
    name: 'XRP → USD (Bitstamp)',
    description: 'XRP to Bitstamp USD'
  },
  {
    source: { currency: 'XRP' },
    destination: { currency: 'BTC', issuer: 'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL' },
    name: 'XRP → BTC',
    description: 'XRP to GateHub BTC'
  },
  {
    source: { currency: 'XRP' },
    destination: { currency: 'ETH', issuer: 'rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h' },
    name: 'XRP → ETH',
    description: 'XRP to GateHub ETH'
  },
];

// Known issuers for display
export const KNOWN_ISSUERS: Record<string, string> = {
  'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq': 'GateHub',
  'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B': 'Bitstamp',
  'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL': 'GateHub',
  'rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h': 'GateHub',
  'rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y': 'RippleCN',
  'r94s8px6kSw1uZ1MV98dhcYTCs2oMmhpT4': 'TokyoJPY',
  'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz': 'Sologenic',
};

let currentServerIndex = 0;

// ==================== HTTP/JSON-RPC CALLS ====================

function getNextServer(): string {
  const server = PUBLIC_SERVERS[currentServerIndex];
  currentServerIndex = (currentServerIndex + 1) % PUBLIC_SERVERS.length;
  return server;
}

async function xrplRequest(method: string, params: any[]): Promise<any> {
  // Try each server until one works
  for (let i = 0; i < PUBLIC_SERVERS.length; i++) {
    const server = getNextServer();
    try {
      const response = await fetch(server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result?.error) {
        throw new Error(data.result.error_message || data.result.error);
      }

      return data.result;
    } catch (error) {
      console.warn(`[Pathfinding] Server ${server} failed:`, error);
      // Try next server
    }
  }

  throw new Error('All XRPL servers failed');
}

// ==================== PATHFINDING FUNCTIONS ====================

/**
 * Find payment paths between two accounts/currencies
 * Uses the native XRPL ripple_path_find command (free on public nodes)
 */
export async function findPaymentPaths(
  sourceAccount: string,
  destinationAccount: string,
  destinationAmount: PathAmount,
  sourceCurrencies?: PathAmount[]
): Promise<PathfindingResult> {
  try {
    // Build the destination amount in XRPL format
    let destAmount: string | { currency: string; issuer: string; value: string };
    if (destinationAmount.currency === 'XRP') {
      // XRP amounts are in drops (1 XRP = 1,000,000 drops)
      destAmount = String(Math.floor(parseFloat(destinationAmount.value) * 1000000));
    } else {
      destAmount = {
        currency: destinationAmount.currency,
        issuer: destinationAmount.issuer!,
        value: destinationAmount.value
      };
    }

    // Build request params
    const params: any = {
      source_account: sourceAccount,
      destination_account: destinationAccount,
      destination_amount: destAmount
    };

    if (sourceCurrencies && sourceCurrencies.length > 0) {
      params.source_currencies = sourceCurrencies.map(sc => ({
        currency: sc.currency,
        issuer: sc.issuer
      }));
    }

    // Make the pathfinding request
    const result = await xrplRequest('ripple_path_find', [params]);

    // Process alternatives
    const alternatives: PaymentPath[] = (result.alternatives || []).map((alt: any) => {
      const sourceAmount = parseAmount(alt.source_amount);
      const destValue = parseFloat(destinationAmount.value);
      const srcValue = parseFloat(sourceAmount.value);
      
      return {
        pathsComputed: alt.paths_computed || [],
        sourceAmount,
        effectiveRate: srcValue > 0 ? destValue / srcValue : 0,
        hops: alt.paths_computed?.[0]?.length || 0,
        liquidityScore: calculateLiquidityScore(alt)
      };
    });

    // Sort by best rate (lowest source amount)
    alternatives.sort((a, b) => 
      parseFloat(a.sourceAmount.value) - parseFloat(b.sourceAmount.value)
    );

    return {
      success: true,
      sourceAccount,
      destinationAccount,
      destinationAmount,
      alternatives,
      destinationCurrencies: result.destination_currencies || [],
      timestamp: new Date()
    };
  } catch (error: any) {
    console.error('[Pathfinding] Error:', error);
    return {
      success: false,
      sourceAccount,
      destinationAccount,
      destinationAmount,
      alternatives: [],
      destinationCurrencies: [],
      error: error.message || 'Pathfinding failed',
      timestamp: new Date()
    };
  }
}

/**
 * Analyze liquidity for a trading pair
 */
export async function analyzeLiquidity(
  sourceCurrency: { currency: string; issuer?: string },
  destinationCurrency: { currency: string; issuer?: string },
  testAmounts: string[] = ['1', '10', '100', '1000']
): Promise<LiquidityAnalysis> {
  // Use a known active account for testing (Bitstamp hot wallet - very liquid)
  const testSourceAccount = 'rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv';
  const testDestAccount = 'rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv';

  const rates: number[] = [];
  let maxLiquidity = '0';
  let recommendedPath: PaymentPath | null = null;
  let pathCount = 0;

  for (const amount of testAmounts) {
    try {
      const result = await findPaymentPaths(
        testSourceAccount,
        testDestAccount,
        {
          currency: destinationCurrency.currency,
          issuer: destinationCurrency.issuer,
          value: amount
        },
        [sourceCurrency]
      );

      if (result.alternatives.length > 0) {
        pathCount = Math.max(pathCount, result.alternatives.length);
        
        const bestAlt = result.alternatives[0];
        const rate = bestAlt.effectiveRate || 0;
        if (rate > 0) {
          rates.push(rate);
          if (parseFloat(amount) > parseFloat(maxLiquidity)) {
            maxLiquidity = amount;
            recommendedPath = bestAlt;
          }
        }
      }
    } catch (error) {
      console.warn('[Pathfinding] Liquidity test failed for amount:', amount);
    }
  }

  const pairName = `${sourceCurrency.currency}/${destinationCurrency.currency}`;
  
  if (rates.length === 0) {
    return {
      pair: pairName,
      bestRate: 0,
      worstRate: 0,
      avgRate: 0,
      spread: 0,
      spreadPercent: 0,
      pathCount: 0,
      maxLiquidity: '0',
      recommendedPath: null,
      timestamp: new Date()
    };
  }

  const bestRate = Math.max(...rates);
  const worstRate = Math.min(...rates);
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const spread = bestRate - worstRate;
  const spreadPercent = avgRate > 0 ? (spread / avgRate) * 100 : 0;

  return {
    pair: pairName,
    bestRate,
    worstRate,
    avgRate,
    spread,
    spreadPercent,
    pathCount,
    maxLiquidity,
    recommendedPath,
    timestamp: new Date()
  };
}

/**
 * Get available destination currencies for an account
 */
export async function getDestinationCurrencies(account: string): Promise<string[]> {
  try {
    const result = await xrplRequest('account_lines', [{
      account,
      limit: 100
    }]);

    const currencies = new Set<string>(['XRP']); // XRP is always available
    
    for (const line of result.lines || []) {
      currencies.add(line.currency);
    }

    return Array.from(currencies);
  } catch (error) {
    console.error('[Pathfinding] Error fetching currencies:', error);
    return ['XRP'];
  }
}

/**
 * Check if a direct path exists (no intermediaries)
 */
export async function hasDirectPath(
  sourceAccount: string,
  destinationAccount: string,
  currency: { currency: string; issuer?: string }
): Promise<boolean> {
  const result = await findPaymentPaths(
    sourceAccount,
    destinationAccount,
    { ...currency, value: '1' }
  );

  return result.alternatives.some(alt => 
    alt.pathsComputed.length === 0 || 
    alt.pathsComputed[0].length === 0
  );
}

// ==================== HELPER FUNCTIONS ====================

function parseAmount(amount: string | { currency: string; issuer?: string; value: string }): PathAmount {
  if (typeof amount === 'string') {
    // XRP amount in drops
    return {
      currency: 'XRP',
      value: (parseInt(amount) / 1000000).toString()
    };
  }
  return {
    currency: amount.currency,
    issuer: amount.issuer,
    value: amount.value
  };
}

function calculateLiquidityScore(alternative: any): number {
  // Score based on path complexity and source amount
  let score = 100;
  
  // Penalize for each hop
  const hops = alternative.paths_computed?.[0]?.length || 0;
  score -= hops * 10;
  
  // Penalize for multiple paths (more complex)
  const pathCount = alternative.paths_computed?.length || 0;
  if (pathCount > 1) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Format currency display name
 */
export function formatCurrency(currency: string, issuer?: string): string {
  if (currency === 'XRP') return 'XRP';
  
  const issuerName = issuer ? KNOWN_ISSUERS[issuer] : null;
  if (issuerName) {
    return `${currency} (${issuerName})`;
  }
  
  return issuer ? `${currency}` : currency;
}

/**
 * Format rate for display
 */
export function formatRate(rate: number): string {
  if (rate === 0) return 'N/A';
  if (rate >= 1000) return rate.toFixed(0);
  if (rate >= 1) return rate.toFixed(4);
  return rate.toFixed(8);
}

// ==================== EXPORTS ====================

export const XRPLPathfinding = {
  findPaymentPaths,
  analyzeLiquidity,
  getDestinationCurrencies,
  hasDirectPath,
  formatCurrency,
  formatRate,
  POPULAR_PAIRS,
  KNOWN_ISSUERS
};

export default XRPLPathfinding;
