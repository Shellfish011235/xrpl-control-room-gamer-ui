export interface TopologyMotionConfig {
  enabled: boolean
  focusDuration: number
  drawerDuration: number
  pulseDuration: number
}

export function getTopologyMotionConfig(reducedMotion: boolean): TopologyMotionConfig {
  if (reducedMotion) {
    return {
      enabled: false,
      focusDuration: 0,
      drawerDuration: 0,
      pulseDuration: 0,
    }
  }

  return {
    enabled: true,
    focusDuration: 0.42,
    drawerDuration: 0.28,
    pulseDuration: 1.8,
  }
}
