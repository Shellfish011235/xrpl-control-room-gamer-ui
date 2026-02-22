/**
 * Fetches XRP price history from CoinGecko for the portfolio chart.
 * Returns data in Recharts-friendly shape: { date: string, xrp: number }[].
 * Always includes the most recent point so the chart is current.
 */
import { useQuery } from '@tanstack/react-query';
import { proxyFetch } from '../lib/dataProxy';

export type ChartPeriod = '1D' | '1W' | '1M';

const DAYS_MAP: Record<ChartPeriod, number> = { '1D': 1, '1W': 7, '1M': 30 };

const MAX_POINTS = 60; // cap for chart readability

function downsampleWithEndpoints<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const result: T[] = [];
  result.push(arr[0]);
  const step = (arr.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round(i * step);
    result.push(arr[idx]);
  }
  result.push(arr[arr.length - 1]);
  return result;
}

async function fetchXRPPriceHistory(days: number): Promise<Array<{ date: string; xrp: number }>> {
  const url = `https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=${days}`;
  const res = await proxyFetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Price history ${res.status}`);
  const data = (await res.json()) as { prices?: [number, number][] };
  const prices = data.prices ?? [];
  if (prices.length === 0) return [];

  // CoinGecko returns ascending time; ensure we keep the latest point
  const sampled = downsampleWithEndpoints(prices, MAX_POINTS);
  return sampled.map(([ts, value]) => ({
    date: new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(days <= 1 ? { hour: '2-digit', minute: '2-digit' } : {}),
    }),
    xrp: Math.round(value * 10000) / 10000,
  }));
}

export function useXRPPriceHistory(period: ChartPeriod) {
  const days = DAYS_MAP[period];
  return useQuery({
    queryKey: ['xrp-price-history', days],
    queryFn: () => fetchXRPPriceHistory(days),
    staleTime: 1000 * 60 * 2, // 2 min so chart stays current
    refetchOnWindowFocus: true,
  });
}
