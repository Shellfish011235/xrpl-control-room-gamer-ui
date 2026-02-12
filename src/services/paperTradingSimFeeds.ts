// Paper Trading Sim Feeds (Phase 1)
// Simulated XRPL WebSocket-style price feeds for 24 pairs + scenario modes.
// Use with Zustand/TanStack Query to test AI logic (e.g. Kelly Criterion) without real APIs.

export const PAPER_TRADING_SYMBOLS = [
  'XRP', 'BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'LINK', 'DOT',
  'AVAX', 'MATIC', 'ATOM', 'UNI', 'LTC', 'XLM', 'ALGO', 'HBAR',
  'NEAR', 'FTM', 'VET', 'SAND', 'MANA', 'APE', 'CRO', 'SHIB',
] as const;

export type SimScenario = 'normal' | 'crash' | 'pump' | 'sideways' | 'volatile';

export interface SimPriceUpdate {
  prices: { [symbol: string]: number };
  changes24h: { [symbol: string]: number };
  scenario: SimScenario;
  timestamp: number;
  bar?: SimOHLCV;
}

export interface SimOHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Default seed prices (aligned with PaperTradingPanel DEFAULT_PRICES)
const SEED_PRICES: { [symbol: string]: number } = {
  XRP: 2.45, BTC: 98500, ETH: 3850, SOL: 245, DOGE: 0.42, ADA: 1.15,
  LINK: 28.5, DOT: 12.8, AVAX: 42.5, MATIC: 0.85, ATOM: 12.4, UNI: 15.2,
  LTC: 125, XLM: 0.45, ALGO: 0.38, HBAR: 0.32, NEAR: 6.8, FTM: 0.95,
  VET: 0.048, SAND: 0.62, MANA: 0.58, APE: 1.85, CRO: 0.12, SHIB: 0.000028,
};

/** Get scenario-driven drift and volatility multiplier */
function scenarioParams(scenario: SimScenario): { drift: number; vol: number } {
  switch (scenario) {
    case 'crash': return { drift: -0.002, vol: 1.8 };
    case 'pump': return { drift: 0.0015, vol: 1.2 };
    case 'sideways': return { drift: 0, vol: 0.4 };
    case 'volatile': return { drift: 0, vol: 2.5 };
    default: return { drift: 0.0002, vol: 1 };
  }
}

/** Single step of a log-normal random walk */
function nextPrice(
  current: number,
  scenario: SimScenario,
  symbol: string
): number {
  const { drift, vol } = scenarioParams(scenario);
  const baseVol = symbol === 'BTC' ? 0.015 : symbol === 'ETH' ? 0.02 : 0.03;
  const sigma = baseVol * vol;
  const change = drift + (Math.random() - 0.5) * sigma;
  const next = current * Math.exp(change);
  return Math.max(next, current * 0.01); // floor at 1% of current
}

/** Generate one OHLCV bar from open price and scenario */
export function generateBar(
  open: number,
  scenario: SimScenario,
  symbol: string,
  timestamp: number
): SimOHLCV {
  const { drift, vol } = scenarioParams(scenario);
  const baseVol = symbol === 'BTC' ? 0.01 : symbol === 'ETH' ? 0.012 : 0.02;
  const sigma = baseVol * vol;
  const path = [open];
  for (let i = 0; i < 4; i++) {
    const c = path[path.length - 1];
    path.push(nextPrice(c, scenario, symbol));
  }
  const low = Math.min(...path);
  const high = Math.max(...path);
  const close = path[path.length - 1];
  const volume = open * (1000 + Math.random() * 5000);
  return { timestamp, open, high, low, close, volume };
}

/** Build historical bars for backtesting. Bars are 1-minute for `minutes` duration. */
export function generateHistoricalBars(
  scenario: SimScenario,
  minutes: number,
  seedPrices: { [symbol: string]: number } = SEED_PRICES
): Map<string, SimOHLCV[]> {
  const start = Date.now() - minutes * 60 * 1000;
  const result = new Map<string, SimOHLCV[]>();

  for (const symbol of PAPER_TRADING_SYMBOLS) {
    const prices = seedPrices[symbol] ?? 1;
    const bars: SimOHLCV[] = [];
    let open = prices;
    for (let i = 0; i < minutes; i++) {
      const bar = generateBar(open, scenario, symbol, start + i * 60 * 1000);
      bars.push(bar);
      open = bar.close;
    }
    result.set(symbol, bars);
  }
  return result;
}

/** Subscribe to simulated price updates (WebSocket-style). Call returned function to unsubscribe. */
export function subscribeSimPrices(
  onUpdate: (update: SimPriceUpdate) => void,
  options: {
    intervalMs?: number;
    scenario?: SimScenario;
    seedPrices?: { [symbol: string]: number };
  } = {}
): () => void {
  const intervalMs = options.intervalMs ?? 2000;
  const scenario = options.scenario ?? 'normal';
  let prices = { ...(options.seedPrices ?? SEED_PRICES) };
  const changes24h: { [symbol: string]: number } = {};

  const tick = () => {
    const next: { [symbol: string]: number } = {};
    for (const symbol of PAPER_TRADING_SYMBOLS) {
      const current = prices[symbol] ?? SEED_PRICES[symbol] ?? 1;
      next[symbol] = nextPrice(current, scenario, symbol);
      changes24h[symbol] = ((next[symbol] - current) / current) * 100;
    }
    prices = next;
    onUpdate({
      prices: { ...prices },
      changes24h: { ...changes24h },
      scenario,
      timestamp: Date.now(),
    });
  };

  const id = setInterval(tick, intervalMs);
  tick(); // emit immediately
  return () => clearInterval(id);
}

/** Get current simulated prices for a single tick (no subscription). */
export function getSimPricesOneShot(
  scenario: SimScenario,
  seedPrices: { [symbol: string]: number } = SEED_PRICES
): { prices: { [symbol: string]: number }; changes24h: { [symbol: string]: number } } {
  const prices: { [symbol: string]: number } = {};
  const changes24h: { [symbol: string]: number } = {};
  for (const symbol of PAPER_TRADING_SYMBOLS) {
    const current = seedPrices[symbol] ?? SEED_PRICES[symbol] ?? 1;
    const next = nextPrice(current, scenario, symbol);
    prices[symbol] = next;
    changes24h[symbol] = ((next - current) / current) * 100;
  }
  return { prices, changes24h };
}
