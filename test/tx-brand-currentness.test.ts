import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (path: string) => readFileSync(path, 'utf8')

function collectTextFiles(root: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(root)) {
    const path = join(root, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) files.push(...collectTextFiles(path))
    else if (/\.(ts|tsx|js|jsx|json|md)$/.test(entry)) files.push(path)
  }
  return files
}

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
  assert.doesNotMatch(sources, /"publisher": "Coreum"/)
})

test('guided project references use the tx project id', () => {
  const guided = read('src/content-packs/v1/projects/guided-steps.json')

  assert.match(guided, /proj-tx-001/)
  assert.doesNotMatch(guided, /proj-sologenic-001/)
})

test('active app source does not retain retired Sologenic/Coreum identifiers', () => {
  const contents = collectTextFiles('src').map((path) => `${path}\n${read(path)}`).join('\n')

  assert.doesNotMatch(contents, /src-sologenic-stats/i)
  assert.doesNotMatch(contents, /proj-sologenic-001/i)
  assert.doesNotMatch(contents, /"publisher"\s*:\s*"(?:Sologenic|Coreum)"/i)
})
