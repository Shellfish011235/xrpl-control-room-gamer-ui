import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIlpOperatorRealtimeConfig } from '../config/ilpOperatorRealtimeConfig'
import { parseIlpOperatorPayload } from '../services/ilpOperatorSnapshotParser'
import type { CorridorExposure, SettlementQueueSummary } from '../types/settlement'

export type IlpOperatorConnectionStatus =
  | 'disabled'
  | 'connecting'
  | 'live_ws'
  | 'live_poll'
  | 'error'

export interface UseIlpOperatorRealtimeResult {
  configured: boolean
  status: IlpOperatorConnectionStatus
  error: string | null
  /** Null until first queue payload (realtime mode only). */
  queueSummary: SettlementQueueSummary | null
  exposures: CorridorExposure[] | null
  /** True after at least one message included a `queue` object (or top-level queue fields). */
  receivedQueue: boolean
  lastUpdateAt: string | null
  reconnectCount: number
}

const MAX_BACKOFF_MS = 30_000

export function useIlpOperatorRealtime(enabled: boolean): UseIlpOperatorRealtimeResult {
  const snapshot = getIlpOperatorRealtimeConfig()
  const cfg = useMemo(() => getIlpOperatorRealtimeConfig(), [
    snapshot.wsUrl ?? '',
    snapshot.httpSnapshotUrl ?? '',
    snapshot.pollIntervalMs,
    snapshot.isConfigured,
  ])
  const [status, setStatus] = useState<IlpOperatorConnectionStatus>(cfg.isConfigured ? 'connecting' : 'disabled')
  const [error, setError] = useState<string | null>(null)
  const [queueSummary, setQueueSummary] = useState<SettlementQueueSummary | null>(null)
  const [exposures, setExposures] = useState<CorridorExposure[] | null>(null)
  const [receivedQueue, setReceivedQueue] = useState(false)
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null)
  const [reconnectCount, setReconnectCount] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1500)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const applySnapshot = useCallback((raw: unknown) => {
    const snap = parseIlpOperatorPayload(raw)
    const now = new Date().toISOString()
    if (snap.queue) {
      setQueueSummary(snap.queue)
      setReceivedQueue(true)
      setLastUpdateAt(now)
    }
    if (snap.exposures !== undefined && snap.exposures !== null) {
      setExposures(snap.exposures)
      setLastUpdateAt(now)
    }
    if (snap.queue || (snap.exposures !== undefined && snap.exposures !== null)) {
      setError(null)
    }
  }, [])

  const pollHttp = useCallback(async () => {
    if (!cfg.httpSnapshotUrl) return
    try {
      const res = await fetch(cfg.httpSnapshotUrl, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as unknown
      applySnapshot(body)
      setStatus((s) => (s === 'live_ws' ? 'live_ws' : 'live_poll'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Poll failed')
      setStatus('error')
    }
  }, [cfg.httpSnapshotUrl, applySnapshot])

  useEffect(() => {
    if (!enabled) return
    if (!cfg.isConfigured) {
      setStatus('disabled')
      return
    }

    let cancelled = false

    const clearTimers = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    const schedulePoll = () => {
      if (!cfg.httpSnapshotUrl || cancelled) return
      void pollHttp()
      pollTimerRef.current = setInterval(() => {
        if (!cancelled) void pollHttp()
      }, cfg.pollIntervalMs)
    }

    const connectWs = () => {
      if (!cfg.wsUrl || cancelled) return
      try {
        const ws = new WebSocket(cfg.wsUrl)
        wsRef.current = ws
        setStatus('connecting')
        ws.onopen = () => {
          if (cancelled) return
          backoffRef.current = 1500
          setStatus('connecting')
          setError(null)
        }
        ws.onmessage = (ev) => {
          if (cancelled) return
          try {
            applySnapshot(ev.data)
            setStatus('live_ws')
          } catch {
            setError('Invalid WS payload')
          }
        }
        ws.onerror = () => {
          if (cancelled) return
          setError('WebSocket error')
        }
        ws.onclose = () => {
          wsRef.current = null
          if (cancelled) return
          setReconnectCount((c) => c + 1)
          const delay = Math.min(MAX_BACKOFF_MS, backoffRef.current)
          backoffRef.current = Math.min(MAX_BACKOFF_MS, backoffRef.current * 1.5)
          reconnectTimerRef.current = setTimeout(() => {
            if (!cancelled && cfg.wsUrl) connectWs()
          }, delay)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'WS init failed')
        setStatus('error')
      }
    }

    if (cfg.wsUrl) {
      connectWs()
    } else {
      setStatus(cfg.httpSnapshotUrl ? 'connecting' : 'disabled')
    }

    if (cfg.httpSnapshotUrl) {
      schedulePoll()
    }

    return () => {
      cancelled = true
      clearTimers()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [enabled, cfg.isConfigured, cfg.wsUrl, cfg.httpSnapshotUrl, cfg.pollIntervalMs, applySnapshot])

  useEffect(() => {
    if (enabled) return
    setQueueSummary(null)
    setExposures(null)
    setReceivedQueue(false)
    setStatus('disabled')
    setError(null)
  }, [enabled])

  return {
    configured: cfg.isConfigured,
    status,
    error,
    queueSummary,
    exposures,
    receivedQueue,
    lastUpdateAt,
    reconnectCount,
  }
}
