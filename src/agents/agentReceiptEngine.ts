import type { AgentReceipt } from './types';

let receiptSeq = 0;

/** Deterministic local fingerprint (FNV-1a style); not a cryptographic hash. */
export function createSimpleHash(input: unknown): string {
  const s =
    typeof input === 'string'
      ? input
      : JSON.stringify(input, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  let h = 2166136261 >>> 0;
  let h2 = 374761393 >>> 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h ^= c;
    h = Math.imul(h, 16777619) >>> 0;
    h2 = (h2 + c * (i + 1)) >>> 0;
  }
  return [h >>> 0, h2 >>> 0].map((x) => x.toString(16).padStart(8, '0')).join('');
}

export interface CreateAgentReceiptParams {
  taskId: string;
  agentIds: string[];
  input: unknown;
  output: unknown;
  policyResult: AgentReceipt['policyResult'];
  securityResult: AgentReceipt['securityResult'];
  summary: string;
}

export function createAgentReceipt(params: CreateAgentReceiptParams): AgentReceipt {
  receiptSeq += 1;
  return {
    id: `ar-${Date.now()}-${receiptSeq}`,
    taskId: params.taskId,
    agentIds: params.agentIds,
    createdAt: new Date().toISOString(),
    inputHash: createSimpleHash(params.input),
    outputHash: createSimpleHash(params.output),
    policyResult: params.policyResult,
    securityResult: params.securityResult,
    summary: params.summary,
  };
}
