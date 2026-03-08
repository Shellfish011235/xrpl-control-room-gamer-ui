/**
 * ILP / Open Payments / Rafiki intelligence layer — types for Stage 1 (metadata) and Stage 2 (routing metrics).
 * Uses shared telemetry truth model: ObservationClass, DataProvenance, ConfidenceScore, HealthState, FreshnessState.
 */

import type {
  ObservationClass,
  DataProvenance,
  ConfidenceScore,
  HealthState,
  FreshnessState,
  BaseNode,
} from '../types/telemetry-truth-model';

// ==================== STAGE 1 — METADATA / ECOSYSTEM ====================

/** Known connector: from registry or connector API. observation_class = observed | inferred. */
export interface KnownConnector {
  id: string;
  label: string;
  operator?: string;
  from_ledger_id?: string;
  to_ledger_id?: string;
  asset_pairs?: { from_asset: string; to_asset: string }[];
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  health: HealthState;
  freshness: FreshnessState;
  /** True if status is from probe only — must be labeled synthetic */
  is_probe_derived?: boolean;
}

/** Rafiki node: implementation or deployment. */
export interface RafikiNode extends BaseNode {
  node_kind: 'rafiki';
  version?: string;
  open_payments_url?: string;
}

/** Open Payments wallet provider (SPSP / Open Payments API). */
export interface OpenPaymentsProviderNode extends BaseNode {
  node_kind: 'open_payments';
  payment_pointer?: string;
  provider_url?: string;
}

/** Generic wallet provider that may use ILP/Open Payments. */
export interface WalletProviderNode extends BaseNode {
  node_kind: 'wallet_provider';
  provider_name?: string;
}

// ==================== STAGE 2 — ROUTING INTELLIGENCE METRICS ====================

/** Quote latency: time to receive a quote (ms). observation_class = observed (from API) or synthetic (from probe). */
export interface QuoteLatencyMetric {
  id: string;
  connector_id?: string;
  route_id?: string;
  latency_ms: number;
  observed_at: string;
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  /** True when from probe — must be labeled */
  is_synthetic: boolean;
}

/** Route health: up / degraded / down; can be observed (connector API) or probe-derived. */
export interface RouteHealthMetric {
  id: string;
  route_id: string;
  connector_ids: string[];
  health: HealthState;
  success_rate?: number;
  last_success_at?: string;
  last_failure_at?: string;
  observed_at: string;
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  is_synthetic: boolean;
}

/** Connector liveness: from health endpoint or probe. */
export interface ConnectorLiveness {
  id: string;
  connector_id: string;
  status: 'up' | 'down' | 'unknown';
  latency_ms?: number;
  observed_at: string;
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  is_synthetic: boolean;
}

// ==================== API PAYLOAD (Stage 1 + Stage 2) ====================

export interface ILPIntelPayload {
  /** Stage 1: ecosystem metadata */
  connectors: KnownConnector[];
  rafiki_nodes: RafikiNode[];
  open_payments_providers: OpenPaymentsProviderNode[];
  wallet_providers?: WalletProviderNode[];
  /** Stage 2: routing metrics */
  quote_latency: QuoteLatencyMetric[];
  route_health: RouteHealthMetric[];
  connector_liveness: ConnectorLiveness[];
  /** Meta */
  built_at: string;
  freshness: FreshnessState;
  contains_synthetic: boolean;
  /** Anomalies to show (e.g. stale data, probe-only visibility) */
  anomalies: { id: string; message: string; severity: string }[];
}

export interface ILPIntelApiResponse {
  ok: boolean;
  payload?: ILPIntelPayload;
  error?: string;
  /** When true, response is from mock data */
  from_mock?: boolean;
}
