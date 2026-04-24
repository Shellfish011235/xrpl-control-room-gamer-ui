import type { ControlRoomRealtimeMessage, RealtimeEventFamily } from '../../types/realtime'

const FAMILIES: RealtimeEventFamily[] = [
  'ilp.packet',
  'ilp.settlement',
  'tigerbeetle.transfer',
  'tigerbeetle.account_snapshot',
  'corridor.exposure',
  'settlement.queue',
]

export function isControlRoomMessage(
  m: { type: string; payload: unknown; timestamp: string; corridorId?: string }
): m is ControlRoomRealtimeMessage {
  return FAMILIES.includes(m.type as RealtimeEventFamily) && m.payload != null
}
