/**
 * UI disclosure layer: Simple / Pro / Operator — does not change RPC truth, only what we show and how dense.
 * Persisted locally; no server.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OperatingUiMode = 'SIMPLE' | 'PRO' | 'OPERATOR';

const STORAGE = 'xcr_op_ui_mode_v1';

interface ModeState {
  mode: OperatingUiMode;
  setMode: (m: OperatingUiMode) => void;
  /** Densities: operator shows raw log hints, simple hides jargon */
  isSimple: () => boolean;
  isPro: () => boolean;
  isOperator: () => boolean;
}

export const useOperatingMode = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'PRO',
      setMode: (m) => set({ mode: m }),
      isSimple: () => get().mode === 'SIMPLE',
      isPro: () => get().mode === 'PRO',
      isOperator: () => get().mode === 'OPERATOR',
    }),
    { name: STORAGE }
  )
);

export const modeLabels: Record<OperatingUiMode, { title: string; blurb: string }> = {
  SIMPLE: {
    title: 'Simple',
    blurb: 'Plain language, guided layout. Fewer raw fields.',
  },
  PRO: {
    title: 'Pro',
    blurb: 'Metrics, toggles, and denser dashboards by default.',
  },
  OPERATOR: {
    title: 'Operator',
    blurb: 'Schemas, sources, policy state, and provenance. Terminal-grade.',
  },
};
