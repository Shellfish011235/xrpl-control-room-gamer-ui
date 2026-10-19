import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('Network validator panel exposes a compact topology entry point', () => {
  const source = readFileSync(join(process.cwd(), 'src/pages/Network.tsx'), 'utf8')

  assert.match(source, /to="\/network\/topology"/)
  assert.match(source, /Explore topology/i)
})
