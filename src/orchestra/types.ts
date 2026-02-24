/**
 * XRPL Agent Orchestra – context, agent interface, and control types.
 * Non-custodial: agents emit intents; LIVE mode requires user sign.
 */

import type {
  Intent,
  PaymentIntent,
  NettedObligation,
  SettlementPlan,
  AgentId,
} from '../types/agentIntents';

export type OrchestraMode = 'SIMULATE' | 'MANUAL' | 'LIVE';

export interface AgentContext {
  now: () => number;
  emit: (intent: Intent) => void;
  readState: (key: string) => unknown;
  writeState: (key: string, value: unknown) => void;
  market?: {
    mid?: number;
    spreadBps?: number;
    volatility?: number;
  };
}

export interface Agent {
  id: AgentId;
  name: string;
  /** Role / backstory for CrewAI-style orchestration */
  role?: string;
  goal?: string;
  tick: (ctx: AgentContext) => Promise<void>;
}

/** Events published to Control Room UI (WebSocket / store) */
export type ControlRoomEvent =
  | { type: 'WINDOW_CLOSED'; plan: SettlementPlan; windowId: string }
  | { type: 'INTENT_REJECTED'; intent: Intent; reasons?: string[] }
  | { type: 'PLAN_READY_FOR_SIGN'; plan: SettlementPlan }
  | { type: 'EXECUTION_RESULT'; planId: string; ok: boolean; txHashes?: string[]; error?: string; plan?: SettlementPlan }
  | { type: 'KILL_SWITCH'; active: boolean }
  | { type: 'MODE_CHANGED'; mode: OrchestraMode };

/** Audit log entry for safety and debugging */
export interface AuditLogEntry {
  id: string;
  ts: number;
  type: 'INTENT_EMIT' | 'INTENT_REJECT' | 'WINDOW_OPEN' | 'WINDOW_CLOSE' | 'PLAN_BUILT' | 'EXEC_SIMULATE' | 'EXEC_MANUAL' | 'EXEC_LIVE' | 'KILL_SWITCH' | 'MODE_CHANGE';
  payload: Record<string, unknown>;
}

export type { Intent, PaymentIntent, NettedObligation, SettlementPlan, AgentId };
