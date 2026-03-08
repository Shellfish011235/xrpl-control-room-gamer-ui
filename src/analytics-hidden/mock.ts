/**
 * Hidden analytics — MOCK DATA for all 3 layers.
 * Clearly labeled as mock. TODO: Replace with real analytics pipeline.
 */

import type {
  HiddenAnalyticsPayload,
  RoutingSignal,
  LiquidityStressSignal,
  CorridorEmergenceSignal,
} from './types';

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

/** Mock AI Payment Routing signals */
const MOCK_AI_ROUTING: RoutingSignal[] = [
  {
    id: 'ar-mock-1',
    entity_type: 'wallet_cluster',
    entity_id: 'cluster-demo',
    score: 72,
    metrics: {
      cadence_regularity: 0.85,
      burst_score: 0.6,
      timing_variance_score: 0.9,
      automation_consistency: 0.7,
      cluster_score: 0.75,
      corridor_automation_score: 0.65,
    },
    anomaly_tags: ['repeating_cadence', 'high_timing_regularity', 'machine_wallet_cluster'],
    observation_class: 'inferred',
    confidence: 55,
    provenance: prov('inferred', 55, 'Pattern from mock data; not observed payment stream'),
    freshness: 'recent',
    explanation: 'Inferred from timing patterns. Do not treat as confirmed machine behavior.',
  },
  {
    id: 'ar-mock-2',
    entity_type: 'corridor',
    entity_id: 'corridor-xrpl-usd',
    score: 58,
    metrics: {
      corridor_automation_score: 0.58,
      automation_consistency: 0.5,
    },
    anomaly_tags: ['automated_corridor_usage'],
    observation_class: 'derived',
    confidence: 62,
    provenance: prov('derived', 62, 'Aggregated from mock quote/settlement samples'),
    freshness: 'recent',
    explanation: 'Derived from mock corridor stats. Real pipeline would use observed quotes.',
  },
];

/** Mock Liquidity Stress signals */
const MOCK_LIQUIDITY_STRESS: LiquidityStressSignal[] = [
  {
    id: 'ls-mock-1',
    entity_type: 'corridor',
    entity_id: 'corridor-xrpl-mexico',
    severity: 'medium',
    stress_score: 65,
    metrics: {
      quote_latency_trend: 'rising',
      quote_latency_p50_ms: 180,
      quote_latency_p99_ms: 1200,
      failure_rate: 0.08,
      quote_variance_trend: 'widening',
      concentration_risk: 0.7,
      route_redundancy: 0.3,
      retry_rate: 0.12,
      settlement_delay_spikes: 3,
    },
    anomaly_tags: ['rising_latency', 'widening_variance', 'concentration_risk', 'settlement_delays'],
    observation_class: 'derived',
    confidence: 60,
    provenance: prov('derived', 60, 'Mock metrics; real data would use observed quotes and settlements'),
    freshness: 'recent',
    triggered_thresholds: ['quote_latency_p99 > 1000', 'failure_rate > 0.05'],
    explanation: 'Mock stress signal. Thresholds illustrative only.',
  },
];

/** Mock Corridor Emergence signals */
const MOCK_CORRIDOR_EMERGENCE: CorridorEmergenceSignal[] = [
  {
    id: 'ce-mock-1',
    entity_type: 'corridor',
    entity_id: 'corridor-new-brl',
    emergence_score: 68,
    metrics: {
      new_asset_pair_score: 0.7,
      new_region_pattern_score: 0.65,
      traffic_acceleration: 0.6,
      new_rail_combination_score: 0.5,
    },
    anomaly_tags: ['new_asset_pair', 'traffic_acceleration'],
    observation_class: 'inferred',
    confidence: 48,
    provenance: prov('inferred', 48, 'Inferred from mock activity; no direct corridor disclosure'),
    freshness: 'recent',
    first_observed_at: NOW,
    explanation: 'Inferred emergence. Do not treat as confirmed new corridor.',
  },
];

/** Full mock payload for hidden analytics API */
export const MOCK_HIDDEN_ANALYTICS_PAYLOAD: HiddenAnalyticsPayload = {
  ai_routing_signals: MOCK_AI_ROUTING,
  liquidity_stress_signals: MOCK_LIQUIDITY_STRESS,
  corridor_emergence_signals: MOCK_CORRIDOR_EMERGENCE,
  built_at: NOW,
  freshness: 'recent',
  contains_synthetic: true,
  anomalies: [
    { id: 'mock-anom-1', message: 'Data is mock. No live analytics pipeline connected.', severity: 'low' },
  ],
};

export function isMockHiddenPayload(payload: HiddenAnalyticsPayload): boolean {
  return (
    payload.anomalies?.some((a) => a.message?.toLowerCase().includes('mock')) ?? false
  ) || (payload.ai_routing_signals?.some((s) => s.provenance?.source_ids?.includes('mock')) ?? false);
}
