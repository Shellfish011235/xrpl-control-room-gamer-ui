/**
 * Vercel serverless: GET /api/ilp/graph
 * Returns ILP graph payload (nodes, edges, confidence, freshness).
 * Without DB: returns mock. With DB: query connectors/corridors/ledgers and build payload.
 */

interface ILPGraphApiResponse {
  ok: boolean;
  payload?: {
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      subtitle?: string;
      data_class: string;
      confidence: number;
      status?: string;
      glow?: number;
      metadata?: Record<string, unknown>;
    }>;
    edges: Array<{
      id: string;
      source_id: string;
      target_id: string;
      corridor_id?: string;
      connector_id?: string;
      data_class: string;
      confidence: number;
      direction: string;
      thickness: number;
      glow: number;
      failure_heat?: number;
      from_asset?: string;
      to_asset?: string;
      volume_24h_usd?: number;
    }>;
    built_at: string;
    freshness: string;
    contains_synthetic: boolean;
  };
  error?: string;
  from_cache?: boolean;
}

function getGraphPayload(): ILPGraphApiResponse {
  const now = new Date().toISOString();
  return {
    ok: true,
    from_cache: false,
    payload: {
      nodes: [
        { id: 'xrpl', type: 'ledger', label: 'XRPL', subtitle: 'XRP', data_class: 'observed', confidence: 95 },
        { id: 'eth', type: 'ledger', label: 'Ethereum', subtitle: 'ETH', data_class: 'observed', confidence: 92 },
        { id: 'rafiki-xrpl-eth', type: 'connector', label: 'Rafiki XRPL↔ETH', data_class: 'observed', confidence: 88, status: 'up', glow: 1 },
      ],
      edges: [
        { id: 'cor-xrpl-eth', source_id: 'xrpl', target_id: 'eth', connector_id: 'rafiki-xrpl-eth', data_class: 'observed', confidence: 85, direction: 'bidirectional', thickness: 0.8, glow: 1, from_asset: 'XRP', to_asset: 'ETH', volume_24h_usd: 45000 },
      ],
      built_at: now,
      freshness: 'live',
      contains_synthetic: false,
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

    const url = new URL(request.url);
    const useCache = url.searchParams.get('cache') !== 'no';
    const cacheMaxAge = useCache ? 60 : 0; // 60s when caching

    try {
      const body: ILPGraphApiResponse = getGraphPayload();
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': cacheMaxAge ? `public, max-age=${cacheMaxAge}` : 'no-store',
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: e instanceof Error ? e.message : 'Internal error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
