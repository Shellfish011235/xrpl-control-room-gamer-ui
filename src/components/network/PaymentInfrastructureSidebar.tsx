/**
 * Sidebar detail panel for a selected Global Payment Infrastructure node.
 * Same metrics and styling as other Network tab selection panels: name, type, region, status,
 * monthly tx/value, connected networks, fiat/crypto/stablecoins/CBDCs, confidence, observation class, provenance, badges.
 */

import React from 'react';
import { X } from 'lucide-react';
import { ConfidenceBadge } from '../telemetry/ConfidenceBadge';
import { getObservationClassLabel } from '../../types/telemetry-visual-rules';
import type { PaymentInfraNodeLayout } from '../../types/payment-infrastructure';
import type { ObservationClass } from '../../types/telemetry-truth-model';

const NODE_TYPE_LABELS: Record<string, string> = {
  payment_hub: 'Payment hub',
  settlement_rail: 'Settlement rail',
  routing_protocol: 'Routing protocol',
  payment_processor: 'Payment processor',
  national_switch: 'National switch',
  interoperability_gateway: 'Interoperability gateway',
  asset_network: 'Asset network',
  cbdc_rail: 'CBDC rail',
};

function observationClassBadgeClass(obs: ObservationClass): string {
  switch (obs) {
    case 'observed':
      return 'border-cyber-green/50 text-cyber-green bg-cyber-green/10';
    case 'derived':
      return 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10';
    case 'inferred':
      return 'border-cyber-yellow/50 text-cyber-yellow bg-cyber-yellow/10';
    case 'synthetic':
      return 'border-cyber-orange/50 text-cyber-orange bg-cyber-orange/10';
    default:
      return 'border-cyber-muted/50 text-cyber-muted bg-cyber-muted/10';
  }
}

export interface PaymentInfrastructureSidebarProps {
  node: PaymentInfraNodeLayout;
  onClose: () => void;
}

export function PaymentInfrastructureSidebar({ node, onClose }: PaymentInfrastructureSidebarProps) {
  const typeLabel = NODE_TYPE_LABELS[node.type] ?? node.type;
  const monthlyTx = node.monthlyTransactions != null ? String(node.monthlyTransactions) : '—';
  const monthlyVal = node.monthlyValueUsd != null ? String(node.monthlyValueUsd) : '—';
  const obsLabel = getObservationClassLabel(node.observationClass);

  return (
    <div
      className="cyber-panel p-5 border border-cyber-glow/25 rounded-2xl"
      role="region"
      aria-label={`Details for ${node.name}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-cyber text-sm text-cyber-glow">SELECTED</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-cyber-glow/10 rounded transition-colors"
          aria-label="Close"
        >
          <X size={14} className="text-cyber-muted" />
        </button>
      </div>

      {/* Node name */}
      <h3 className="font-cyber text-lg text-cyber-text mb-1">{node.name}</h3>
      {/* Node type */}
      <p className="text-xs text-cyber-muted mb-0.5">{typeLabel}</p>
      {/* Region */}
      <p className="text-xs text-cyber-muted mb-2">Region: {node.region}</p>
      <p className="text-sm text-cyber-text mb-3">{node.description}</p>

      {/* Status + Observation class + Mock badges (same pattern as other network panels) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className={`px-2 py-1 rounded text-xs border ${
            node.status === 'active'
              ? 'border-cyber-green/50 text-cyber-green'
              : node.status === 'pilot'
                ? 'border-cyber-cyan/50 text-cyber-cyan'
                : 'border-cyber-muted/50 text-cyber-muted'
          }`}
        >
          {node.status}
        </span>
        <span className={`px-2 py-1 rounded text-xs border ${observationClassBadgeClass(node.observationClass)}`}>
          {obsLabel}
        </span>
        {node.isMock && (
          <span className="px-2 py-1 rounded text-xs border border-cyber-orange/50 text-cyber-orange bg-cyber-orange/10">
            Mock
          </span>
        )}
      </div>

      {/* Monthly transactions & value */}
      <section className="mb-4">
        <h4 className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider mb-2">
          Monthly activity
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
            <p className="font-cyber text-cyber-glow">{monthlyTx}</p>
            <p className="text-[10px] text-cyber-muted">Monthly transactions</p>
          </div>
          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
            <p className="font-cyber text-cyber-green">{monthlyVal}</p>
            <p className="text-[10px] text-cyber-muted">Monthly value (USD)</p>
          </div>
        </div>
        {node.trend && node.trend !== 'unknown' && (
          <p className="text-[10px] text-cyber-muted mt-1">Trend: {node.trend}</p>
        )}
      </section>

      {/* Connected networks */}
      <section className="mb-4">
        <h4 className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider mb-1.5">
          Connected networks
        </h4>
        {node.connectedNetworks && node.connectedNetworks.length > 0 ? (
          <ul className="text-xs text-cyber-text space-y-0.5">
            {node.connectedNetworks.map((id, i) => (
              <li key={i}>{id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-cyber-muted">—</p>
        )}
      </section>

      {/* Supported assets: fiat, crypto, stablecoins, CBDCs */}
      <section className="mb-4">
        <h4 className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider mb-1.5">
          Supported assets
        </h4>
        <div className="space-y-1.5 text-xs text-cyber-text">
          <div>
            <span className="text-cyber-muted">Fiat currencies: </span>
            {node.supportedFiatCurrencies?.length ? node.supportedFiatCurrencies.join(', ') : '—'}
          </div>
          <div>
            <span className="text-cyber-muted">Crypto assets: </span>
            {node.supportedCryptoAssets?.length ? node.supportedCryptoAssets.join(', ') : '—'}
          </div>
          <div>
            <span className="text-cyber-muted">Stablecoins: </span>
            {node.supportedStablecoins?.length ? node.supportedStablecoins.join(', ') : '—'}
          </div>
          <div>
            <span className="text-cyber-muted">CBDCs: </span>
            {node.supportedCBDCs?.length ? node.supportedCBDCs.join(', ') : '—'}
          </div>
        </div>
      </section>

      {/* Data quality: confidence, observation class, provenance */}
      <section>
        <h4 className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider mb-2">
          Data quality
        </h4>
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-cyber-muted mb-1">Confidence</p>
            <ConfidenceBadge
              confidence={node.confidence}
              observationClass={node.observationClass}
              showWarning={
                node.observationClass === 'inferred' ||
                node.observationClass === 'synthetic' ||
                node.observationClass === 'unknown' ||
                node.confidence < 50
              }
              compact
            />
          </div>
          <div>
            <p className="text-[10px] text-cyber-muted mb-1">Observation class</p>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] border ${observationClassBadgeClass(node.observationClass)}`}>
              {obsLabel}
            </span>
          </div>
          {node.provenance && (
            <div>
              <p className="text-[10px] text-cyber-muted mb-1">Provenance</p>
              <p className="text-xs text-cyber-text">{node.provenance}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
