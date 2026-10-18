import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const validatorPath = join(
  process.cwd(),
  'demo/unreal/xrpl-control-room-cinematic/Content/Python/validate_cinematic.py',
)
const validator = readFileSync(validatorPath, 'utf8')

test('runtime validator requires the handoff actor and master camera cut', () => {
  assert.match(validator, /CR_Handoff/)
  assert.match(validator, /def _validate_sequence_structure\(errors:\s*list\[str\]\)\s*->\s*None/)
  assert.match(validator, /MovieSceneCameraCutTrack/)
  assert.match(validator, /MovieSceneCinematicShotTrack/)
  assert.match(validator, /Missing master camera cut track/)
  assert.match(validator, /Missing cinematic shot track/)
  assert.match(validator, /_validate_sequence_structure\(errors\)/)

  execFileSync('python3', ['-m', 'py_compile', validatorPath], { stdio: 'pipe' })
})
