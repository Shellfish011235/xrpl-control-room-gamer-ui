/**
 * useUIEnhancer – hook for UIEnhancerAgent: invoke suggestions and subscribe to workflow events.
 * Error-resilient: try/catch all async with fallback state.
 */

import { useState, useCallback, useEffect } from 'react';
import { invokeUIEnhancer, wireLedgerToWorkflow } from '../agents/UIEnhancerAgent';
import type { AgentInvocationResult } from '../agents/Orchestrator';

export interface UseUIEnhancerReturn {
  result: AgentInvocationResult | null;
  loading: boolean;
  error: string | null;
  invoke: (task: string, context?: Record<string, unknown>) => Promise<AgentInvocationResult>;
  lastHighImpactScore: number | null;
}

export function useUIEnhancer(): UseUIEnhancerReturn {
  const [result, setResult] = useState<AgentInvocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastHighImpactScore, setLastHighImpactScore] = useState<number | null>(null);

  const invoke = useCallback(async (task: string, context: Record<string, unknown> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const out = await invokeUIEnhancer(task, context);
      setResult(out);
      return out;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'UIEnhancer failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = wireLedgerToWorkflow((payload) => {
      if (typeof payload.score === 'number') setLastHighImpactScore(payload.score);
    });
    return unsub;
  }, []);

  return { result, loading, error, invoke, lastHighImpactScore };
}
