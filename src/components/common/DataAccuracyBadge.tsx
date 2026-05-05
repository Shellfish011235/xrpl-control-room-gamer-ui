import type { DataSourceMeta } from '../../types/dataAccuracy'
import { getAccuracyLabel } from '../../types/dataAccuracy'

type Props = {
  meta: DataSourceMeta
  compact?: boolean
}

function toneClasses(accuracy: DataSourceMeta['accuracy']): string {
  switch (accuracy) {
    case 'LIVE_VERIFIED':
    case 'LOCAL_TELEMETRY':
    case 'PUBLIC_XRPL':
      return 'border-cyber-green/50 text-cyber-green bg-cyber-green/10'
    case 'TESTNET_VERIFIED':
      return 'border-cyber-purple/50 text-cyber-cyan bg-cyber-purple/15'
    case 'PUBLIC_DIRECTORY':
      return 'border-cyber-glow/45 text-cyber-glow bg-cyber-glow/10'
    case 'DERIVED':
      return 'border-cyber-yellow/50 text-cyber-yellow bg-cyber-yellow/10'
    case 'SIMULATED':
    case 'DEMO':
      return 'border-orange-400/45 text-orange-200 bg-orange-500/10'
    case 'MANUAL':
    case 'UNKNOWN':
    default:
      return 'border-cyber-border/60 text-cyber-muted bg-cyber-darker/50'
  }
}

export function DataAccuracyBadge({ meta, compact }: Props) {
  const label = getAccuracyLabel(meta.accuracy)
  const tip = [meta.sourceName, meta.warning, meta.sourceUrl ? `Source: ${meta.sourceUrl}` : null]
    .filter(Boolean)
    .join(' · ')

  if (compact) {
    return (
      <span
        className={`inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-[8px] font-cyber uppercase tracking-wide border ${toneClasses(meta.accuracy)}`}
        title={tip}
      >
        {label} · {meta.confidencePct}%
      </span>
    )
  }

  return (
    <span
      className={`inline-flex flex-col gap-0.5 rounded border px-2 py-1 text-[9px] leading-tight ${toneClasses(meta.accuracy)}`}
      title={tip}
    >
      <span className="font-cyber uppercase tracking-wide">
        {label} · {meta.confidencePct}%
      </span>
      {meta.sourceName && (
        <span className="text-[8px] text-cyber-muted normal-case tracking-normal line-clamp-2">{meta.sourceName}</span>
      )}
    </span>
  )
}
