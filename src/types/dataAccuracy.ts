export type DataAccuracy =
  | 'LIVE_VERIFIED'
  | 'LOCAL_TELEMETRY'
  | 'TESTNET_VERIFIED'
  | 'PUBLIC_XRPL'
  | 'PUBLIC_DIRECTORY'
  | 'DERIVED'
  | 'SIMULATED'
  | 'DEMO'
  | 'MANUAL'
  | 'UNKNOWN'

export type DataSourceKind =
  | 'xrpl_websocket'
  | 'xrpscan'
  | 'local_rippled'
  | 'rafiki_local'
  | 'rafiki_testnet'
  | 'open_payments'
  | 'payment_pointer'
  | 'manual_config'
  | 'static_dataset'
  | 'mock_dataset'
  | 'derived_model'
  | 'unknown'

export interface DataSourceMeta {
  accuracy: DataAccuracy
  sourceKind: DataSourceKind
  sourceName: string
  sourceUrl?: string
  lastCheckedAt?: string
  confidencePct: number
  warning?: string
  isLive: boolean
}

export interface WithDataSourceMeta {
  dataSource: DataSourceMeta
}

export function makeDataSourceMeta(
  input: Partial<DataSourceMeta> & Pick<DataSourceMeta, 'accuracy' | 'sourceKind' | 'sourceName'>
): DataSourceMeta {
  return {
    isLive: false,
    confidencePct: 50,
    ...input,
  }
}

export function getAccuracyLabel(accuracy: DataAccuracy): string {
  switch (accuracy) {
    case 'LIVE_VERIFIED':
      return 'Live verified'
    case 'LOCAL_TELEMETRY':
      return 'Local telemetry'
    case 'TESTNET_VERIFIED':
      return 'Testnet verified'
    case 'PUBLIC_XRPL':
      return 'Public XRPL'
    case 'PUBLIC_DIRECTORY':
      return 'Public directory'
    case 'DERIVED':
      return 'Derived'
    case 'SIMULATED':
      return 'Simulated'
    case 'DEMO':
      return 'Demo'
    case 'MANUAL':
      return 'Manual'
    case 'UNKNOWN':
      return 'Unknown'
    default:
      return 'Unknown'
  }
}

export function getAccuracyWarning(accuracy: DataAccuracy): string | undefined {
  switch (accuracy) {
    case 'LIVE_VERIFIED':
    case 'LOCAL_TELEMETRY':
    case 'TESTNET_VERIFIED':
    case 'PUBLIC_XRPL':
      return undefined
    case 'PUBLIC_DIRECTORY':
      return 'Public directory data may be delayed or incomplete.'
    case 'DERIVED':
      return 'Derived from available inputs; not a direct live feed.'
    case 'SIMULATED':
      return 'Simulation only. Not a live payment route.'
    case 'DEMO':
      return 'Demo data. Do not treat as verified network truth.'
    case 'MANUAL':
      return 'Manually configured. Verify before using operationally.'
    case 'UNKNOWN':
      return 'Source is unknown or unverified.'
    default:
      return 'Source is unknown or unverified.'
  }
}
