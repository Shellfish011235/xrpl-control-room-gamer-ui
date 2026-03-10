/**
 * Legend for Global Payment Infrastructure map: node types, edge certainty, mock disclaimer.
 */

import React from 'react';
import type { PaymentInfraNodeType } from '../../types/payment-infrastructure';

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

const NODE_LABELS: Record<PaymentInfraNodeType, string> = {
  payment_hub: 'Payment hub',
  settlement_rail: 'Settlement rail',
  routing_protocol: 'Routing protocol',
  payment_processor: 'Payment processor',
  national_switch: 'National switch',
  interoperability_gateway: 'Interop gateway',
  asset_network: 'Asset network',
  cbdc_rail: 'CBDC rail',
};

export function PaymentInfrastructureLegend() {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider">Node types</p>
      <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
        {(Object.keys(NODE_COLORS) as PaymentInfraNodeType[]).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: NODE_COLORS[type] }}
            />
            <span className="text-[10px] text-cyber-muted">{NODE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-cyber-border/60">
        <p className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider mb-2">Edge certainty</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-cyber-green" />
            <span className="text-[10px] text-cyber-muted">Observed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-px border-t-2 border-cyber-yellow border-dashed" />
            <span className="text-[10px] text-cyber-muted">Inferred</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-px border-t border-cyber-muted border-dotted" />
            <span className="text-[10px] text-cyber-muted">Synthetic / mock</span>
          </div>
        </div>
        <p className="text-[9px] text-cyber-muted mt-2">Opacity = confidence</p>
      </div>

      <div className="pt-2 border-t border-cyber-border/40">
        <p className="text-[9px] text-cyber-orange italic">
          Mock and inferred data are labeled. Do not treat as authoritative.
        </p>
      </div>
    </div>
  );
}
