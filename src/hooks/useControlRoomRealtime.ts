import { useMemo } from 'react'
import type { CorridorExposure, SettlementQueueSummary } from '../types/settlement'
import { getMockCorridorExposuresList, getMockSettlementQueueSummary } from '../lib/settlement/mockSettlementData'

/**
 * Future: subscribe to `wss://<bridge>/ws/control-room` (or `EventSource` for SSE).
 * Bridge normalizes: TigerBeetle CDC (via RabbitMQ) + ILP connector telemetry.
 * Parse frames with `parseDashboardRealtimeEvent` in `../lib/realtime/eventAdapter`.
 */
export function useControlRoomRealtime(options?: { useDemo: boolean }): {
  queueSummary: SettlementQueueSummary
  corridorExposures: CorridorExposure[]
} {
  const useDemo = options?.useDemo !== false
  return useMemo(
    () => ({
      queueSummary: getMockSettlementQueueSummary(useDemo),
      corridorExposures: getMockCorridorExposuresList(useDemo),
    }),
    [useDemo]
  )
}

// TODO(control-room):
// 1) read VITE_CONTROL_ROOM_WS; new WebSocket(url) with reconnect/backoff
// 2) onmessage → JSON.parse → parseDashboardRealtimeEvent → setState
// 3) never call RabbitMQ or TigerBeetle from the browser
