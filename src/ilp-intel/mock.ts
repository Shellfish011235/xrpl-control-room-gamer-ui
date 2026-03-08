/**
 * ILP Intelligence — MOCK DATA (Stage 1 + Stage 2).
 * Clearly labeled as mock; do not use for production decisions.
 * TODO: Replace with real API/connector data when backend is available.
 */

import type { ILPIntelPayload } from './types';

const NOW = new Date().toISOString();

function prov(
  observation_class: 'observed' | 'derived' | 'inferred' | 'synthetic' | 'unknown',
  confidence: number,
  explanation?: string
) {
  return {
    observation_class,
    confidence,
    source_ids: ['mock'],
    observed_at: NOW,
    explanation,
  };
}

/** Mock payload for ILP Intelligence panel. Every entity is mock — confidence and labels reflect that. */
export const MOCK_ILP_INTEL_PAYLOAD: ILPIntelPayload = {
  built_at: NOW,
  freshness: 'live',
  contains_synthetic: true,
  anomalies: [
    { id: 'mock-1', message: 'Data is mock. No live connector or probe data.', severity: 'low' },
  ],
  connectors: [
    {
      id: 'conn-rafiki-xrpl-eth',
      label: 'Rafiki XRPL↔ETH',
      operator: 'Rafiki',
      from_ledger_id: 'xrpl',
      to_ledger_id: 'eth',
      asset_pairs: [{ from_asset: 'XRP', to_asset: 'ETH' }],
      observation_class: 'inferred',
      confidence: 55,
      provenance: prov('inferred', 55, 'From public registry; not directly observed'),
      health: 'unknown',
      freshness: 'stale',
      is_probe_derived: false,
    },
    {
      id: 'conn-demo-1',
      label: 'Demo connector (testnet)',
      operator: 'Demo',
      observation_class: 'synthetic',
      confidence: 40,
      provenance: prov('synthetic', 40, 'Testnet / demo only'),
      health: 'up',
      freshness: 'recent',
      is_probe_derived: true,
    },
  ],
  rafiki_nodes: [
    {
      id: 'rafiki-1',
      node_kind: 'rafiki',
      label: 'Rafiki reference',
      subtitle: 'interledger/rafiki',
      observation_class: 'observed',
      confidence: 90,
      provenance: prov('observed', 90, 'Documentation / repo metadata'),
      health: 'unknown',
      freshness: 'recent',
      version: '1.x',
      open_payments_url: 'https://rafiki.dev',
    },
  ],
  open_payments_providers: [
    {
      id: 'op-demo',
      node_kind: 'open_payments',
      label: 'Open Payments demo',
      subtitle: '$demo.rafiki.dev',
      observation_class: 'inferred',
      confidence: 50,
      provenance: prov('inferred', 50, 'Documentation; not verified live'),
      health: 'unknown',
      freshness: 'stale',
      payment_pointer: '$demo.rafiki.dev',
      provider_url: 'https://rafiki.dev',
    },
  ],
  wallet_providers: [
    {
      id: 'wp-1',
      node_kind: 'wallet_provider',
      label: 'Wallet (Rafiki-based)',
      observation_class: 'inferred',
      confidence: 45,
      provenance: prov('inferred', 45, 'Assumed from ecosystem docs'),
      health: 'unknown',
      freshness: 'unknown',
      provider_name: 'Rafiki wallet',
    },
  ],
  quote_latency: [
    {
      id: 'ql-1',
      connector_id: 'conn-demo-1',
      latency_ms: 120,
      observed_at: NOW,
      observation_class: 'synthetic',
      confidence: 40,
      provenance: prov('synthetic', 40, 'Probe-only; not production traffic'),
      is_synthetic: true,
    },
  ],
  route_health: [
    {
      id: 'rh-1',
      route_id: 'route-demo-xrpl-eth',
      connector_ids: ['conn-demo-1'],
      health: 'up',
      success_rate: 1,
      last_success_at: NOW,
      observed_at: NOW,
      observation_class: 'synthetic',
      confidence: 40,
      provenance: prov('synthetic', 40, 'Probe-derived route health'),
      is_synthetic: true,
    },
  ],
  connector_liveness: [
    {
      id: 'cl-1',
      connector_id: 'conn-demo-1',
      status: 'up',
      latency_ms: 45,
      observed_at: NOW,
      observation_class: 'synthetic',
      confidence: 40,
      provenance: prov('synthetic', 40, 'Probe liveness check'),
      is_synthetic: true,
    },
  ],
};

/** Type guard / marker: payload is mock (for UI to show disclaimer). */
export function isMockPayload(payload: ILPIntelPayload): boolean {
  return (
    payload.connectors.some((c) => c.provenance?.source_ids?.includes('mock')) ||
    payload.anomalies?.some((a) => a.message?.includes('mock'))
  ) ?? false;
}
