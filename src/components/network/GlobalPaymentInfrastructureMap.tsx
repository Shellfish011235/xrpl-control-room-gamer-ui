/**
 * Global Payment Infrastructure map – graph of hubs, rails, and assets.
 * Reuses visual rules: solid = observed, dashed = inferred, dotted = synthetic; opacity = confidence.
 */

import React, { useMemo } from 'react';
import { getGlobalPaymentInfrastructureData } from '../../data/globalPaymentInfrastructureData';
import { transformPaymentInfrastructureGraph } from '../../data/globalPaymentInfrastructureTransform';
import { lineStyleFromObservationClass } from '../../types/telemetry-visual-rules';
import type { PaymentInfraNodeLayout, PaymentInfraEdgeLayout, PaymentInfraNodeType } from '../../types/payment-infrastructure';

const NODE_COLORS: Record<PaymentInfraNodeType, string> = {
  payment_hub: '#00d4ff',
  settlement_rail: '#00ff88',
  routing_protocol: '#a855f7',
  payment_processor: '#14b8a6',
  national_switch: '#ffd700',
  interoperability_gateway: '#00ffff',
  asset_network: '#f97316',
  cbdc_rail: '#6366f1',
};

const EDGE_COLOR = 'rgba(0, 212, 255, 0.7)';

export interface GlobalPaymentInfrastructureMapProps {
  onSelectNode: (node: PaymentInfraNodeLayout | null) => void;
  selectedNodeId: string | null;
}

export function GlobalPaymentInfrastructureMap({
  onSelectNode,
  selectedNodeId,
}: GlobalPaymentInfrastructureMapProps) {
  const { nodes, edges, viewBox } = useMemo(() => {
    const { nodes: n, edges: e } = getGlobalPaymentInfrastructureData();
    return transformPaymentInfrastructureGraph(n, e);
  }, []);

  const nodeById = useMemo(() => {
    const m: Record<string, PaymentInfraNodeLayout> = {};
    nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const getStrokeDasharray = (obsClass: PaymentInfraEdgeLayout['observationClass']) => {
    const style = lineStyleFromObservationClass(obsClass);
    if (style === 'dashed') return '8,4';
    if (style === 'dotted') return '2,3';
    return undefined;
  };

  return (
    <div className="rounded-xl border border-cyber-border/50 bg-cyber-darker/30 overflow-visible">
      <svg
        width="100%"
        height="480"
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="bg-cyber-darker/50 rounded overflow-visible"
      >
        <defs>
          <pattern id="gpi-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={viewBox.w} height={viewBox.h} fill="url(#gpi-grid)" opacity="0.3" />

        {/* Edges */}
        <g aria-hidden>
          {edges.map((edge) => {
            const from = nodeById[edge.source];
            const to = nodeById[edge.target];
            if (!from || !to) return null;
            const opacity = edge.opacity ?? 0.6;
            const dash = getStrokeDasharray(edge.observationClass);
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={EDGE_COLOR}
                strokeWidth={1 + (edge.volumeWeight ?? 0.5)}
                strokeOpacity={opacity}
                strokeDasharray={dash}
                fill="none"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g aria-hidden>
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const color = NODE_COLORS[node.type] ?? '#888';
            const opacity = Math.max(0.5, node.confidence / 100);
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectNode(isSelected ? null : node)}
                role="button"
                tabIndex={0}
                aria-label={`${node.name}, ${node.type}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNode(isSelected ? null : node);
                  }
                }}
              >
                <circle
                  r={isSelected ? 14 : 12}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={isSelected ? 3 : 1}
                />
                <text
                  y={22}
                  textAnchor="middle"
                  fill="#e0e0e0"
                  fontSize={9}
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.name.length > 10 ? node.name.slice(0, 9) + '…' : node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
