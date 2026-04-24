export function formatDurationSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—'
  if (totalSeconds < 60) return `${Math.floor(totalSeconds)}s`
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  if (m < 60) return `${m}m ${s}s`
  const h = Math.floor(m / 60)
  const m2 = m % 60
  return `${h}h ${m2}m`
}

export function formatUtilization(pct: number): string {
  if (!Number.isFinite(pct)) return '—'
  return `${Math.min(100, Math.max(0, pct)).toFixed(1)}%`
}
