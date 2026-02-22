/**
 * Live stablecoin market cap and 24h volume from CoinGecko.
 * Used for the STABLECOIN COMPARISON table (RLUSD, USDC, USDT, DAI).
 */
import { useQuery } from '@tanstack/react-query';
import { proxyFetch } from '../lib/dataProxy';

const COIN_IDS = ['ripple-usd', 'usd-coin', 'tether', 'dai'] as const;
const COIN_LABELS: Record<string, string> = {
  'ripple-usd': 'RLUSD',
  'usd-coin': 'USDC',
  tether: 'USDT',
  dai: 'DAI',
};
const COIN_BACKING: Record<string, number> = {
  'ripple-usd': 100,
  'usd-coin': 100,
  tether: 99,
  dai: 150,
};

export interface StablecoinRow {
  name: string;
  mcap: number;
  volume: number;
  backing: number;
}

async function fetchStablecoinMarkets(): Promise<StablecoinRow[]> {
  const ids = COIN_IDS.join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;
  const res = await proxyFetch(url, { mode: 'cors' });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    id: string;
    market_cap: number;
    total_volume: number;
  }>;
  const byId = new Map(data.map((d) => [d.id, d]));
  const result: StablecoinRow[] = [];
  for (const id of COIN_IDS) {
    const row = byId.get(id);
    const mcapB = row ? row.market_cap / 1e9 : 0;
    const volB = row ? row.total_volume / 1e9 : 0;
    result.push({
      name: COIN_LABELS[id] ?? id,
      mcap: mcapB,
      volume: volB,
      backing: COIN_BACKING[id] ?? 100,
    });
  }
  return result;
}

const FALLBACK: StablecoinRow[] = [
  { name: 'RLUSD', mcap: 2.45, volume: 0.85, backing: 100 },
  { name: 'USDC', mcap: 45.2, volume: 8.2, backing: 100 },
  { name: 'USDT', mcap: 120.5, volume: 65.4, backing: 99 },
  { name: 'DAI', mcap: 5.3, volume: 0.42, backing: 150 },
];

export function useStablecoinComparison() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['stablecoin-comparison'],
    queryFn: fetchStablecoinMarkets,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });
  const displayOrder = ['RLUSD', 'USDC', 'USDT', 'DAI'];
  const raw = data?.length ? data : FALLBACK;
  const byName = new Map(raw.map((r) => [r.name, r]));
  const rows = displayOrder.map((name) => byName.get(name)).filter(Boolean) as StablecoinRow[];
  if (rows.length < 4) return { rows: FALLBACK, loading: isLoading, dataUpdatedAt: dataUpdatedAt ?? 0 };
  return { rows, loading: isLoading, dataUpdatedAt: dataUpdatedAt ?? 0 };
}
