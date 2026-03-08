/**
 * Hidden analytics layers: AI Payment Routing, Liquidity Stress, Corridor Emergence.
 * All signals carry observation_class and confidence — do not overclaim.
 */

import type {
  ObservationClass,
  DataProvenance,
  ConfidenceScore,
  FreshnessState,
  AnomalySeverity,
} from '../types/telemetry-truth-model';

// ==================== HIDDEN LAYER 1 — AI PAYMENT ROUTING SIGNALS ====================

/** Metrics that suggest machine-driven or agentic payment behavior */
export interface AIPaymentRoutingMetrics {
  /** Repeating payment cadence (e.g. same interval) — 0–1 */
  cadence_regularity?: number;
  /** Bursty microtransaction score — 0–1 */
  burst_score?: number;
  /** Low human variance in timing — 0–1 */
  timing_variance_score?: number;
  /** Quote/settlement pattern consistency with automation — 0–1 */
  automation_consistency?: number;
  /** Cluster of wallets behaving similarly (machine wallet cluster) — 0–1 */
  cluster_score?: number;
  /** Repeated corridor usage with non-human-like timing — 0–1 */
  corridor_automation_score?: number;
}

export type AIRoutingAnomalyTag =
  | 'repeating_cadence'
  | 'bursty_micropayments'
  | 'high_timing_regularity'
  | 'automated_quote_settlement'
  | 'machine_wallet_cluster'
  | 'automated_corridor_usage'
  | 'unknown';

export interface RoutingSignal {
  id: string;
  /** Entity: wallet cluster, corridor, route */
  entity_type: 'wallet_cluster' | 'corridor' | 'route' | 'connector';
  entity_id: string;
  /** 0–100: how strongly signals suggest machine-driven behavior */
  score: number;
  metrics: AIPaymentRoutingMetrics;
  anomaly_tags: AIRoutingAnomalyTag[];
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  freshness: FreshnessState;
  /** Observed = from direct payment/quote data; Inferred = from pattern only */
  explanation?: string;
}

// ==================== HIDDEN LAYER 2 — LIQUIDITY STRESS DETECTION ====================

export interface LiquidityStressMetrics {
  /** Quote latency trend (rising = stress) */
  quote_latency_trend?: 'rising' | 'stable' | 'falling' | 'unknown';
  quote_latency_p50_ms?: number;
  quote_latency_p99_ms?: number;
  /** Payment failure rate 0–1 */
  failure_rate?: number;
  /** Quote variance (e.g. spread) — widening = stress */
  quote_variance_trend?: 'widening' | 'stable' | 'narrowing' | 'unknown';
  /** Concentration: share of flow through single route/corridor — 0–1 */
  concentration_risk?: number;
  /** Route redundancy (more = less stress) — 0–1 */
  route_redundancy?: number;
  /** Retry rate 0–1 */
  retry_rate?: number;
  /** Spread stability — 0–1 */
  spread_stability?: number;
  /** Settlement delay spike count in window */
  settlement_delay_spikes?: number;
}

export type LiquidityStressSeverity = 'low' | 'medium' | 'high' | 'critical';

export type LiquidityStressAnomalyTag =
  | 'rising_latency'
  | 'high_failures'
  | 'widening_variance'
  | 'concentration_risk'
  | 'low_redundancy'
  | 'high_retries'
  | 'spread_instability'
  | 'settlement_delays'
  | 'unknown';

export interface LiquidityStressSignal {
  id: string;
  entity_type: 'corridor' | 'route' | 'connector' | 'rail';
  entity_id: string;
  severity: LiquidityStressSeverity;
  /** 0–100 stress level */
  stress_score: number;
  metrics: LiquidityStressMetrics;
  anomaly_tags: LiquidityStressAnomalyTag[];
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  freshness: FreshnessState;
  /** Thresholds that were exceeded */
  triggered_thresholds?: string[];
  explanation?: string;
}

// ==================== HIDDEN LAYER 3 — CORRIDOR EMERGENCE DETECTION ====================

export interface CorridorEmergenceMetrics {
  /** New asset pair recurring — count or 0–1 score */
  new_asset_pair_score?: number;
  /** New region-to-region pattern — 0–1 */
  new_region_pattern_score?: number;
  /** New connector pair appearing repeatedly — 0–1 */
  new_connector_pair_score?: number;
  /** Traffic acceleration from low baseline — 0–1 */
  traffic_acceleration?: number;
  /** New protocol bridge active — boolean or 0–1 */
  new_bridge_active?: number;
  /** New rail combination around destination — 0–1 */
  new_rail_combination_score?: number;
}

export type CorridorEmergenceAnomalyTag =
  | 'new_asset_pair'
  | 'new_region_pattern'
  | 'new_connector_pair'
  | 'traffic_acceleration'
  | 'new_bridge'
  | 'new_rail_combination'
  | 'unknown';

export interface CorridorEmergenceSignal {
  id: string;
  entity_type: 'corridor' | 'route' | 'connector_pair' | 'bridge' | 'rail';
  entity_id: string;
  /** 0–100: how strong emergence signal is */
  emergence_score: number;
  metrics: CorridorEmergenceMetrics;
  anomaly_tags: CorridorEmergenceAnomalyTag[];
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  freshness: FreshnessState;
  /** First observed / baseline window */
  first_observed_at?: string;
  explanation?: string;
}

// ==================== COMBINED HIDDEN ANALYTICS PAYLOAD ====================

export interface HiddenAnalyticsPayload {
  /** Layer 1: AI payment routing signals */
  ai_routing_signals: RoutingSignal[];
  /** Layer 2: Liquidity stress */
  liquidity_stress_signals: LiquidityStressSignal[];
  /** Layer 3: Corridor emergence */
  corridor_emergence_signals: CorridorEmergenceSignal[];
  built_at: string;
  freshness: FreshnessState;
  /** True if any data is synthetic/mock */
  contains_synthetic: boolean;
  anomalies: { id: string; message: string; severity: AnomalySeverity }[];
}

export interface HiddenAnalyticsApiResponse {
  ok: boolean;
  payload?: HiddenAnalyticsPayload;
  error?: string;
  from_mock?: boolean;
}
