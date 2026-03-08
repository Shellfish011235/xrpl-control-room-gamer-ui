/**
 * Interoperability layer graph model.
 * Application / Routing / Settlement layers; node and edge types for protocol overlays.
 * Uses shared telemetry truth model (ObservationClass, DataProvenance, etc.).
 */

import type { BaseNode, BaseEdge } from './telemetry-truth-model';

// ==================== LAYER ====================

export type InteropLayer = 'application' | 'routing' | 'settlement';

// ==================== NODE TYPE ====================

export type NodeType =
  | 'ledger'
  | 'validator'
  | 'connector'
  | 'router'
  | 'bridge'
  | 'oracle'
  | 'wallet_provider'
  | 'payment_system'
  | 'protocol_hub';

// ==================== EDGE TYPE ====================

export type EdgeType =
  | 'settlement'
  | 'routing'
  | 'liquidity'
  | 'bridge'
  | 'message'
  | 'trust'
  | 'probe';

// ==================== INTEROP NODE (extends BaseNode) ====================

export interface InteropNode extends BaseNode {
  node_type: NodeType;
  layer: InteropLayer;
  /** Optional protocol or rail identifier */
  protocol?: string;
}

// ==================== INTEROP EDGE (extends BaseEdge) ====================

export interface InteropEdge extends BaseEdge {
  edge_type: EdgeType;
  /** Layer of source/target for rendering */
  layer?: InteropLayer;
  /** Volume or importance 0–1 for thickness */
  volume_normalized?: number;
}

// ==================== GRAPH PAYLOAD ====================

export interface InteropGraphPayload {
  nodes: InteropNode[];
  edges: InteropEdge[];
  built_at: string;
  freshness: string;
  contains_synthetic: boolean;
  /** Toggleable layer visibility */
  layers: InteropLayer[];
}
