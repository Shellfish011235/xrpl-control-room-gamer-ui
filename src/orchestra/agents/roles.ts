/**
 * CrewAI-style role agents: Validator, Netting, Settlement.
 * Used as procedural steps in the batch window (SOP); optional backstory for audit/UI.
 */

import type { Agent, AgentContext } from '../types';
import type { Intent, ValidationResult, SettlementPlan } from '../../types/agentIntents';
import type { NettingResult } from '../netting';
import { validateIntent } from '../validate';
import { netPayments } from '../netting';
import { buildPlan } from '../plan';

/** ValidatorAgent: validates intents and rejects invalid. Goal = single responsibility. */
export const ValidatorAgent = {
  id: 'agent_validator',
  name: 'Validator Agent',
  role: 'Intent validation and policy enforcement',
  goal: 'Accept only allowlisted assets and schema-valid intents; assign risk score',
  async tick(ctx: AgentContext): Promise<void> {
    // No emit; used as step in closeAndPlanWindow
  },
  /** SOP step: validate a list of intents, return valid + log rejected */
  validateBatch(intents: Intent[], opts?: { volatility?: number }): { valid: Intent[]; rejected: { intent: Intent; reasons: string[] }[] } {
    const valid: Intent[] = [];
    const rejected: { intent: Intent; reasons: string[] }[] = [];
    for (const i of intents) {
      const vr: ValidationResult = validateIntent(i, opts);
      if (vr.ok && vr.normalized) valid.push(vr.normalized);
      else rejected.push({ intent: i, reasons: vr.reasons ?? ['Unknown'] });
    }
    return { valid, rejected };
  },
};

/** NettingAgent: nets payment intents by asset. */
export const NettingAgent = {
  id: 'agent_netting',
  name: 'Netting Agent',
  role: 'Payment netting and cycle resolution',
  goal: 'Minimize obligations per asset so fewer XRPL txs are needed',
  async tick(_ctx: AgentContext): Promise<void> {},
  netBatch(intents: Intent[]): NettingResult {
    return netPayments(intents);
  },
};

/** SettlementAgent: builds XRPL settlement plan from netted + remainder. */
export const SettlementAgent = {
  id: 'agent_settlement',
  name: 'Settlement Agent',
  role: 'Settlement planning and tx ordering',
  goal: 'Convert netted obligations and remaining intents into a safe, ordered XRPL tx set',
  async tick(_ctx: AgentContext): Promise<void> {},
  buildSettlementPlan(result: NettingResult, maxTx: number): SettlementPlan {
    return buildPlan(result, { maxTx });
  },
};
