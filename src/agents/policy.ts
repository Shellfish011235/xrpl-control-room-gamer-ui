import type { AgentCapability } from './types';
import { getAgentById } from './agentRegistry';

const ALWAYS_BLOCKED = new Set<string>([
  'sign_transaction',
  'send_payment',
  'place_order',
  'bridge_assets',
  'swap_assets',
  'custody_assets',
  'request_private_key',
  'export_secret',
  'bypass_policy',
]);

const BLOCK_REASONS: Record<string, string> = {
  sign_transaction: 'Ledger-changing signatures are not performed by agents.',
  send_payment: 'Agents cannot send payments or move XRP.',
  place_order: 'Agents cannot place DEX offers or orders.',
  bridge_assets: 'Agents cannot bridge assets.',
  swap_assets: 'Agents cannot execute swaps.',
  custody_assets: 'Agents never custody funds.',
  request_private_key: 'Private keys and seeds are never requested or handled.',
  export_secret: 'Secrets cannot be exported by agents.',
  bypass_policy: 'Policy bypass is not permitted.',
};

export function isBlockedAction(action: string): boolean {
  return ALWAYS_BLOCKED.has(String(action).toLowerCase());
}

export function getBlockedReason(action: string): string {
  const key = String(action).toLowerCase();
  return BLOCK_REASONS[key] ?? 'Action is not permitted in agent safe mode.';
}

/** Throws if the action is in the blocked set (e.g. LLM/tool payloads). */
export function assertAgentActionNotBlocked(action: string): void {
  const a = String(action).toLowerCase();
  if (isBlockedAction(a)) {
    throw new Error(getBlockedReason(a));
  }
}

export function canAgentPerformCapability(agentId: string, capability: AgentCapability): boolean {
  const agent = getAgentById(agentId);
  if (!agent) return false;
  return agent.capabilities.includes(capability);
}

export function requireHumanApproval(actionType: string): boolean {
  const t = String(actionType).toLowerCase();
  return t === 'prepare' || t === 'manual_review';
}
