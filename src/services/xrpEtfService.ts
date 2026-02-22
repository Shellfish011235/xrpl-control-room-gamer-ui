/**
 * XRP ETF live data via CoinGlass API.
 * Set VITE_COINGLASS_API_KEY in .env for live flows and derived metrics.
 * @see https://docs.coinglass.com/reference/xrp-etf-flows-history
 */

const COINGLASS_BASE = 'https://open-api-v4.coinglass.com';

function getApiKey(): string {
  try {
    const v =
      typeof import.meta !== 'undefined' &&
      typeof (import.meta as { env?: Record<string, string> }).env?.VITE_COINGLASS_API_KEY === 'string'
        ? (import.meta as { env: Record<string, string> }).env.VITE_COINGLASS_API_KEY.trim()
        : '';
    return v;
  } catch {
    return '';
  }
}

export interface XRPETFFlowPoint {
  timestamp: number;
  flow_usd: number;
  price_usd?: number;
  etf_flows?: Array<{ etf_ticker?: string; ticker?: string; flow_usd?: number; change_usd?: number }>;
}

export interface XRPETFLiveResult {
  /** Net flow in USD over last 24h (sum of daily points in last 24h, or latest day) */
  inflows24h: number | null;
  /** Approx AUM from flow history if derivable; else null (CoinGlass AUM endpoint is BTC/ETH focused) */
  aum: number | null;
  /** Last 14 days: date label and net flow per day for bar chart */
  flowHistory: Array<{ day: string; inflow: number; outflow: number }>;
  /** Per-ticker latest flow (USD) when API returns etf_flows */
  perEtfFlow: Record<string, number>;
  /** XRP price at latest data point */
  priceUsd: number | null;
  loading: boolean;
  error: string | null;
  /** 'coinglass' when live, '' when fallback */
  source: string;
}

/** Fetch XRP ETF flow history from CoinGlass. Requires VITE_COINGLASS_API_KEY. */
async function fetchFlowHistory(): Promise<XRPETFFlowPoint[]> {
  const key = getApiKey();
  if (!key) return [];

  const url = `${COINGLASS_BASE}/api/etf/xrp/flow-history`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'CG-API-KEY': key,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    code?: string;
    data?: Array<{
      timestamp: number;
      flow_usd?: number;
      change_usd?: number;
      price?: number;
      price_usd?: number;
    }>;
  };
  if (json.code !== '0' || !Array.isArray(json.data)) return [];

  return json.data.map((d) => ({
    timestamp: d.timestamp,
    flow_usd: d.flow_usd ?? d.change_usd ?? 0,
    price_usd: d.price_usd ?? d.price,
  }));
}

/** Aggregate flow points by calendar day (UTC) for chart. */
function aggregateByDay(points: XRPETFFlowPoint[]): Map<number, number> {
  const byDay = new Map<number, number>();
  for (const p of points) {
    const dayStart = new Date(p.timestamp);
    dayStart.setUTCHours(0, 0, 0, 0);
    const key = dayStart.getTime();
    byDay.set(key, (byDay.get(key) ?? 0) + p.flow_usd);
  }
  return byDay;
}

/** Build flow history for last 14 days (for bar chart). */
function buildFlowHistory(points: XRPETFFlowPoint[]): Array<{ day: string; inflow: number; outflow: number }> {
  const byDay = aggregateByDay(points);
  const sorted = Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]);
  const last14 = sorted.slice(-14);
  const result = last14.map(([ts, flow]) => {
    const d = new Date(ts);
    const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const inflow = flow >= 0 ? flow : 0;
    const outflow = flow < 0 ? flow : 0; // keep negative for chart
    return { day: dayLabel, inflow, outflow };
  });
  return result.length > 0 ? result : [];
}

/** Net flow for "24h" display: sum of points in last 24h, or latest single-day flow if API returns daily points. */
function sumLast24h(points: XRPETFFlowPoint[]): number {
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;
  const in24h = points.filter((p) => p.timestamp >= cutoff);
  const sum = in24h.reduce((s, p) => s + p.flow_usd, 0);
  if (in24h.length > 0) return sum;
  const latest = points[points.length - 1];
  return latest ? latest.flow_usd : 0;
}

export function isXRPETFConfigured(): boolean {
  return getApiKey().length > 0;
}

/**
 * Fetch and derive XRP ETF live metrics. Use with useQuery in a hook.
 * When no API key: returns empty flowHistory and null metrics with source ''.
 */
export async function fetchXRPETFLive(): Promise<Omit<XRPETFLiveResult, 'loading'>> {
  const points = await fetchFlowHistory();
  if (points.length === 0) {
    return {
      inflows24h: null,
      aum: null,
      flowHistory: [],
      perEtfFlow: {},
      priceUsd: null,
      error: getApiKey() ? 'No data from CoinGlass' : null,
      source: '',
    };
  }

  const flowHistory = buildFlowHistory(points);
  const inflows24h = sumLast24h(points);
  const latest = points[points.length - 1];
  const priceUsd = latest?.price_usd ?? null;

  const perEtfFlow: Record<string, number> = {};
  if (latest?.etf_flows?.length) {
    for (const e of latest.etf_flows) {
      const ticker = (e.etf_ticker ?? e.ticker ?? '').toUpperCase();
      if (!ticker) continue;
      const flow = e.flow_usd ?? e.change_usd ?? 0;
      perEtfFlow[ticker] = (perEtfFlow[ticker] ?? 0) + flow;
    }
  }

  return {
    inflows24h,
    aum: null,
    flowHistory,
    perEtfFlow,
    priceUsd,
    error: null,
    source: 'coinglass',
  };
}
