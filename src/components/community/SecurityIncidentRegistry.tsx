import { useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, Search, ShieldAlert } from 'lucide-react'
import {
  incidentCategories,
  securityIncidents,
  type IncidentCategory,
  type SecurityIncident,
} from '../../data/securityIncidents'

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function shortAddress(address: string): string {
  if (address.length <= 22) return address
  return `${address.slice(0, 10)}…${address.slice(-8)}`
}

function confidenceClass(confidence: string): string {
  if (confidence === 'confirmed') return 'text-cyber-green border-cyber-green/40 bg-cyber-green/10'
  if (confidence === 'attributed' || confidence === 'high') return 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10'
  if (confidence === 'suspected' || confidence === 'medium') return 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10'
  return 'text-cyber-muted border-cyber-border/50 bg-cyber-darker/50'
}

export default function SecurityIncidentRegistry() {
  const [query, setQuery] = useState('')
  const [chain, setChain] = useState('all')
  const [category, setCategory] = useState<'all' | IncidentCategory>('all')
  const [selected, setSelected] = useState<SecurityIncident | null>(null)

  const chains = useMemo(
    () => Array.from(new Set(securityIncidents.flatMap((incident) => incident.affectedChains))).sort(),
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return securityIncidents.filter((incident) => {
      const matchesChain = chain === 'all' || incident.affectedChains.includes(chain)
      const matchesCategory = category === 'all' || incident.category === category
      const haystack = [
        incident.name,
        incident.summary,
        incident.attackVector,
        incident.rootCause,
        incident.attribution.actor ?? '',
        ...incident.affectedChains,
        ...incident.affectedProjects,
        ...incident.addresses.map((item) => item.address),
      ].join(' ').toLowerCase()
      return matchesChain && matchesCategory && (!q || haystack.includes(q))
    })
  }, [category, chain, query])

  const totalTracked = securityIncidents.reduce((sum, incident) => sum + incident.amountUsd, 0)

  return (
    <section className="w-full pb-8">
      <div className="cyber-panel p-4 md:p-5 border border-cyber-red/25">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-cyber-red" />
              <h2 className="font-cyber text-base text-cyber-red">SECURITY INCIDENT REGISTRY</h2>
            </div>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-cyber-muted">
              Evidence-backed records of major crypto incidents. Wallet labels and attribution are shown only with a
              source and confidence level; disputed or unknown facts stay marked as such.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center shrink-0">
            <div className="rounded border border-cyber-red/25 bg-cyber-darker/60 px-3 py-2">
              <p className="font-cyber text-lg text-cyber-red">{securityIncidents.length}</p>
              <p className="text-[9px] text-cyber-muted">CURATED INCIDENTS</p>
            </div>
            <div className="rounded border border-cyber-yellow/25 bg-cyber-darker/60 px-3 py-2">
              <p className="font-cyber text-lg text-cyber-yellow">{formatUsd(totalTracked)}</p>
              <p className="text-[9px] text-cyber-muted">REPORTED LOSSES</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-cyber-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search incident, project, actor, or wallet address…"
              className="w-full rounded border border-cyber-border bg-cyber-darker/70 py-2 pl-8 pr-3 text-xs text-cyber-text placeholder:text-cyber-muted/60"
            />
          </label>
          <select
            value={chain}
            onChange={(event) => setChain(event.target.value)}
            className="rounded border border-cyber-border bg-cyber-darker/70 px-2 py-2 text-xs text-cyber-text"
          >
            <option value="all">All chains</option>
            {chains.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as 'all' | IncidentCategory)}
            className="rounded border border-cyber-border bg-cyber-darker/70 px-2 py-2 text-xs text-cyber-text"
          >
            <option value="all">All attack types</option>
            {Object.entries(incidentCategories).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => setSelected(selected?.id === incident.id ? null : incident)}
              className="w-full rounded border border-cyber-border/60 bg-cyber-darker/45 p-3 text-left transition hover:border-cyber-red/40 hover:bg-cyber-darker/75"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-cyber-text">{incident.name}</p>
                  <p className="mt-0.5 text-[10px] text-cyber-muted">
                    {incident.date} · {incident.affectedChains.join(' / ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-cyber text-sm text-cyber-red">{formatUsd(incident.amountUsd)}</p>
                  <p className="text-[9px] text-cyber-muted">{incidentCategories[incident.category]}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-cyber-muted">{incident.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {incident.affectedProjects.map((project) => (
                  <span key={project} className="rounded bg-cyber-cyan/10 px-1.5 py-0.5 text-[9px] text-cyber-cyan">
                    {project}
                  </span>
                ))}
                <span className={`rounded border px-1.5 py-0.5 text-[9px] ${confidenceClass(incident.attribution.confidence)}`}>
                  {incident.attribution.actor ?? 'Actor unknown'} · {incident.attribution.confidence}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded border border-cyber-border/50 p-5 text-center text-xs text-cyber-muted">
              No incidents match those filters.
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-4 rounded border border-cyber-red/30 bg-cyber-darker/70 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-cyber-yellow" />
              <div>
                <p className="font-cyber text-sm text-cyber-text">{selected.name}</p>
                <p className="text-[10px] text-cyber-muted">{selected.summary}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-cyber-muted">How it happened</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-cyber-text">{selected.attackVector}</p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-cyber-muted">Root cause</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-cyber-text">{selected.rootCause}</p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-cyber-muted">Attribution</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-cyber-text">{selected.attribution.basis}</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-cyber-muted">Associated addresses</p>
                <div className="mt-1 space-y-1.5">
                  {selected.addresses.length > 0 ? selected.addresses.map((item) => (
                    <a
                      key={item.address}
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.address}
                      className="block rounded border border-cyber-border/50 bg-black/15 px-2 py-1.5 hover:border-cyber-cyan/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[9px] text-cyber-cyan">{shortAddress(item.address)}</code>
                        <span className={`rounded border px-1 py-0.5 text-[8px] ${confidenceClass(item.confidence)}`}>
                          {item.confidence}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[8px] text-cyber-muted">{item.chain} · {item.role}</p>
                    </a>
                  )) : (
                    <p className="rounded border border-cyber-border/40 p-2 text-[9px] text-cyber-muted">
                      No address is published in the cited authoritative source for this record.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-cyber-border/40 pt-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-cyber-muted">Sources</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {selected.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-cyber-cyan/25 bg-cyber-cyan/10 px-2 py-1 text-[9px] text-cyber-cyan hover:bg-cyber-cyan/20"
                  >
                    <ExternalLink size={9} />
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 text-[9px] leading-relaxed text-cyber-muted">
          This registry is for incident awareness and defensive research. A listed address is not independently labeled
          by Control Room beyond what the cited source supports.
        </p>
      </div>
    </section>
  )
}
