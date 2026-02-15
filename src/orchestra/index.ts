/**
 * XRPL Agent Orchestra – public API.
 * Non-custodial intent batching for the Control Room UI.
 */

export { Orchestra } from './orchestra';
export { TipJarAgent, MemeticSimAgent, ValidatorAgent, NettingAgent, SettlementAgent } from './agents';
export { publishToControlRoom, subscribeToControlRoom } from './events';
export { validateIntent } from './validate';
export { netPayments } from './netting';
export { buildPlan } from './plan';
export { simulate, requestApproval, executeOnXRPL, reconcileAfterExecute, submitPlannedTx } from './execution';
export { appendAudit, getAuditLog } from './audit';

export type {
  Agent,
  AgentContext,
  OrchestraMode,
  ControlRoomEvent,
  AuditLogEntry,
} from './types';
export type { NettingResult } from './netting';
export type { BuildPlanOptions } from './plan';

export { useOrchestra } from './useOrchestra';
