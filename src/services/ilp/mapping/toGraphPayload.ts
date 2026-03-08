/**
 * ILP Mapping — Frontend Transform: canonical entities → graph payload
 * Raw API / store data → ILPGraphPayload for globe/network map.
 */

import type { Connector, Corridor, Route, Ledger } from './canonical';
import type { ILPGraphPayload, GraphNode, GraphEdge } from './graphPayload';
import { computeConfidence } from './confidence';

export interface ToGraphPayloadInput {
  ledgers: Ledger[];
  connectors: Connector[];
  corridors: Corridor[];
  routes?: Route[];
  /** Optional: failure rate 0–1 per connector or edge for heat overlay */
  failureHeat?: Map<string, number>;
  /** Optional: volume for edge thickness */
  volumeByEdge?: Map<string, number>;
  now?: Date;
}

const defaultNow = () => new Date();

/**
 * Build normalized graph payload for the Control Room map.
 * Distinguishes observed vs inferred; applies confidence and optional heat/volume.
 */
export function toGraphPayload(input: ToGraphPayloadInput): ILPGraphPayload {
  const {
    ledgers,
    connectors,
    corridors,
    routes = [],
    failureHeat = new Map(),
    volumeByEdge = new Map(),
    now = defaultNow(),
  } = input;

  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  // Ledgers as nodes
  for (const l of ledgers) {
    const { score, label } = computeConfidence(l.provenance, {
      telemetry_completeness: 1,
      freshness_seconds: 0,
    });
    nodeMap.set(l.id, {
      id: l.id,
      type: 'ledger',
      label: l.name,
      subtitle: l.symbol,
      data_class: l.provenance.class,
      confidence: score,
      domain: 'on-ledger',
      metadata: { native_asset_id: l.native_asset_id },
    });
  }

  // Connectors as nodes (optional: some UIs show only ledgers + edges)
  for (const c of connectors) {
    const { score } = computeConfidence(c.provenance, {
      connector_uptime_percent: c.uptime_percent,
      telemetry_completeness: c.liquidity_depth_usd != null ? 1 : 0.7,
    });
    const heat = failureHeat.get(c.id) ?? 0;
    nodeMap.set(c.id, {
      id: c.id,
      type: 'connector',
      label: c.name,
      subtitle: c.operator,
      data_class: c.provenance.class,
      confidence: score,
      status: 'up',
      glow: 1 - heat,
      metadata: {
        from_ledger_id: c.from_ledger_id,
        to_ledger_id: c.to_ledger_id,
        liquidity_status: c.liquidity_status,
      },
    });
  }

  // Edges: corridor-based (connector → from_ledger, to_ledger) or connector-to-connector from routes
  const maxVolume = Math.max(1, ...volumeByEdge.values());
  for (const cor of corridors) {
    const edgeId = `corridor:${cor.id}`;
    const vol = volumeByEdge.get(edgeId) ?? cor.volume_24h_usd ?? 0;
    const thickness = Math.min(1, (vol || 1) / Math.max(1, maxVolume));
    const heat = failureHeat.get(cor.connector_id) ?? failureHeat.get(edgeId) ?? 0;
    const { score } = computeConfidence(cor.provenance, {});

    const sourceId = cor.from_ledger_id;
    const targetId = cor.to_ledger_id;
    if (!nodeMap.has(sourceId)) continue;
    if (!nodeMap.has(targetId)) continue;

    edgeMap.set(edgeId, {
      id: edgeId,
      source_id: sourceId,
      target_id: targetId,
      corridor_id: cor.id,
      connector_id: cor.connector_id,
      data_class: cor.provenance.class,
      confidence: score,
      direction: cor.bidirectional ? 'bidirectional' : 'forward',
      thickness,
      glow: 1 - heat,
      failure_heat: heat || undefined,
      from_asset: cor.from_asset,
      to_asset: cor.to_asset,
      volume_24h_usd: cor.volume_24h_usd,
    });
  }

  // Route hops as edges if we want multi-hop visibility (connector-to-connector)
  for (const route of routes) {
    const hopIds = route.hop_connector_ids;
    for (let i = 0; i < hopIds.length; i++) {
      const fromLedger = i === 0 ? route.from_ledger_id : hopIds[i - 1];
      const toLedger = i === hopIds.length - 1 ? route.to_ledger_id : hopIds[i];
      const edgeId = `route:${route.id}:${i}`;
      if (edgeMap.has(edgeId)) continue;
      const thickness = 0.3 + (route.liquidity_available_usd ?? 0) / Math.max(1, maxVolume) * 0.7;
      const { score } = computeConfidence(route.provenance, {});
      const sourceNode = nodeMap.get(fromLedger) ?? nodeMap.get(hopIds[i - 1]);
      const targetNode = nodeMap.get(toLedger) ?? nodeMap.get(hopIds[i]);
      if (sourceNode && targetNode) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source_id: sourceNode.id,
          target_id: targetNode.id,
          connector_id: hopIds[i],
          data_class: route.provenance.class,
          confidence: score,
          direction: 'forward',
          thickness: Math.min(1, thickness),
          glow: 0.8,
        });
      }
    }
  }

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());
  const contains_synthetic = [...connectors, ...corridors].some(
    (e) => (e as { is_synthetic?: boolean }).is_synthetic === true
  );

  return {
    nodes,
    edges,
    built_at: now.toISOString(),
    freshness: 'live',
    contains_synthetic,
  };
}
