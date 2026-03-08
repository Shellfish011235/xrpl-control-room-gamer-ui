/**
 * Frontend renderer strategy: one graph engine for all three maps.
 * Consumes UnifiedMapPayload (validator | connector | payment_corridor) and returns
 * visual props per node/edge so any graph lib (Cytoscape, Three, SVG) can render consistently.
 */

import type { BaseNode, BaseEdge } from '../types/telemetry-truth-model';
import type { UnifiedMapPayload } from '../types/telemetry-maps';
import {
  lineStyleFromObservationClass,
  opacityFromConfidence,
  glowFromHealth,
  shouldShowWarningBadge,
  getConfidenceLabel,
  getObservationClassLabel,
  buildTooltipSections,
  paymentCorridorEdgeLabel,
  type TooltipSection,
} from '../types/telemetry-visual-rules';

// ==================== VISUAL PROPS (graph-engine-agnostic) ====================

export interface NodeVisualProps {
  id: string;
  label: string;
  subtitle?: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  glow: number;
  size: number;
  showWarningBadge: boolean;
  confidenceLabel: string;
  observationClassLabel: string;
  tooltipSections: TooltipSection[];
  /** Map-specific: e.g. unl_confirmed, xrpl_confirmed */
  meta: Record<string, unknown>;
}

export interface EdgeVisualProps {
  id: string;
  source_id: string;
  target_id: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  glow: number;
  thickness: number;
  showWarningBadge: boolean;
  confidenceLabel: string;
  observationClassLabel: string;
  tooltipSections: TooltipSection[];
  /** Honest short label for payment corridors */
  edgeLabel?: string;
  meta: Record<string, unknown>;
}

// ==================== RENDERER ====================

export function nodeToVisualProps(
  node: BaseNode,
  anomalyMessages: Record<string, string> = {}
): NodeVisualProps {
  const lineStyle = lineStyleFromObservationClass(node.observation_class);
  const opacity = node.opacity ?? opacityFromConfidence(node.confidence);
  const glow = node.glow ?? glowFromHealth(node.health);
  const tooltipSections = buildTooltipSections(node, {
    includeProvenance: true,
    includeAnomalies: true,
    anomalyMessages,
  });
  const meta: Record<string, unknown> = { ...node.metadata };
  if ('unl_confirmed' in node) meta.unl_confirmed = (node as { unl_confirmed?: boolean }).unl_confirmed;
  if ('on_ledger_visible' in node) meta.on_ledger_visible = (node as { on_ledger_visible?: boolean }).on_ledger_visible;
  if ('xrpl_confirmed' in node) meta.xrpl_confirmed = (node as { xrpl_confirmed?: boolean }).xrpl_confirmed;

  return {
    id: node.id,
    label: node.label,
    subtitle: node.subtitle,
    lineStyle,
    opacity,
    glow,
    size: node.size ?? 1,
    showWarningBadge: shouldShowWarningBadge(node),
    confidenceLabel: getConfidenceLabel(node.confidence, node.observation_class),
    observationClassLabel: getObservationClassLabel(node.observation_class),
    tooltipSections,
    meta,
  };
}

export function edgeToVisualProps(
  edge: BaseEdge,
  anomalyMessages: Record<string, string> = {}
): EdgeVisualProps {
  const lineStyle = lineStyleFromObservationClass(edge.observation_class);
  const opacity = edge.opacity ?? opacityFromConfidence(edge.confidence);
  const glow = edge.glow ?? glowFromHealth(edge.health);
  const tooltipSections = buildTooltipSections(edge, {
    includeProvenance: true,
    includeAnomalies: true,
    anomalyMessages,
  });
  const meta: Record<string, unknown> = { ...edge.metadata };
  let edgeLabel: string | undefined;
  if ('relationship_type' in edge && 'xrpl_confirmed' in edge) {
    edgeLabel = paymentCorridorEdgeLabel(
      (edge as { xrpl_confirmed: boolean }).xrpl_confirmed,
      edge.observation_class
    );
  }
  if ('unl_confirmed' in edge) meta.unl_confirmed = (edge as { unl_confirmed?: boolean }).unl_confirmed;
  if ('xrpl_confirmed' in edge) meta.xrpl_confirmed = (edge as { xrpl_confirmed?: boolean }).xrpl_confirmed;

  return {
    id: edge.id,
    source_id: edge.source_id,
    target_id: edge.target_id,
    lineStyle,
    opacity,
    glow,
    thickness: edge.thickness,
    showWarningBadge: shouldShowWarningBadge(edge),
    confidenceLabel: getConfidenceLabel(edge.confidence, edge.observation_class),
    observationClassLabel: getObservationClassLabel(edge.observation_class),
    tooltipSections,
    edgeLabel,
    meta,
  };
}

/** Build anomaly id -> message map from payload */
export function anomalyMessageMap(payload: UnifiedMapPayload): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of payload.anomalies) {
    out[a.id] = a.message;
  }
  return out;
}

/**
 * One graph engine entry point: take any UnifiedMapPayload and return visual props for all nodes and edges.
 */
export function payloadToVisualProps(payload: UnifiedMapPayload): {
  nodes: NodeVisualProps[];
  edges: EdgeVisualProps[];
  anomalyMessages: Record<string, string>;
  contains_synthetic: boolean;
  freshness: string;
} {
  const anomalyMessages = anomalyMessageMap(payload);
  const nodes = payload.nodes.map((n) => nodeToVisualProps(n, anomalyMessages));
  const edges = payload.edges.map((e) => edgeToVisualProps(e, anomalyMessages));
  return {
    nodes,
    edges,
    anomalyMessages,
    contains_synthetic: payload.contains_synthetic,
    freshness: payload.freshness,
  };
}
