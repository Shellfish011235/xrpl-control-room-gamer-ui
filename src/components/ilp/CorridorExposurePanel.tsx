import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import type { CorridorExposure } from '../../types/settlement'
import { formatUtilization } from '../../lib/settlement/formatters'
import { getMockCorridorExposuresList } from '../../lib/settlement/mockSettlementData'

export type OperatorViewMode = 'flow' | 'settlement' | 'exposure'

const statusClass: Record<CorridorExposure['settlementStatus'], string> = {
  settled: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  pending: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40',
  stale: 'bg-cyber-yellow/15 text-cyber-yellow border-cyber-yellow/40',
  exception: 'bg-red-500/10 text-red-300 border-red-500/40',
  correcting: 'bg-cyber-orange/15 text-orange-300 border-orange-400/40',
}

const statusLabel: Record<CorridorExposure['settlementStatus'], string> = {
  settled: 'Settled',
  pending: 'Pending',
  stale: 'Stale',
  exception: 'Exception',
  correcting: 'Correcting',
}

type Props = {
  /** When absent, uses demo data from mock layer (clearly for operator preview). */
  exposures?: CorridorExposure[]
  viewMode?: OperatorViewMode
  compact?: boolean
  /** Wider ILP bar: more horizontal room and taller table viewport (less “compressed” vertically). */
  expandedWide?: boolean
}

export function CorridorExposurePanel({
  exposures,
  viewMode = 'flow',
  compact = false,
  expandedWide = false,
}: Props) {
  const rows = exposures?.length ? exposures : getMockCorridorExposuresList(true)
  const emphasizeNet = viewMode === 'exposure' || viewMode === 'settlement'
  const emphasizePending = viewMode === 'settlement'

  if (compact) {
    return (
      <div className="rounded-lg border border-cyber-border/50 bg-cyber-darker/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-cyber uppercase tracking-wider text-cyber-muted">Corridor exposure (demo)</span>
          <span className="text-[9px] text-cyber-muted">{rows.length} rows</span>
        </div>
        <ul className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
          {rows.slice(0, 3).map((r) => (
            <li key={r.corridorId} className="flex items-center justify-between text-[10px] gap-2">
              <span className="text-cyber-text truncate">{r.source.split(' ')[0]}…→…{r.destination.split(' ')[0]}</span>
              <span className={emphasizeNet ? 'text-cyber-yellow font-cyber shrink-0' : 'text-cyber-muted shrink-0'}>
                {r.netExposure}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-cyber-purple/30 bg-cyber-darker/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={14} className="text-cyber-purple" />
        <div>
          <p className="text-[10px] font-cyber uppercase tracking-wider text-cyber-purple">Corridor exposure</p>
          <p className="text-[9px] text-cyber-muted">Internal balances &amp; net exposure (demo / TigerBeetle-style model)</p>
        </div>
      </div>
      <div
        className={
          'w-full min-w-0 -mx-1 overflow-x-auto overflow-y-auto custom-scrollbar rounded border border-cyber-border/40 px-1 ' +
          (expandedWide
            ? 'max-h-[min(72vh,36rem)] lg:max-h-[min(80vh,44rem)]'
            : 'max-h-52')
        }
      >
        {/*
          w-max: columns size to content so headers are not letter-boxed/ellipsis;
          min-w: scroll container shows full text via horizontal scroll if viewport is still tight.
        */}
        <table className="w-max min-w-full border-separate border-spacing-0 text-left text-[9px] sm:text-[10px]">
          <caption className="sr-only">Corridor exposure: pending and posted debits and credits, net, utilization, status</caption>
          <thead className="sticky top-0 z-10 border-b border-cyber-border/50 bg-cyber-darker/95 backdrop-blur-sm">
            <tr className="text-cyber-muted">
              <th scope="col" className="min-w-[9rem] max-w-[12rem] whitespace-normal p-1.5 text-left align-bottom">
                Source / destination
              </th>
              <th scope="col" className="p-1.5 whitespace-nowrap" title="Asset path">
                Asset path
              </th>
              <th
                scope="col"
                className={`whitespace-nowrap p-1.5 text-right align-bottom font-cyber ${emphasizePending ? 'text-cyber-cyan' : ''}`}
                title="Pending debits"
              >
                Pend. debits
              </th>
              <th
                scope="col"
                className={`whitespace-nowrap p-1.5 text-right align-bottom font-cyber ${emphasizePending ? 'text-cyber-cyan' : ''}`}
                title="Pending credits"
              >
                Pend. credits
              </th>
              <th
                scope="col"
                className="min-w-[6.5rem] whitespace-nowrap p-1.5 text-right align-bottom"
                title="Posted debits / posted credits"
              >
                Posted DB / CR
              </th>
              {emphasizeNet ? (
                <th
                  scope="col"
                  className="min-w-[4.5rem] whitespace-nowrap p-1.5 text-right text-cyber-yellow align-bottom"
                  title="Net exposure"
                >
                  Net exp.
                </th>
              ) : (
                <th scope="col" className="min-w-[4.5rem] whitespace-nowrap p-1.5 text-right align-bottom" title="Net exposure">
                  Net exp.
                </th>
              )}
              <th
                scope="col"
                className="min-w-[3.25rem] whitespace-nowrap p-1.5 text-right align-bottom"
                title="Credit utilization"
              >
                Util.
              </th>
              <th scope="col" className="min-w-[7rem] whitespace-nowrap p-1.5 text-right align-bottom" title="Last settlement time">
                Last
              </th>
              <th scope="col" className="min-w-[4.5rem] whitespace-nowrap p-1.5 align-bottom">
                Status
              </th>
              <th scope="col" className="w-8 min-w-[2rem] whitespace-nowrap p-1.5 text-center align-bottom" title="Exceptions">
                Exc.
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.corridorId} className="border-b border-cyber-border/30 hover:bg-cyber-darker/50">
                <td className="max-w-[12rem] p-1.5 align-top break-words">
                  <p className="text-cyber-text">{r.source}</p>
                  <p className="text-cyber-muted text-[9px]">{r.destination}</p>
                </td>
                <td className="whitespace-nowrap p-1.5 text-cyber-cyan/90">{r.assetPath}</td>
                <td
                  className={`whitespace-nowrap p-1.5 text-right font-mono tabular-nums ${
                    emphasizePending ? 'text-cyber-cyan' : 'text-cyber-text/80'
                  }`}
                >
                  {r.debitsPending}
                </td>
                <td
                  className={`whitespace-nowrap p-1.5 text-right font-mono tabular-nums ${
                    emphasizePending ? 'text-cyber-cyan' : 'text-cyber-text/80'
                  }`}
                >
                  {r.creditsPending}
                </td>
                <td className="min-w-[6.5rem] whitespace-nowrap p-1.5 text-right font-mono text-cyber-text/90">
                  {r.debitsPosted} / {r.creditsPosted}
                </td>
                <td
                  className={`whitespace-nowrap p-1.5 text-right font-mono tabular-nums ${
                    emphasizeNet ? 'text-cyber-yellow' : 'text-cyber-text'
                  }`}
                >
                  {r.netExposure}
                </td>
                <td className="whitespace-nowrap p-1.5 text-right tabular-nums">
                  {formatUtilization(r.creditUtilizationPct)}
                </td>
                <td
                  className="whitespace-nowrap p-1.5 text-right text-[9px] text-cyber-muted"
                  title="Last settlement (operator clock)"
                >
                  {new Date(r.lastSettlementAt).toLocaleString()}
                </td>
                <td className="p-1.5">
                  <span
                    className={`inline-flex max-w-full items-center gap-0.5 whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] ${statusClass[r.settlementStatus]}`}
                  >
                    {r.settlementStatus === 'settled' && <CheckCircle size={10} className="shrink-0" />}
                    {r.settlementStatus === 'stale' && <Clock size={10} className="shrink-0" />}
                    {r.settlementStatus === 'exception' && <AlertTriangle size={10} className="shrink-0" />}
                    {statusLabel[r.settlementStatus]}
                  </span>
                </td>
                <td className="p-1.5 text-center">
                  {r.exceptionCount > 0 ? <span className="text-red-400 font-cyber tabular-nums">{r.exceptionCount}</span> : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
