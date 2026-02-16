/**
 * Multi-strategy state: DCA, Market Maker, Arbitrage, Grid.
 * Shared max exposure across agents; PnL and levels for gamified UI.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StrategyId = 'grid' | 'dca' | 'mm' | 'arbitrage';

export interface DCAEntry {
  id: string;
  timestamp: number;
  price: number;
  amountXRP: number;
  totalCost: number;
  avgCostAfter: number;
}

export interface ArbOpportunity {
  id: string;
  timestamp: number;
  pair: string;
  clobMid: number;
  ammQuote: number;
  spreadBps: number;
  direction: 'buy_amm_sell_clob' | 'buy_clob_sell_amm';
}

export interface StrategyPnL {
  strategyId: StrategyId;
  realizedPnL: number;
  unrealizedPnL: number;
  totalFees: number;
  tradesCount: number;
}

const DEFAULT_MAX_EXPOSURE_XRP = 500;

interface StrategyState {
  // Strategy toggles (unlock / enable)
  enabled: Record<StrategyId, boolean>;
  setEnabled: (id: StrategyId, on: boolean) => void;

  // Shared risk
  maxExposureXRP: number;
  exposureXRP: number;
  setMaxExposureXRP: (x: number) => void;
  setExposureXRP: (x: number) => void;
  addExposure: (delta: number) => void;

  // Market snapshot (for Orchestra context)
  marketSnapshot: { mid: number; spreadBps: number; volatility: number } | null;
  setMarketSnapshot: (s: { mid: number; spreadBps?: number; volatility?: number } | null) => void;

  // Real AMM quote from ledger (XRP/USD pool) for CLOB vs AMM arb; takes precedence over synthetic
  ammQuoteFromLedger: number | null;
  setAmmQuoteFromLedger: (price: number | null) => void;

  // DCA: entry levels and avg cost for chart
  dcaEntries: DCAEntry[];
  dcaAvgCost: number | null;
  addDCAEntry: (entry: Omit<DCAEntry, 'id'>) => void;
  setDCAAvgCost: (avg: number | null) => void;

  // Arbitrage: opportunities for heatmap
  arbOpportunities: ArbOpportunity[];
  addArbOpportunity: (o: Omit<ArbOpportunity, 'id'>) => void;
  clearArbOpportunities: () => void;

  // PnL by strategy (shared gauge)
  pnlByStrategy: Record<StrategyId, StrategyPnL>;
  updatePnL: (strategyId: StrategyId, update: Partial<StrategyPnL>) => void;

  // Wallet address for agents (from wallet store or user input)
  walletAddress: string | null;
  setWalletAddress: (addr: string | null) => void;

  // Orchestra kill switch (persisted, visible in UI) – pause all strategy agent suggestions
  orchestraKillSwitch: boolean;
  setOrchestraKillSwitch: (on: boolean) => void;
}

const defaultPnL = (id: StrategyId): StrategyPnL => ({
  strategyId: id,
  realizedPnL: 0,
  unrealizedPnL: 0,
  totalFees: 0,
  tradesCount: 0,
});

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set) => ({
      enabled: { grid: true, dca: false, mm: false, arbitrage: false },
      setEnabled: (id, on) => set((s) => ({ enabled: { ...s.enabled, [id]: on } })),

      maxExposureXRP: DEFAULT_MAX_EXPOSURE_XRP,
      exposureXRP: 0,
      setMaxExposureXRP: (x) => set({ maxExposureXRP: Math.max(0, x) }),
      setExposureXRP: (x) => set({ exposureXRP: Math.max(0, x) }),
      addExposure: (delta) => set((s) => ({ exposureXRP: Math.max(0, s.exposureXRP + delta) })),

      marketSnapshot: null,
      setMarketSnapshot: (s) =>
        set({
          marketSnapshot: s
            ? { mid: s.mid, spreadBps: s.spreadBps ?? 0, volatility: s.volatility ?? 0 }
            : null,
        }),

      ammQuoteFromLedger: null,
      setAmmQuoteFromLedger: (price) => set({ ammQuoteFromLedger: price }),

      dcaEntries: [],
      dcaAvgCost: null,
      addDCAEntry: (entry) =>
        set((s) => ({
          dcaEntries: [
            ...s.dcaEntries.slice(-199),
            { ...entry, id: `dca_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),
      setDCAAvgCost: (avg) => set({ dcaAvgCost: avg }),

      arbOpportunities: [],
      addArbOpportunity: (o) =>
        set((s) => ({
          arbOpportunities: [
            ...s.arbOpportunities.slice(-99),
            { ...o, id: `arb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),
      clearArbOpportunities: () => set({ arbOpportunities: [] }),

      pnlByStrategy: {
        grid: defaultPnL('grid'),
        dca: defaultPnL('dca'),
        mm: defaultPnL('mm'),
        arbitrage: defaultPnL('arbitrage'),
      },
      updatePnL: (strategyId, update) =>
        set((s) => ({
          pnlByStrategy: {
            ...s.pnlByStrategy,
            [strategyId]: { ...s.pnlByStrategy[strategyId], ...update },
          },
        })),

      walletAddress: null,
      setWalletAddress: (addr) => set({ walletAddress: addr }),

      orchestraKillSwitch: false,
      setOrchestraKillSwitch: (on) => set({ orchestraKillSwitch: on }),
    }),
    { name: 'xrpl-control-room-strategies', partialize: (s) => ({ enabled: s.enabled, maxExposureXRP: s.maxExposureXRP, orchestraKillSwitch: s.orchestraKillSwitch }) }
  )
);
