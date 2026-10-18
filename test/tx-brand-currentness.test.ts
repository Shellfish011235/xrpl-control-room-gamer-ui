import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

test('current project content uses tx instead of Sologenic as the active brand', () => {
  const projects = read('src/content-packs/v1/projects/brief.json')

  assert.match(projects, /"id": "proj-tx-001"/)
  assert.match(projects, /"title": "tx /)
  assert.match(projects, /"sourceIds": \["src-tx-ecosystem"\]/)
  assert.doesNotMatch(projects, /"title": "Sologenic /)
})

test('current source metadata points to tx rather than Sologenic as publisher', () => {
  const sources = read('src/content-packs/v1/meta/sources.json')

  assert.match(sources, /"id": "src-tx-ecosystem"/)
  assert.match(sources, /"publisher": "tx"/)
  assert.match(sources, /https:\/\/tx\.org/)
  assert.doesNotMatch(sources, /"publisher": "Sologenic"/)
})

test('guided project references use the tx project id', () => {
  const guided = read('src/content-packs/v1/projects/guided-steps.json')

  assert.match(guided, /proj-tx-001/)
  assert.doesNotMatch(guided, /proj-sologenic-001/)
})
