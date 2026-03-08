/**
 * GET /api/analytics/hidden
 * Returns hidden analytics payload (AI routing, liquidity stress, corridor emergence).
 * Without backend: returns mock. TODO: Connect to real analytics pipeline.
 */

interface HiddenAnalyticsApiResponse {
  ok: boolean;
  payload?: {
    ai_routing_signals: unknown[];
    liquidity_stress_signals: unknown[];
    corridor_emergence_signals: unknown[];
    built_at: string;
    freshness: string;
    contains_synthetic: boolean;
    anomalies: Array<{ id: string; message: string; severity: string }>;
  };
  error?: string;
  from_mock?: boolean;
}

function getPayload(): HiddenAnalyticsApiResponse {
  const now = new Date().toISOString();
  const prov = (oc: string, c: number, exp?: string) => ({
    observation_class: oc,
    confidence: c,
    source_ids: ['mock'],
    observed_at: now,
    explanation: exp,
  });
  return {
    ok: true,
    from_mock: true,
    payload: {
      built_at: now,
      freshness: 'recent',
      contains_synthetic: true,
      anomalies: [
        { id: 'mock-1', message: 'Data is mock. No live analytics pipeline connected.', severity: 'low' },
      ],
      ai_routing_signals: [
        {
          id: 'ar-mock-1',
          entity_type: 'wallet_cluster',
          entity_id: 'cluster-demo',
          score: 72,
          metrics: { cadence_regularity: 0.85, burst_score: 0.6, timing_variance_score: 0.9 },
          anomaly_tags: ['repeating_cadence', 'high_timing_regularity', 'machine_wallet_cluster'],
          observation_class: 'inferred',
          confidence: 55,
          provenance: prov('inferred', 55, 'Pattern from mock data'),
          freshness: 'recent',
          explanation: 'Inferred from timing patterns. Do not treat as confirmed machine behavior.',
        },
      ],
      liquidity_stress_signals: [
        {
          id: 'ls-mock-1',
          entity_type: 'corridor',
          entity_id: 'corridor-xrpl-mexico',
          severity: 'medium',
          stress_score: 65,
          metrics: { quote_latency_trend: 'rising', failure_rate: 0.08, concentration_risk: 0.7 },
          anomaly_tags: ['rising_latency', 'concentration_risk', 'settlement_delays'],
          observation_class: 'derived',
          confidence: 60,
          provenance: prov('derived', 60, 'Mock metrics'),
          freshness: 'recent',
          explanation: 'Mock stress signal.',
        },
      ],
      corridor_emergence_signals: [
        {
          id: 'ce-mock-1',
          entity_type: 'corridor',
          entity_id: 'corridor-new-brl',
          emergence_score: 68,
          metrics: { new_asset_pair_score: 0.7, traffic_acceleration: 0.6 },
          anomaly_tags: ['new_asset_pair', 'traffic_acceleration'],
          observation_class: 'inferred',
          confidence: 48,
          provenance: prov('inferred', 48, 'Inferred from mock activity'),
          freshness: 'recent',
          explanation: 'Inferred emergence. Do not treat as confirmed new corridor.',
        },
      ],
    },
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    try {
      const body = getPayload();
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
