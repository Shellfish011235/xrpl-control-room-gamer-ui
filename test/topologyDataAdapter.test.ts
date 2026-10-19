import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTopologyDataset } from '../src/services/topology/topologyDataAdapter.ts'
import type { LiveNodeMarker, LiveValidatorMarker } from '../src/types/globe.ts'

test('adapter preserves observed validators without inventing peer edges', () => {
  const validators: LiveValidatorMarker[] = [
    {
      id: 'v1',
      masterKey: 'nHU1234567890abcdef',
      domain: 'validator.example',
      isUNL: true,
      agreement24h: 0.999,
      coordinates: [-80, 26],
      city: 'Miami',
      countryCode: 'US',
    },
  ]
  const nodes: LiveNodeMarker[] = [
    {
      id: 'p1',
      publicKey: 'n9Peer1234567890',
      coordinates: [-74, 40],
      city: 'New York',
      countryCode: 'US',
    },
  ]

  const dataset = buildTopologyDataset(validators, nodes, new Date('2026-10-18T12:00:00Z'))
  assert.equal(dataset.nodes.length, 2)
  assert.equal(dataset.edges.length, 0)
  assert.equal(dataset.nodes[0]?.evidence, 'observed')
  assert.equal(dataset.nodes[0]?.endpointVisibility, 'unknown')
  assert.equal(dataset.nodes[0]?.trust?.unl, true)
})

test('adapter keeps missing operator attribution unknown', () => {
  const validators: LiveValidatorMarker[] = [
    {
      id: 'v2',
      masterKey: 'nHUabcdef1234567890',
      isUNL: false,
      agreement24h: 0.98,
      coordinates: [0, 0],
    },
  ]

  const dataset = buildTopologyDataset(validators, [])
  const validator = dataset.nodes[0]
  assert.equal(validator?.operator, undefined)
  assert.equal(validator?.domain, undefined)
  assert.equal(validator?.endpointVisibility, 'unknown')
})
