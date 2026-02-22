/**
 * Live XRP ETF data (flows, 24h inflow) from CoinGlass.
 * Set VITE_COINGLASS_API_KEY for live data; otherwise returns empty/fallback.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchXRPETFLive, type XRPETFLiveResult } from '../services/xrpEtfService';

export function useXRPETF(): XRPETFLiveResult & { refetch: () => void; dataUpdatedAt: number } {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['xrp-etf-live'],
    queryFn: fetchXRPETFLive,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });

  const result = data ?? {
    inflows24h: null,
    aum: null,
    flowHistory: [],
    perEtfFlow: {},
    priceUsd: null,
    error: null,
    source: '',
  };

  return {
    ...result,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : result.error,
    refetch,
    dataUpdatedAt: dataUpdatedAt ?? 0,
  };
}
