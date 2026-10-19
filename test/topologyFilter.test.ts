import test from 'node:test'
import assert from 'node:assert/strict'
import { filterTopologyDataset } from '../src/services/topology/topologyFilter.ts'
import type { TopologyDataset } from '../src/types/networkTopology.ts'

const dataset: TopologyDataset = {
  nodes: [
    {
      id: 'validator:observed',
      kind: 'validator',
      label: 'observed.example',
      endpointVisibility: 'public',
      evidence: 'observed',
      sources: [],
      trust: { unl: true },
      operator: 'Observed Operator',
    },
    {
      id: 'validator:unknown',
      kind: 'validator',
      label: 'unknown.example',
      endpointVisibility: 'unknown',
      evidence: 'unknown',
      sources: [],
      trust: { unl: false },
    },
    {
      id: 'peer:observed',
      kind: 'peer',
      label: 'peer',
      endpointVisibility: 'public',
      evidence: 'observed',
      sources: [],
    },
  ],
  edges: [
    {
      id: 'edge:kept',
      source: 'validator:observed',
      target: 'peer:observed',
      relation: 'peer',
      evidence: 'observed',
      sources: [],
    },
    {
      id: 'edge:dropped',
      source: 'validator:unknown',
      target: 'peer:observed',
      relation: 'peer',
      evidence: 'observed',
      sources: [],
    },
  ],
}

test('filters topology by evidence while removing orphaned edges', () => {
  const filtered = filterTopologyDataset(dataset, { evidence: 'observed' })

  assert.deepEqual(filtered.nodes.map((node) => node.id), ['validator:observed', 'peer:observed'])
  assert.deepEqual(filtered.edges.map((edge) => edge.id), ['edge:kept'])
})

test('filters validators by UNL, endpoint visibility, and attribution without hiding peers', () => {
  const filtered = filterTopologyDataset(dataset, {
    unl: 'yes',
    endpointVisibility: 'public',
    attribution: 'known',
  })

  assert.deepEqual(filtered.nodes.map((node) => node.id), ['validator:observed', 'peer:observed'])
})
