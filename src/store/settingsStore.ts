/**
 * App settings: network (testnet/mainnet), premium mode gate.
 * Phase 0 compliance: default testnet, mainnet warnings in UI.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NetworkMode = 'testnet' | 'mainnet';

interface SettingsState {
  network: NetworkMode;
  setNetwork: (n: NetworkMode) => void;
  /** Premium Mode: gate for advanced viz/alerts. Stripe integration placeholder. */
  premium: boolean;
  setPremium: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      network: 'testnet',
      setNetwork: (network) => set({ network }),
      premium: false,
      setPremium: (premium) => set({ premium }),
    }),
    { name: 'xrpl-control-room-settings' }
  )
);
