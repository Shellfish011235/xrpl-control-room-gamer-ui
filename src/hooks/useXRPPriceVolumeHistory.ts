/**
 * Fetches XRP price + volume history from CoinGecko for scatter (volume vs price by day).
 * Returns one point per day: { date, xrp, volume }.
 */
import { useQuery } from '@tanstack/react-query';
import { proxyFetch } from '../lib/dataProxy';
import type { ChartPeriod } from './useXRPPriceHistory';

const DAYS_MAP: Record<ChartPeriod, number> = { '1D': 1, '1W': 7, '1M': 30 };

export interface PriceVolumePoint {
  date: string;
  xrp: number;
  volume: number;
}

async function fetchPriceVolumeHistory(period: ChartPeriod): Promise<PriceVolumePoint[]> {
  const days = DAYS_MAP[period];
  const url = `https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=${days}`;
  const res = await proxyFetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Price/volume history ${res.status}`);
  const data = (await res.json()) as {
    prices?: [number, number][];
    total_volumes?: [number, number][];
  };
  const prices = data.prices ?? [];
  const volumes = (data.total_volumes ?? []).filter((v) => v[1] != null && v[1] > 0);

  if (prices.length === 0) return [];

  // Build a map: date string (day) -> { price, volume }
  const byDay = new Map<string, { price: number; volume: number }>();

  for (const [ts, value] of prices) {
    const d = new Date(ts);
    const key = d.toISOString().slice(0, 10);
    const existing = byDay.get(key);
    if (!existing) byDay.set(key, { price: value, volume: 0 });
    else existing.price = value; // use latest price for the day
  }

  for (const [ts, value] of volumes) {
    const d = new Date(ts);
    const key = d.toISOString().slice(0, 10);
    const existing = byDay.get(key);
    if (!existing) byDay.set(key, { price: 0, volume: value });
    else existing.volume += value; // sum volume per day
  }

  const sorted = Array.from(byDay.entries())
    .filter(([, v]) => v.price > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, { price, volume }]) => ({
      date: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      xrp: Math.round(price * 10000) / 10000,
      volume: Math.round(volume),
    }));

  return sorted;
}

export function useXRPPriceVolumeHistory(period: ChartPeriod) {
  return useQuery({
    queryKey: ['xrp-price-volume-history', period],
    queryFn: () => fetchPriceVolumeHistory(period),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}
