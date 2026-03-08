/**
 * ILP Mapping — Normalized Graph Payload for Frontend
 * Ready for globe/network map: nodes, edges, confidence-weighted rendering.
 */

import type { DataClass, ConfidenceScore } from './canonical';

// ==================== GRAPH NODE ====================

export type GraphNodeType = 'ledger' | 'connector';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  /** For ledgers: symbol; for connectors: operator or name */
  subtitle?: string;
  data_class: DataClass;
  confidence: ConfidenceScore;
  /** Optional position for 2D/3D layout */
  position?: { x: number; y: number; z?: number };
  /** Visual: size scale 0–1 */
  size?: number;
  /** Visual: glow intensity 0–1 (health/activity) */
  glow?: number;
  /** Ledger only: domain */
  domain?: 'on-ledger' | 'off-ledger' | 'hybrid';
  /** Connector only: status */
  status?: 'up' | 'degraded' | 'down' | 'unknown';
  metadata?: Record<string, unknown>;
}

// ==================== GRAPH EDGE ====================

export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  /** Corridor or direct connector edge */
  corridor_id?: string;
  connector_id?: string;
  data_class: DataClass;
  confidence: ConfidenceScore;
  /** Directional: source -> target */
  direction: 'forward' | 'backward' | 'bidirectional';
  /** Visual: thickness 0–1 (volume) */
  thickness: number;
  /** Visual: glow 0–1 (health/activity) */
  glow: number;
  /** Optional: failure heat 0–1 for overlay */
  failure_heat?: number;
  from_asset?: string;
  to_asset?: string;
  volume_24h_usd?: number;
  metadata?: Record<string, unknown>;
}

// ==================== ROOT PAYLOAD ====================

export interface ILPGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** When this snapshot was built */
  built_at: string;
  /** Data freshness: live / stale / historical */
  freshness: 'live' | 'stale' | 'historical';
  /** If any data is synthetic/probe-derived */
  contains_synthetic: boolean;
  /** Optional anomalies to overlay */
  anomalies?: { node_id?: string; edge_id?: string; severity: string; message: string }[];
}

// ==================== API RESPONSE WRAPPER ====================

export interface ILPGraphApiResponse {
  ok: boolean;
  payload?: ILPGraphPayload;
  error?: string;
  from_cache?: boolean;
}
