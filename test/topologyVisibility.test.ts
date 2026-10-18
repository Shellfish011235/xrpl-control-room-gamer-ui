import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateTopologyVisibility } from '../src/services/topology/topologyVisibility.ts'
import type { TopologyDataset } from '../src/types/networkTopology.ts'

test('topology visibility score counts only supported validator facts', () => {
  const dataset: TopologyDataset = {
    nodes: [
      {
        id: 'validator:1',
        kind: 'validator',
        label: 'example.org',
        operator: 'example.org',
        domain: 'example.org',
        endpointVisibility: 'unknown',
        evidence: 'observed',
        sources: [],
        trust: { unl: true },
        consensus: { agreement: 0.999 },
      },
      {
        id: 'validator:2',
        kind: 'validator',
        label: 'nHU…',
        endpointVisibility: 'private',
        evidence: 'observed',
        sources: [],
        trust: { unl: true },
        consensus: { agreement: 0.998 },
      },
    ],
    edges: [],
  }

  const summary = calculateTopologyVisibility(dataset)
  assert.equal(summary.totalValidators, 2)
  assert.equal(summary.attributableOperators, 1)
  assert.equal(summary.opaqueEndpoints, 2)
  assert.equal(summary.observedFacts, 6)
  assert.equal(summary.possibleFacts, 8)
  assert.equal(summary.score, 75)
})

test('empty topology has a zero score instead of NaN', () => {
  const summary = calculateTopologyVisibility({ nodes: [], edges: [] })
  assert.equal(summary.score, 0)
  assert.equal(summary.totalValidators, 0)
})
