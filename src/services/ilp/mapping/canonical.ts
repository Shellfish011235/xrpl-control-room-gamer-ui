/**
 * ILP Mapping — Canonical Entity Model
 * Implementation-ready types for observed / derived / inferred / unknown data.
 * Do not overclaim: every fact has a data_class and confidence.
 */

// ==================== TRUTH MODEL: DATA CLASS ====================

export type DataClass = 'observed' | 'derived' | 'inferred' | 'unknown';

/** 0–100. observed≥90, derived 70–89, inferred 40–69, unknown 0–39 */
export type ConfidenceScore = number;

export interface DataProvenance {
  class: DataClass;
  confidence: ConfidenceScore;
  source_ids: string[];
  observed_at: string; // ISO8601
  explanation?: string; // For UI tooltip
}

// ==================== CORE ENTITIES ====================

export interface Connector {
  id: string;
  name: string;
  from_ledger_id: string;
  to_ledger_id: string;
  asset_pairs: { from_asset: string; to_asset: string; rate?: number; spread_bps?: number }[];
  liquidity_status: 'live' | 'simulated' | 'unknown' | 'depleted';
  liquidity_depth_usd?: number;
  settlement_mechanism: string;
  operator?: string;
  fee_bps?: number;
  min_amount?: number;
  max_amount?: number;
  uptime_percent?: number;
  last_active_at?: string;
  provenance: DataProvenance;
  /** Optional: link to existing Connector from types.ts */
  legacy_id?: string;
}

export interface Route {
  id: string;
  from_ledger_id: string;
  to_ledger_id: string;
  from_asset: string;
  to_asset: string;
  hop_connector_ids: string[];
  total_fee_bps: number;
  total_latency_ms: number;
  liquidity_available_usd?: number;
  expires_at?: string;
  provenance: DataProvenance;
}

export interface Corridor {
  id: string;
  connector_id: string;
  from_ledger_id: string;
  to_ledger_id: string;
  from_asset: string;
  to_asset: string;
  status: 'active' | 'experimental' | 'inactive' | 'deprecated';
  volume_24h_usd?: number;
  tx_count_24h?: number;
  avg_settlement_time_ms?: number;
  success_rate?: number;
  bidirectional: boolean;
  provenance: DataProvenance;
}

export interface Asset {
  id: string;
  symbol: string;
  ledger_id: string;
  asset_type: 'native' | 'issued' | 'wrapped';
  issuer?: string;
  provenance: DataProvenance;
}

export interface Ledger {
  id: string;
  name: string;
  symbol?: string;
  type: 'public' | 'permissioned' | 'private';
  native_asset_id: string;
  finality_seconds?: number;
  provenance: DataProvenance;
}

export interface PaymentAttempt {
  id: string;
  source_ledger_id: string;
  dest_ledger_id: string;
  source_asset: string;
  dest_asset: string;
  amount: string;
  route_id?: string;
  status: 'pending' | 'quoted' | 'in_flight' | 'settled' | 'failed';
  quote_id?: string;
  settlement_id?: string;
  started_at: string;
  settled_at?: string;
  failure_reason?: string;
  provenance: DataProvenance;
}

export interface Quote {
  id: string;
  payment_attempt_id: string;
  connector_id: string;
  amount_in: string;
  amount_out: string;
  exchange_rate?: number;
  fee_bps: number;
  expires_at: string;
  created_at: string;
  provenance: DataProvenance;
}

export interface SettlementEvent {
  id: string;
  payment_attempt_id: string;
  ledger_id: string;
  tx_hash?: string;
  amount: string;
  asset: string;
  settled_at: string;
  provenance: DataProvenance;
  /** True only if we have on-ledger proof (e.g. XRPL tx) */
  xrpl_confirmed?: boolean;
}

export interface LiquidityEdge {
  id: string;
  connector_id: string;
  from_asset: string;
  to_asset: string;
  amount_usd: number;
  observed_at: string;
  provenance: DataProvenance;
}

export interface NodeHealth {
  id: string;
  node_type: 'connector' | 'ledger';
  node_id: string;
  status: 'up' | 'degraded' | 'down' | 'unknown';
  latency_ms?: number;
  last_check_at: string;
  consecutive_failures: number;
  provenance: DataProvenance;
}

export interface PacketFlow {
  id: string;
  payment_attempt_id: string;
  hop_index: number;
  connector_id: string;
  direction: 'forward' | 'fulfill' | 'reject';
  packet_type: string;
  observed_at: string;
  provenance: DataProvenance;
}

export interface ProbeResult {
  id: string;
  probe_type: 'quote' | 'liveness' | 'test_payment';
  target_connector_id?: string;
  target_route_id?: string;
  success: boolean;
  latency_ms?: number;
  error_code?: string;
  executed_at: string;
  /** Must be true so UI can filter synthetic from real */
  is_synthetic: true;
  provenance: DataProvenance;
}

// ==================== ANOMALY ====================

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  id: string;
  type: string; // e.g. 'connector_unreachable', 'quote_mismatch', 'settlement_delay'
  severity: AnomalySeverity;
  entity_type: 'connector' | 'route' | 'corridor' | 'payment';
  entity_id: string;
  message: string;
  detected_at: string;
  metadata?: Record<string, unknown>;
}
