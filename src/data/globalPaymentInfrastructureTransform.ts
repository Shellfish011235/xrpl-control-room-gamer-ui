/**
 * Transforms raw payment infrastructure nodes/edges into layout positions for the map.
 * Uses concentric-ring layout consistent with UnifiedNetworkTopology and ConnectorMap:
 * one ring per node type, generous radii, even angular spread to avoid overlapping nodes.
 */

import type {
  PaymentInfraNode,
  PaymentInfraEdge,
  PaymentInfraNodeLayout,
  PaymentInfraEdgeLayout,
} from '../types/payment-infrastructure';
import { opacityFromConfidence } from '../types/telemetry-visual-rules';

const VIEWBOX = { w: 800, h: 480 };
const CENTER = { x: VIEWBOX.w / 2, y: VIEWBOX.h / 2 };
/** Scale from topology coords to SVG; same pattern as ConnectorMap (scale ~3.8) and UnifiedTopology */
const SCALE = 3.2;

/**
 * Single radius per node type so types don't share a ring and overlap.
 * Order: inner (national/cbdc) → middle (interop, routing, assets) → outer (settlement rails).
 * Spacing ~10 topology units between rings so nodes don't overlap across rings.
 */
const RADIUS_BY_TYPE: Record<string, number> = {
  national_switch: 18,
  cbdc_rail: 28,
  payment_hub: 32,
  interoperability_gateway: 38,
  payment_processor: 42,
  routing_protocol: 46,
  asset_network: 52,
  settlement_rail: 60,
};

function toSvg(x: number, y: number): { x: number; y: number } {
  return {
    x: CENTER.x + x * SCALE,
    y: CENTER.y - y * SCALE,
  };
}

export interface TransformResult {
  nodes: PaymentInfraNodeLayout[];
  edges: PaymentInfraEdgeLayout[];
  viewBox: { w: number; h: number };
}

/**
 * Assign positions: one ring per node type, nodes spread evenly by angle (no overlap on same ring).
 * Unassigned types get a fallback ring.
 */
export function transformPaymentInfrastructureGraph(
  nodes: PaymentInfraNode[],
  edges: PaymentInfraEdge[]
): TransformResult {
  const byType: Record<string, PaymentInfraNode[]> = {};
  nodes.forEach((n) => {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  });

  const nodePositions = new Map<string, { x: number; y: number }>();

  Object.entries(RADIUS_BY_TYPE).forEach(([type, radius]) => {
    const list = byType[type];
    if (!list?.length) return;
    const n = list.length;
    list.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      nodePositions.set(node.id, { x, y });
    });
  });

  const unassigned = nodes.filter((n) => !nodePositions.has(n.id));
  unassigned.forEach((node, i) => {
    const n = unassigned.length;
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    nodePositions.set(node.id, {
      x: 40 * Math.cos(angle),
      y: 40 * Math.sin(angle),
    });
  });

  const layoutNodes: PaymentInfraNodeLayout[] = nodes.map((node) => {
    const pos = nodePositions.get(node.id)!;
    const svg = toSvg(pos.x, pos.y);
    return { ...node, x: svg.x, y: svg.y };
  });

  const layoutEdges: PaymentInfraEdgeLayout[] = edges.map((edge) => ({
    ...edge,
    opacity: opacityFromConfidence(edge.confidence),
  }));

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    viewBox: VIEWBOX,
  };
}
