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

// ==================== XRPL PUBLIC SERVERS ====================
// WebSocket endpoints - using public servers with full API access
// Note: ripple_path_find requires admin access, so we use book_offers instead
const WEBSOCKET_SERVERS = [
  'wss://xrplcluster.com',        // XRPL Foundation cluster
  'wss://s1.ripple.com',          // Ripple server
  'wss://s2.ripple.com',          // Ripple server (backup)
];

// Active WebSocket connection
let activeSocket: WebSocket | null = null;
let currentServerIndex = 0;
let requestId = 0;
const pendingRequests: Map<number, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

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

// ==================== WEBSOCKET CONNECTION ====================

function getNextServer(): string {
  const server = WEBSOCKET_SERVERS[currentServerIndex];
  currentServerIndex = (currentServerIndex + 1) % WEBSOCKET_SERVERS.length;
  return server;
}

async function ensureConnection(): Promise<WebSocket> {
  // Return existing connection if healthy
  if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
    return activeSocket;
  }
  
  // Close stale connection
  if (activeSocket) {
    try {
      activeSocket.close();
    } catch (e) {
      // Ignore close errors
    }
    activeSocket = null;
  }
  
  // Try each server
  const errors: string[] = [];
  
  for (let i = 0; i < WEBSOCKET_SERVERS.length; i++) {
    const serverUrl = getNextServer();
    console.log(`[Pathfinding] Connecting to WebSocket: ${serverUrl}`);
    
    try {
      const socket = await connectWebSocket(serverUrl);
      activeSocket = socket;
      console.log(`[Pathfinding] Connected to ${serverUrl}`);
      return socket;
    } catch (error: any) {
      console.warn(`[Pathfinding] Failed to connect to ${serverUrl}:`, error.message);
      errors.push(`${serverUrl}: ${error.message}`);
    }
  }
  
  throw new Error(`Could not connect to any XRPL server:\n${errors.join('\n')}`);
}

function connectWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout (10s)'));
    }, 10000);
    
    try {
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        clearTimeout(timeout);
        console.log(`[Pathfinding] WebSocket opened: ${url}`);
        resolve(socket);
      };
      
      socket.onerror = (event) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket connection error'));
      };
      
      socket.onclose = (event) => {
        console.log(`[Pathfinding] WebSocket closed: ${url}`, event.code, event.reason);
        if (activeSocket === socket) {
          activeSocket = null;
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const id = data.id;
          
          if (id !== undefined && pendingRequests.has(id)) {
            const { resolve, reject } = pendingRequests.get(id)!;
            pendingRequests.delete(id);
            
            if (data.error) {
              reject(new Error(data.error_message || data.error));
            } else if (data.result?.error) {
              reject(new Error(data.result.error_message || data.result.error));
            } else {
              resolve(data.result);
            }
          }
        } catch (e) {
          console.warn('[Pathfinding] Failed to parse message:', e);
        }
      };
    } catch (error: any) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function xrplRequest(method: string, params: any[]): Promise<any> {
  const socket = await ensureConnection();
  
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Request timeout (30s)'));
    }, 30000);
    
    pendingRequests.set(id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });
    
    const request = {
      id,
      command: method,  // WebSocket uses 'command' not 'method'
      ...params[0]      // Spread params directly
    };
    
    console.log(`[Pathfinding] Sending request:`, request);
    socket.send(JSON.stringify(request));
  });
}

// ==================== PATHFINDING FUNCTIONS ====================

/**
 * Find payment paths between two accounts/currencies
 * Uses book_offers to analyze available liquidity (ripple_path_find requires admin)
 */
export async function findPaymentPaths(
  sourceAccount: string,
  destinationAccount: string,
  destinationAmount: PathAmount,
  sourceCurrencies?: PathAmount[]
): Promise<PathfindingResult> {
  try {
    // Use book_offers to get order book data
    // This shows available liquidity without requiring admin access
    // ripple_path_find requires admin permissions on public servers
    
    // Default to XRP as source currency (most common case)
    const sourceCurrency = sourceCurrencies?.[0] || { currency: 'XRP', value: '0' };
    
    console.log('[Pathfinding] Finding paths:', {
      source: sourceCurrency.currency,
      dest: destinationAmount.currency,
      destIssuer: destinationAmount.issuer,
      amount: destinationAmount.value
    });
    
    // Build taker_gets (what we want) and taker_pays (what we offer)
    let takerGets: any;
    let takerPays: any;
    
    if (destinationAmount.currency === 'XRP') {
      takerGets = { currency: 'XRP' };
    } else {
      takerGets = {
        currency: destinationAmount.currency,
        issuer: destinationAmount.issuer
      };
    }
    
    if (sourceCurrency.currency === 'XRP') {
      takerPays = { currency: 'XRP' };
    } else {
      takerPays = {
        currency: sourceCurrency.currency,
        issuer: sourceCurrency.issuer
      };
    }

    // Get order book offers
    const result = await xrplRequest('book_offers', [{
      taker_gets: takerGets,
      taker_pays: takerPays,
      limit: 20
    }]);

    console.log('[Pathfinding] book_offers result:', result);

    // Process order book offers into path alternatives
    const offers = result.offers || [];
    const alternatives: PaymentPath[] = [];
    
    if (offers.length > 0) {
      // Calculate aggregated liquidity from order book
      let totalLiquidity = 0;
      let bestRate = 0;
      
      for (const offer of offers) {
        // Parse offer amounts
        const getsValue = typeof offer.TakerGets === 'string' 
          ? parseFloat(offer.TakerGets) / 1000000  // XRP in drops
          : parseFloat(offer.TakerGets.value);
        const paysValue = typeof offer.TakerPays === 'string'
          ? parseFloat(offer.TakerPays) / 1000000  // XRP in drops  
          : parseFloat(offer.TakerPays.value);
        
        if (paysValue > 0) {
          const rate = getsValue / paysValue;
          if (rate > bestRate) bestRate = rate;
          totalLiquidity += getsValue;
        }
      }
      
      // Create a synthetic "path" representing the best available route
      const requestedAmount = parseFloat(destinationAmount.value);
      const estimatedSource = bestRate > 0 ? requestedAmount / bestRate : requestedAmount;
      
      alternatives.push({
        pathsComputed: [],  // Direct through order book
        sourceAmount: {
          currency: sourceCurrency.currency,
          issuer: sourceCurrency.issuer,
          value: estimatedSource.toFixed(6)
        },
        effectiveRate: bestRate,
        hops: 1,
        liquidityScore: Math.min(100, (totalLiquidity / requestedAmount) * 10)
      });
    }

    // If no offers found, return informative message
    if (alternatives.length === 0) {
      return {
        success: false,
        sourceAccount,
        destinationAccount,
        destinationAmount,
        alternatives: [],
        destinationCurrencies: [],
        error: `No liquidity found for ${sourceCurrency.currency} → ${destinationAmount.currency}. Try a different currency pair or check issuer addresses.`,
        timestamp: new Date()
      };
    }

    return {
      success: true,
      sourceAccount,
      destinationAccount,
      destinationAmount,
      alternatives,
      destinationCurrencies: [],
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
 * Disconnect from XRPL WebSocket servers
 */
export function disconnectXRPL(): void {
  if (activeSocket) {
    try {
      activeSocket.close();
    } catch (e) {
      // Ignore
    }
    activeSocket = null;
  }
  pendingRequests.clear();
  console.log('[Pathfinding] Disconnected from XRPL');
}

/**
 * Check if connected to XRPL
 */
export function isConnected(): boolean {
  return activeSocket !== null && activeSocket.readyState === WebSocket.OPEN;
}

/**
 * Analyze liquidity for a trading pair
 */
export async function analyzeLiquidity(
  sourceCurrency: { currency: string; issuer?: string },
  destinationCurrency: { currency: string; issuer?: string },
  testAmounts: string[] = ['1', '10', '100', '1000']
): Promise<LiquidityAnalysis> {
  // Use Bitstamp as test account - very liquid, has many trustlines
  const testSourceAccount = 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B';
  const testDestAccount = 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B';

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
        [{
          currency: sourceCurrency.currency,
          issuer: sourceCurrency.issuer,
          value: amount
        }]
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
  disconnectXRPL,
  isConnected,
  formatCurrency,
  formatRate,
  POPULAR_PAIRS,
  KNOWN_ISSUERS
};

export default XRPLPathfinding;
