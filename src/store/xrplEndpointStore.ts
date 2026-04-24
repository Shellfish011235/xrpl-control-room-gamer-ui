/**
 * User preferences + live endpoint state. Rotation state only when mode is "auto" and not locked to a single private node.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type XrplEndpointMode = 'auto' | 'manual';

export interface XrplEndpointSnapshot {
  mode: XrplEndpointMode;
  /** In manual: which index in the pool. */
  manualIndex: number;
  /** Current active (same as manual in manual; advances on failover in auto). */
  activeIndex: number;
  latencyMs: number | null;
  lastError: string | null;
  lastFailoverAt: number | null;
  /** If true, pool is 1 and UI should not show rotation. */
  locked: boolean;
}

const STORAGE = 'xrpl-control-room-endpoint-v1';

type Store = XrplEndpointSnapshot & {
  setMode: (m: XrplEndpointMode) => void;
  setManualIndex: (index: number) => void;
  setToAuto: () => void;
  setActiveIndex: (i: number) => void;
  setLatency: (ms: number | null) => void;
  setLastError: (e: string | null) => void;
  recordFailover: (reason?: string) => void;
  setLocked: (locked: boolean) => void;
  advanceInAuto: (len: number) => void;
};

const initial: XrplEndpointSnapshot = {
  mode: 'auto',
  manualIndex: 0,
  activeIndex: 0,
  latencyMs: null,
  lastError: null,
  lastFailoverAt: null,
  locked: false,
};

export const useXrplEndpointStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,
      setMode: (mode) => set({ mode }),
      setManualIndex: (manualIndex) => set((s) => ({ mode: 'manual' as const, manualIndex, activeIndex: manualIndex })),
      setToAuto: () =>
        set({
          mode: 'auto' as const,
          activeIndex: 0,
        }),
      setActiveIndex: (activeIndex) => set({ activeIndex }),
      setLatency: (latencyMs) => set({ latencyMs }),
      setLastError: (lastError) => set({ lastError }),
      setLocked: (locked) => set({ locked }),
      recordFailover: () => set({ lastFailoverAt: Date.now() }),
      advanceInAuto: (len) => {
        const s = get();
        if (s.locked || len < 2 || s.mode !== 'auto') return;
        set({ activeIndex: (s.activeIndex + 1) % len, lastFailoverAt: Date.now() });
      },
    }),
    { name: STORAGE, partialize: (st) => ({ mode: st.mode, manualIndex: st.manualIndex, activeIndex: st.activeIndex }) }
  )
);
