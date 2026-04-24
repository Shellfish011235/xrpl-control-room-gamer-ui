/**
 * Normalizes wire-level DashboardRealtimeEvent messages into typed ControlRoomRealtimeMessage
 * and optional UI-friendly patches.
 *
 * Future: WebSocket to `wss://…/ws/control-room` (or same-origin `/ws/control-room` behind proxy).
 * Bridge is responsible for: TigerBeetle CDC / ILP telemetry → one JSON stream.
 *
 * Intended topology:
 *   TigerBeetle cluster → CDC job → RabbitMQ → Node/TypeScript bridge → WebSocket/SSE → parseDashboardRealtimeEvent
 *   ILP connector / routing telemetry → adapter → same bridge → WebSocket/SSE → parseDashboardRealtimeEvent
 */

import type { ControlRoomRealtimeMessage, DashboardRealtimeEvent } from '../../types/realtime'
import type { CorridorExposure, SettlementQueueSummary } from '../../types/settlement'

// TODO(control-room): connect with reconnect + backoff; use EventSource for SSE if preferred
// const WS_URL = import.meta.env.VITE_CONTROL_ROOM_WS as string | undefined

export function parseDashboardRealtimeEvent(raw: DashboardRealtimeEvent): ControlRoomRealtimeMessage | null {
  const t = raw.type
  if (!t || !raw.payload || typeof raw.payload !== 'object') return null
  if (t === 'settlement.queue') {
    const p = raw.payload as SettlementQueueSummary
    return { type: 'settlement.queue', corridorId: raw.corridorId, payload: p, timestamp: raw.timestamp }
  }
  if (t === 'corridor.exposure') {
    if (!raw.corridorId) return null
    const p = raw.payload as CorridorExposure
    return { type: 'corridor.exposure', corridorId: raw.corridorId, payload: p, timestamp: raw.timestamp }
  }
  if (t === 'ilp.packet' || t === 'ilp.settlement' || t === 'tigerbeetle.transfer' || t === 'tigerbeetle.account_snapshot') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { type: t, corridorId: raw.corridorId, payload: raw.payload as any, timestamp: raw.timestamp } as ControlRoomRealtimeMessage
  }
  return null
}

/** Merge queue summary when receiving settlement.queue (demo reducer pattern). */
export function mergeQueueSummary(
  prev: SettlementQueueSummary,
  next: Partial<SettlementQueueSummary>
): SettlementQueueSummary {
  return { ...prev, ...next }
}

