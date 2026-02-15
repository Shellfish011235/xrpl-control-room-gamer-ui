/**
 * Execution per mode: SIMULATE, MANUAL, LIVE.
 * Non-custodial: LIVE requires UI/wallet to sign; we only build and emit plan.
 */

import type { SettlementPlan, PlannedTx } from '../types/agentIntents';
import { publishToControlRoom } from './events';

const MAX_RETRIES = 3;

export function simulate(plan: SettlementPlan): void {
  publishToControlRoom({
    type: 'EXECUTION_RESULT',
    planId: plan.id,
    ok: true,
    txHashes: plan.xrplTxs.map((_, i) => `sim_${plan.id}_${i}`),
  });
}

export function requestApproval(plan: SettlementPlan): void {
  publishToControlRoom({ type: 'PLAN_READY_FOR_SIGN', plan });
}

/**
 * LIVE: emit plan for UI to sign (Xumm/wallet). No direct submit from orchestra.
 * A separate reconciler can call account_tx after user signs to confirm.
 */
export function executeOnXRPL(plan: SettlementPlan): void {
  publishToControlRoom({ type: 'PLAN_READY_FOR_SIGN', plan });
}

/**
 * Reconciler: after execution, scan ledger (account_tx) to confirm txs.
 * Stub: returns success; real impl would call xrplClient.request({ command: 'account_tx', ... }).
 */
export async function reconcileAfterExecute(
  _plan: SettlementPlan,
  _submittedTxHashes: string[]
): Promise<{ ok: boolean; confirmed: string[]; errors?: string[] }> {
  await new Promise((r) => setTimeout(r, 100));
  return { ok: true, confirmed: _submittedTxHashes };
}

/**
 * Submit a single PlannedTx (called by UI after wallet sign).
 * Stub: real impl uses xrpl.js and signed blob from wallet.
 */
export async function submitPlannedTx(
  _tx: PlannedTx,
  _signedPayload?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 50));
  return { success: true, hash: `tx_${Date.now()}` };
}
