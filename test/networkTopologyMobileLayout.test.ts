import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('topology page contains wide content on narrow viewports', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/NetworkTopologyPage.tsx'), 'utf8')
  const filters = readFileSync(join(process.cwd(), 'src/components/network-topology/TopologyFilters.tsx'), 'utf8')

  assert.match(page, /max-w-\[1800px\][^"\n]*overflow-x-hidden/)
  assert.match(page, /Geographic origin[^<]+paths are not inferred[^<]*<\/span>/)
  assert.match(filters, /max-w-full/)
})
