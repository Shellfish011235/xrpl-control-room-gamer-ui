/**
 * Sample control-room style messages for local testing. Not used as silent production defaults.
 */

import type { ControlRoomRealtimeMessage } from '../../types/realtime'

const ts = () => new Date().toISOString()

export const MOCK_CONTROL_ROOM_EVENT_SAMPLES: ControlRoomRealtimeMessage[] = [
  {
    type: 'settlement.queue',
    payload: {
      pendingCount: 15,
      postedCount: 1290,
      voidedCount: 3,
      expiredCount: 1,
      correctedCount: 2,
      oldestPendingAgeSeconds: 380,
      lastPostedAt: ts(),
    },
    timestamp: ts(),
  },
  {
    type: 'corridor.exposure',
    corridorId: 'us-mx-remit',
    payload: {
      corridorId: 'us-mx-remit',
      source: 'ILF Rafiki (US)',
      destination: 'Fynbos (EU) · MX rail',
      assetPath: 'USD → USDC → MXN',
      debitsPending: '1.24M',
      debitsPosted: '980K',
      creditsPending: '1.10M',
      creditsPosted: '940K',
      pendingExposure: '1.24M',
      postedExposure: '940K',
      netExposure: '−82K',
      creditUtilizationPct: 64,
      exceptionCount: 0,
      lastSettlementAt: ts(),
      settlementStatus: 'settled',
    },
    timestamp: ts(),
  },
  {
    type: 'ilp.packet',
    corridorId: 'us-ph-remit',
    payload: {
      id: 'pkt-1',
      corridorId: 'us-ph-remit',
      sourcePeer: 'u.us',
      destinationPeer: 'u.ph',
      assetPath: 'USD→PHP',
      eventType: 'fulfill',
      amount: '120.00',
      latencyMs: 45,
      timestamp: ts(),
      routeId: 'r-1',
    },
    timestamp: ts(),
  },
]
