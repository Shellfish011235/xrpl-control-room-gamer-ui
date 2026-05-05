import type { DataAccuracy, DataSourceKind, DataSourceMeta } from '../types/dataAccuracy'
import { getAccuracyWarning, makeDataSourceMeta } from '../types/dataAccuracy'

function withWarning(
  accuracy: DataAccuracy,
  sourceKind: DataSourceKind,
  sourceName: string,
  extra: Partial<DataSourceMeta> = {}
): DataSourceMeta {
  return makeDataSourceMeta({
    accuracy,
    sourceKind,
    sourceName,
    warning: extra.warning ?? getAccuracyWarning(accuracy),
    ...extra,
  })
}

export function classifyXrplSource(source: 'local_rippled' | 'xrpscan' | 'public_ws'): DataSourceMeta {
  if (source === 'local_rippled') {
    return withWarning('LIVE_VERIFIED', 'local_rippled', 'Local rippled (server_info / WebSocket)', {
      isLive: true,
      confidencePct: 92,
    })
  }
  if (source === 'xrpscan') {
    return withWarning('PUBLIC_DIRECTORY', 'xrpscan', 'XRPScan registry / nodes', {
      sourceUrl: 'https://xrpscan.com',
      confidencePct: 78,
    })
  }
  return withWarning('PUBLIC_XRPL', 'xrpl_websocket', 'Public XRPL WebSocket stream', {
    isLive: true,
    confidencePct: 85,
  })
}

/** Hardcoded ILP connector/corridor dataset — reference only. */
export function classifyIlpStaticData(): DataSourceMeta {
  return withWarning('DEMO', 'static_dataset', 'Static ILP reference dataset (ilpData.ts)', {
    confidencePct: 15,
  })
}

/** Static connector list when an operator bridge is already configured (queue/exposure live above). */
export function classifyIlpStaticDataBesideLiveBridge(): DataSourceMeta {
  return withWarning('MANUAL', 'static_dataset', 'Static connector directory (reference)', {
    confidencePct: 20,
    warning:
      'Curated connector rows from ilpData.ts. Live queue and corridor exposure use your operator bridge above.',
  })
}

export function classifyMockSettlementData(): DataSourceMeta {
  return withWarning('DEMO', 'mock_dataset', 'Mock settlement queue (mockSettlementData)', {
    confidencePct: 5,
  })
}

/** Dashboard widget: upcoming events subset from dashboardMockData (not a live calendar). */
export function classifyDashboardEventsMock(): DataSourceMeta {
  return withWarning('DEMO', 'mock_dataset', 'dashboardMockData.eventsMock', {
    confidencePct: 5,
  })
}

export function classifyRafikiLocalTelemetry(): DataSourceMeta {
  return withWarning('LOCAL_TELEMETRY', 'rafiki_local', 'Local Rafiki / connector telemetry', {
    isLive: true,
    confidencePct: 80,
  })
}

export function classifyRafikiTestnet(): DataSourceMeta {
  return withWarning('TESTNET_VERIFIED', 'rafiki_testnet', 'Rafiki testnet endpoint', {
    confidencePct: 72,
  })
}

/** Env-configured WS / HTTP snapshot bridge for ILP operator strip (see `VITE_ILP_OPERATOR_*`). */
export function classifyIlpOperatorBridge(): DataSourceMeta {
  return withWarning('LOCAL_TELEMETRY', 'manual_config', 'ILP operator bridge (VITE_ILP_OPERATOR_*)', {
    isLive: true,
    confidencePct: 70,
    warning:
      'Payloads come from your configured URL(s). URLs are public in the client bundle; do not expose secrets.',
  })
}

export function classifyOpenPaymentsEndpoint(
  success: boolean,
  isTestnet?: boolean
): DataSourceMeta {
  if (!success) {
    return withWarning('UNKNOWN', 'open_payments', 'Open Payments endpoint probe', { confidencePct: 20 })
  }
  if (isTestnet) {
    return classifyRafikiTestnet()
  }
  return withWarning('LOCAL_TELEMETRY', 'open_payments', 'Open Payments endpoint (reachable)', {
    confidencePct: 55,
    warning:
      'Reachability only — does not verify quotes, balances, or production ILP capability.',
  })
}

export function classifyDerivedRoute(): DataSourceMeta {
  return withWarning('DERIVED', 'derived_model', 'Route estimate (XRPL + endpoint signals)', {
    confidencePct: 40,
  })
}

export function classifyManualEndpoint(verified: boolean): DataSourceMeta {
  if (verified) {
    return withWarning('MANUAL', 'manual_config', 'Manually verified endpoint config', {
      confidencePct: 65,
    })
  }
  return withWarning('UNKNOWN', 'manual_config', 'Manual endpoint config (unverified)', {
    confidencePct: 30,
  })
}
