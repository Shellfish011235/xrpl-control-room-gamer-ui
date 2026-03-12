/**
 * XRPL Intelligence layer: aggregates validators, whales, liquidity, bots, agents.
 * Exposes combined state for the dashboard; consumes XRPL events and routes to modules.
 */

export * from './validators';
export * from './whales';
export * from './liquidity';
export * from './bots';
export * from './aiAgents';

import type { NetworkHealthSummary } from './validators';
import type { WhaleState } from './whales';
import type { LiquidityState } from './liquidity';
import type { BotState } from './bots';
import type { AgentState } from './aiAgents';

export interface XRPLIntelligenceState {
  validators: NetworkHealthSummary | null;
  whales: WhaleState;
  liquidity: LiquidityState;
  bots: BotState;
  agents: AgentState;
  lastLedgerIndex: number | null;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  lastUpdated: number;
}
