// ILP Connector Map Visualization - Full Featured Version
// Supports all UI Lenses: Domain, Trust, Heat, Fog, Flow
// Shows active routes when calculated

import React, { useMemo, useState, useEffect } from 'react';
import { useILPStore } from '../../store/ilpStore';
import type { Ledger, Corridor, UILens } from '../../services/ilp/types';

interface ConnectorMapProps {
  onLedgerClick?: (ledger: Ledger) => void;
  onCorridorClick?: (corridor: Corridor) => void;
}

// Color schemes for different lenses
const DOMAIN_COLORS = {
  'on-ledger': '#00D4FF',   // Cyan
  'off-ledger': '#FF6B35',  // Orange
  'hybrid': '#A855F7',      // Purple
};

const TRUST_COLORS = {
  high: '#00FF88',    // Green
  medium: '#FFD700',  // Yellow
  low: '#FF4444',     // Red
};

const STATUS_COLORS = {
  active: '#00FF88',
  experimental: '#FFD700',
  fogged: '#666666',
  inactive: '#444444',
  deprecated: '#333333',
};

// Get ledger color based on active lens
function getLedgerColor(ledger: Ledger, lens: UILens, connectors: any[]): string {
  switch (lens) {
    case 'domain':
      return DOMAIN_COLORS[ledger.domain] || '#888888';
    
    case 'trust':
      const relatedConnectors = connectors.filter(c => c.from === ledger.id || c.to === ledger.id);
      if (relatedConnectors.length === 0) return '#888888';
      const avgTrust = relatedConnectors.reduce((sum, c) => sum + c.trust_score, 0) / relatedConnectors.length;
      if (avgTrust > 0.7) return TRUST_COLORS.high;
      if (avgTrust > 0.4) return TRUST_COLORS.medium;
      return TRUST_COLORS.low;
    
    case 'heat':
      const heatLevel = Math.max(0, 1 - ledger.finality_seconds / 100);
      return `hsl(${(1 - heatLevel) * 60}, 100%, ${50 + heatLevel * 30}%)`;
    
    case 'fog':
      const riskCount = ledger.risk_flags.length;
      const fogOpacity = Math.max(0.3, 1 - riskCount * 0.15);
      return `rgba(200, 200, 200, ${fogOpacity})`;
    
    case 'flow':
      return ledger.supports_ilp_adapter ? '#00FF88' : '#666666';
    
    default:
      return '#888888';
  }
}

// Get corridor color and style based on lens
function getCorridorStyle(
  corridor: Corridor, 
  lens: UILens, 
  connectors: any[],
  ledgers: Ledger[]
) {
  const connector = connectors.find(c => c.id === corridor.connector_id);
  const trust = connector?.trust_score || 0.5;
  const fromLedger = ledgers.find(l => l.id === corridor.from_ledger);
  const toLedger = ledgers.find(l => l.id === corridor.to_ledger);
  
  switch (lens) {
    case 'domain':
      // In Domain lens, color based on the connecting ledgers' domains
      // If both same domain = solid that color, if different = gradient/blend
      const fromColor = fromLedger ? DOMAIN_COLORS[fromLedger.domain] : '#888888';
      const toColor = toLedger ? DOMAIN_COLORS[toLedger.domain] : '#888888';
      // Use the "from" ledger's domain color for the line
      return {
        color: fromColor,
        toColor: toColor,
        width: 2,
        opacity: 0.7,
        dashArray: fromLedger?.domain !== toLedger?.domain ? '6,3' : 'none', // Dashed if cross-domain
      };
    
    case 'trust':
      const trustColor = trust > 0.7 ? TRUST_COLORS.high : trust > 0.4 ? TRUST_COLORS.medium : TRUST_COLORS.low;
      return {
        color: trustColor,
        toColor: trustColor,
        width: 1 + trust * 3,
        opacity: 0.4 + trust * 0.4,
        dashArray: trust < 0.3 ? '2,2' : 'none',
      };
    
    case 'heat':
      const heat = corridor.glow || 0.5;
      const heatColor = `hsl(${(1 - heat) * 60}, 100%, 50%)`;
      return {
        color: heatColor,
        toColor: heatColor,
        width: 1 + heat * 4,
        opacity: 0.3 + heat * 0.7,
        dashArray: 'none',
      };
    
    case 'fog':
      const riskLevel = corridor.risk_fog.length / 5;
      const fogColor = riskLevel > 0.5 ? '#FF4444' : riskLevel > 0.2 ? '#FFD700' : '#888888';
      return {
        color: fogColor,
        toColor: fogColor,
        width: 1 + riskLevel * 2,
        opacity: 0.2 + (1 - riskLevel) * 0.3,
        dashArray: riskLevel > 0.3 ? '3,3' : 'none',
      };
    
    case 'flow':
      const flowColor = corridor.bidirectional ? '#00D4FF' : '#00FF88';
      return {
        color: flowColor,
        toColor: flowColor,
        width: 1 + corridor.thickness * 3,
        opacity: 0.5 + corridor.glow * 0.5,
        dashArray: 'none',
      };
    
    default:
      return { color: '#666666', toColor: '#666666', width: 1, opacity: 0.5, dashArray: 'none' };
  }
}

export function ConnectorMap({ onLedgerClick, onCorridorClick }: ConnectorMapProps) {
  const { 
    ledgers, connectors, corridors, activeLens, activeRoute, 
    showLabels, showRiskFog, showFlowParticles,
    selectedLedger, selectLedger
  } = useILPStore();
  
  const [hoveredLedger, setHoveredLedger] = useState<string | null>(null);
  const [hoveredCorridor, setHoveredCorridor] = useState<string | null>(null);
  const [flowOffset, setFlowOffset] = useState(0);

  // Animate flow
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowOffset(prev => (prev + 1) % 40);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Calculate positions for all ledgers
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const center = { x: 400, y: 200 };
    const radius = 150;
    
    // XRPL at center
    pos['xrpl'] = center;
    
    // Other ledgers in a circle
    const others = ledgers.filter(l => l.id !== 'xrpl');
    others.forEach((ledger, i) => {
      const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
      pos[ledger.id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });
    
    return pos;
  }, [ledgers]);

  // Route corridors for highlighting
  const routeCorridorIds = useMemo(() => {
    if (!activeRoute) return new Set<string>();
    return new Set(activeRoute.hops.map(h => h.corridor_id));
  }, [activeRoute]);

  // Get selected ledger data
  const selectedLedgerData = useMemo(() => {
    if (!selectedLedger) return null;
    return ledgers.find(l => l.id === selectedLedger);
  }, [selectedLedger, ledgers]);

  // Loading state
  if (ledgers.length === 0) {
    return (
      <div className="w-full h-full min-h-[500px] bg-cyber-darker rounded-lg border border-cyber-border flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-cyber-muted">Loading ILP Network...</p>
        </div>
      </div>
    );
  }

  // Handle ledger click - select it
  const handleLedgerClick = (ledger: Ledger) => {
    selectLedger(selectedLedger === ledger.id ? null : ledger.id);
    onLedgerClick?.(ledger);
  };

  return (
    <div className="w-full h-full min-h-[500px] bg-cyber-darker rounded-lg border border-cyber-border p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 pb-2 border-b border-cyber-border flex items-center justify-between">
        <div>
          <h3 className="font-cyber text-cyber-cyan">ILP NETWORK TOPOLOGY</h3>
          <p className="text-xs text-cyber-muted">
            {ledgers.length} Ledgers • {connectors.length} Connectors • {corridors.length} Corridors • Lens: {activeLens}
          </p>
        </div>
        {activeRoute && (
          <div className="px-3 py-1 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs">
            Route Active: {activeRoute.hops.length} hops
          </div>
        )}
      </div>

      {/* SVG Map */}
      <svg width="100%" height="400" viewBox="0 0 800 400" className="bg-cyber-darker/50 rounded">
        {/* Definitions */}
        <defs>
          {/* Background grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
          </pattern>
          
          {/* Glow filters */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Arrow markers for direction */}
          <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#00FF88" />
          </marker>
          <marker id="arrow-cyan" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#00D4FF" />
          </marker>
          <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#FF6B35" />
          </marker>
          <marker id="arrow-purple" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#A855F7" />
          </marker>
          <marker id="arrow-yellow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#FFD700" />
          </marker>
          <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#FF4444" />
          </marker>
          
          {/* Gradient definitions for cross-domain corridors */}
          {corridors.map(corridor => {
            const fromLedger = ledgers.find(l => l.id === corridor.from_ledger);
            const toLedger = ledgers.find(l => l.id === corridor.to_ledger);
            const fromColor = fromLedger ? DOMAIN_COLORS[fromLedger.domain] : '#888';
            const toColor = toLedger ? DOMAIN_COLORS[toLedger.domain] : '#888';
            return (
              <linearGradient key={`grad-${corridor.id}`} id={`grad-${corridor.id}`}>
                <stop offset="0%" stopColor={fromColor} />
                <stop offset="100%" stopColor={toColor} />
              </linearGradient>
            );
          })}
        </defs>
        
        <rect width="800" height="400" fill="url(#grid)" opacity="0.3" />

        {/* Risk Fog Overlay (for Fog lens) */}
        {(activeLens === 'fog' || showRiskFog) && (
          <g className="fog-layer">
            {ledgers.filter(l => l.risk_flags.length > 0).map(ledger => {
              const pos = positions[ledger.id];
              if (!pos) return null;
              const riskLevel = ledger.risk_flags.length;
              return (
                <circle
                  key={`fog-${ledger.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={30 + riskLevel * 10}
                  fill={riskLevel > 2 ? '#FF444420' : '#FFD70015'}
                  className="animate-pulse"
                />
              );
            })}
          </g>
        )}

        {/* Corridors (connections) */}
        <g className="corridors">
          {corridors.map(corridor => {
            const fromPos = positions[corridor.from_ledger];
            const toPos = positions[corridor.to_ledger];
            if (!fromPos || !toPos) return null;
            
            const style = getCorridorStyle(corridor, activeLens, connectors, ledgers);
            const isOnRoute = routeCorridorIds.has(corridor.id);
            const isHovered = hoveredCorridor === corridor.id || 
              (hoveredLedger && (corridor.from_ledger === hoveredLedger || corridor.to_ledger === hoveredLedger));
            const isSelected = selectedLedger && (corridor.from_ledger === selectedLedger || corridor.to_ledger === selectedLedger);
            
            // Calculate line endpoints - shorten to not overlap with nodes
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const nodeRadius = 20;
            const startOffset = nodeRadius / length;
            const endOffset = (length - nodeRadius) / length;
            
            const x1 = fromPos.x + dx * startOffset;
            const y1 = fromPos.y + dy * startOffset;
            const x2 = fromPos.x + dx * endOffset;
            const y2 = fromPos.y + dy * endOffset;
            
            // Midpoint for bidirectional indicators
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;

            // Choose arrow marker color based on style
            const arrowColor = style.color.includes('00FF88') ? 'green' : 
                              style.color.includes('00D4FF') ? 'cyan' :
                              style.color.includes('FF6B35') ? 'orange' :
                              style.color.includes('A855F7') ? 'purple' :
                              style.color.includes('FFD700') ? 'yellow' : 'green';

            return (
              <g key={corridor.id}>
                {/* Main corridor line with gradient for Domain lens */}
                {activeLens === 'domain' ? (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={`url(#grad-${corridor.id})`}
                    strokeWidth={isOnRoute ? style.width + 2 : isHovered || isSelected ? style.width + 1 : style.width}
                    strokeOpacity={isOnRoute ? 0.9 : isHovered || isSelected ? 0.9 : style.opacity}
                    strokeDasharray={style.dashArray}
                    filter={isOnRoute ? 'url(#glow-green)' : undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCorridorClick?.(corridor)}
                    onMouseEnter={() => setHoveredCorridor(corridor.id)}
                    onMouseLeave={() => setHoveredCorridor(null)}
                    markerEnd={!corridor.bidirectional ? `url(#arrow-${arrowColor})` : undefined}
                  />
                ) : (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isOnRoute ? '#00FF88' : style.color}
                    strokeWidth={isOnRoute ? style.width + 2 : isHovered || isSelected ? style.width + 1 : style.width}
                    strokeOpacity={isOnRoute ? 0.9 : isHovered || isSelected ? 0.9 : style.opacity}
                    strokeDasharray={isOnRoute ? '8,4' : style.dashArray}
                    strokeDashoffset={isOnRoute ? -flowOffset : 0}
                    filter={isOnRoute ? 'url(#glow-green)' : undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCorridorClick?.(corridor)}
                    onMouseEnter={() => setHoveredCorridor(corridor.id)}
                    onMouseLeave={() => setHoveredCorridor(null)}
                    markerEnd={!corridor.bidirectional ? `url(#arrow-${arrowColor})` : undefined}
                  />
                )}
                
                {/* Bidirectional indicator - two small arrows at midpoint */}
                {corridor.bidirectional && (
                  <g>
                    {/* Double-headed arrow symbol at midpoint */}
                    <circle
                      cx={midX}
                      cy={midY}
                      r={6}
                      fill="#0a0a1a"
                      stroke={style.color}
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                    <text
                      x={midX}
                      y={midY + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={style.color}
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      ⇄
                    </text>
                  </g>
                )}
                
                {/* One-way arrow indicator */}
                {!corridor.bidirectional && (
                  <g>
                    <circle
                      cx={midX}
                      cy={midY}
                      r={6}
                      fill="#0a0a1a"
                      stroke={style.color}
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                    <text
                      x={midX}
                      y={midY + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={style.color}
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      →
                    </text>
                  </g>
                )}
                
                {/* Flow particles (always on for visual feedback) */}
                {(activeLens === 'flow' || showFlowParticles || isOnRoute) && (
                  <>
                    {[0.2, 0.5, 0.8].map((offset, i) => {
                      const progress = ((flowOffset / 40) + offset) % 1;
                      const px = x1 + (x2 - x1) * progress;
                      const py = y1 + (y2 - y1) * progress;
                      return (
                        <circle
                          key={`flow-${corridor.id}-${i}`}
                          cx={px}
                          cy={py}
                          r={isOnRoute ? 3 : 2}
                          fill={isOnRoute ? '#00FF88' : style.color}
                          opacity={0.8}
                        />
                      );
                    })}
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Ledgers (nodes) */}
        <g className="ledgers">
          {ledgers.map(ledger => {
            const pos = positions[ledger.id];
            if (!pos) return null;
            const color = getLedgerColor(ledger, activeLens, connectors);
            const isXRPL = ledger.id === 'xrpl';
            const isHovered = hoveredLedger === ledger.id;
            const isSelected = selectedLedger === ledger.id;
            const isOnRoute = activeRoute && (
              activeRoute.from_ledger === ledger.id || 
              activeRoute.to_ledger === ledger.id || 
              activeRoute.hops.some(h => h.from_ledger === ledger.id || h.to_ledger === ledger.id)
            );
            
            const baseRadius = isXRPL ? 25 : (activeLens === 'heat' ? 12 + (ledger.tps_estimate / 1000) * 5 : 15);
            
            return (
              <g 
                key={ledger.id} 
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleLedgerClick(ledger)}
                onMouseEnter={() => setHoveredLedger(ledger.id)}
                onMouseLeave={() => setHoveredLedger(null)}
              >
                {/* Selection/hover ring */}
                {(isSelected || isHovered || isOnRoute) && (
                  <>
                    <circle 
                      r={baseRadius + 15} 
                      fill="none"
                      stroke={isOnRoute ? '#00FF88' : isSelected ? '#FFFFFF' : color} 
                      strokeWidth={2}
                      strokeDasharray={isSelected ? 'none' : '4,4'}
                      opacity={0.5}
                    />
                    <circle r={baseRadius + 10} fill={isOnRoute ? '#00FF88' : color} opacity={0.15} />
                  </>
                )}
                
                {/* Outer glow */}
                {isXRPL && (
                  <>
                    <circle r={40} fill={color} opacity={0.15} />
                    <circle r={30} fill={color} opacity={0.3} />
                  </>
                )}
                
                {/* Heat glow */}
                {activeLens === 'heat' && (
                  <circle r={baseRadius + 8} fill={color} opacity={0.3} className="animate-pulse" />
                )}
                
                {/* Main circle */}
                <circle 
                  r={baseRadius}
                  fill={color}
                  opacity={activeLens === 'fog' && ledger.risk_flags.length > 2 ? 0.5 : 0.9}
                  stroke={isOnRoute ? '#00FF88' : isSelected ? '#FFFFFF' : 'none'}
                  strokeWidth={isOnRoute || isSelected ? 3 : 0}
                  filter={isXRPL ? 'url(#glow-cyan)' : undefined}
                />
                
                {/* Risk ring */}
                {activeLens === 'fog' && ledger.risk_flags.length > 0 && (
                  <circle
                    r={baseRadius + 5}
                    fill="none"
                    stroke="#FF4444"
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                    strokeDasharray="3,3"
                  />
                )}
                
                {/* Label */}
                {showLabels && (
                  <text 
                    y={baseRadius + 15} 
                    textAnchor="middle" 
                    fill={isSelected ? '#FFFFFF' : '#E0E0E0'} 
                    fontSize={isXRPL ? '12' : '10'} 
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {ledger.symbol || ledger.id.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Lens Legend */}
        <g transform="translate(10, 360)">
          <rect x="0" y="-10" width="200" height="45" fill="#0a0a1a" opacity="0.9" rx="4" />
          <text x="5" y="5" fill="#888" fontSize="9" fontFamily="monospace">
            {activeLens.toUpperCase()} LENS
          </text>
          {activeLens === 'domain' && (
            <>
              <circle cx="15" cy="22" r="5" fill={DOMAIN_COLORS['on-ledger']} />
              <text x="25" y="25" fill="#888" fontSize="8">On-ledger</text>
              <circle cx="80" cy="22" r="5" fill={DOMAIN_COLORS['off-ledger']} />
              <text x="90" y="25" fill="#888" fontSize="8">Off-ledger</text>
              <circle cx="150" cy="22" r="5" fill={DOMAIN_COLORS['hybrid']} />
              <text x="160" y="25" fill="#888" fontSize="8">Hybrid</text>
            </>
          )}
          {activeLens === 'trust' && (
            <>
              <circle cx="15" cy="22" r="5" fill={TRUST_COLORS.high} />
              <text x="25" y="25" fill="#888" fontSize="8">High</text>
              <circle cx="60" cy="22" r="5" fill={TRUST_COLORS.medium} />
              <text x="70" y="25" fill="#888" fontSize="8">Medium</text>
              <circle cx="120" cy="22" r="5" fill={TRUST_COLORS.low} />
              <text x="130" y="25" fill="#888" fontSize="8">Low</text>
            </>
          )}
          {activeLens === 'fog' && (
            <>
              <circle cx="15" cy="22" r="5" fill="#FF4444" opacity="0.6" />
              <text x="25" y="25" fill="#888" fontSize="8">High Risk</text>
              <circle cx="85" cy="22" r="5" fill="#FFD700" opacity="0.6" />
              <text x="95" y="25" fill="#888" fontSize="8">Med Risk</text>
            </>
          )}
          {activeLens === 'flow' && (
            <>
              <circle cx="15" cy="22" r="5" fill="#00FF88" />
              <text x="25" y="25" fill="#888" fontSize="8">ILP Enabled</text>
              <circle cx="100" cy="22" r="5" fill="#666666" />
              <text x="110" y="25" fill="#888" fontSize="8">No ILP</text>
            </>
          )}
          {activeLens === 'heat' && (
            <text x="10" y="25" fill="#888" fontSize="8">Hotter = Faster finality</text>
          )}
        </g>
        
        {/* Direction Legend */}
        <g transform="translate(620, 360)">
          <rect x="0" y="-10" width="170" height="45" fill="#0a0a1a" opacity="0.9" rx="4" />
          <text x="5" y="5" fill="#888" fontSize="9" fontFamily="monospace">DIRECTION</text>
          <circle cx="15" cy="22" r="5" fill="#0a0a1a" stroke="#888" />
          <text x="12" y="25" fill="#888" fontSize="7">⇄</text>
          <text x="25" y="25" fill="#888" fontSize="8">Bidirectional</text>
          <circle cx="100" cy="22" r="5" fill="#0a0a1a" stroke="#888" />
          <text x="97" y="25" fill="#888" fontSize="7">→</text>
          <text x="110" y="25" fill="#888" fontSize="8">One-way</text>
        </g>
      </svg>

      {/* Selected Ledger Details Panel */}
      {selectedLedgerData && (
        <div className="mt-4 p-4 rounded border border-cyber-cyan/50 bg-cyber-cyan/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-cyber text-cyber-cyan">{selectedLedgerData.name}</h4>
            <button 
              onClick={() => selectLedger(null)}
              className="text-cyber-muted hover:text-cyber-text text-xs"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-cyber-muted">Domain</p>
              <p className="text-cyber-text capitalize">{selectedLedgerData.domain}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Type</p>
              <p className="text-cyber-text capitalize">{selectedLedgerData.type}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Finality</p>
              <p className="text-cyber-text">{selectedLedgerData.finality_seconds}s</p>
            </div>
            <div>
              <p className="text-cyber-muted">TPS</p>
              <p className="text-cyber-text">{selectedLedgerData.tps_estimate.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Native Asset</p>
              <p className="text-cyber-text">{selectedLedgerData.native_asset}</p>
            </div>
            <div>
              <p className="text-cyber-muted">ILP Support</p>
              <p className={selectedLedgerData.supports_ilp_adapter ? 'text-cyber-green' : 'text-cyber-red'}>
                {selectedLedgerData.supports_ilp_adapter ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-cyber-muted">Consensus</p>
              <p className="text-cyber-text">{selectedLedgerData.consensus}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Risk Flags</p>
              <p className={selectedLedgerData.risk_flags.length > 0 ? 'text-cyber-yellow' : 'text-cyber-green'}>
                {selectedLedgerData.risk_flags.length > 0 ? selectedLedgerData.risk_flags.join(', ') : 'None'}
              </p>
            </div>
          </div>
          
          {/* Connected Corridors */}
          <div className="mt-3 pt-3 border-t border-cyber-border">
            <p className="text-xs text-cyber-muted mb-2">Connected Corridors:</p>
            <div className="flex flex-wrap gap-2">
              {corridors
                .filter(c => c.from_ledger === selectedLedger || c.to_ledger === selectedLedger)
                .map(corridor => (
                  <span 
                    key={corridor.id}
                    className={`px-2 py-1 rounded text-[10px] border ${
                      corridor.status === 'active' ? 'border-cyber-green text-cyber-green' :
                      corridor.status === 'experimental' ? 'border-cyber-yellow text-cyber-yellow' :
                      'border-cyber-muted text-cyber-muted'
                    }`}
                  >
                    {corridor.from_ledger === selectedLedger ? `→ ${corridor.to_ledger}` : `${corridor.from_ledger} →`}
                    {corridor.bidirectional && ' ⇄'}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Ledger List */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {ledgers.map(ledger => {
          const color = getLedgerColor(ledger, activeLens, connectors);
          const isSelected = selectedLedger === ledger.id;
          const isOnRoute = activeRoute && (
            activeRoute.from_ledger === ledger.id || 
            activeRoute.to_ledger === ledger.id || 
            activeRoute.hops.some(h => h.from_ledger === ledger.id || h.to_ledger === ledger.id)
          );
          
          return (
            <div 
              key={ledger.id}
              className={`p-2 rounded border cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-cyber-cyan/20 border-cyber-cyan ring-2 ring-cyber-cyan/50' 
                  : isOnRoute 
                  ? 'bg-cyber-green/20 border-cyber-green/50' 
                  : 'bg-cyber-darker/50 border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-darker'
              }`}
              onClick={() => handleLedgerClick(ledger)}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-xs font-cyber text-cyber-text">{ledger.name}</p>
              </div>
              <p className="text-[10px] text-cyber-muted mt-1">
                {ledger.domain} • {ledger.finality_seconds}s finality
              </p>
            </div>
          );
        })}
      </div>

      {/* Corridor Stats */}
      <div className="mt-4 pt-4 border-t border-cyber-border">
        <p className="text-xs text-cyber-muted mb-2">CORRIDORS</p>
        <div className="flex flex-wrap gap-2">
          {corridors.map(corridor => {
            const style = getCorridorStyle(corridor, activeLens, connectors, ledgers);
            const isOnRoute = routeCorridorIds.has(corridor.id);
            const isRelatedToSelected = selectedLedger && (corridor.from_ledger === selectedLedger || corridor.to_ledger === selectedLedger);
            
            return (
              <span 
                key={corridor.id}
                className={`px-2 py-1 rounded text-[10px] cursor-pointer transition-all flex items-center gap-1 ${
                  isOnRoute 
                    ? 'bg-cyber-green/30 text-cyber-green border-2 border-cyber-green' 
                    : isRelatedToSelected
                    ? 'bg-cyber-cyan/20 border-2 border-cyber-cyan text-cyber-cyan'
                    : 'border'
                }`}
                style={{ 
                  borderColor: isOnRoute || isRelatedToSelected ? undefined : style.color,
                  color: isOnRoute || isRelatedToSelected ? undefined : style.color,
                  backgroundColor: isOnRoute || isRelatedToSelected ? undefined : `${style.color}15`,
                }}
                onClick={() => onCorridorClick?.(corridor)}
              >
                {corridor.from_ledger} 
                <span className="opacity-70">{corridor.bidirectional ? '⇄' : '→'}</span> 
                {corridor.to_ledger}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ConnectorMap;
