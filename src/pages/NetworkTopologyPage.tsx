import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react'
import { useLiveNetworkData } from '../hooks/useLiveNetworkData'
import { useLiveLedgerStream } from '../hooks/useLiveLedgerStream'
import { buildTopologyDataset } from '../services/topology/topologyDataAdapter'
import { filterTopologyDataset, type TopologyFilters as FilterState } from '../services/topology/topologyFilter'
import { calculateTopologyVisibility } from '../services/topology/topologyVisibility'
import type { TopologyNode } from '../types/networkTopology'
import { TopologyCanvas, TopologyFilters, TopologyLegend, TopologySummary, ValidatorDetailDrawer } from '../components/network-topology'

export default function NetworkTopologyPage() {
  const { validators, nodes, stats, isLoading, error, refetch } = useLiveNetworkData({ refreshInterval: 60_000 })
  const { connected, tps } = useLiveLedgerStream()
  const [selected, setSelected] = useState<TopologyNode | null>(null)
  const [filters, setFilters] = useState<FilterState>({})

  const dataset = useMemo(
    () => buildTopologyDataset(validators, nodes, stats?.lastUpdated),
    [validators, nodes, stats?.lastUpdated],
  )
  const summary = useMemo(() => calculateTopologyVisibility(dataset), [dataset])
  const filteredDataset = useMemo(() => filterTopologyDataset(dataset, filters), [dataset, filters])
  const visibleSelected = selected && filteredDataset.nodes.some((node) => node.id === selected.id) ? selected : null
  const handleSelect = useCallback((node: TopologyNode | null) => setSelected(node), [])

  return (
    <div className="mx-auto w-full max-w-[1800px] px-3 pb-10 sm:px-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/network" className="inline-flex items-center gap-1.5 text-xs text-cyber-muted hover:text-cyber-glow">
            <ArrowLeft size={14} /> Back to Network
          </Link>
          <h1 className="mt-2 font-cyber text-2xl text-cyber-text sm:text-3xl">XRPL Consensus Topology</h1>
          <p className="mt-1 max-w-3xl text-sm text-cyber-muted">
            Relationship-first view of what is observable about XRPL validators and peers. Unknown connections stay unknown instead of being drawn as facts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-cyber-border/70 bg-cyber-darker/70 px-3 py-2 text-xs text-cyber-glow hover:border-cyber-glow/50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh snapshot
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-cyber-border/50 bg-cyber-darker/60 px-3 py-2 text-xs text-cyber-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-cyber-green' : 'bg-cyber-red'}`} />
          Live ledger stream {connected ? 'connected' : 'disconnected'}
        </span>
        <span className="inline-flex items-center gap-1.5"><Activity size={13} /> {tps} tx/s observed</span>
        <span className="text-cyber-yellow">Geographic origin and hop-by-hop transaction paths are not inferred.</span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-cyber-red/30 bg-cyber-red/5 p-3 text-sm text-cyber-red">
          Live topology snapshot unavailable: {error}
        </div>
      )}

      <TopologySummary summary={summary} />

      <div className="mt-4 space-y-3">
        <TopologyFilters filters={filters} onChange={setFilters} />
        <TopologyLegend />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {isLoading && dataset.nodes.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-cyber-border/60 bg-cyber-darker/60 text-sm text-cyber-muted">
              Loading live validator snapshot…
            </div>
          ) : dataset.nodes.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-cyber-border/60 bg-cyber-darker/60 p-8 text-center text-sm text-cyber-muted">
              No live validator topology data is available right now. The page is intentionally not substituting mock connections.
            </div>
          ) : filteredDataset.nodes.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-cyber-border/60 bg-cyber-darker/60 p-8 text-center text-sm text-cyber-muted">
              No topology records match the current filters. Reset the filters to restore the full observed snapshot.
            </div>
          ) : (
            <TopologyCanvas dataset={filteredDataset} selectedId={visibleSelected?.id ?? null} onSelect={handleSelect} />
          )}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-cyber-muted">
            <span><span className="mr-1 text-cyber-glow">●</span> Validator</span>
            <span><span className="mr-1 text-cyber-blue">●</span> Public peer</span>
            <span><span className="mr-1 text-cyber-green">●</span> UNL membership observed</span>
            <span>Canvas is fixed: click nodes to focus; no drag-to-find behavior.</span>
          </div>
        </div>
        <ValidatorDetailDrawer node={visibleSelected} onClose={() => setSelected(null)} />
      </div>
    </div>
  )
}
