import test from 'node:test'
import assert from 'node:assert/strict'
import { getTopologyMotionConfig } from '../src/services/topology/topologyMotion.ts'

test('topology motion uses restrained focus and ambient timings by default', () => {
  const motion = getTopologyMotionConfig(false)

  assert.equal(motion.focusDuration, 0.42)
  assert.equal(motion.drawerDuration, 0.28)
  assert.equal(motion.pulseDuration, 1.8)
  assert.equal(motion.enabled, true)
})

test('topology motion disables animation when reduced motion is requested', () => {
  const motion = getTopologyMotionConfig(true)

  assert.equal(motion.focusDuration, 0)
  assert.equal(motion.drawerDuration, 0)
  assert.equal(motion.pulseDuration, 0)
  assert.equal(motion.enabled, false)
})
