/**
 * Platform mode: Demo vs Live
 * Single switch at the top of the app; when Live, the whole platform treats flows as live
 * (real signing still requires Xaman credentials; this controls presentation and intent).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlatformMode = 'demo' | 'live';

interface PlatformModeState {
  mode: PlatformMode;
  setMode: (mode: PlatformMode) => void;
  toggleMode: () => void;
  isDemo: () => boolean;
  isLive: () => boolean;
}

export const usePlatformModeStore = create<PlatformModeState>()(
  persist(
    (set, get) => ({
      mode: 'demo',

      setMode: (mode) => set({ mode }),

      toggleMode: () =>
        set((s) => ({ mode: s.mode === 'demo' ? 'live' : 'demo' })),

      isDemo: () => get().mode === 'demo',
      isLive: () => get().mode === 'live',
    }),
    { name: 'xrpl-platform-mode-v3' }
  )
);
