/**
 * Map-specific node/edge types extending shared telemetry truth model.
 * Validator Map, Connector (ILP) Map, Payment Corridor Map — same base, specialized fields.
 */

import type {
  BaseNode,
  BaseEdge,
  DataProvenance,
  ObservationClass,
  AnomalyEvent,
  FreshnessState,
  HealthState,
  GeoConfidence,
} from './telemetry-truth-model';

export type MapKind = 'validator' | 'connector' | 'payment_corridor';

// ==================== VALIDATOR MAP ====================

/** UNL-confirmed vs inferred; observed uptime vs inferred influence; confirmed vs estimated location */
export type ValidatorObservationClass = ObservationClass;

export type ValidatorAnomalyType =
  | 'validator_drift'      // Agreement/position divergence
  | 'validator_downtime'   // Unreachable or not validating
  | 'vote_divergence'     // Amendment vote differs from UNL norm
  | 'stale_telemetry'     // No recent data
  | 'inferred_only';      // No UNL confirmation for relationship

export interface ValidatorNode extends BaseNode {
  map_kind: 'validator';
  /** Master public key (node id may be hash or slug) */
  master_key?: string;
  domain?: string;
  /** True only when validator is on current UNL (directly observed from ledger/registry) */
  unl_confirmed: boolean;
  /** Observed uptime/agreement from telemetry (e.g. agreement_24h 0–1). When missing, do not show as fact. */
  agreement_24h?: number;
  /** Inferred influence/importance (e.g. from graph centrality). Never present as "observed". */
  inferred_influence?: number;
  /** Location: only confirmed if from declared/verified source */
  geo_confidence?: GeoConfidence;
  /** Amendment vote overlay: amendment_id -> yes/no/unknown. observation_class per vote. */
  amendment_votes?: Record<string, { vote: 'yes' | 'no' | 'unknown'; observation_class: ObservationClass }>;
  /** Participation overlay: last ledger closed, proposals, etc. */
  participation?: {
    last_ledger_index?: number;
    last_ledger_close_time?: string;
    observation_class: ObservationClass;
  };
}

export interface ValidatorEdge extends BaseEdge {
  map_kind: 'validator';
  /** 'unl_link' = UNL-confirmed; 'inferred_link' = inferred validator relationship */
  relationship_type: 'unl_link' | 'inferred_link';
  /** When true, this edge is from UNL/ledger data; when false, inferred (e.g. from co-validation) */
  unl_confirmed: boolean;
}

// ==================== CONNECTOR (ILP) MAP ====================

export type ConnectorAnomalyType =
  | 'connector_unreachable'
  | 'quote_mismatch'
  | 'settlement_delay'
  | 'route_flap'
  | 'repeated_hop_failure'
  | 'corridor_degradation'
  | 'stale_liquidity'
  | 'telemetry_blackout';

export interface ConnectorNode extends BaseNode {
  map_kind: 'connector';
  from_ledger_id?: string;
  to_ledger_id?: string;
  liquidity_status?: 'live' | 'simulated' | 'unknown' | 'depleted';
  operator?: string;
  /** Probe-derived health must be labeled synthetic */
  is_synthetic_probe?: boolean;
}

export interface ConnectorEdge extends BaseEdge {
  map_kind: 'connector';
  relationship_type: 'connector_hop' | 'corridor_route' | 'probe_route';
  corridor_id?: string;
  connector_id?: string;
  from_asset?: string;
  to_asset?: string;
  volume_24h_usd?: number;
  /** True if edge is from probe only */
  is_synthetic_probe?: boolean;
}

// ==================== PAYMENT CORRIDOR MAP ====================

/** XRPL-confirmed settlement vs inferred corridor routing; on-ledger vs off-ledger */
export type PaymentCorridorObservationClass = ObservationClass;

export type PaymentCorridorAnomalyType =
  | 'corridor_degradation'
  | 'settlement_delay'
  | 'concentration_risk'
  | 'low_liquidity_stress'
  | 'stale_estimate';

export interface PaymentCorridorNode extends BaseNode {
  map_kind: 'payment_corridor';
  /** Account, issuer, or region identifier */
  account_or_region?: string;
  /** When true, node activity is from on-ledger data; when false, may include off-ledger assumptions */
  on_ledger_visible: boolean;
  /** Observed transaction volume (on-ledger only). Do not mix with estimated. */
  observed_volume_24h?: number;
  /** Estimated importance/volume when not fully observed — must be labeled inferred/derived */
  estimated_importance?: number;
}

export interface PaymentCorridorEdge extends BaseEdge {
  map_kind: 'payment_corridor';
  /** 'settlement_flow' = XRPL-confirmed; 'inferred_flow' = inferred routing */
  relationship_type: 'settlement_flow' | 'inferred_flow' | 'probe_route';
  /** True when flow is backed by on-ledger settlement evidence */
  xrpl_confirmed: boolean;
  /** On-ledger observed volume (do not overclaim) */
  observed_volume_24h?: number;
  /** Inferred/estimated volume — show as inferred */
  estimated_volume_24h?: number;
  from_asset?: string;
  to_asset?: string;
}

// ==================== UNIFIED GRAPH PAYLOAD (one engine for all maps) ====================

export type TelemetryNode = ValidatorNode | ConnectorNode | PaymentCorridorNode;
export type TelemetryEdge = ValidatorEdge | ConnectorEdge | PaymentCorridorEdge;

export interface UnifiedMapPayload<N extends TelemetryNode = TelemetryNode, E extends TelemetryEdge = TelemetryEdge> {
  map_kind: MapKind;
  nodes: N[];
  edges: E[];
  anomalies: AnomalyEvent[];
  built_at: string;
  freshness: FreshnessState;
  /** True if any node/edge is synthetic (probe, demo, test) */
  contains_synthetic: boolean;
}

export type ValidatorMapPayload = UnifiedMapPayload<ValidatorNode, ValidatorEdge>;
export type ConnectorMapPayload = UnifiedMapPayload<ConnectorNode, ConnectorEdge>;
export type PaymentCorridorMapPayload = UnifiedMapPayload<PaymentCorridorNode, PaymentCorridorEdge>;

// ==================== PROTOCOL HUB (interoperability layer) ====================

export interface ProtocolHubNode extends BaseNode {
  map_kind: 'connector'; // reuse connector map kind for interop
  node_kind: 'protocol_hub';
  /** Protocol or rail identifiers (ILP, Lightning, IBC, CCIP, etc.) */
  protocols?: string[];
  /** Application / routing / settlement */
  layer?: 'application' | 'routing' | 'settlement';
}
