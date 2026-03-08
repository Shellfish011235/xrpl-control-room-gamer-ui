/**
 * Vercel serverless: GET /api/ilp/intel
 * Returns ILP Intelligence payload (Stage 1 metadata + Stage 2 routing metrics).
 * Without backend: returns mock. TODO: Connect to real connector/probe data.
 */

interface ILPIntelApiResponse {
  ok: boolean;
  payload?: {
    connectors: Array<{
      id: string;
      label: string;
      operator?: string;
      observation_class: string;
      confidence: number;
      provenance: { observation_class: string; confidence: number; source_ids: string[]; observed_at: string; explanation?: string };
      health: string;
      freshness: string;
      is_probe_derived?: boolean;
    }>;
    rafiki_nodes: Array<{
      id: string;
      node_kind: string;
      label: string;
      subtitle?: string;
      observation_class: string;
      confidence: number;
      health: string;
      freshness: string;
      version?: string;
      open_payments_url?: string;
    }>;
    open_payments_providers: Array<{
      id: string;
      node_kind: string;
      label: string;
      observation_class: string;
      confidence: number;
      health: string;
      freshness: string;
      payment_pointer?: string;
      provider_url?: string;
    }>;
    wallet_providers?: Array<{
      id: string;
      node_kind: string;
      label: string;
      observation_class: string;
      confidence: number;
      health: string;
      freshness: string;
      provider_name?: string;
    }>;
    quote_latency: Array<{
      id: string;
      connector_id?: string;
      latency_ms: number;
      observed_at: string;
      observation_class: string;
      confidence: number;
      is_synthetic: boolean;
    }>;
    route_health: Array<{
      id: string;
      route_id: string;
      connector_ids: string[];
      health: string;
      success_rate?: number;
      observed_at: string;
      observation_class: string;
      confidence: number;
      is_synthetic: boolean;
    }>;
    connector_liveness: Array<{
      id: string;
      connector_id: string;
      status: string;
      latency_ms?: number;
      observed_at: string;
      observation_class: string;
      confidence: number;
      is_synthetic: boolean;
    }>;
    built_at: string;
    freshness: string;
    contains_synthetic: boolean;
    anomalies: Array<{ id: string; message: string; severity: string }>;
  };
  error?: string;
  from_mock?: boolean;
}

function getIntelPayload(): ILPIntelApiResponse {
  const now = new Date().toISOString();
  const prov = (oc: string, conf: number, exp?: string) => ({
    observation_class: oc,
    confidence: conf,
    source_ids: ['mock'],
    observed_at: now,
    explanation: exp,
  });
  return {
    ok: true,
    from_mock: true,
    payload: {
      built_at: now,
      freshness: 'live',
      contains_synthetic: true,
      anomalies: [{ id: 'mock-1', message: 'Data is mock. No live connector or probe data.', severity: 'low' }],
      connectors: [
        {
          id: 'conn-rafiki-xrpl-eth',
          label: 'Rafiki XRPL↔ETH',
          operator: 'Rafiki',
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
          observation_class: 'inferred',
          confidence: 50,
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
          observed_at: now,
          observation_class: 'synthetic',
          confidence: 40,
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
          observed_at: now,
          observation_class: 'synthetic',
          confidence: 40,
          is_synthetic: true,
        },
      ],
      connector_liveness: [
        {
          id: 'cl-1',
          connector_id: 'conn-demo-1',
          status: 'up',
          latency_ms: 45,
          observed_at: now,
          observation_class: 'synthetic',
          confidence: 40,
          is_synthetic: true,
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
      const body = getIntelPayload();
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
