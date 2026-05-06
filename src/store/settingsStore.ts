/**
 * App settings: network (testnet/mainnet), premium mode gate, Safety Kernel mode.
 * Phase 0 compliance: default testnet, mainnet warnings in UI.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SafetyMode } from '../safety/safetyTypes';

export type NetworkMode = 'testnet' | 'mainnet';

interface SettingsState {
  network: NetworkMode;
  setNetwork: (n: NetworkMode) => void;
  /** Premium Mode: gate for advanced viz/alerts. Stripe integration placeholder. */
  premium: boolean;
  setPremium: (v: boolean) => void;
  /** Safety Kernel v0.2 — default read-only; signing requires user_approved_signing. */
  safetyMode: SafetyMode;
  setSafetyMode: (mode: SafetyMode) => void;
  /** Set when user explicitly confirms mainnet (platform bar / Control Room). */
  mainnetConfirmedAt: number | null;
  confirmMainnetForSession: () => void;
  clearMainnetConfirmation: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      network: 'testnet',
      setNetwork: (network) =>
        set((s) => ({
          network,
          mainnetConfirmedAt: network === 'testnet' ? null : s.mainnetConfirmedAt,
        })),
      premium: false,
      setPremium: (premium) => set({ premium }),
      safetyMode: 'read_only',
      setSafetyMode: (safetyMode) => set({ safetyMode }),
      mainnetConfirmedAt: null,
      confirmMainnetForSession: () => set({ mainnetConfirmedAt: Date.now() }),
      clearMainnetConfirmation: () => set({ mainnetConfirmedAt: null }),
    }),
    { name: 'xrpl-control-room-settings' }
  )
);
