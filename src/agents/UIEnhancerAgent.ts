/**
 * UIEnhancerAgent – meta-agent: monitors interactions, suggests/auto-applies patterns.
 * Skills: @react-patterns @ai-agent-orchestrator @workflow-automation @typescript-expert
 * E.g. slow loads → lazy-loading; mobile → responsive neon grids.
 * Orchestrates Ledger alert → Portfolio sim → UI refresh via event bus.
 */

import { publishAgentEvent, subscribeAgentEvent } from './eventBus';
import { getDefaultOrchestrator } from './Orchestrator';
import type { AgentInvocationResult } from './Orchestrator';

export interface UIEnhanceSuggestion {
  pattern: string;
  reason: string;
  codeSuggestions: string[];
}

const DEBOUNCE_MS = 500;
let lastInvoke = 0;

/**
 * Invoke UIEnhancer agent (debounced). Returns suggestions for lazy-loading, responsive grids, etc.
 */
export async function invokeUIEnhancer(
  task: string,
  context: Record<string, unknown>
): Promise<AgentInvocationResult> {
  const now = Date.now();
  if (now - lastInvoke < DEBOUNCE_MS) {
    return {
      analysis: '[Debounced]',
      codeSuggestions: [],
      uiUpdates: {},
      agentType: 'ui-enhance',
    };
  }
  lastInvoke = now;
  const orch = getDefaultOrchestrator();
  const result = await orch.invokeAgent(task, context, 'ui-enhance');
  publishAgentEvent('ui-enhance-suggestion', { result });
  return result;
}

/**
 * Subscribe to ledger high-impact → trigger workflow (e.g. run portfolio sim, then UI refresh).
 */
export function wireLedgerToWorkflow(
  onHighImpact: (payload: { score?: number }) => void
): () => void {
  const unsub = subscribeAgentEvent('ledger-high-impact', (payload) => {
    onHighImpact(payload as { score?: number });
  });
  return unsub;
}
