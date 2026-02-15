/**
 * Lightweight event bus for multi-agent flows: Ledger alert → Portfolio sim → UI refresh.
 * Type-safe event names and payloads.
 */

export type AgentEventType =
  | 'ledger-high-impact'
  | 'portfolio-sim-update'
  | 'ui-enhance-suggestion'
  | 'workflow-trigger';

export type AgentEventPayload = Record<string, unknown>;

const listeners = new Map<AgentEventType, Set<(payload: AgentEventPayload) => void>>();

export function subscribeAgentEvent(
  type: AgentEventType,
  handler: (payload: AgentEventPayload) => void
): () => void {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(handler);
  return () => listeners.get(type)?.delete(handler);
}

export function publishAgentEvent(type: AgentEventType, payload: AgentEventPayload = {}): void {
  listeners.get(type)?.forEach((h) => {
    try {
      h(payload);
    } catch (e) {
      console.warn('[AgentEventBus] Handler error:', e);
    }
  });
}
