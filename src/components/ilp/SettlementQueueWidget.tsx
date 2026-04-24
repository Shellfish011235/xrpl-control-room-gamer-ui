import { Inbox, Timer, CheckCircle, Ban, XCircle, RefreshCw, Activity } from 'lucide-react'
import type { SettlementQueueSummary } from '../../types/settlement'
import { formatDurationSeconds } from '../../lib/settlement/formatters'
import { getMockSettlementQueueSummary } from '../../lib/settlement/mockSettlementData'

type Props = {
  queue?: SettlementQueueSummary
  /** false = structurally empty (no demo numbers) */
  useDemoData?: boolean
  compact?: boolean
}

function StatBox({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
  title: tip,
}: {
  icon: typeof Inbox
  label: string
  value: string | number
  sub?: string
  tone?: 'default' | 'warning' | 'ok' | 'danger'
  title?: string
}) {
  const t =
    tone === 'ok'
      ? 'border-cyber-green/30 text-cyber-green'
      : tone === 'warning'
        ? 'border-cyber-yellow/30 text-cyber-yellow'
        : tone === 'danger'
          ? 'border-red-500/30 text-red-400'
          : 'border-cyber-border/50 text-cyber-text'
  return (
    <div className={`min-w-0 rounded-md border p-2 ${t}`} title={tip}>
      <div className="flex items-start gap-1.5 text-[9px] text-cyber-muted mb-0.5 min-h-[2.5rem]">
        <Icon size={12} className="shrink-0 mt-0.5" />
        <span className="font-cyber uppercase tracking-wide leading-tight break-words [overflow-wrap:anywhere]">
          {label}
        </span>
      </div>
      <p className="text-lg font-cyber leading-tight break-all sm:break-normal tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-cyber-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export function SettlementQueueWidget({ queue, useDemoData = true, compact: compactProp }: Props) {
  const q = queue ?? getMockSettlementQueueSummary(useDemoData)
  const compact = compactProp !== false
  if (!useDemoData && !queue) {
    return (
      <div className="rounded-lg border border-cyber-border/50 bg-cyber-darker/30 p-3 text-[10px] text-cyber-muted">
        <span className="font-cyber">Queue status</span> — no data source configured.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-cyber-cyan/25 bg-cyber-darker/50 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={14} className="text-cyber-cyan shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-cyber uppercase tracking-wider text-cyber-cyan">Queue status</p>
            <p className="text-[9px] text-cyber-muted truncate">Settlements &amp; two-phase state (demo)</p>
          </div>
        </div>
        {useDemoData && (
          <span className="text-[8px] px-1.5 py-0.5 rounded border border-cyber-yellow/30 text-cyber-yellow shrink-0">
            DEMO
          </span>
        )}
      </div>
      {compact ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          <StatBox icon={Inbox} label="Pending" value={q.pendingCount} tone="warning" />
          <StatBox icon={CheckCircle} label="Posted" value={q.postedCount} tone="ok" />
          <StatBox icon={Ban} label="Void" value={q.voidedCount} />
          <StatBox icon={XCircle} label="Expired" value={q.expiredCount} />
          <StatBox icon={RefreshCw} label="Corrections" value={q.correctedCount} sub="transfers" />
          <StatBox
            icon={Timer}
            label="Oldest pend."
            value={formatDurationSeconds(q.oldestPendingAgeSeconds)}
            sub="age"
            tone={q.oldestPendingAgeSeconds > 300 ? 'warning' : 'default'}
          />
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-2 sm:grid-cols-3 gap-2.5">
          <StatBox icon={Inbox} label="Pending" value={q.pendingCount} />
          <StatBox icon={CheckCircle} label="Posted" value={q.postedCount} tone="ok" />
          <StatBox icon={Ban} label="Voided" value={q.voidedCount} />
          <StatBox icon={XCircle} label="Expired" value={q.expiredCount} />
          <StatBox
            icon={RefreshCw}
            label="Corrections"
            value={q.correctedCount}
            sub="transfers"
            title="Count of correction transfers in the queue"
          />
          <StatBox
            icon={Timer}
            label="Oldest unsettled"
            value={formatDurationSeconds(q.oldestPendingAgeSeconds)}
            sub="oldest age"
            tone={q.oldestPendingAgeSeconds > 300 ? 'warning' : 'default'}
            title="Age of oldest item still in pending state"
          />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[9px] text-cyber-muted border-t border-cyber-border/30 pt-2">
        <span>Last posted settlement</span>
        <span className="text-cyber-cyan/90">
          {q.lastPostedAt ? new Date(q.lastPostedAt).toLocaleString() : '—'}
        </span>
      </div>
    </div>
  )
}
