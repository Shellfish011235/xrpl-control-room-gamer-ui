/**
 * Transforms raw payment infrastructure nodes/edges into layout positions for the map.
 * Deterministic layout by node type (rings); no external layout engine required.
 */

import type { PaymentInfraNode, PaymentInfraEdge, PaymentInfraNodeLayout, PaymentInfraEdgeLayout } from '../types/payment-infrastructure';
import { opacityFromConfidence } from '../types/telemetry-visual-rules';

const VIEWBOX = { w: 800, h: 500 };
const CENTER = { x: VIEWBOX.w / 2, y: VIEWBOX.h / 2 };
const SCALE = 2.6;

// Ring radii by node type (topology coords ~ -80..80)
const RING_BY_TYPE: Record<string, number> = {
  settlement_rail: 55,
  asset_network: 45,
  interoperability_gateway: 35,
  national_switch: 25,
  routing_protocol: 55,
  payment_processor: 35,
  cbdc_rail: 40,
  payment_hub: 30,
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
 * Assign positions to nodes (by type ring, then spread by index) and enrich edges with opacity.
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
  const order: Array<{ type: string; radius: number }> = [];
  Object.entries(RING_BY_TYPE).forEach(([type, radius]) => {
    const list = byType[type];
    if (list?.length) order.push({ type, radius });
  });

  order.forEach(({ type, radius }) => {
    const list = byType[type] ?? [];
    const n = list.length;
    list.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      nodePositions.set(node.id, { x, y });
    });
  });

  // Any unassigned (fallback radius)
  nodes.forEach((node, i) => {
    if (!nodePositions.has(node.id)) {
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2;
      nodePositions.set(node.id, { x: 40 * Math.cos(angle), y: 40 * Math.sin(angle) });
    }
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
