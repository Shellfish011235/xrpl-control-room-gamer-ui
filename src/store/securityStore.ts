/**
 * Security Ops — local preferences and in-browser audit log. No backend, no key material.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromptScanResult } from '../security/promptFirewall';

export type QuantumReadinessLevel = 'inventory' | 'crypto_agile_planned' | 'pqc_ready';

export interface SecurityEventEntry {
  id: string;
  timestamp: number;
  kind: string;
  detail: string;
}

export interface PoisoningEventEntry {
  id: string;
  timestamp: number;
  result: PromptScanResult;
  inputPreview: string;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface SecurityState {
  promptFirewallEnabled: boolean;
  mainnetLocked: boolean;
  humanApprovalRequired: boolean;
  privateKeyAccessAllowed: boolean;
  autonomousExecutionAllowed: boolean;
  lastAuditDate: string | null;
  securityEvents: SecurityEventEntry[];
  poisoningEvents: PoisoningEventEntry[];
  quantumReadinessLevel: QuantumReadinessLevel;
}

export interface SecurityActions {
  addSecurityEvent: (kind: string, detail: string) => void;
  addPoisoningEvent: (input: string, result: PromptScanResult) => void;
  clearSecurityEvents: () => void;
  clearPoisoningEvents: () => void;
  setMainnetLocked: (v: boolean) => void;
  setPromptFirewallEnabled: (v: boolean) => void;
  setQuantumReadinessLevel: (v: QuantumReadinessLevel) => void;
}

const defaultState: SecurityState = {
  promptFirewallEnabled: true,
  mainnetLocked: true,
  humanApprovalRequired: true,
  privateKeyAccessAllowed: false,
  autonomousExecutionAllowed: false,
  lastAuditDate: null,
  securityEvents: [],
  poisoningEvents: [],
  quantumReadinessLevel: 'inventory',
};

export const useSecurityStore = create<SecurityState & SecurityActions>()(
  persist(
    (set) => ({
      ...defaultState,

      addSecurityEvent: (kind, detail) =>
        set((s) => ({
          lastAuditDate: new Date().toISOString(),
          securityEvents: [
            { id: newId(), timestamp: Date.now(), kind, detail: detail.slice(0, 4000) },
            ...s.securityEvents,
          ].slice(0, 200),
        })),

      addPoisoningEvent: (input, result) =>
        set((s) => ({
          lastAuditDate: new Date().toISOString(),
          poisoningEvents: [
            {
              id: newId(),
              timestamp: Date.now(),
              result: { ...result, flags: [...result.flags] },
              inputPreview: input.slice(0, 2000),
            },
            ...s.poisoningEvents,
          ].slice(0, 200),
        })),

      clearSecurityEvents: () => set({ securityEvents: [] }),
      clearPoisoningEvents: () => set({ poisoningEvents: [] }),
      setMainnetLocked: (v) => set({ mainnetLocked: v }),
      setPromptFirewallEnabled: (v) => set({ promptFirewallEnabled: v }),
      setQuantumReadinessLevel: (v) => set({ quantumReadinessLevel: v }),
    }),
    { name: 'xrpl-security-ops-v0-1' }
  )
);
