import type { EndpointVisibility, EvidenceState, TopologyDataset, TopologyNode } from '../../types/networkTopology'

export interface TopologyFilters {
  evidence?: EvidenceState | 'all'
  unl?: 'all' | 'yes' | 'no' | 'unknown'
  endpointVisibility?: EndpointVisibility | 'all'
  attribution?: 'all' | 'known' | 'unknown'
}

function matchesValidatorFilters(node: TopologyNode, filters: TopologyFilters): boolean {
  if (node.kind !== 'validator') return true

  if (filters.unl && filters.unl !== 'all') {
    const unlState = node.trust?.unl == null ? 'unknown' : node.trust.unl ? 'yes' : 'no'
    if (unlState !== filters.unl) return false
  }

  if (filters.endpointVisibility && filters.endpointVisibility !== 'all' && node.endpointVisibility !== filters.endpointVisibility) {
    return false
  }

  if (filters.attribution && filters.attribution !== 'all') {
    const hasAttribution = Boolean(node.operator || node.domain || node.infrastructure?.asn || node.infrastructure?.provider)
    if ((filters.attribution === 'known') !== hasAttribution) return false
  }

  return true
}

export function filterTopologyDataset(dataset: TopologyDataset, filters: TopologyFilters): TopologyDataset {
  const nodes = dataset.nodes.filter((node) => {
    if (filters.evidence && filters.evidence !== 'all' && node.evidence !== filters.evidence) return false
    return matchesValidatorFilters(node, filters)
  })
  const includedIds = new Set(nodes.map((node) => node.id))
  const edges = dataset.edges.filter((edge) => includedIds.has(edge.source) && includedIds.has(edge.target))

  return { ...dataset, nodes, edges }
}
