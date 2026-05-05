/**
 * ILP operator strip — real-time configuration (browser-safe).
 * Point at your own bridge/proxy that normalizes Rafiki / ledger / queue data.
 * Do not put secrets in VITE_* vars for public builds.
 */

import { validateIlpHttpSnapshotInput, validateIlpWebSocketInput } from '../lib/urlValidation'

export interface IlpOperatorRealtimeConfig {
  /** Full WebSocket URL (e.g. wss://your-bridge.example/ws/ilp-operator) */
  wsUrl?: string
  /** GET JSON snapshot { queue?, exposures? } — polled while WS unset or as fallback */
  httpSnapshotUrl?: string
  pollIntervalMs: number
  /** True if any transport is configured */
  isConfigured: boolean
}

const DEFAULT_POLL_MS = 8000

/** Browser overrides (no Vite rebuild). Used by `IlpOperatorBridgeQuickConfig`. */
export const ILP_OPERATOR_STORAGE_KEYS = {
  wsUrl: 'xrpl.ilpOperator.wsUrl',
  httpSnapshotUrl: 'xrpl.ilpOperator.httpSnapshotUrl',
} as const

function storageUrl(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const v = window.localStorage.getItem(key)?.trim()
    return v || undefined
  } catch {
    return undefined
  }
}

function validatedHttpFromStorage(key: string): string | undefined {
  const raw = storageUrl(key)
  if (!raw) return undefined
  const v = validateIlpHttpSnapshotInput(raw)
  return v.ok ? v.normalized : undefined
}

function validatedWsFromStorage(key: string): string | undefined {
  const raw = storageUrl(key)
  if (!raw) return undefined
  const v = validateIlpWebSocketInput(raw)
  return v.ok ? v.normalized : undefined
}

function validatedEnvHttp(s: string | undefined): string | undefined {
  if (!s?.trim()) return undefined
  const v = validateIlpHttpSnapshotInput(s.trim())
  return v.ok ? v.normalized : undefined
}

function validatedEnvWs(s: string | undefined): string | undefined {
  if (!s?.trim()) return undefined
  const v = validateIlpWebSocketInput(s.trim())
  return v.ok ? v.normalized : undefined
}

export function clearIlpOperatorStorageOverrides(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ILP_OPERATOR_STORAGE_KEYS.wsUrl)
    localStorage.removeItem(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl)
  } catch {
    /* ignore */
  }
}

/**
 * One-shot: `?ilpHttp=/api/snapshot&ilpWs=wss://…` writes localStorage, strips params.
 * Returns true if either param was present (caller should reload so hooks pick up URLs).
 */
export function bootstrapIlpOperatorFromQuery(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const q = new URLSearchParams(window.location.search)
    if (!q.has('ilpHttp') && !q.has('ilpWs')) return false
    const h = q.get('ilpHttp')
    const w = q.get('ilpWs')
    if (h !== null) {
      const t = h.trim()
      if (!t) {
        localStorage.removeItem(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl)
      } else {
        const v = validateIlpHttpSnapshotInput(t)
        if (v.ok) localStorage.setItem(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl, v.normalized)
      }
    }
    if (w !== null) {
      const t = w.trim()
      if (!t) {
        localStorage.removeItem(ILP_OPERATOR_STORAGE_KEYS.wsUrl)
      } else {
        const v = validateIlpWebSocketInput(t)
        if (v.ok) localStorage.setItem(ILP_OPERATOR_STORAGE_KEYS.wsUrl, v.normalized)
      }
    }
    q.delete('ilpHttp')
    q.delete('ilpWs')
    const qs = q.toString()
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
    return true
  } catch {
    return false
  }
}

/**
 * Merge build-time env with optional runtime overrides (same-tab / no rebuild).
 * Keys: `xrpl.ilpOperator.wsUrl`, `xrpl.ilpOperator.httpSnapshotUrl`
 */
export function getIlpOperatorRealtimeConfig(): IlpOperatorRealtimeConfig {
  // Each VITE_* key must appear as a static property access so Vite can inline at build time.
  const wsUrl =
    validatedEnvWs((import.meta.env.VITE_ILP_OPERATOR_WS_URL as string | undefined)?.trim()) ||
    validatedEnvWs((import.meta.env.VITE_ILP_OPERATOR_WEBSOCKET_URL as string | undefined)?.trim()) ||
    validatedWsFromStorage(ILP_OPERATOR_STORAGE_KEYS.wsUrl) ||
    undefined
  const httpSnapshotUrl =
    validatedEnvHttp((import.meta.env.VITE_ILP_OPERATOR_HTTP_SNAPSHOT_URL as string | undefined)?.trim()) ||
    validatedEnvHttp((import.meta.env.VITE_ILP_OPERATOR_SNAPSHOT_URL as string | undefined)?.trim()) ||
    validatedEnvHttp((import.meta.env.VITE_ILP_OPERATOR_HTTP_URL as string | undefined)?.trim()) ||
    validatedHttpFromStorage(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl) ||
    undefined
  const pollRaw = import.meta.env.VITE_ILP_OPERATOR_POLL_MS as string | undefined
  const parsed = Number.parseInt(String(pollRaw ?? '').trim() || '', 10)
  const basePoll = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_POLL_MS
  const pollIntervalMs = Math.max(2000, basePoll)

  return {
    wsUrl,
    httpSnapshotUrl,
    pollIntervalMs,
    isConfigured: Boolean(wsUrl || httpSnapshotUrl),
  }
}
