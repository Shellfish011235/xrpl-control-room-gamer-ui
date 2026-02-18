/**
 * CAR compute – pathfinding / route computation.
 * Phase 2: zkVM integration to prove optimal route without exposing full logic.
 * Current: delegate to existing CARV pathfinder; proof payload placeholder.
 */

import type { ComputeInput, ComputeOutput } from './types';
import type { PaymentIntentEnvelope } from '../../services/carv/types';

/**
 * Compute route for PIE. In production: call pathfinder (e.g. carv/pathfinder.ts)
 * and optionally generate zkVM proof that route is optimal per ledger state.
 */
export async function computeRoute(input: ComputeInput): Promise<ComputeOutput> {
  const { pie } = input;
  // TODO: Integrate with src/services/carv/pathfinder.ts and venueRouter
  // const route = await pathfinder.findPath(pie);
  const route = [pie.constraints?.venue ?? 'xrpl'];
  const costEstimate = pie.constraints?.max_fee ?? '0.00001';

  // Placeholder for zkVM: prove "route is valid per ledger state" without revealing full logic
  let proofPayload: string | undefined;
  if (input.ledgerStateSnapshot) {
    proofPayload = `zkvm-proof-placeholder:${input.ledgerStateSnapshot.slice(0, 16)}`;
  }

  return {
    route,
    costEstimate,
    proofPayload,
  };
}
