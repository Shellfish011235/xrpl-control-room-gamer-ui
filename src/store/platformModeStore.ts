/**
 * Platform mode: always live (functional). No demo/safe mode.
 * Real signing requires Xaman API key; platform is live-only for personal use.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlatformMode = 'live';

interface PlatformModeState {
  mode: PlatformMode;
  setMode: (mode: PlatformMode) => void;
  isDemo: () => boolean;
  isLive: () => boolean;
}

export const usePlatformModeStore = create<PlatformModeState>()(
  persist(
    (set, get) => ({
      mode: 'live',

      setMode: (mode) => set({ mode: 'live' }),

      isDemo: () => false,
      isLive: () => true,
    }),
    { name: 'xrpl-platform-mode-v3' }
  )
);
