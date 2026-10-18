import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const builder = readFileSync(
  join(process.cwd(), 'demo/unreal/xrpl-control-room-cinematic/Content/Python/build_cinematic.py'),
  'utf8',
)

test('handoff plane uses a real topology capture when present and a neutral placeholder otherwise', () => {
  assert.match(builder, /HANDOFF_REFERENCE_NAME\s*=\s*['"]topology-handoff\.png['"]/)
  assert.match(builder, /def _import_handoff_texture\(\)\s*->\s*str \| None/)
  assert.match(builder, /AutomatedAssetImportData/)
  assert.match(builder, /import_assets_automated/)
  assert.match(builder, /def _create_handoff_plane\(material_paths:\s*dict\[str, str\]\)\s*->\s*str/)
  assert.match(builder, /M_CR_Handoff/)
  assert.match(builder, /M_CR_HandoffPlaceholder/)
  assert.match(builder, /References.*topology-handoff\.png/s)
  assert.match(builder, /actor_paths\[['"]handoff['"]\]/)
  assert.match(builder, /SHOT_TIMINGS\[['"]control_room_handoff['"]\]\[0\]/)
})
