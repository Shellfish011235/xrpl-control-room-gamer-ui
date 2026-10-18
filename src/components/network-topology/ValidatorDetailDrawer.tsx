import { X } from 'lucide-react'
import type { TopologyNode } from '../../types/networkTopology'

export function ValidatorDetailDrawer({ node, onClose }: { node: TopologyNode | null; onClose: () => void }) {
  if (!node) return null

  const agreement = node.consensus?.agreement

  return (
    <aside className="rounded-2xl border border-cyber-border/60 bg-cyber-darker/90 p-4 xl:sticky xl:top-4 xl:max-h-[760px] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-cyber uppercase tracking-[0.16em] text-cyber-muted">{node.kind}</p>
          <h2 className="mt-1 truncate font-cyber text-lg text-cyber-text">{node.label}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-cyber-muted hover:bg-cyber-border/30 hover:text-cyber-text" aria-label="Close details">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-3 text-xs">
        <Detail label="Evidence" value={node.evidence} />
        <Detail label="UNL" value={node.trust?.unl == null ? 'Unknown' : node.trust.unl ? 'Yes' : 'No'} />
        <Detail label="Operator / domain" value={node.operator || node.domain || 'Unknown'} />
        <Detail label="Endpoint visibility" value={node.endpointVisibility} />
        <Detail label="Region" value={node.infrastructure?.region || 'Unknown'} />
        <Detail label="ASN" value={node.infrastructure?.asn || 'Unknown'} />
        <Detail label="Hosting provider" value={node.infrastructure?.provider || 'Unknown'} />
        <Detail label="Agreement" value={agreement == null ? 'Unknown' : `${(agreement * 100).toFixed(2)}%`} />
        {node.validatorPublicKey && <Detail label="Validator key" value={node.validatorPublicKey} mono />}
      </div>

      <div className="mt-5 rounded-xl border border-cyber-yellow/25 bg-cyber-yellow/5 p-3 text-[11px] leading-relaxed text-cyber-muted">
        Unknown infrastructure means the public observation stops here. It is not automatically evidence of an institution, private routing relationship, or hidden validator network.
      </div>
    </aside>
  )
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-cyber-border/30 pb-2 last:border-0">
      <p className="text-[10px] uppercase tracking-wider text-cyber-muted">{label}</p>
      <p className={`mt-1 break-words text-cyber-text ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</p>
    </div>
  )
}
