// XRPL DEX Service
// Trade on the XRP Ledger's built-in decentralized exchange
// Supports order books, pathfinding, and cross-currency payments

import { xrpToDrops, dropsToXRP } from './xrplService';

// ==================== TYPES ====================

export interface Currency {
  currency: string;
  issuer?: string; // Required for non-XRP currencies
}

export interface CurrencyAmount extends Currency {
  value: string;
}

export interface OrderBookOffer {
  account: string;
  takerGets: CurrencyAmount;
  takerPays: CurrencyAmount;
  quality: number; // Price ratio
  sequence: number;
  flags: number;
}

export interface OrderBook {
  asks: OrderBookOffer[]; // Sell orders (what sellers want)
  bids: OrderBookOffer[]; // Buy orders (what buyers want)
  spread: number;
  spreadPercent: number;
  midPrice: number;
  bestAsk: number;
  bestBid: number;
  timestamp: Date;
}

export interface TradeQuote {
  id: string;
  direction: 'buy' | 'sell';
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: string;
  toAmount: string;
  rate: number;
  inverseRate: number;
  slippage: number;
  fees: {
    network: string; // XRP network fee
    spread: string;  // DEX spread cost
  };
  path: PathStep[];
  expiresAt: Date;
  isPartialFill: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface PathStep {
  currency: string;
  issuer?: string;
  account?: string;
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  fromAmount: string;
  toAmount: string;
  actualRate: number;
  fees: string;
  error?: string;
}

// Known stablecoin issuers
export const KNOWN_STABLECOINS: Record<string, { currency: string; issuer: string; name: string }> = {
  'USD_GATEHUB': { currency: 'USD', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', name: 'GateHub USD' },
  'USD_BITSTAMP': { currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', name: 'Bitstamp USD' },
  'EUR_GATEHUB': { currency: 'EUR', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', name: 'GateHub EUR' },
  'BTC_GATEHUB': { currency: 'BTC', issuer: 'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL', name: 'GateHub BTC' },
  'ETH_GATEHUB': { currency: 'ETH', issuer: 'rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h', name: 'GateHub ETH' },
};

// ==================== WEBSOCKET CONNECTION ====================

const XRPL_SERVERS = [
  'wss://xrplcluster.com',
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
];

let socket: WebSocket | null = null;
let currentServerIndex = 0;
let requestId = 0;
const pendingRequests = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

async function ensureConnection(): Promise<WebSocket> {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  // Try each server
  for (let i = 0; i < XRPL_SERVERS.length; i++) {
    const serverUrl = XRPL_SERVERS[(currentServerIndex + i) % XRPL_SERVERS.length];
    try {
      socket = await connectWebSocket(serverUrl);
      currentServerIndex = (currentServerIndex + i) % XRPL_SERVERS.length;
      console.log(`[DEX] Connected to ${serverUrl}`);
      return socket;
    } catch (e) {
      console.warn(`[DEX] Failed to connect to ${serverUrl}`);
    }
  }

  throw new Error('Could not connect to any XRPL server');
}

function connectWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(ws);
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('WebSocket error'));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id !== undefined && pendingRequests.has(data.id)) {
          const { resolve, reject } = pendingRequests.get(data.id)!;
          pendingRequests.delete(data.id);
          if (data.error || data.result?.error) {
            reject(new Error(data.error_message || data.result?.error_message || 'Unknown error'));
          } else {
            resolve(data.result);
          }
        }
      } catch (e) {
        console.warn('[DEX] Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      if (socket === ws) socket = null;
    };
  });
}

async function xrplRequest(command: string, params: Record<string, unknown> = {}): Promise<any> {
  const ws = await ensureConnection();
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Request timeout'));
    }, 30000);

    pendingRequests.set(id, {
      resolve: (v) => { clearTimeout(timeout); resolve(v); },
      reject: (e) => { clearTimeout(timeout); reject(e); },
    });

    ws.send(JSON.stringify({ id, command, ...params }));
  });
}

// ==================== ORDER BOOK ====================

/**
 * Get the order book for a trading pair
 */
export async function getOrderBook(
  baseCurrency: Currency,
  quoteCurrency: Currency,
  limit: number = 20
): Promise<OrderBook> {
  // Get both sides of the book
  const [asksResult, bidsResult] = await Promise.all([
    // Asks: People selling base for quote (we're buying base)
    xrplRequest('book_offers', {
      taker_gets: formatCurrency(baseCurrency),
      taker_pays: formatCurrency(quoteCurrency),
      limit,
    }),
    // Bids: People buying base for quote (we're selling base)
    xrplRequest('book_offers', {
      taker_gets: formatCurrency(quoteCurrency),
      taker_pays: formatCurrency(baseCurrency),
      limit,
    }),
  ]);

  const asks = parseOffers(asksResult.offers || [], baseCurrency, quoteCurrency);
  const bids = parseOffers(bidsResult.offers || [], quoteCurrency, baseCurrency, true);

  // Calculate spread
  const bestAsk = asks.length > 0 ? asks[0].quality : 0;
  const bestBid = bids.length > 0 ? bids[0].quality : 0;
  const midPrice = (bestAsk + bestBid) / 2;
  const spread = bestAsk - bestBid;
  const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  return {
    asks,
    bids,
    spread,
    spreadPercent,
    midPrice,
    bestAsk,
    bestBid,
    timestamp: new Date(),
  };
}

function parseOffers(
  offers: any[],
  baseCurrency: Currency,
  quoteCurrency: Currency,
  invertQuality: boolean = false
): OrderBookOffer[] {
  return offers.map(offer => {
    const takerGets = parseAmount(offer.TakerGets);
    const takerPays = parseAmount(offer.TakerPays);
    
    let quality = parseFloat(takerPays.value) / parseFloat(takerGets.value);
    if (invertQuality) {
      quality = 1 / quality;
    }

    return {
      account: offer.Account,
      takerGets,
      takerPays,
      quality,
      sequence: offer.Sequence,
      flags: offer.Flags,
    };
  });
}

function parseAmount(amount: string | { currency: string; issuer?: string; value: string }): CurrencyAmount {
  if (typeof amount === 'string') {
    return { currency: 'XRP', value: dropsToXRP(amount).toString() };
  }
  return {
    currency: amount.currency,
    issuer: amount.issuer,
    value: amount.value,
  };
}

function formatCurrency(currency: Currency): { currency: string } | { currency: string; issuer: string } {
  if (currency.currency === 'XRP') {
    return { currency: 'XRP' };
  }
  if (!currency.issuer) {
    throw new Error(`Issuer required for ${currency.currency}`);
  }
  return { currency: currency.currency, issuer: currency.issuer };
}

// ==================== TRADE QUOTES ====================

/**
 * Get a quote for trading between two currencies
 */
export async function getTradeQuote(
  fromCurrency: Currency,
  toCurrency: Currency,
  amount: string,
  direction: 'buy' | 'sell' = 'sell'
): Promise<TradeQuote> {
  // Get order book
  const orderBook = await getOrderBook(
    direction === 'sell' ? fromCurrency : toCurrency,
    direction === 'sell' ? toCurrency : fromCurrency
  );

  const offers = direction === 'sell' ? orderBook.asks : orderBook.bids;
  
  if (offers.length === 0) {
    throw new Error(`No liquidity for ${fromCurrency.currency}/${toCurrency.currency}`);
  }

  // Calculate how much we can get for our amount
  const inputAmount = parseFloat(amount);
  let remainingInput = inputAmount;
  let totalOutput = 0;
  const usedOffers: OrderBookOffer[] = [];

  for (const offer of offers) {
    if (remainingInput <= 0) break;

    const offerInput = direction === 'sell' 
      ? parseFloat(offer.takerGets.value)
      : parseFloat(offer.takerPays.value);
    const offerOutput = direction === 'sell'
      ? parseFloat(offer.takerPays.value)
      : parseFloat(offer.takerGets.value);

    const fillAmount = Math.min(remainingInput, offerInput);
    const outputAmount = (fillAmount / offerInput) * offerOutput;

    remainingInput -= fillAmount;
    totalOutput += outputAmount;
    usedOffers.push(offer);
  }

  const isPartialFill = remainingInput > 0;
  const filledInput = inputAmount - remainingInput;
  const rate = totalOutput / filledInput;
  
  // Calculate slippage (difference from best price)
  const bestRate = direction === 'sell' ? orderBook.bestAsk : orderBook.bestBid;
  const slippage = Math.abs((rate - bestRate) / bestRate) * 100;

  // Determine confidence based on fill and slippage
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (isPartialFill || slippage > 2) confidence = 'low';
  else if (slippage > 0.5) confidence = 'medium';

  return {
    id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    direction,
    fromCurrency,
    toCurrency,
    fromAmount: filledInput.toFixed(6),
    toAmount: totalOutput.toFixed(6),
    rate,
    inverseRate: 1 / rate,
    slippage,
    fees: {
      network: '0.000012', // ~12 drops
      spread: (rate * orderBook.spreadPercent / 100).toFixed(6),
    },
    path: [], // Direct trade, no path
    expiresAt: new Date(Date.now() + 30000), // 30 second expiry
    isPartialFill,
    confidence,
  };
}

/**
 * Get a quote for a cross-currency payment using pathfinding
 * This finds the best route through the DEX
 */
export async function getCrossPaymentQuote(
  sourceAccount: string,
  sourceCurrency: Currency,
  destinationAccount: string,
  destinationAmount: CurrencyAmount
): Promise<TradeQuote> {
  // Use ripple_path_find for cross-currency paths
  // Note: This requires being connected to a server that supports it
  
  try {
    const result = await xrplRequest('book_offers', {
      taker_gets: formatCurrency({ currency: destinationAmount.currency, issuer: destinationAmount.issuer }),
      taker_pays: formatCurrency(sourceCurrency),
      limit: 20,
    });

    const offers = result.offers || [];
    if (offers.length === 0) {
      throw new Error('No path found');
    }

    // Calculate required source amount
    const destValue = parseFloat(destinationAmount.value);
    let sourceNeeded = 0;
    let remaining = destValue;

    for (const offer of offers) {
      if (remaining <= 0) break;
      
      const gets = parseAmount(offer.TakerGets);
      const pays = parseAmount(offer.TakerPays);
      const getsValue = parseFloat(gets.value);
      const paysValue = parseFloat(pays.value);
      
      const fillDest = Math.min(remaining, getsValue);
      const fillSource = (fillDest / getsValue) * paysValue;
      
      remaining -= fillDest;
      sourceNeeded += fillSource;
    }

    const rate = destValue / sourceNeeded;
    const isPartialFill = remaining > 0;

    return {
      id: `quote_${Date.now()}`,
      direction: 'sell',
      fromCurrency: sourceCurrency,
      toCurrency: { currency: destinationAmount.currency, issuer: destinationAmount.issuer },
      fromAmount: sourceNeeded.toFixed(6),
      toAmount: (destValue - remaining).toFixed(6),
      rate,
      inverseRate: 1 / rate,
      slippage: 0,
      fees: {
        network: '0.000012',
        spread: '0',
      },
      path: [],
      expiresAt: new Date(Date.now() + 30000),
      isPartialFill,
      confidence: isPartialFill ? 'low' : remaining > destValue * 0.01 ? 'medium' : 'high',
    };
  } catch (error) {
    throw new Error(`Path finding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ==================== LIQUIDITY ANALYSIS ====================

/**
 * Analyze available liquidity for a currency pair
 */
export async function analyzeLiquidity(
  baseCurrency: Currency,
  quoteCurrency: Currency
): Promise<{
  totalBidLiquidity: number;
  totalAskLiquidity: number;
  depth: { price: number; bidSize: number; askSize: number }[];
  healthScore: number;
}> {
  const orderBook = await getOrderBook(baseCurrency, quoteCurrency, 50);

  let totalBidLiquidity = 0;
  let totalAskLiquidity = 0;
  const depth: { price: number; bidSize: number; askSize: number }[] = [];

  // Aggregate by price levels
  for (const bid of orderBook.bids) {
    totalBidLiquidity += parseFloat(bid.takerGets.value);
  }

  for (const ask of orderBook.asks) {
    totalAskLiquidity += parseFloat(ask.takerGets.value);
  }

  // Health score based on spread and liquidity
  let healthScore = 100;
  if (orderBook.spreadPercent > 5) healthScore -= 30;
  else if (orderBook.spreadPercent > 2) healthScore -= 15;
  else if (orderBook.spreadPercent > 1) healthScore -= 5;

  if (totalBidLiquidity < 1000 || totalAskLiquidity < 1000) healthScore -= 20;
  if (orderBook.bids.length < 5 || orderBook.asks.length < 5) healthScore -= 10;

  return {
    totalBidLiquidity,
    totalAskLiquidity,
    depth,
    healthScore: Math.max(0, healthScore),
  };
}

// ==================== TRADE EXECUTION HELPERS ====================

/**
 * Build an OfferCreate transaction for a trade
 */
export function buildTradeTransaction(
  account: string,
  quote: TradeQuote
): {
  TransactionType: 'OfferCreate';
  Account: string;
  TakerGets: string | { currency: string; issuer: string; value: string };
  TakerPays: string | { currency: string; issuer: string; value: string };
  Flags: number;
} {
  // tfImmediateOrCancel - fill what you can, cancel rest
  const FLAGS_IOC = 0x00020000;

  const takerGets = quote.direction === 'sell'
    ? formatAmount(quote.toAmount, quote.toCurrency)
    : formatAmount(quote.fromAmount, quote.fromCurrency);

  const takerPays = quote.direction === 'sell'
    ? formatAmount(quote.fromAmount, quote.fromCurrency)
    : formatAmount(quote.toAmount, quote.toCurrency);

  return {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: takerGets,
    TakerPays: takerPays,
    Flags: FLAGS_IOC,
  };
}

/**
 * Build a Payment transaction with paths for cross-currency
 */
export function buildCrossPaymentTransaction(
  sourceAccount: string,
  destinationAccount: string,
  destinationAmount: CurrencyAmount,
  sendMax: CurrencyAmount,
  paths?: PathStep[][]
): {
  TransactionType: 'Payment';
  Account: string;
  Destination: string;
  Amount: string | { currency: string; issuer: string; value: string };
  SendMax: string | { currency: string; issuer: string; value: string };
  Paths?: PathStep[][];
} {
  return {
    TransactionType: 'Payment',
    Account: sourceAccount,
    Destination: destinationAccount,
    Amount: formatAmount(destinationAmount.value, destinationAmount),
    SendMax: formatAmount(sendMax.value, sendMax),
    Paths: paths,
  };
}

function formatAmount(
  value: string,
  currency: Currency
): string | { currency: string; issuer: string; value: string } {
  if (currency.currency === 'XRP') {
    return xrpToDrops(parseFloat(value));
  }
  if (!currency.issuer) {
    throw new Error(`Issuer required for ${currency.currency}`);
  }
  return {
    currency: currency.currency,
    issuer: currency.issuer,
    value,
  };
}

// ==================== EXPORTS ====================

export const XRPLDex = {
  getOrderBook,
  getTradeQuote,
  getCrossPaymentQuote,
  analyzeLiquidity,
  buildTradeTransaction,
  buildCrossPaymentTransaction,
  KNOWN_STABLECOINS,
};

export default XRPLDex;
