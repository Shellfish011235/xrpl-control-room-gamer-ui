import type { TopologyFilters as FilterState } from '../../services/topology/topologyFilter'

interface TopologyFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const selectClass = 'max-w-full rounded-lg border border-cyber-border/60 bg-cyber-darker px-2.5 py-2 text-xs text-cyber-text outline-none focus:border-cyber-glow/60'

export function TopologyFilters({ filters, onChange }: TopologyFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyber-border/50 bg-cyber-darker/60 p-3">
      <span className="mr-1 text-[10px] font-cyber uppercase tracking-[0.16em] text-cyber-muted">Filter</span>
      <select aria-label="Evidence state" value={filters.evidence ?? 'all'} onChange={(event) => onChange({ ...filters, evidence: event.target.value as FilterState['evidence'] })} className={selectClass}>
        <option value="all">All evidence</option>
        <option value="observed">Observed</option>
        <option value="inferred">Inferred</option>
        <option value="unknown">Unknown</option>
      </select>
      <select aria-label="UNL membership" value={filters.unl ?? 'all'} onChange={(event) => onChange({ ...filters, unl: event.target.value as FilterState['unl'] })} className={selectClass}>
        <option value="all">Any UNL state</option>
        <option value="yes">UNL: yes</option>
        <option value="no">UNL: no</option>
        <option value="unknown">UNL: unknown</option>
      </select>
      <select aria-label="Endpoint visibility" value={filters.endpointVisibility ?? 'all'} onChange={(event) => onChange({ ...filters, endpointVisibility: event.target.value as FilterState['endpointVisibility'] })} className={selectClass}>
        <option value="all">Any endpoint</option>
        <option value="public">Public endpoint</option>
        <option value="partial">Partial visibility</option>
        <option value="private">Private endpoint</option>
        <option value="unknown">Endpoint unknown</option>
      </select>
      <select aria-label="Infrastructure attribution" value={filters.attribution ?? 'all'} onChange={(event) => onChange({ ...filters, attribution: event.target.value as FilterState['attribution'] })} className={selectClass}>
        <option value="all">Any attribution</option>
        <option value="known">Attribution known</option>
        <option value="unknown">Attribution unknown</option>
      </select>
      <button type="button" onClick={() => onChange({})} className="ml-auto rounded-lg border border-cyber-border/50 px-2.5 py-2 text-xs text-cyber-muted hover:border-cyber-glow/40 hover:text-cyber-text">
        Reset
      </button>
    </div>
  )
}
