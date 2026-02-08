/**
 * Centralized constants for the XRPL Control Room
 * 
 * All magic values, API endpoints, timeouts, and configuration
 * should be defined here for easy maintenance and consistency.
 */

// ==================== XRPL NETWORK ENDPOINTS ====================

/** XRPL WebSocket endpoints (ordered by reliability) */
export const XRPL_WS_ENDPOINTS = [
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
  'wss://xrplcluster.com',
] as const;

/** XRPL JSON-RPC endpoints (ordered by reliability) */
export const XRPL_RPC_ENDPOINTS = [
  'https://s1.ripple.com:51234',
  'https://s2.ripple.com:51234',
  'https://xrplcluster.com',
] as const;

/** XRPL Testnet endpoints */
export const XRPL_TESTNET_ENDPOINTS = {
  ws: 'wss://s.altnet.rippletest.net:51233',
  faucet: 'https://faucet.altnet.rippletest.net/accounts',
} as const;

/** XRPL Devnet endpoints */
export const XRPL_DEVNET_ENDPOINTS = {
  ws: 'wss://s.devnet.rippletest.net:51233',
  faucet: 'https://faucet.devnet.rippletest.net/accounts',
} as const;

// ==================== PRICE API ENDPOINTS ====================

export const COINGECKO_API = {
  base: 'https://api.coingecko.com/api/v3',
  simplePrice: 'https://api.coingecko.com/api/v3/simple/price',
} as const;

export const BINANCE_API = {
  ticker: 'https://api.binance.com/api/v3/ticker/price',
  ws: 'wss://stream.binance.com:9443',
} as const;

// ==================== NFT & IPFS ENDPOINTS ====================

/** IPFS gateway URLs (ordered by reliability) */
export const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/',
  'https://4everland.io/ipfs/',
] as const;

/** NFT metadata/image aggregator endpoints */
export const NFT_AGGREGATORS = {
  xrplMeta: 'https://s1.xrplmeta.org',
  xrpScan: 'https://api.xrpscan.com',
  bithomp: 'https://bithomp.com',
  onXrp: 'https://nft.onxrp.com',
} as const;

/** Image proxy for CORS bypass */
export const IMAGE_PROXY = 'https://wsrv.nl/?url=';

// ==================== TIMING & LIMITS ====================

/** API rate limiting */
export const RATE_LIMITS = {
  /** CoinGecko free tier: ~30 calls/min, cache for 5 min */
  coingeckoCacheDuration: 5 * 60 * 1000, // 5 minutes
  /** Price refresh interval */
  priceRefreshInterval: 5 * 60 * 1000, // 5 minutes
  /** Ledger poll interval */
  ledgerPollInterval: 4000, // 4 seconds
} as const;

/** NFT loading configuration */
export const NFT_CONFIG = {
  /** Items per page in grid view */
  pageSize: 20,
  /** Concurrent metadata fetches */
  concurrentFetches: 3,
  /** Image load timeout per source (ms) */
  imageTimeout: 4000,
  /** Max fallback sources to try */
  maxFallbacks: 8,
  /** Initial batch size to load */
  initialBatchSize: 30,
} as const;

/** WebSocket configuration */
export const WS_CONFIG = {
  /** Reconnect delay (ms) */
  reconnectDelay: 2000,
  /** Max reconnect attempts */
  maxReconnectAttempts: 5,
  /** Request timeout (ms) */
  requestTimeout: 30000,
} as const;

// ==================== CRYPTO IDENTIFIERS ====================

/** CoinGecko IDs for popular cryptos */
export const COINGECKO_IDS: Record<string, string> = {
  XRP: 'ripple',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  LINK: 'chainlink',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  ATOM: 'cosmos',
  UNI: 'uniswap',
  LTC: 'litecoin',
  XLM: 'stellar',
  ALGO: 'algorand',
  HBAR: 'hedera-hashgraph',
} as const;

/** Fallback prices (updated 2026-02-04) */
export const FALLBACK_PRICES: Record<string, number> = {
  XRP: 2.50,
  BTC: 105000,
  ETH: 3400,
  SOL: 220,
  DOGE: 0.35,
  ADA: 1.10,
  LINK: 28,
  DOT: 9.50,
  AVAX: 42,
  MATIC: 0.60,
  ATOM: 11,
  UNI: 14,
  LTC: 120,
  XLM: 0.45,
  ALGO: 0.35,
  HBAR: 0.40,
} as const;

// ==================== AGENT ECONOMY ====================

/** Service wallet for paid actions (Power Mode, etc.). Set VITE_AGENT_SERVICE_WALLET in .env */
export const AGENT_SERVICE_WALLET: string =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_AGENT_SERVICE_WALLET) ||
  'rYourServiceWalletHere';

/** Power Mode Unlock price (XRP) */
export const POWER_MODE_UNLOCK_XRP = 0.25;

/** Power Mode duration (ms) - 24 hours */
export const POWER_MODE_DURATION_MS = 24 * 60 * 60 * 1000;

// ==================== DATA ACCURACY & SOURCING ====================

/** Display label for when dashboard quantitative data was last updated */
export const DATA_AS_OF_LABEL = 'Feb 7, 2026';

/** Primary sources for dashboard metrics (for disclaimers) */
export const DATA_SOURCES = {
  remittances: 'World Bank / Banxico / BSP',
  bridges: 'DefiLlama (on-chain)',
  odl: 'Ripple insights / partner estimates',
} as const;

// ==================== UI CONSTANTS ====================

/** Animation durations (ms) */
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/** Breakpoints matching Tailwind */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ==================== XRP UNITS ====================

/** 1 XRP = 1,000,000 drops */
export const DROPS_PER_XRP = 1_000_000;

/** Convert drops to XRP */
export const dropsToXrp = (drops: string | number): number => {
  return Number(drops) / DROPS_PER_XRP;
};

/** Convert XRP to drops */
export const xrpToDrops = (xrp: number): string => {
  return Math.floor(xrp * DROPS_PER_XRP).toString();
};
