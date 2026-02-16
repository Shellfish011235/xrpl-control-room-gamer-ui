/**
 * Liquidity Path Optimizer state (Phase 1 – Revenue MVP).
 * Source/dest, amount, ranked paths, risk tolerance, favorites.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RankedPath {
  id: string;
  source: string;
  dest: string;
  amount: string;
  type: 'xrpl_native' | 'amm' | 'bridge';
  costScore: number;
  speedScore: number;
  riskScore: number;
  hops?: number;
  estimatedSourceAmount?: string;
  effectiveRate?: number;
  label: string;
}

interface OptimizerState {
  sourceAsset: string;
  destAsset: string;
  amount: string;
  riskTolerance: number;
  rankedPaths: RankedPath[];
  loading: boolean;
  error: string | null;
  favorites: string[];

  setSourceAsset: (v: string) => void;
  setDestAsset: (v: string) => void;
  setAmount: (v: string) => void;
  setRiskTolerance: (v: number) => void;
  setRankedPaths: (p: RankedPath[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  toggleFavorite: (pathId: string) => void;
}

export const useOptimizerStore = create<OptimizerState>()(
  persist(
    (set) => ({
      sourceAsset: 'XRP',
      destAsset: 'USD',
      amount: '100',
      riskTolerance: 50,
      rankedPaths: [],
      loading: false,
      error: null,
      favorites: [],

      setSourceAsset: (v) => set({ sourceAsset: v, error: null }),
      setDestAsset: (v) => set({ destAsset: v, error: null }),
      setAmount: (v) => set({ amount: v, error: null }),
      setRiskTolerance: (v) => set({ riskTolerance: Math.max(0, Math.min(100, v)) }),
      setRankedPaths: (p) => set({ rankedPaths: p, error: null }),
      setLoading: (v) => set({ loading: v }),
      setError: (v) => set({ error: v }),
      toggleFavorite: (pathId) =>
        set((s) => ({
          favorites: s.favorites.includes(pathId)
            ? s.favorites.filter((id) => id !== pathId)
            : [...s.favorites, pathId],
        })),
    }),
    { name: 'xrpl-optimizer', partialize: (s) => ({ riskTolerance: s.riskTolerance, favorites: s.favorites }) }
  )
);
