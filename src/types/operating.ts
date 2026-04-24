/**
 * Operating model — data plane vs interpretation plane.
 * Observations: measured, source-bound, replayable. Claims: narrative, model output, or UI convention.
 * Not legal or compliance classification for securities purposes — engineering clarity only.
 */

/** Provenance of a data point, panel, or model output. */
export type ProvenanceSourceKind = 'api' | 'websocket' | 'ipfs' | 'cache' | 'derived' | 'static' | 'user_input' | 'unknown';

export interface ProvenanceRecord {
  sourceKind: ProvenanceSourceKind;
  /** Human-readable, e.g. wss://s1.ripple.com, CoinGecko REST, local cache */
  label: string;
  /** ISO-8601 when known */
  fetchedAt?: string;
  /** Schema or payload version, if any */
  schemaVersion?: string;
  /** 0..1 for model or heuristic outputs */
  confidence?: number;
  /** Hostname or region hint */
  nodeOrigin?: string;
  /** Whether this record is stale per client policy */
  stale?: boolean;
  /** Free-form, e.g. "subscription dropped; showing last value" */
  note?: string;
}

/** A measurement or value traceable to sources (may be computed from other observations). */
export interface ObservationRecord {
  id: string;
  kind: 'observation';
  value: unknown;
  label: string;
  unit?: string;
  provenance: ProvenanceRecord;
  /** If derived, upstream observation ids */
  dependsOn?: string[];
}

/**
 * Interpretive or narrative content — not directly measured.
 * (Summaries, AI text, "healthy"/"stressed" labels, educational blurbs.)
 */
export interface ClaimRecord {
  id: string;
  kind: 'claim';
  text: string;
  author: 'user' | 'llm' | 'rules' | 'ui' | 'community';
  provenance: ProvenanceRecord;
  /** Optional range for model / heuristic */
  confidence?: number;
  /** If claim contradicts or qualifies another id */
  relatedObservationIds?: string[];
}

export type PolicyFeatureState = 'read_only' | 'simulation_only' | 'approval_required' | 'disabled';

export interface PolicyDecision {
  featureId: string;
  state: PolicyFeatureState;
  reason?: string;
  /** Optional region / review gate */
  blockedByComplianceReview?: boolean;
  /** If false, do not show primary CTA */
  ctaEnabled?: boolean;
}

/** Draft preview of a hypothetical action (no execution in this app layer). */
export interface SimulationEnvelope {
  id: string;
  actionKind: string;
  summary: string;
  /** e.g. route hops, DEX book depth summary — structured later */
  parameters: Record<string, unknown>;
  estimatedFeeDrops?: string;
  assumedSlippageBps?: number;
  networkPathLabel?: string;
  warnings: string[];
  validUntil: string;
  policyResult: PolicyDecision;
  /** If linked to a preview hash or quote id in future */
  sourceRef?: string;
}

/**
 * What the user (or a future in-wallet flow) would see before signing.
 * Wire this to Xaman / wallet-only submission — never a hidden backend sign.
 */
export interface ApprovalEnvelope {
  id: string;
  actionType: string;
  /** 'user' | 'agent' — agent must never sign on behalf of user here */
  initiator: 'user' | 'agent' | 'system_suggestion';
  parameters: Record<string, unknown>;
  constraints: string[];
  preview: SimulationEnvelope | null;
  warnings: string[];
  requiredWalletStep: 'connect' | 'review' | 'sign' | 'done';
  createdAt: string;
  expiresAt?: string;
  policySnapshot: PolicyDecision;
}

export interface AgentFinding {
  id: string;
  agentId: string;
  agentRole: string;
  title: string;
  observationSummary: string;
  interpretation: string;
  confidence: number;
  uncertainty: string;
  /** Optional: ids of other findings that conflict (non-executing) */
  conflictsWith?: string[];
  suggestedNextReview: string;
  nonExecuting: true;
  provenance: ProvenanceRecord;
  updatedAt: string;
}

/** Labeled mock — UI structure only, not a live model */
export const MOCK_DATA_LABEL = 'MOCK — structure only' as const;
