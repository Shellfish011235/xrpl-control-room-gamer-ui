import { useEffect, useState } from 'react'
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react'

/** Only aggregated, non-custodial telemetry. No secrets, wallet balances, peer IDs or addresses. */
type Status = {
  schema_version: 1
  node_label: string
  observed_at: string
  service: 'running' | 'stopped' | 'unknown'
  network: 'xrpl-testnet'
  mode: 'periphery'
  uplinks_connected: number
  relay_connected: boolean
  fulfilled_packets: number
  rejected_packets: number
  expired_packets: number
  hub_validators_responding: number
  hub_validators_total: number
}

function parseStatus(raw: unknown): Status | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const numbers = ['uplinks_connected', 'fulfilled_packets', 'rejected_packets', 'expired_packets', 'hub_validators_responding', 'hub_validators_total']
  if (s.schema_version !== 1 || s.network !== 'xrpl-testnet' || s.mode !== 'periphery') return null
  if (!['running', 'stopped', 'unknown'].includes(String(s.service))) return null
  if (typeof s.node_label !== 'string' || s.node_label.length > 48) return null
  if (typeof s.observed_at !== 'string' || !Number.isFinite(Date.parse(s.observed_at))) return null
  if (typeof s.relay_connected !== 'boolean') return null
  if (numbers.some(k => typeof s[k] !== 'number' || !Number.isSafeInteger(s[k]) || (s[k] as number) < 0)) return null
  if ((s.hub_validators_responding as number) > (s.hub_validators_total as number)) return null
  return s as Status
}

export function DassieTelemetryPanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [issue, setIssue] = useState('Connecting to read-only status adapter…')
  useEffect(() => {
    let live = true
    const refresh = async () => {
      try {
        // Same-origin ONLY. Must be backed by an authenticated operator endpoint,
        // not a public proxy to Dassie administration or wallet services.
        const response = await fetch('/api/dassie/status', {
          cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Status adapter is not connected')
        const result = parseStatus(await response.json())
        if (!result) throw new Error('Invalid telemetry contract')
        if (live) { setStatus(result); setIssue('') }
      } catch {
        if (live) { setStatus(null); setIssue('Status unavailable — authenticated adapter not configured or offline') }
      }
    }
    void refresh()
    const interval = window.setInterval(() => { void refresh() }, 30_000)
    return () => { live = false; window.clearInterval(interval) }
  }, [])
  const ageMs = status ? Date.now() - Date.parse(status.observed_at) : Infinity
  const fresh = status !== null && ageMs >= 0 && ageMs <= 120_000
  const healthy = fresh && status?.service === 'running' && status.uplinks_connected > 0 && status.relay_connected

  return (
    <section className="neon-panel p-4 space-y-3" aria-label="S9 Dassie telemetry">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-cyber-cyan" />
        <h3 className="font-cyber text-cyber-text">S9 Dassie · XRPL Testnet</h3>
        <span className={healthy ? 'text-cyber-green text-xs' : 'text-cyber-yellow text-xs'}>
          {healthy ? 'Observed / Connected' : fresh ? 'Observed / Attention' : 'Offline / Unverified'}
        </span>
      </div>
      <p className="text-xs text-cyber-muted">Read-only periphery node monitoring. Does not expose funds, private peer identities, administrative access, or payment commands.</p>
      {fresh && status ? (
        <div className="grid grid-cols-2 gap-3 text-sm text-cyber-text">
          <span>Uplinks: <strong>{status.uplinks_connected}</strong></span>
          <span>Relay: <strong>{status.relay_connected ? 'Connected' : 'Disconnected'}</strong></span>
          <span>Fulfilled: <strong>{status.fulfilled_packets}</strong></span>
          <span>Rejected: <strong>{status.rejected_packets}</strong></span>
          <span>Expired: <strong>{status.expired_packets}</strong></span>
          <span>Hub validators: <strong>{status.hub_validators_responding}/{status.hub_validators_total}</strong></span>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-cyber-yellow"><AlertTriangle size={14} /> {status ? 'Telemetry stale (over 2 minutes)' : issue}</p>
      )}
      <p className="flex items-center gap-2 text-[11px] text-cyber-muted">
        <ShieldCheck size={13} /> Observation only · No signing or transaction submission
        {status && <> · Last observed {new Date(status.observed_at).toLocaleString()}</>}
      </p>
    </section>
  )
}
