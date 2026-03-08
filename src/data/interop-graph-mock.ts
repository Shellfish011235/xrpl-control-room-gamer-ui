/**
 * Mock InteropGraphPayload for transform and map testing.
 * Clearly labeled mock. TODO: Replace with real interop API.
 */

import type { InteropGraphPayload, InteropNode, InteropEdge } from '../types/interop-graph';

const NOW = new Date().toISOString();

function prov(
  observation_class: 'observed' | 'derived' | 'inferred' | 'synthetic' | 'unknown',
  confidence: number
) {
  return {
    observation_class,
    confidence,
    source_ids: ['mock'],
    observed_at: NOW,
    explanation: 'Mock interop graph',
  };
}

const MOCK_NODES: InteropNode[] = [
  {
    id: 'n-xrpl',
    label: 'XRPL',
    subtitle: 'XRP',
    node_type: 'ledger',
    layer: 'settlement',
    observation_class: 'observed',
    confidence: 95,
    provenance: prov('observed', 95),
    health: 'up',
    freshness: 'live',
    size: 1,
    glow: 1,
  },
  {
    id: 'n-conn-1',
    label: 'Rafiki connector',
    node_type: 'connector',
    layer: 'routing',
    observation_class: 'inferred',
    confidence: 55,
    provenance: prov('inferred', 55),
    health: 'unknown',
    freshness: 'stale',
    size: 0.8,
    glow: 0.5,
  },
  {
    id: 'n-wallet',
    label: 'Wallet provider',
    node_type: 'wallet_provider',
    layer: 'application',
    observation_class: 'inferred',
    confidence: 45,
    provenance: prov('inferred', 45),
    health: 'unknown',
    freshness: 'unknown',
    size: 0.6,
    glow: 0.5,
  },
];

const MOCK_EDGES: InteropEdge[] = [
  {
    id: 'e-1',
    source_id: 'n-wallet',
    target_id: 'n-conn-1',
    edge_type: 'routing',
    observation_class: 'inferred',
    confidence: 45,
    provenance: prov('inferred', 45),
    health: 'unknown',
    freshness: 'unknown',
    direction: 'forward',
    thickness: 0.5,
    glow: 0.5,
    volume_normalized: 0.5,
  },
  {
    id: 'e-2',
    source_id: 'n-conn-1',
    target_id: 'n-xrpl',
    edge_type: 'settlement',
    observation_class: 'observed',
    confidence: 85,
    provenance: prov('observed', 85),
    health: 'up',
    freshness: 'live',
    direction: 'forward',
    thickness: 0.8,
    glow: 1,
    volume_normalized: 0.8,
  },
];

export const MOCK_INTEROP_GRAPH_PAYLOAD: InteropGraphPayload = {
  nodes: MOCK_NODES,
  edges: MOCK_EDGES,
  built_at: NOW,
  freshness: 'live',
  contains_synthetic: false,
  layers: ['application', 'routing', 'settlement'],
};
