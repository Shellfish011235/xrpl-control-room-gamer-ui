/**
 * useAgent – invoke XRPLAgentOrchestrator by task and agent type.
 * Returns last result and loading/error for Ledger Impact Analyzer and other UI.
 */

import { useState, useCallback } from 'react';
import { getDefaultOrchestrator } from '../agents/Orchestrator';
import type { AgentType, AgentInvocationResult } from '../agents/Orchestrator';

export interface UseAgentReturn {
  result: AgentInvocationResult | null;
  loading: boolean;
  error: string | null;
  invoke: (task: string, context: Record<string, unknown>, agentType: AgentType) => Promise<AgentInvocationResult>;
}

export function useAgent(): UseAgentReturn {
  const [result, setResult] = useState<AgentInvocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = useCallback(
    async (task: string, context: Record<string, unknown>, agentType: AgentType): Promise<AgentInvocationResult> => {
      setLoading(true);
      setError(null);
      try {
        const orch = getDefaultOrchestrator();
        const out = await orch.invokeAgent(task, context, agentType);
        setResult(out);
        return out;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Agent invocation failed';
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, invoke };
}
