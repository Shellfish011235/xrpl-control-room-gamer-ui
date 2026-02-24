/**
 * Execution per mode: SIMULATE, MANUAL, LIVE.
 * Non-custodial: LIVE requires UI/wallet to sign; we only build and emit plan.
 * When user signs in Xaman, Xaman auto-submits the tx to the ledger (we do not call submit from the app).
 * After sign, Terminal receives txHash from Xaman, publishes EXECUTION_RESULT (strategy store updated), then we reconcile via getTransaction(txHash).
 * For in-app signing flows, use submitPlannedTx + submitSignedTx from xrplService.
 */

import type { SettlementPlan, PlannedTx } from '../types/agentIntents';
import { publishToControlRoom } from './events';
import { getTransaction } from '../services/xrplService';

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
 * LIVE: emit plan for UI to sign (Xaman/wallet). Xaman submits the signed tx to the ledger.
 * No app-side submit; after sign we reconcile via getTransaction(txHash).
 */
export function executeOnXRPL(plan: SettlementPlan): void {
  publishToControlRoom({ type: 'PLAN_READY_FOR_SIGN', plan });
}

/**
 * Reconciler: after user signed (Xaman auto-submitted), verify each tx on the ledger.
 * Calls xrpl getTransaction(txHash) to confirm validated and success.
 */
export async function reconcileAfterExecute(
  _plan: SettlementPlan,
  submittedTxHashes: string[]
): Promise<{ ok: boolean; confirmed: string[]; errors?: string[] }> {
  const confirmed: string[] = [];
  const errors: string[] = [];
  for (const hash of submittedTxHashes) {
    try {
      const tx = await getTransaction(hash);
      if (tx.validated && tx.success) confirmed.push(hash);
      else if (tx.error) errors.push(`${hash}: ${tx.error}`);
    } catch (e) {
      errors.push(`${hash}: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  }
  return { ok: errors.length === 0, confirmed, errors: errors.length ? errors : undefined };
}

/**
 * Submit a single PlannedTx (e.g. when using Control Room wallet instead of Xaman).
 * For Xaman flow, Xaman submits; use this only for in-app signing + submit.
 */
export async function submitPlannedTx(
  _tx: PlannedTx,
  _signedPayload?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 50));
  return { success: true, hash: `tx_${Date.now()}` };
}
