import type { TopologyDataset, TopologyVisibilitySummary } from '../../types/networkTopology'

export function calculateTopologyVisibility(dataset: TopologyDataset): TopologyVisibilitySummary {
  const validators = dataset.nodes.filter((node) => node.kind === 'validator')
  const possibleFacts = validators.length * 4
  let observedFacts = 0
  let attributableOperators = 0
  let opaqueEndpoints = 0

  validators.forEach((validator) => {
    if (validator.operator || validator.domain) {
      attributableOperators += 1
      observedFacts += 1
    }
    if (validator.trust?.unl != null) observedFacts += 1
    if (validator.consensus?.agreement != null) observedFacts += 1
    if (validator.endpointVisibility !== 'unknown') observedFacts += 1
    if (validator.endpointVisibility === 'private' || validator.endpointVisibility === 'partial' || validator.endpointVisibility === 'unknown') {
      opaqueEndpoints += 1
    }
  })

  const score = possibleFacts === 0 ? 0 : Math.round((observedFacts / possibleFacts) * 100)

  return {
    score,
    totalValidators: validators.length,
    attributableOperators,
    opaqueEndpoints,
    observedFacts,
    possibleFacts,
  }
}
