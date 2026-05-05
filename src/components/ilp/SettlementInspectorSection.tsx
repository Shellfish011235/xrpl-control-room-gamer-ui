import { AlertCircle, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react'
import { DataAccuracyBadge } from '../common/DataAccuracyBadge'
import type { IlpCorridorInspectorSettlement, OperatorSettlementStatus } from '../../types/settlement'
import { getMockInspectorSettlement, getMockCorridorExposure } from '../../lib/settlement/mockSettlementData'
import { classifyMockSettlementData } from '../../services/dataAccuracyClassifier'
import type { OperatorViewMode } from './CorridorExposurePanel'

type Props = {
  corridorId: string
  settlement?: IlpCorridorInspectorSettlement
  useDemoData?: boolean
  viewMode?: OperatorViewMode
}

const demoSettlementMeta = classifyMockSettlementData()

function exceptionBadge(
  s: IlpCorridorInspectorSettlement['exceptionOrCorrection'],
  st?: OperatorSettlementStatus
) {
  if (s === 'exception' || st === 'exception') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-red-500/50 text-red-300 bg-red-500/10">
        <AlertCircle size={10} />
        Exception
      </span>
    )
  }
  if (s === 'correction' || st === 'correcting') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-orange-400/50 text-orange-200 bg-orange-500/10">
        <RefreshCw size={10} />
        Correction
      </span>
    )
  }
  if (s === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-cyber-cyan/40 text-cyber-cyan">
        Pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-cyber-green/40 text-cyber-green">
      <CheckCircle size={10} />
      Clear
    </span>
  )
}

export function SettlementInspectorSection({
  corridorId,
  settlement,
  useDemoData = false,
  viewMode = 'flow',
}: Props) {
  const s = settlement ?? (useDemoData ? getMockInspectorSettlement(corridorId) : null)
  const ex = useDemoData ? getMockCorridorExposure(corridorId) : null

  if (!s) {
    return (
      <div className="p-3 rounded bg-cyber-darker/40 border border-cyber-border/30">
        <p className="text-[10px] font-cyber text-cyber-muted uppercase mb-1">Settlement state</p>
        <p className="text-xs text-cyber-muted leading-snug">
          No verified Rafiki/Open Payments settlement telemetry configured. Connect a local Rafiki webhook feed to
          replace demo settlement data.
        </p>
      </div>
    )
  }

  const lagWarn = s.settlementLag !== '—' && /^\d+m$/.test(s.settlementLag) && parseInt(s.settlementLag, 10) >= 45
  const exposureCallout = viewMode === 'exposure' && ex

  return (
    <div
      className={
        'p-3 rounded border ' +
        (exposureCallout
          ? 'bg-amber-500/5 border-amber-500/25'
          : 'bg-cyber-darker/50 border-cyber-border/40')
      }
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <p className="text-[10px] font-cyber uppercase tracking-wider text-cyber-cyan">Settlement state</p>
        <div className="flex items-center gap-2 flex-wrap">
          {useDemoData && settlement === undefined && <DataAccuracyBadge meta={demoSettlementMeta} compact />}
          {ex?.settlementStatus && (
            <span
              className="text-[9px] text-cyber-muted"
              title="Aggregate settlement posture for this route (from internal ledger / connector model)"
            >
              Operator: {ex.settlementStatus}
            </span>
          )}
        </div>
      </div>

      {exposureCallout && (
        <p className="text-[9px] text-amber-200/90 mb-2 flex items-center gap-1">
          <TrendingUp size={10} />
          Net exposure: {ex.netExposure} · Credit utilization {ex.creditUtilizationPct.toFixed(1)}%
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
          <p className="text-cyber-muted text-[9px] mb-0.5">Pending balance</p>
          <p className={viewMode === 'settlement' ? 'text-cyber-cyan font-cyber' : 'text-cyber-text'}>
            {s.pendingBalance}
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
          <p className="text-cyber-muted text-[9px] mb-0.5">Posted balance</p>
          <p className="text-cyber-green/90 font-cyber">{s.postedBalance}</p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
          <p className="text-cyber-muted text-[9px] mb-0.5">Net owed</p>
          <p className="text-cyber-text">{s.netOwed}</p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
          <p className="text-cyber-muted text-[9px] mb-0.5">Fee accrual</p>
          <p className="text-cyber-text">{s.feeAccrual ?? '—'}</p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
          <p className="text-cyber-muted text-[9px] mb-0.5">Settlement lag</p>
          <p className={lagWarn ? 'text-cyber-yellow' : 'text-cyber-text'}>{s.settlementLag}</p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
          <p className="text-cyber-muted text-[9px] mb-0.5">Exceptions / corrections</p>
          <div className="mt-0.5">{exceptionBadge(s.exceptionOrCorrection, ex?.settlementStatus)}</div>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30 col-span-2">
          <p className="text-cyber-muted text-[9px] mb-0.5">Last settlement</p>
          <p className="text-cyber-cyan/90 text-xs">
            {new Date(s.lastSettlementAt).toLocaleString()}
          </p>
        </div>
      </div>
      {s.notes && (
        <p className="text-[9px] text-cyber-muted mt-2 border-t border-cyber-border/20 pt-2 leading-snug">{s.notes}</p>
      )}
    </div>
  )
}
