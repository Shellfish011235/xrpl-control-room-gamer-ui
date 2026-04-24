/**
 * Zustand store: Private Quant Lab — client-only, persisted. No network execution.
 *
 * Shared Task Receipts created here are local audit records only: no XRPL memo writes, no transaction submission.
 * executionEnabled / mainnetExecution on receipts must stay false (see createTaskReceipt calls).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PaperTrade,
  PaperTradeStatus,
  PaperTradingStats,
  QuantAccountingSnapshot,
  QuantMode,
  QuantOpportunity,
  QuantStrategyReceipt,
} from '../quant/privateQuantTypes';
import type { RankedPath } from './optimizerStore';
import { getCompliancePermissionSet } from '../compliance/jurisdictionRules';
import {
  createTaskReceipt,
  getAllowedActionsFromPermissionSet,
  getBlockedActionsFromPermissionSet,
} from '../receipts/taskReceiptEngine';
import {
  createQuantOpportunityFromRankedPath,
  createSampleQuantOpportunity,
  generateQuantStrategyReceipt,
  simulateTigerBeetleAccounting,
} from '../quant/privateQuantEngine';
import {
  calculatePaperTradingStats,
  closePaperTrade as finalizePaperTrade,
  createPaperTradeFromOpportunity,
} from '../quant/paperTradingEngine';
import { useComplianceStore } from './complianceStore';
import { useSecurityStore } from './securityStore';
import { useTaskReceiptStore } from './taskReceiptStore';

/** Initial snapshot for mock accounting — simulation-only; not a real book of record. */
const defaultAccounting = (): QuantAccountingSnapshot => ({
  simulatedBalanceXRP: 1000,
  reservedCapitalXRP: 0,
  paperPnlXRP: 0,
  feesPaidXRP: 0,
  failedRoutes: 0,
  winningRoutes: 0,
  riskBudgetUsedPct: 0,
});

/** Merges Private Quant “TigerBeetle”-style simulation deltas — in-browser only, not real IL or TB. */
function mergeAccounting(
  previous: QuantAccountingSnapshot,
  delta: QuantAccountingSnapshot
): QuantAccountingSnapshot {
  return {
    simulatedBalanceXRP: Number(
      (previous.simulatedBalanceXRP + (delta.paperPnlXRP - delta.feesPaidXRP) * 0.1).toFixed(4)
    ),
    reservedCapitalXRP: Number(
      Math.max(previous.reservedCapitalXRP, delta.reservedCapitalXRP).toFixed(2)
    ),
    paperPnlXRP: Number((previous.paperPnlXRP + delta.paperPnlXRP).toFixed(4)),
    feesPaidXRP: Number((previous.feesPaidXRP + delta.feesPaidXRP).toFixed(4)),
    failedRoutes: previous.failedRoutes + delta.failedRoutes,
    winningRoutes: previous.winningRoutes + delta.winningRoutes,
    riskBudgetUsedPct: Number(
      Math.min(100, 0.7 * previous.riskBudgetUsedPct + 0.3 * delta.riskBudgetUsedPct + 0.1).toFixed(1)
    ),
  };
}

const emptyPaperStats: PaperTradingStats = calculatePaperTradingStats([]);

/**
 * Pushes a shared task receipt for Private Quant: local simulation only, no on-chain or wallet effect.
 * execution fields stay false via createTaskReceipt defaults; explicitly reinforced below.
 */
function pushPrivateQuantTaskReceipt(input: { title: string; summary: string; opportunityId?: string; notes?: string[] }): void {
  const p = useComplianceStore.getState().profile;
  const perm = getCompliancePermissionSet(p);
  const sec = useSecurityStore.getState();
  const tr = createTaskReceipt({
    source: 'private_quant_lab',
    title: input.title,
    summary: input.summary,
    mode: 'simulation_only',
    status: 'simulated',
    moduleId: 'private_quant_lab',
    opportunityId: input.opportunityId,
    notes: input.notes,
    jurisdiction: {
      country: p.country,
      region: p.region,
      userType: p.userType,
      intendedUse: p.intendedUse,
      botMode: p.botMode,
    },
    compliance: {
      riskLevel: perm.riskLevel,
      requiresHumanApproval: perm.requiresHumanApproval,
      requiresLegalReview: perm.requiresLegalReview,
      allowedActions: getAllowedActionsFromPermissionSet(perm),
      blockedActions: getBlockedActionsFromPermissionSet(perm),
    },
    security: {
      poisoningFlags: [],
      mainnetLocked: sec.mainnetLocked,
      privateKeyAccessAllowed: sec.privateKeyAccessAllowed,
      autonomousExecutionAllowed: sec.autonomousExecutionAllowed,
      humanApprovalRequired: sec.humanApprovalRequired,
    },
    execution: { executionEnabled: false, mainnetExecution: false, transactionSubmitted: false },
  });
  useTaskReceiptStore.getState().addReceipt(tr);
}

const envLabEnabled = () => import.meta.env.VITE_PRIVATE_QUANT_LAB === 'true';

export interface PrivateQuantState {
  privateQuantEnabled: boolean;
  mode: Extract<QuantMode, 'simulation_only'>;
  killSwitch: boolean;
  riskBudgetXRP: number;
  maxSimulatedExposureXRP: number;
  opportunities: QuantOpportunity[];
  receipts: QuantStrategyReceipt[];
  accountingSnapshot: QuantAccountingSnapshot;
  paperTrades: PaperTrade[];
  paperStats: PaperTradingStats;
}

export interface PrivateQuantActions {
  setPrivateQuantEnabled: (v: boolean) => void;
  setKillSwitch: (v: boolean) => void;
  setRiskBudgetXRP: (n: number) => void;
  setMaxSimulatedExposureXRP: (n: number) => void;
  addOpportunity: (o: QuantOpportunity) => void;
  addReceipt: (r: QuantStrategyReceipt) => void;
  clearOpportunities: () => void;
  clearReceipts: () => void;
  runSampleSimulation: () => void;
  importOptimizerPath: (path: RankedPath) => void;
  openPaperTrade: (opportunityId: string, sizeXRP: number) => void;
  closePaperTrade: (tradeId: string, status: Exclude<PaperTradeStatus, 'open'>) => void;
  clearPaperTrades: () => void;
}

const initial: PrivateQuantState = {
  privateQuantEnabled: envLabEnabled(),
  mode: 'simulation_only',
  killSwitch: true,
  riskBudgetXRP: 500,
  maxSimulatedExposureXRP: 500,
  opportunities: [],
  receipts: [],
  accountingSnapshot: defaultAccounting(),
  paperTrades: [],
  paperStats: emptyPaperStats,
};

export const usePrivateQuantStore = create<PrivateQuantState & PrivateQuantActions>()(
  persist(
    (set, get) => ({
      ...initial,

      setPrivateQuantEnabled: (v) => set({ privateQuantEnabled: v }),
      setKillSwitch: (v) => set({ killSwitch: v }),
      setRiskBudgetXRP: (n) => set({ riskBudgetXRP: Math.max(0, n) }),
      setMaxSimulatedExposureXRP: (n) => set({ maxSimulatedExposureXRP: Math.max(0, n) }),

      addOpportunity: (o) => set((s) => ({ opportunities: [o, ...s.opportunities].slice(0, 200) })),

      addReceipt: (r) => set((s) => ({ receipts: [r, ...s.receipts].slice(0, 200) })),

      clearOpportunities: () => set({ opportunities: [] }),

      clearReceipts: () => set({ receipts: [] }),

      runSampleSimulation: () => {
        const state = get();
        if (!state.privateQuantEnabled || state.killSwitch) {
          return;
        }

        const opportunity = createSampleQuantOpportunity();
        const nextSnap = simulateTigerBeetleAccounting(opportunity);
        const merged = mergeAccounting(get().accountingSnapshot, nextSnap);
        const receipt = generateQuantStrategyReceipt(opportunity, merged);

        set((s) => ({
          opportunities: [opportunity, ...s.opportunities].slice(0, 200),
          receipts: [receipt, ...s.receipts].slice(0, 200),
          accountingSnapshot: merged,
        }));

        const p = useComplianceStore.getState().profile;
        const perm = getCompliancePermissionSet(p);
        const sec = useSecurityStore.getState();
        const tr = createTaskReceipt({
          source: 'private_quant_lab',
          title: `Private Quant Lab — ${opportunity.pair} simulation`,
          summary: receipt.summary,
          mode: 'simulation_only',
          status: 'simulated',
          moduleId: 'private_quant_lab',
          opportunityId: opportunity.id,
          jurisdiction: {
            country: p.country,
            region: p.region,
            userType: p.userType,
            intendedUse: p.intendedUse,
            botMode: p.botMode,
          },
          compliance: {
            riskLevel: perm.riskLevel,
            requiresHumanApproval: perm.requiresHumanApproval,
            requiresLegalReview: perm.requiresLegalReview,
            allowedActions: getAllowedActionsFromPermissionSet(perm),
            blockedActions: getBlockedActionsFromPermissionSet(perm),
          },
          security: {
            poisoningFlags: [],
            mainnetLocked: sec.mainnetLocked,
            privateKeyAccessAllowed: sec.privateKeyAccessAllowed,
            autonomousExecutionAllowed: sec.autonomousExecutionAllowed,
            humanApprovalRequired: sec.humanApprovalRequired,
          },
          execution: { executionEnabled: false, mainnetExecution: false, transactionSubmitted: false },
        });
        useTaskReceiptStore.getState().addReceipt(tr);
      },

      importOptimizerPath: (path) => {
        const state = get();
        if (!state.privateQuantEnabled || state.killSwitch) {
          return;
        }
        const opportunity = createQuantOpportunityFromRankedPath(path);
        const nextSnap = simulateTigerBeetleAccounting(opportunity);
        const merged = mergeAccounting(get().accountingSnapshot, nextSnap);
        const receipt = generateQuantStrategyReceipt(opportunity, merged);
        set((s) => ({
          opportunities: [opportunity, ...s.opportunities].slice(0, 200),
          receipts: [receipt, ...s.receipts].slice(0, 200),
          accountingSnapshot: merged,
        }));
        const p = useComplianceStore.getState().profile;
        const perm = getCompliancePermissionSet(p);
        const sec = useSecurityStore.getState();
        const tr = createTaskReceipt({
          source: 'private_quant_lab',
          title: `Private Quant — Liquidity Nexus: ${path.label}`,
          summary: `Optimizer import (simulation only). ${receipt.summary}`,
          mode: 'simulation_only',
          status: 'simulated',
          moduleId: 'private_quant_lab',
          opportunityId: opportunity.id,
          jurisdiction: {
            country: p.country,
            region: p.region,
            userType: p.userType,
            intendedUse: p.intendedUse,
            botMode: p.botMode,
          },
          compliance: {
            riskLevel: perm.riskLevel,
            requiresHumanApproval: perm.requiresHumanApproval,
            requiresLegalReview: perm.requiresLegalReview,
            allowedActions: getAllowedActionsFromPermissionSet(perm),
            blockedActions: getBlockedActionsFromPermissionSet(perm),
          },
          security: {
            poisoningFlags: [],
            mainnetLocked: sec.mainnetLocked,
            privateKeyAccessAllowed: sec.privateKeyAccessAllowed,
            autonomousExecutionAllowed: sec.autonomousExecutionAllowed,
            humanApprovalRequired: sec.humanApprovalRequired,
          },
          execution: { executionEnabled: false, mainnetExecution: false, transactionSubmitted: false },
        });
        useTaskReceiptStore.getState().addReceipt(tr);
      },

      openPaperTrade: (opportunityId, sizeXRP) => {
        const s = get();
        if (!s.privateQuantEnabled || s.killSwitch) {
          return;
        }
        const op = s.opportunities.find((o) => o.id === opportunityId);
        if (!op || op.recommendation === 'ignore') {
          return;
        }
        const paper = createPaperTradeFromOpportunity(
          op,
          sizeXRP,
          s.maxSimulatedExposureXRP
        );
        set((state) => {
          const paperTrades = [paper, ...state.paperTrades].slice(0, 500);
          return { paperTrades, paperStats: calculatePaperTradingStats(paperTrades) };
        });
        pushPrivateQuantTaskReceipt({
          title: 'Private Quant — Paper trade opened (local simulation only)',
          summary: `No on-chain or wallet action. ${paper.pair} size ${paper.simulatedSizeXRP.toFixed(2)} XRP, edge ${paper.entryEdgeBps} bps, est. fee ${paper.simulatedFeesXRP} XRP.`,
          opportunityId: op.id,
          notes: [`paperTradeId:${paper.id}`, 'executionEnabled:false', 'mainnetExecution:false'],
        });
      },

      closePaperTrade: (tradeId, status) => {
        const t = get().paperTrades.find((x) => x.id === tradeId);
        if (!t || t.status !== 'open') {
          return;
        }
        const closed = finalizePaperTrade(t, status);
        set((state) => {
          const paperTrades = state.paperTrades.map((p) => (p.id === tradeId ? closed : p));
          return { paperTrades, paperStats: calculatePaperTradingStats(paperTrades) };
        });
        pushPrivateQuantTaskReceipt({
          title: `Private Quant — Paper trade ${status} (local simulation only)`,
          summary: `No on-chain or wallet action. PnL ${closed.simulatedPnlXRP} XRP (simulated), pair ${closed.pair}, trade ${closed.id}.`,
          opportunityId: closed.opportunityId,
          notes: [`paperTradeId:${closed.id}`, `outcome:${status}`, 'executionEnabled:false', 'mainnetExecution:false'],
        });
      },

      clearPaperTrades: () =>
        set({ paperTrades: [], paperStats: calculatePaperTradingStats([]) }),
    }),
    { name: 'xrpl-private-quant-lab-v0-1' }
  )
);
