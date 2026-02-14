// Full Network Topology – aggregates Validators, ILP, Corridors, Bridges & Chains from all Network tabs

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, ExternalLink, Link2 } from 'lucide-react';
import { useILPStore } from '../../store/ilpStore';
import { getUnifiedTopology } from '../../data/unifiedTopology';
import type { UnifiedNode, UnifiedEdge, UnifiedNodeType, UnifiedEdgeType } from '../../data/unifiedTopology';

// Larger viewBox so outer rings (hubs ~72, partners ~88) and labels are never clipped
const VIEWBOX = { w: 900, h: 720 };
const CENTER = { x: VIEWBOX.w / 2, y: VIEWBOX.h / 2 };
const SCALE = 3.8; // topology coords ~ -90..90; scale so radius 88 fits with margin

const NODE_COLORS: Record<UnifiedNodeType, string> = {
  ledger: '#00D4FF',
  validator_hub: '#FFD700',
  odl_partner: '#00FF88',
  chain: '#A855F7',
  corridor_region: '#14b8a6',
};

const EDGE_COLORS: Record<UnifiedEdgeType, string> = {
  ilp: '#00D4FF',
  validates: '#FFD700',
  odl: '#00FF88',
  bridge: '#A855F7',
  corridor: '#14b8a6',
  partner_corridor: '#64748b',
};

function toSvg(p: { x: number; y: number }) {
  return { x: CENTER.x + p.x * SCALE, y: CENTER.y - p.y * SCALE };
}

const NODE_TYPE_LABELS: Record<UnifiedNodeType, string> = {
  ledger: 'Ledger & ILP',
  validator_hub: 'Validator hub',
  odl_partner: 'ODL partner & corridor',
  chain: 'Chain & bridge',
  corridor_region: 'Corridor region',
};

function NodeDetailPanel({
  node,
  nodes,
  edges,
  onClose,
}: {
  node: UnifiedNode;
  nodes: UnifiedNode[];
  edges: UnifiedEdge[];
  onClose: () => void;
}) {
  const nodeById = useMemo(() => {
    const m: Record<string, UnifiedNode> = {};
    nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const connectedEdges = useMemo(() => {
    return edges.filter((e) => e.from === node.id || e.to === node.id);
  }, [edges, node.id]);

  const otherNodeLabel = (edge: UnifiedEdge): string => {
    const otherId = edge.from === node.id ? edge.to : edge.from;
    const other = nodeById[otherId];
    return other ? (other.shortLabel ?? other.label) : otherId;
  };

  const typeLabel = NODE_TYPE_LABELS[node.type] ?? node.type;

  return (
    <div
      className="mt-4 p-4 rounded-lg border border-cyber-cyan/40 bg-cyber-darker/90 text-left flex-shrink-0 max-h-[320px] overflow-y-auto"
      role="dialog"
      aria-label={`Details for ${node.label}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="font-cyber text-cyber-cyan text-sm">{node.label}</h4>
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider">{typeLabel}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-cyber-border/50 text-cyber-muted hover:text-cyber-text transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <section className="mb-3">
        <h5 className="text-[10px] uppercase text-cyber-muted tracking-wider mb-1.5 flex items-center gap-1">
          <Link2 size={10} /> Integration
        </h5>
        <ul className="text-xs text-cyber-text space-y-1">
          {connectedEdges.length === 0 ? (
            <li className="text-cyber-muted">No edges in current view</li>
          ) : (
            connectedEdges.map((edge) => (
              <li key={`${edge.from}-${edge.to}-${edge.type}`}>
                <span className="text-cyber-muted">↔</span>{' '}
                <span className="text-cyber-glow">{otherNodeLabel(edge)}</span>
                {' · '}
                <span className="text-cyber-muted">{edge.type}</span>
                {edge.label && <span className="text-cyber-muted"> ({edge.label})</span>}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h5 className="text-[10px] uppercase text-cyber-muted tracking-wider mb-1.5">Details</h5>
        <div className="text-xs text-cyber-text space-y-1.5">
          {node.type === 'ledger' && node.data?.ledger && (
            <>
              <p>{(node.data.ledger as { name?: string }).name}</p>
              <p className="text-cyber-muted">Symbol: {(node.data.ledger as { symbol?: string }).symbol ?? node.id}</p>
            </>
          )}
          {node.type === 'validator_hub' && node.data?.hub && (
            (() => {
              const hub = node.data.hub as { name: string; city?: string; countryIso2?: string; type?: string; validators?: unknown[] };
              return (
                <>
                  <p>{hub.name}</p>
                  {(hub.city || hub.countryIso2) && (
                    <p className="text-cyber-muted">{[hub.city, hub.countryIso2].filter(Boolean).join(', ')}</p>
                  )}
                  {hub.type && <p className="text-cyber-muted">Type: {hub.type}</p>}
                  {Array.isArray(hub.validators) && hub.validators.length > 0 && (
                    <p className="text-cyber-muted">Validators: {hub.validators.length} linked</p>
                  )}
                </>
              );
            })()
          )}
          {node.type === 'odl_partner' && node.data?.partner && (
            (() => {
              const p = node.data.partner as { name: string; type?: string; xrpIntegration?: string; status?: string; corridors?: string[]; website?: string };
              return (
                <>
                  <p>{p.name}</p>
                  {p.type && <p className="text-cyber-muted">Type: {p.type}</p>}
                  {(p.xrpIntegration || p.status) && (
                    <p className="text-cyber-muted">XRPL: {p.xrpIntegration ?? p.status}</p>
                  )}
                  {Array.isArray(p.corridors) && p.corridors.length > 0 && (
                    <p className="text-cyber-muted">Corridors: {p.corridors.length} ({p.corridors.slice(0, 3).join(', ')}{p.corridors.length > 3 ? '…' : ''})</p>
                  )}
                  {p.website && (
                    <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline flex items-center gap-1">
                      <ExternalLink size={10} /> Website
                    </a>
                  )}
                </>
              );
            })()
          )}
          {node.type === 'chain' && node.data?.chain && (
            (() => {
              const c = node.data.chain as { name: string; symbol?: string; xrpBridge?: boolean; status?: string; website?: string; description?: string };
              return (
                <>
                  <p>{c.name}</p>
                  {c.symbol && <p className="text-cyber-muted">Symbol: {c.symbol}</p>}
                  {c.xrpBridge != null && <p className="text-cyber-muted">XRP bridge: {c.xrpBridge ? 'Yes' : 'No'}</p>}
                  {c.status && <p className="text-cyber-muted">Status: {c.status}</p>}
                  {c.description && <p className="text-cyber-muted mt-1">{c.description.slice(0, 120)}…</p>}
                  {c.website && (
                    <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline flex items-center gap-1">
                      <ExternalLink size={10} /> Website
                    </a>
                  )}
                </>
              );
            })()
          )}
          {node.type === 'corridor_region' && node.data?.corridor && (
            (() => {
              const c = node.data.corridor as { name: string; from?: { country?: string; countryCode?: string }; to?: { country?: string; countryCode?: string }; volume?: string; xrpSettlement?: boolean; odlEnabled?: boolean };
              return (
                <>
                  <p>{c.name}</p>
                  {c.from && c.to && (
                    <p className="text-cyber-muted">
                      {typeof c.from === 'object' ? c.from.countryCode ?? c.from.country : c.from} → {typeof c.to === 'object' ? c.to.countryCode ?? c.to.country : c.to}
                    </p>
                  )}
                  {c.volume && <p className="text-cyber-muted">Volume: {c.volume}</p>}
                  {c.xrpSettlement != null && <p className="text-cyber-muted">XRP settlement: {c.xrpSettlement ? 'Yes' : 'No'}</p>}
                  {c.odlEnabled != null && <p className="text-cyber-muted">ODL: {c.odlEnabled ? 'Yes' : 'No'}</p>}
                </>
              );
            })()
          )}
          {!node.data && node.type === 'ledger' && <p className="text-cyber-muted">Ledger node</p>}
        </div>
      </section>
    </div>
  );
}

export function UnifiedNetworkTopology() {
  const ledgers = useILPStore((s) => s.ledgers);
  const corridors = useILPStore((s) => s.corridors);
  const [includeValidators, setIncludeValidators] = useState(true);
  const [includeODL, setIncludeODL] = useState(true);
  const [includeBridgesChains, setIncludeBridgesChains] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<UnifiedNode | null>(null);

  useEffect(() => {
    if (!fullScreen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullScreen(false);
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [fullScreen]);

  const { nodes, edges } = useMemo(
    () =>
      getUnifiedTopology({
        ledgers,
        corridors,
        includeValidators,
        includeODL,
        includeBridgesChains,
      }),
    [ledgers, corridors, includeValidators, includeODL, includeBridgesChains]
  );

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      map[n.id] = toSvg(n.position);
    });
    return map;
  }, [nodes]);

  const graphContent = (
    <>
      <svg
        width="100%"
        height={fullScreen ? '100%' : '480'}
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className={`bg-cyber-darker/50 overflow-visible w-full ${fullScreen ? 'min-h-[70vh] flex-1' : 'rounded-lg border border-cyber-border/50 shrink-0'}`}
      >
        <defs>
          <pattern id="unified-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#unified-grid)" opacity="0.3" />

        {/* Edges */}
        <g className="edges">
          {edges.map((edge) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;
            const color = EDGE_COLORS[edge.type] ?? '#666';
            return (
              <line
                key={`${edge.from}-${edge.to}-${edge.type}-${edge.label ?? ''}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={color}
                strokeWidth={edge.type === 'ilp' ? 2 : 1}
                strokeOpacity={edge.type === 'ilp' ? 0.8 : 0.5}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const color = NODE_COLORS[node.type] ?? '#888';
            const r = node.type === 'ledger' && node.id === 'xrpl' ? 22 : node.type === 'ledger' ? 16 : 12;
            const isSelected = selectedNode?.id === node.id;
            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode((prev) => (prev?.id === node.id ? null : node));
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
                  }
                }}
                aria-label={`${node.label}, ${node.type}. Click for integration details`}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={isSelected ? color : '#0a0a1a'}
                  stroke={color}
                  strokeWidth={node.id === 'xrpl' ? 3 : isSelected ? 2.5 : 1.5}
                  opacity={isSelected ? 1 : 0.95}
                />
                <text
                  x={pos.x}
                  y={pos.y + r + 14}
                  textAnchor="middle"
                  className="fill-cyber-text"
                  style={{ fontSize: 9, fontFamily: 'system-ui', pointerEvents: 'none' }}
                >
                  {node.shortLabel ?? node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-cyber-muted flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF]" /> Ledgers & ILP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FFD700]" /> Validator hubs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00FF88]" /> ODL partners & corridors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A855F7]" /> Chains & bridges
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#14b8a6]" /> Corridor regions
        </span>
      </div>
      <p className="text-[10px] text-cyber-muted mt-2 italic flex-shrink-0">
        {nodes.length} nodes · {edges.length} edges. Toggle layers above to focus on validators, ODL, or bridges. Click any node for integration details.
      </p>

      {/* Node detail panel – integration proof */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          nodes={nodes}
          edges={edges}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </>
  );

  const controls = (
    <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
      <div>
        <h3 className="font-cyber text-sm text-cyber-cyan tracking-tight">Full network topology</h3>
        <p className="text-[11px] text-cyber-muted mt-0.5">
          {fullScreen ? 'Press Esc or click X to close' : 'Validators · ILP · Payment corridors · ODL partners · Bridges & chains'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeValidators}
            onChange={(e) => setIncludeValidators(e.target.checked)}
            className="rounded border-cyber-border bg-cyber-darker text-cyber-glow focus:ring-cyber-glow"
          />
          <span className="text-xs text-cyber-text">Validator hubs</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeODL}
            onChange={(e) => setIncludeODL(e.target.checked)}
            className="rounded border-cyber-border bg-cyber-darker text-cyber-green focus:ring-cyber-green"
          />
          <span className="text-xs text-cyber-text">ODL & corridors</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeBridgesChains}
            onChange={(e) => setIncludeBridgesChains(e.target.checked)}
            className="rounded border-cyber-border bg-cyber-darker text-cyber-purple focus:ring-cyber-purple"
          />
          <span className="text-xs text-cyber-text">Bridges & chains</span>
        </label>
        {fullScreen && (
          <button
            type="button"
            onClick={() => setFullScreen(false)}
            className="p-2 rounded-lg border border-cyber-border bg-cyber-darker/80 hover:bg-cyber-darker text-cyber-text transition-colors"
            aria-label="Close full screen"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {controls}
        {!fullScreen && (
          <button
            type="button"
            onClick={() => setFullScreen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors text-xs font-medium"
            title="Open full screen"
          >
            <Maximize2 size={16} />
            Full screen
          </button>
        )}
      </div>

      {!fullScreen && (
        <div
          className="rounded-lg border border-cyber-border/50 overflow-visible cursor-pointer"
          onClick={() => setFullScreen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setFullScreen(true)}
          aria-label="Click to open full screen"
        >
          <p className="text-[10px] text-cyber-muted mb-2 italic">Click the graph or use the button above to open full screen</p>
          {graphContent}
        </div>
      )}

      {fullScreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-cyber-darker w-screen h-screen min-w-full min-h-full"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => e.target === e.currentTarget && setFullScreen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Full network topology full screen"
          >
            {/* Thin top bar: title + toggles + close */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-cyber-border/60 flex-shrink-0 bg-cyber-darker/95"
              onClick={(e) => e.stopPropagation()}
            >
              {controls}
            </div>
            {/* Graph fills the rest of the viewport - true full screen */}
            <div
              className="flex-1 min-h-[70vh] flex flex-col p-4 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {graphContent}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
