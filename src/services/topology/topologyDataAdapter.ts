import type { LiveNodeMarker, LiveValidatorMarker } from '../../types/globe'
import type { TopologyDataset, TopologyNode } from '../../types/networkTopology'

function shortKey(value: string): string {
  if (value.length <= 14) return value
  return `${value.slice(0, 7)}…${value.slice(-5)}`
}

export function buildTopologyDataset(
  validators: LiveValidatorMarker[],
  nodes: LiveNodeMarker[],
  asOf?: Date,
): TopologyDataset {
  const validatorNodes: TopologyNode[] = validators.map((validator) => ({
    id: `validator:${validator.id}`,
    kind: 'validator',
    label: validator.domain || shortKey(validator.masterKey),
    validatorPublicKey: validator.masterKey,
    operator: validator.domain,
    domain: validator.domain,
    endpointVisibility: 'unknown',
    evidence: 'observed',
    sources: [{ label: 'XRPL network snapshot', asOf: asOf?.toISOString() }],
    trust: { unl: validator.isUNL },
    infrastructure: {
      region: [validator.city, validator.countryCode].filter(Boolean).join(', ') || undefined,
    },
    consensus: {
      agreement: validator.agreement24h,
      active: validator.lastSeen ? Date.now() - validator.lastSeen.getTime() < 10 * 60_000 : undefined,
    },
  }))

  const peerNodes: TopologyNode[] = nodes.slice(0, 80).map((node) => ({
    id: `peer:${node.id}`,
    kind: 'peer',
    label: shortKey(node.publicKey),
    endpointVisibility: 'public',
    evidence: 'observed',
    sources: [{ label: 'XRPL network snapshot', asOf: asOf?.toISOString() }],
    infrastructure: {
      region: [node.city, node.countryCode].filter(Boolean).join(', ') || undefined,
    },
  }))

  return {
    nodes: [...validatorNodes, ...peerNodes],
    // The current public snapshot does not prove peer-to-validator hop relationships.
    // Keep the graph honest instead of synthesizing connections.
    edges: [],
    asOf,
  }
}
