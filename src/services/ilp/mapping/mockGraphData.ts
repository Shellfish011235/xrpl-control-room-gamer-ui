/**
 * ILP Mapping — Mock data for dashboard development
 * Clearly labeled observed/derived/inferred; includes synthetic probe data.
 */

import type { ILPGraphPayload, ILPGraphApiResponse } from './graphPayload';
import type { Connector, Corridor, Ledger } from './canonical';
import { toGraphPayload } from './toGraphPayload';

const NOW = new Date().toISOString();

function prov(class_: 'observed' | 'derived' | 'inferred' | 'unknown', confidence: number, explanation?: string) {
  return {
    class: class_ as 'observed' | 'derived' | 'inferred' | 'unknown',
    confidence,
    source_ids: ['mock'],
    observed_at: NOW,
    explanation,
  };
}

export const mockLedgers: Ledger[] = [
  { id: 'xrpl', name: 'XRPL', symbol: 'XRP', type: 'public', native_asset_id: 'XRP', provenance: prov('observed', 95), finality_seconds: 4 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', type: 'public', native_asset_id: 'ETH', provenance: prov('observed', 92), finality_seconds: 900 },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', type: 'public', native_asset_id: 'MATIC', provenance: prov('derived', 78), finality_seconds: 2 },
];

export const mockConnectors: Connector[] = [
  {
    id: 'rafiki-xrpl-eth',
    name: 'Rafiki XRPL↔ETH',
    from_ledger_id: 'xrpl',
    to_ledger_id: 'eth',
    asset_pairs: [{ from_asset: 'XRP', to_asset: 'ETH', rate: 0.0002, spread_bps: 30 }],
    liquidity_status: 'live',
    liquidity_depth_usd: 150_000,
    settlement_mechanism: 'api',
    operator: 'Rafiki',
    fee_bps: 50,
    uptime_percent: 99.5,
    last_active_at: NOW,
    provenance: prov('observed', 88, 'Connector API + ledger confirmations'),
  },
  {
    id: 'conn-polygon-xrpl',
    name: 'Polygon–XRPL Bridge',
    from_ledger_id: 'polygon',
    to_ledger_id: 'xrpl',
    asset_pairs: [{ from_asset: 'MATIC', to_asset: 'XRP' }, { from_asset: 'USDC', to_asset: 'XRP' }],
    liquidity_status: 'live',
    liquidity_depth_usd: 80_000,
    settlement_mechanism: 'bridge',
    operator: 'Unknown',
    provenance: prov('inferred', 55, 'Inferred from pathfinding responses'),
  },
];

export const mockCorridors: Corridor[] = [
  {
    id: 'cor-xrpl-eth',
    connector_id: 'rafiki-xrpl-eth',
    from_ledger_id: 'xrpl',
    to_ledger_id: 'eth',
    from_asset: 'XRP',
    to_asset: 'ETH',
    status: 'active',
    volume_24h_usd: 45_000,
    tx_count_24h: 120,
    avg_settlement_time_ms: 8000,
    success_rate: 0.98,
    bidirectional: true,
    provenance: prov('observed', 85),
  },
  {
    id: 'cor-polygon-xrpl',
    connector_id: 'conn-polygon-xrpl',
    from_ledger_id: 'polygon',
    to_ledger_id: 'xrpl',
    from_asset: 'USDC',
    to_asset: 'XRP',
    status: 'active',
    volume_24h_usd: 12_000,
    tx_count_24h: 40,
    bidirectional: true,
    provenance: prov('inferred', 50),
  },
];

/** Build mock graph payload (no DB). */
export function buildMockGraphPayload(): ILPGraphPayload {
  return toGraphPayload({
    ledgers: mockLedgers,
    connectors: mockConnectors,
    corridors: mockCorridors,
    now: new Date(),
    failureHeat: new Map([['conn-polygon-xrpl', 0.15]]),
    volumeByEdge: new Map([
      ['corridor:cor-xrpl-eth', 45_000],
      ['corridor:cor-polygon-xrpl', 12_000],
    ]),
  });
}

/** Mock API response for GET /api/ilp/graph */
export function mockILPGraphApiResponse(fromCache?: boolean): ILPGraphApiResponse {
  return {
    ok: true,
    payload: buildMockGraphPayload(),
    from_cache: fromCache ?? false,
  };
}
