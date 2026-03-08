/**
 * Interop graph transform: raw InteropGraphPayload → graph-ready nodes/edges with visual props.
 * Reuses shared renderer rules: solid/dashed/dotted by observation_class, opacity by confidence, glow by health.
 */

import type { InteropNode, InteropEdge, InteropGraphPayload } from '../types/interop-graph';
import type { ObservationClass } from '../types/telemetry-truth-model';
import {
  lineStyleFromObservationClass,
  opacityFromConfidence,
  glowFromHealth,
  shouldShowWarningBadge,
  getConfidenceLabel,
  getObservationClassLabel,
} from '../types/telemetry-visual-rules';

// ==================== RENDERER RULES (aligned with telemetry-visual-rules) ====================

/** solid = observed, dashed = inferred, dotted = synthetic/probe */
export function getLineStyle(observationClass: ObservationClass): 'solid' | 'dashed' | 'dotted' {
  return lineStyleFromObservationClass(observationClass);
}

/** opacity 0–1 from confidence (min 0.3) */
export function getOpacity(confidence: number): number {
  return opacityFromConfidence(confidence);
}

/** glow 0–1 from health */
export function getGlow(health: string): number {
  return glowFromHealth(health as 'up' | 'degraded' | 'down' | 'unknown');
}

export interface InteropNodeVisual {
  id: string;
  label: string;
  subtitle?: string;
  node_type: string;
  layer: string;
  observation_class: ObservationClass;
  confidence: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  glow: number;
  size: number;
  showWarningBadge: boolean;
  confidenceLabel: string;
  observationClassLabel: string;
}

export interface InteropEdgeVisual {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  observation_class: ObservationClass;
  confidence: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  glow: number;
  thickness: number;
  showWarningBadge: boolean;
  confidenceLabel: string;
  observationClassLabel: string;
}

export interface InteropGraphVisualPayload {
  nodes: InteropNodeVisual[];
  edges: InteropEdgeVisual[];
  built_at: string;
  freshness: string;
  contains_synthetic: boolean;
  layers: string[];
}

/**
 * Transform interop graph payload into visual props for rendering.
 * Use with any graph engine (Cytoscape, Three, SVG).
 */
export function transformInteropGraphToVisual(
  payload: InteropGraphPayload
): InteropGraphVisualPayload {
  const nodes: InteropNodeVisual[] = payload.nodes.map((n) => {
    const showWarning = shouldShowWarningBadge({
      observation_class: n.observation_class,
      confidence: n.confidence,
      freshness: n.freshness,
    });
    return {
      id: n.id,
      label: n.label,
      subtitle: n.subtitle,
      node_type: n.node_type,
      layer: n.layer,
      observation_class: n.observation_class,
      confidence: n.confidence,
      lineStyle: getLineStyle(n.observation_class),
      opacity: n.opacity ?? getOpacity(n.confidence),
      glow: n.glow ?? getGlow(n.health),
      size: n.size ?? 1,
      showWarningBadge: showWarning,
      confidenceLabel: getConfidenceLabel(n.confidence, n.observation_class),
      observationClassLabel: getObservationClassLabel(n.observation_class),
    };
  });

  const edges: InteropEdgeVisual[] = payload.edges.map((e) => {
    const showWarning = shouldShowWarningBadge({
      observation_class: e.observation_class,
      confidence: e.confidence,
      freshness: e.freshness,
    });
    return {
      id: e.id,
      source_id: e.source_id,
      target_id: e.target_id,
      edge_type: e.edge_type,
      observation_class: e.observation_class,
      confidence: e.confidence,
      lineStyle: getLineStyle(e.observation_class),
      opacity: e.opacity ?? getOpacity(e.confidence),
      glow: e.glow ?? getGlow(e.health),
      thickness: e.volume_normalized ?? e.thickness ?? 0.5,
      showWarningBadge: showWarning,
      confidenceLabel: getConfidenceLabel(e.confidence, e.observation_class),
      observationClassLabel: getObservationClassLabel(e.observation_class),
    };
  });

  return {
    nodes,
    edges,
    built_at: payload.built_at,
    freshness: payload.freshness,
    contains_synthetic: payload.contains_synthetic,
    layers: payload.layers ?? ['application', 'routing', 'settlement'],
  };
}
