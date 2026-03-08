/**
 * Shared Telemetry Truth Model
 * Graded certainty intelligence: one canonical model for Validator, ILP/Connector, and Payment Corridor maps.
 * All map layers inherit from this. Do not overclaim: every fact has observation_class and confidence.
 */

// ==================== OBSERVATION CLASS (what we actually know) ====================

export type ObservationClass =
  | 'observed'   // Direct primary source (ledger, API, telemetry)
  | 'derived'   // Computed from observed data (aggregates, rates, health)
  | 'inferred'  // Inferred from partial/indirect signals (registry, correlation)
  | 'synthetic' // Probe, demo, test, simulated — must be labeled
  | 'unknown';  // No signal or placeholder

/** Confidence 0–100. observed≥85, derived 70–84, inferred 40–69, synthetic 30–50, unknown 0–39 */
export type ConfidenceScore = number;

// ==================== FRESHNESS ====================

export type FreshnessState =
  | 'live'      // Within normal update window (e.g. &lt; 2 min)
  | 'recent'    // Slightly aged (e.g. 2 min – 1 h)
  | 'stale'     // Old (e.g. &gt; 1 h) — show warning
  | 'unknown';  // No timestamp or unreliable

// ==================== HEALTH ====================

export type HealthState =
  | 'up'
  | 'degraded'
  | 'down'
  | 'unknown';

// ==================== GEO CONFIDENCE ====================

export type GeoConfidence =
  | 'confirmed'  // Declared or verified location
  | 'estimated'  // IP/registry/heuristic
  | 'unknown';

// ==================== DATA PROVENANCE ====================

export interface DataProvenance {
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  source_ids: string[];
  observed_at: string; // ISO8601
  explanation?: string; // For UI tooltip — never overclaim
}

// ==================== TIME WINDOW ====================

export interface TimeWindow {
  start: string; // ISO8601
  end: string;
}

// ==================== OBSERVATION SOURCE (for source_ids) ====================

export type ObservationSource =
  | 'ledger_api'
  | 'validator_telemetry'
  | 'unl_registry'
  | 'connector_api'
  | 'quote_response'
  | 'probe'
  | 'registry'
  | 'inference'
  | 'demo'
  | 'testnet'
  | string;

// ==================== ANOMALY ====================

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyEvent {
  id: string;
  type: string;
  severity: AnomalySeverity;
  entity_type: 'node' | 'edge';
  entity_id: string;
  message: string;
  detected_at: string;
  observation_class: ObservationClass;
  metadata?: Record<string, unknown>;
}

// ==================== BASE NODE (shared by all maps) ====================

export interface BaseNode {
  id: string;
  label: string;
  subtitle?: string;
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  health: HealthState;
  freshness: FreshnessState;
  /** Geography: only set when map shows location */
  geo_confidence?: GeoConfidence;
  coordinates?: [number, number]; // [lng, lat]
  /** Anomalies affecting this node */
  anomaly_ids?: string[];
  /** Visual hint: 0–1 size/importance */
  size?: number;
  /** Visual: 0–1 glow (health/activity) */
  glow?: number;
  /** Visual: 0–1 opacity (confidence) — can be derived client-side */
  opacity?: number;
  metadata?: Record<string, unknown>;
}

// ==================== BASE EDGE (shared by all maps) ====================

export type EdgeDirection = 'forward' | 'backward' | 'bidirectional';

export interface BaseEdge {
  id: string;
  source_id: string;
  target_id: string;
  observation_class: ObservationClass;
  confidence: ConfidenceScore;
  provenance: DataProvenance;
  health: HealthState;
  freshness: FreshnessState;
  direction: EdgeDirection;
  /** Visual: 0–1 thickness (volume/importance) */
  thickness: number;
  /** Visual: 0–1 glow (health/activity) */
  glow: number;
  /** Visual: 0–1 opacity (confidence) */
  opacity?: number;
  anomaly_ids?: string[];
  metadata?: Record<string, unknown>;
}

// ==================== RELATIONSHIP TYPE (for edge semantics) ====================

export type RelationshipType =
  | 'unl_link'           // Validator: UNL-confirmed relationship
  | 'inferred_link'      // Validator: inferred validator relationship
  | 'connector_hop'      // ILP: connector between ledgers
  | 'corridor_route'     // ILP: corridor/route
  | 'settlement_flow'    // Payment: XRPL-confirmed settlement flow
  | 'inferred_flow'      // Payment: inferred corridor routing
  | 'probe_route'       // Synthetic: probe-confirmed path
  | string;
