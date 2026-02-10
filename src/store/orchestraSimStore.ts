// Simulated micropayments from outside the Orchestra UI (e.g. Paper Trading Bot)
// So the AI Agent Payments transaction feed can show "Paper Trading paid Price Feed + Sentiment + Reasoning"

import { create } from 'zustand';

export interface OrchestraSimPayment {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  amount: number; // drops (for display, convert to XRP)
  reason: string;
}

interface OrchestraSimState {
  payments: OrchestraSimPayment[];
  recordPayment: (from: string, to: string, amountDrops: number, reason: string) => void;
  clearPayments: () => void;
}

export const useOrchestraSimStore = create<OrchestraSimState>((set) => ({
  payments: [],

  recordPayment: (from, to, amountDrops, reason) => {
    set((s) => ({
      payments: [
        ...s.payments.slice(-99),
        {
          id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          from,
          to,
          amount: amountDrops,
          reason,
        },
      ],
    }));
  },

  clearPayments: () => set({ payments: [] }),
}));
