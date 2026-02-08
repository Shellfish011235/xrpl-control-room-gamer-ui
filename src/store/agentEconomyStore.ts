/**
 * Agent Economy store: receipts, pending requests, spend caps.
 * Persisted so receipts and unlock state survive refresh.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== TYPES ====================

export interface AgentReceipt {
  id: string;
  jobId: string;
  action: string;
  txHash: string;
  amountXRP: number;
  destination: string;
  result?: string;
  timestamp: number;
}

export interface PendingAction {
  id: string;
  jobId: string;
  task: string;
  priceXRP: number;
  provider: string;
  payloadId?: string;
  status: 'pending' | 'signing' | 'expired' | 'rejected';
  createdAt: number;
}

export interface PowerModeUnlock {
  expires: number;
  txHash: string;
  jobId: string;
}

export interface SpendCaps {
  dailyLimitXRP: number;
  weeklyLimitXRP: number;
  whitelistedDestinations: string[];
}

interface AgentEconomyState {
  receipts: AgentReceipt[];
  pending: PendingAction[];
  powerModeUnlock: PowerModeUnlock | null;
  spendCaps: SpendCaps;

  addReceipt: (r: Omit<AgentReceipt, 'id' | 'timestamp'>) => void;
  addPending: (p: Omit<PendingAction, 'id' | 'createdAt'>) => string;
  updatePending: (id: string, update: Partial<PendingAction>) => void;
  removePending: (id: string) => void;
  setPowerModeUnlock: (u: PowerModeUnlock | null) => void;
  setSpendCaps: (c: Partial<SpendCaps>) => void;
  isPowerModeUnlocked: () => boolean;
  getSpendTotalToday: () => number;
}

const defaultCaps: SpendCaps = {
  dailyLimitXRP: 100,
  weeklyLimitXRP: 500,
  whitelistedDestinations: [],
};

// ==================== STORE ====================

export const useAgentEconomyStore = create<AgentEconomyState>()(
  persist(
    (set, get) => ({
      receipts: [],
      pending: [],
      powerModeUnlock: null,
      spendCaps: defaultCaps,

      addReceipt: (r) => set((state) => ({
        receipts: [
          {
            ...r,
            id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
          },
          ...state.receipts,
        ].slice(0, 200),
      })),

      addPending: (p) => {
        const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          pending: [
            ...state.pending,
            { ...p, id, createdAt: Date.now() },
          ],
        }));
        return id;
      },

      updatePending: (id, update) => set((state) => ({
        pending: state.pending.map((q) => (q.id === id ? { ...q, ...update } : q)),
      })),

      removePending: (id) => set((state) => ({
        pending: state.pending.filter((q) => q.id !== id),
      })),

      setPowerModeUnlock: (u) => set({ powerModeUnlock: u }),

      setSpendCaps: (c) => set((state) => ({
        spendCaps: { ...state.spendCaps, ...c },
      })),

      isPowerModeUnlocked: () => {
        const u = get().powerModeUnlock;
        return u != null && u.expires > Date.now();
      },

      getSpendTotalToday: () => {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const start = dayStart.getTime();
        return get().receipts
          .filter((r) => r.timestamp >= start)
          .reduce((sum, r) => sum + r.amountXRP, 0);
      },
    }),
    { name: 'xrpl-agent-economy' }
  )
);
