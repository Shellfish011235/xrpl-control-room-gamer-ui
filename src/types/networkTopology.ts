export type EvidenceState = 'observed' | 'inferred' | 'unknown'
export type EndpointVisibility = 'public' | 'private' | 'partial' | 'unknown'
export type TopologyNodeKind = 'validator' | 'peer' | 'sentry' | 'visibility-boundary'

export interface TopologySource {
  label: string
  url?: string
  asOf?: string
}

export interface TopologyNode {
  id: string
  kind: TopologyNodeKind
  label: string
  validatorPublicKey?: string
  operator?: string
  domain?: string
  endpointVisibility: EndpointVisibility
  evidence: EvidenceState
  sources: TopologySource[]
  trust?: {
    unl?: boolean | null
  }
  infrastructure?: {
    region?: string
    asn?: string
    provider?: string
  }
  consensus?: {
    agreement?: number
    active?: boolean
  }
}

export interface TopologyEdge {
  id: string
  source: string
  target: string
  relation: 'peer' | 'sentry' | 'visibility-boundary'
  evidence: EvidenceState
  sources: TopologySource[]
}

export interface TopologyDataset {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  asOf?: Date
}

export interface TopologyVisibilitySummary {
  score: number
  totalValidators: number
  attributableOperators: number
  opaqueEndpoints: number
  observedFacts: number
  possibleFacts: number
}
