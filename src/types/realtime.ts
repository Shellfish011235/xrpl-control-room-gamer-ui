/**
 * Frontend contract for a future control-room stream (WebSocket or SSE), e.g. GET /ws/control-room
 *
 * Data path (intended production):
 *   TigerBeetle cluster → CDC job → RabbitMQ → Node/TypeScript bridge → WebSocket/SSE → this UI
 *   ILP connector / routing telemetry → exporter/adapter → same bridge → WebSocket/SSE → this UI
 *
 * The browser does not connect to RabbitMQ or TigerBeetle directly.
 */

import type {
  CorridorExposure,
  IlpPacketEvent,
  IlpSettlementEvent,
  SettlementAccountSnapshot,
  SettlementQueueSummary,
  TigerBeetleTransferEvent,
} from './settlement'

export type RealtimeEventFamily =
  | 'ilp.packet'
  | 'ilp.settlement'
  | 'tigerbeetle.transfer'
  | 'tigerbeetle.account_snapshot'
  | 'corridor.exposure'
  | 'settlement.queue'

export interface IlpPacketRealtimeEnvelope {
  type: 'ilp.packet'
  corridorId: string
  payload: IlpPacketEvent
  timestamp: string
}

export interface IlpSettlementRealtimeEnvelope {
  type: 'ilp.settlement'
  corridorId: string
  payload: IlpSettlementEvent
  timestamp: string
}

export interface TigerBeetleTransferRealtimeEnvelope {
  type: 'tigerbeetle.transfer'
  corridorId: string
  payload: TigerBeetleTransferEvent
  timestamp: string
}

export interface TigerBeetleAccountSnapshotEnvelope {
  type: 'tigerbeetle.account_snapshot'
  corridorId: string
  payload: SettlementAccountSnapshot
  timestamp: string
}

export interface CorridorExposureRealtimeEnvelope {
  type: 'corridor.exposure'
  corridorId: string
  payload: CorridorExposure
  timestamp: string
}

export interface SettlementQueueRealtimeEnvelope {
  type: 'settlement.queue'
  corridorId?: string
  payload: SettlementQueueSummary
  timestamp: string
}

export type ControlRoomRealtimeMessage =
  | IlpPacketRealtimeEnvelope
  | IlpSettlementRealtimeEnvelope
  | TigerBeetleTransferRealtimeEnvelope
  | TigerBeetleAccountSnapshotEnvelope
  | CorridorExposureRealtimeEnvelope
  | SettlementQueueRealtimeEnvelope

/** Wire-level envelope (string type for version skew tolerance) */
export interface DashboardRealtimeEvent {
  type: string
  corridorId?: string
  payload: unknown
  timestamp: string
  /** Optional id for de-dupe */
  id?: string
}
