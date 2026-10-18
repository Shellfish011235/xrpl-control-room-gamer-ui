import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const cinematicRoot = join(root, 'demo/unreal/xrpl-control-room-cinematic')

function read(relativePath: string): string {
  return readFileSync(join(cinematicRoot, relativePath), 'utf8')
}

test('Unreal cinematic project is isolated and presentation-only', () => {
  assert.equal(existsSync(cinematicRoot), true, 'cinematic project directory should exist')
  assert.equal(existsSync(join(cinematicRoot, 'XRPLControlRoomCinematic.uproject')), true)
  assert.equal(existsSync(join(cinematicRoot, 'Config/DefaultEngine.ini')), true)

  const readme = read('README.md')
  assert.match(readme, /presentation[- ]only/i)
  assert.match(readme, /must not become a runtime dependency/i)
})

test('cinematic spec defines five ordered shots totaling 5 to 15 seconds', () => {
  const spec = read('Content/Python/cinematic_spec.py')
  const expectedShots = [
    'ledger_signal',
    'validators',
    'relationships',
    'visibility_boundary',
    'control_room_handoff',
  ]

  const timingBlock = spec.match(/SHOT_TIMINGS[^=]*=\s*\{([\s\S]*?)\n\}/)?.[1]
  assert.ok(timingBlock, 'SHOT_TIMINGS block should exist')

  const matches = [...timingBlock.matchAll(/^\s*['"]([a-z_]+)['"]\s*:\s*\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)/gm)]
  const shots = matches.map((match) => ({
    name: match[1],
    start: Number(match[2]),
    end: Number(match[3]),
  }))

  assert.deepEqual(shots.map((shot) => shot.name), expectedShots)
  assert.equal(shots[0].start, 0)
  for (let i = 1; i < shots.length; i += 1) {
    assert.equal(shots[i].start, shots[i - 1].end, `shot ${shots[i].name} should start when prior shot ends`)
  }

  const totalDuration = shots.at(-1)!.end - shots[0].start
  assert.ok(totalDuration >= 5 && totalDuration <= 15, `duration ${totalDuration}s should stay in 5–15s range`)
  assert.match(spec, /['"]resolution['"]\s*:\s*\(1920,\s*1080\)/)
})

test('topology manifest preserves evidence boundaries and avoids unsupported claims', () => {
  const manifest = read('Content/Python/topology_manifest.py')

  assert.match(manifest, /class TopologyNode/)
  assert.match(manifest, /class TopologyEdge/)
  assert.match(manifest, /['"]observed['"]/)
  assert.match(manifest, /['"]inferred['"]/)
  assert.match(manifest, /['"]unknown['"]/)
  assert.doesNotMatch(manifest, /\b(bank|institution|private route)\b/i)
  assert.doesNotMatch(manifest, /TopologyEdge\([^)]*evidence\s*=\s*['"]unknown['"]/s)
})

test('scene builder exposes deterministic build stages and refuses unsupported edges', () => {
  const builderPath = join(cinematicRoot, 'Content/Python/build_cinematic.py')
  const builder = read('Content/Python/build_cinematic.py')

  assert.match(builder, /def create_materials\(\)\s*->\s*dict\[str, str\]/)
  assert.match(builder, /def create_level\(\)\s*->\s*str/)
  assert.match(builder, /def spawn_network\(nodes:\s*tuple\[TopologyNode, \.\.\.\], edges:\s*tuple\[TopologyEdge, \.\.\.\]\)\s*->\s*dict\[str, str\]/)
  assert.match(builder, /def create_sequence\(actor_paths:\s*dict\[str, str\]\)\s*->\s*str/)
  assert.match(builder, /def configure_render\(sequence_path:\s*str\)\s*->\s*str/)
  assert.match(builder, /def build_all\(\)\s*->\s*dict\[str, str\]/)
  assert.match(builder, /SHOT_TIMINGS/)
  assert.match(builder, /NODES/)
  assert.match(builder, /EDGES/)
  assert.match(builder, /CR_/)
  assert.match(builder, /\/Game\/XRPLControlRoomCinematic/)
  assert.match(builder, /edge\.evidence\s+not\s+in\s+\("observed",\s*"inferred"\)/)

  execFileSync('python3', ['-m', 'py_compile', builderPath], { stdio: 'pipe' })
})

test('storyboard builder programs reveal tracks, deliberate camera motion, and a camera cut', () => {
  const builder = read('Content/Python/build_cinematic.py')

  assert.match(builder, /def _add_visibility_keys\([^)]*reveal_seconds:\s*float[^)]*\)\s*->\s*None/)
  assert.match(builder, /MovieSceneVisibilityTrack/)
  assert.match(builder, /add_key\(unreal\.FrameNumber\(/)
  assert.match(builder, /def _add_camera_motion\([^)]*\)\s*->\s*None/)
  assert.match(builder, /MovieScene3DTransformTrack/)
  assert.match(builder, /SHOT_TIMINGS\["visibility_boundary"\]/)
  assert.match(builder, /SHOT_TIMINGS\["control_room_handoff"\]/)
  assert.match(builder, /def _add_camera_cut\([^)]*\)\s*->\s*None/)
  assert.match(builder, /MovieSceneCameraCutTrack/)
  assert.match(builder, /set_camera_binding_id/)
  assert.match(builder, /def _program_storyboard\([^)]*\)\s*->\s*None/)
})

test('Unreal validator checks scene contract and reports a missing handoff reference', () => {
  const validatorPath = join(cinematicRoot, 'Content/Python/validate_cinematic.py')
  const validator = read('Content/Python/validate_cinematic.py')

  assert.match(validator, /def validate_scene\(\)\s*->\s*list\[str\]/)
  assert.match(validator, /LEVEL_PATH/)
  assert.match(validator, /SEQUENCE_PATH/)
  assert.match(validator, /RENDER_PRESET_PATH/)
  assert.match(validator, /SHOT_TIMINGS/)
  assert.match(validator, /OUTPUT_SETTINGS/)
  assert.match(validator, /NODES/)
  assert.match(validator, /EDGES/)
  assert.match(validator, /topology-handoff\.png/)
  assert.match(validator, /missing handoff reference/i)
  assert.match(validator, /1920/)
  assert.match(validator, /1080/)

  execFileSync('python3', ['-m', 'py_compile', validatorPath], { stdio: 'pipe' })
})

test('Unreal packaging keeps generated editor state and rendered video out of source control', () => {
  const mediaKeep = join(cinematicRoot, 'Media/.gitkeep')
  const gitignore = readFileSync(join(root, '.gitignore'), 'utf8')
  const readme = read('README.md')

  assert.equal(existsSync(mediaKeep), true, 'Media/.gitkeep should retain the render output directory')
  assert.match(gitignore, /demo\/unreal\/xrpl-control-room-cinematic\/Saved\//)
  assert.match(gitignore, /demo\/unreal\/xrpl-control-room-cinematic\/Intermediate\//)
  assert.match(gitignore, /demo\/unreal\/xrpl-control-room-cinematic\/DerivedDataCache\//)
  assert.match(gitignore, /demo\/unreal\/xrpl-control-room-cinematic\/Binaries\//)
  assert.match(gitignore, /demo\/unreal\/xrpl-control-room-cinematic\/Media\/\*\.mp4/)
  assert.match(readme, /Movie Render Queue/i)
  assert.match(readme, /Media\//)
  assert.match(readme, /1920×1080/)
})
