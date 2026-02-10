// Full Network Topology – aggregates Validators, ILP, Corridors, Bridges & Chains from all Network tabs

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2 } from 'lucide-react';
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

export function UnifiedNetworkTopology() {
  const ledgers = useILPStore((s) => s.ledgers);
  const corridors = useILPStore((s) => s.corridors);
  const [includeValidators, setIncludeValidators] = useState(true);
  const [includeODL, setIncludeODL] = useState(true);
  const [includeBridgesChains, setIncludeBridgesChains] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);

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
            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill="#0a0a1a"
                  stroke={color}
                  strokeWidth={node.id === 'xrpl' ? 3 : 1.5}
                  opacity={0.95}
                />
                <text
                  x={pos.x}
                  y={pos.y + r + 14}
                  textAnchor="middle"
                  className="fill-cyber-text"
                  style={{ fontSize: 9, fontFamily: 'system-ui' }}
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
        {nodes.length} nodes · {edges.length} edges. Toggle layers above to focus on validators, ODL, or bridges.
      </p>
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
