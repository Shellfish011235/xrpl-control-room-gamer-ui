import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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

  const matches = [...spec.matchAll(/^\s*['"]([a-z_]+)['"]\s*:\s*\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)/gm)]
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
