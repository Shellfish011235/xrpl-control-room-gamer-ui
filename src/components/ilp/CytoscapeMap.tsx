// Cytoscape-based ILP Connector Map
// Production-grade visualization with CAR validation, live updates, no flickering
// "ILP does not connect blockchains. Connectors do. Trust is a topology, not a claim."

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
// @ts-ignore - cola layout extension
import cola from 'cytoscape-cola';
import { useILPStore } from '../../store/ilpStore';
import type { Ledger, Corridor, UILens } from '../../services/ilp/types';

// Register cola layout
cytoscape.use(cola);

// =============================================================================
// TYPES
// =============================================================================

interface CytoscapeMapProps {
  onNodeClick?: (ledgerId: string) => void;
  onEdgeClick?: (corridorId: string) => void;
  height?: number;
}

interface CytoscapeElement {
  group: 'nodes' | 'edges';
  data: {
    id: string;
    label?: string;
    color?: string;
    type?: string;
    domain?: string;
    finality?: number;
    tps?: number;
    ilpSupport?: boolean;
    riskFlags?: string[];
    source?: string;
    target?: string;
    confidence?: number;
    bidirectional?: boolean;
    carValidated?: boolean;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DOMAIN_COLORS = {
  'on-ledger': '#00D4FF',
  'off-ledger': '#FF6B35',
  'hybrid': '#A855F7',
};

const TRUST_COLORS = {
  high: '#00FF88',
  medium: '#FFD700',
  low: '#FF4444',
};

// =============================================================================
// CYTOSCAPE MAP COMPONENT
// =============================================================================

export function CytoscapeMap({ 
  onNodeClick, 
  onEdgeClick,
  height = 500 
}: CytoscapeMapProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  
  const { 
    ledgers, 
    connectors, 
    corridors, 
    activeLens,
    activeRoute,
    selectedLedger,
    selectLedger
  } = useILPStore();

  // ==========================================================================
  // BUILD CYTOSCAPE ELEMENTS
  // ==========================================================================
  
  const elements = useMemo((): CytoscapeElement[] => {
    const nodes: CytoscapeElement[] = ledgers.map(ledger => {
      const color = getLedgerColor(ledger, activeLens, connectors);
      return {
        group: 'nodes',
        data: {
          id: ledger.id,
          label: ledger.symbol || ledger.name,
          color,
          type: ledger.type,
          domain: ledger.domain,
          finality: ledger.finality_seconds,
          tps: ledger.tps_estimate,
          ilpSupport: ledger.supports_ilp_adapter,
          riskFlags: ledger.risk_flags,
        },
      };
    });

    const edges: CytoscapeElement[] = corridors.map(corridor => {
      const connector = connectors.find(c => c.id === corridor.connector_id);
      const trust = connector?.trust_score || 0.5;
      const isOnRoute = activeRoute?.hops.some(h => h.corridor_id === corridor.id);
      
      return {
        group: 'edges',
        data: {
          id: corridor.id,
          source: corridor.from_ledger,
          target: corridor.to_ledger,
          label: corridor.bidirectional ? '⇄' : '→',
          confidence: trust,
          bidirectional: corridor.bidirectional,
          carValidated: isOnRoute || trust > 0.7,
        },
      };
    });

    return [...nodes, ...edges];
  }, [ledgers, corridors, connectors, activeLens, activeRoute]);

  // ==========================================================================
  // CYTOSCAPE INITIALIZATION & UPDATE (THE KEY IMPROVEMENT)
  // ==========================================================================
  
  useEffect(() => {
    if (!cyRef.current) return;

    if (!cyInstance.current) {
      // First mount: create Cytoscape instance
      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'color': '#FFFFFF',
              'font-size': 11,
              'font-family': 'monospace',
              'border-width': 2,
              'border-color': '#00FFFF',
              'text-outline-width': 1,
              'text-outline-color': '#000',
              'width': 40,
              'height': 40,
              'text-margin-y': 5,
            },
          },
          {
            // XRPL is the central hub - make it larger
            selector: 'node[id = "xrpl"]',
            style: {
              'width': 60,
              'height': 60,
              'font-size': 14,
              'font-weight': 'bold',
              'border-width': 3,
            },
          },
          {
            // Selected node
            selector: 'node:selected',
            style: {
              'border-color': '#FFFFFF',
              'border-width': 4,
              'overlay-color': '#00FFFF',
              'overlay-opacity': 0.2,
            },
          },
          {
            // Edge styles with confidence-based coloring (CAR validation)
            selector: 'edge',
            style: {
              'width': 'mapData(confidence, 0, 1, 1, 4)',
              'line-color': 'mapData(confidence, 0, 1, #FF4444, #00FFCC)',
              'target-arrow-color': 'mapData(confidence, 0, 1, #FF4444, #00FFCC)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': 10,
              'color': '#888',
              'text-rotation': 'autorotate',
              'text-margin-y': -10,
            },
          },
          {
            // CAR-validated edges get special treatment
            selector: 'edge[carValidated]',
            style: {
              'line-color': '#00FFCC',
              'target-arrow-color': '#00FFCC',
              'width': 3,
            },
          },
          {
            // Bidirectional edges
            selector: 'edge[bidirectional]',
            style: {
              'source-arrow-shape': 'triangle',
              'source-arrow-color': 'mapData(confidence, 0, 1, #FF4444, #00FFCC)',
            },
          },
          {
            // Hovered edge
            selector: 'edge:selected',
            style: {
              'width': 5,
              'line-color': '#00FF88',
              'target-arrow-color': '#00FF88',
              'z-index': 999,
            },
          },
        ],
        layout: {
          name: 'cola',
          animate: true,
          fit: true,
          nodeSpacing: 80,
          edgeLength: 150,
          randomize: false,
          convergenceThreshold: 0.01,
        } as any,
        wheelSensitivity: 0.15,
        minZoom: 0.3,
        maxZoom: 3,
      });

      // Event handlers
      cyInstance.current.on('tap', 'node', (evt) => {
        const nodeId = evt.target.id();
        selectLedger(selectedLedger === nodeId ? null : nodeId);
        onNodeClick?.(nodeId);
      });

      cyInstance.current.on('tap', 'edge', (evt) => {
        onEdgeClick?.(evt.target.id());
      });

      // Hover tooltips (simple title-based)
      cyInstance.current.on('mouseover', 'node', (evt) => {
        const node = evt.target;
        const data = node.data();
        node.scratch('_tippy', {
          content: `${data.label}\nFinality: ${data.finality}s\nTPS: ${data.tps}\nILP: ${data.ilpSupport ? 'Yes' : 'No'}`,
        });
      });

    } else {
      // 🔑 KEY CHANGE: Update without re-mounting
      const cy = cyInstance.current;
      cy.batch(() => {
        cy.elements().remove();
        cy.add(elements);
      });
      cy.layout({ 
        name: 'cola', 
        animate: true,
        fit: true,
        nodeSpacing: 80,
      } as any).run();
    }
  }, [elements, onNodeClick, onEdgeClick, selectLedger, selectedLedger]);

  // ==========================================================================
  // IMPERATIVE API: ADD CORRIDOR WITHOUT RE-RENDER
  // ==========================================================================
  
  const addCorridor = useCallback((
    source: string,
    target: string,
    label: string,
    confidence: number,
    carValidated: boolean = false
  ) => {
    const cy = cyInstance.current;
    if (!cy) return;

    // Prevent duplicates
    const existingEdge = cy.edges(`[source = "${source}"][target = "${target}"]`);
    if (existingEdge.length > 0) {
      // Update existing edge confidence
      existingEdge.data('confidence', confidence);
      existingEdge.data('carValidated', carValidated);
      return;
    }

    cy.add({
      group: 'edges',
      data: {
        id: `${source}-${target}-${Date.now()}`,
        source,
        target,
        label,
        confidence,
        carValidated,
      },
    });

    cy.layout({ name: 'cola', animate: true } as any).run();
  }, []);

  // ==========================================================================
  // IMPERATIVE API: FOCUS ON NODE
  // ==========================================================================
  
  const focusNode = useCallback((id: string) => {
    const cy = cyInstance.current;
    if (!cy) return;
    
    const node = cy.getElementById(id);
    if (node.length === 0) return;
    
    cy.animate({
      fit: { eles: node, padding: 100 },
      duration: 500,
      easing: 'ease-out-cubic',
    });
  }, []);

  // ==========================================================================
  // IMPERATIVE API: HIGHLIGHT ROUTE
  // ==========================================================================
  
  const highlightRoute = useCallback((ledgerIds: string[]) => {
    const cy = cyInstance.current;
    if (!cy) return;

    // Reset all
    cy.elements().removeClass('highlighted');

    // Highlight path
    ledgerIds.forEach((id, i) => {
      const node = cy.getElementById(id);
      node.addClass('highlighted');
      
      if (i < ledgerIds.length - 1) {
        const nextId = ledgerIds[i + 1];
        const edge = cy.edges(`[source = "${id}"][target = "${nextId}"], [source = "${nextId}"][target = "${id}"]`);
        edge.addClass('highlighted');
      }
    });
  }, []);

  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  useEffect(() => {
    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, []);

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  
  if (ledgers.length === 0) {
    return (
      <div 
        className="w-full bg-cyber-darker rounded-lg border border-cyber-border flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-cyber-muted">Loading ILP Network...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <div className="w-full bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border flex items-center justify-between">
        <div>
          <h3 className="font-cyber text-cyber-cyan text-sm">ILP NETWORK TOPOLOGY</h3>
          <p className="text-[10px] text-cyber-muted">
            {ledgers.length} Ledgers • {connectors.length} Connectors • {corridors.length} Corridors • Lens: {activeLens}
          </p>
        </div>
        {activeRoute && (
          <div className="px-2 py-1 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-[10px]">
            Route: {activeRoute.hops.length} hops
          </div>
        )}
      </div>

      {/* Cytoscape Container */}
      <div 
        ref={cyRef} 
        style={{ height: height - 60 }}
        className="w-full"
      />

      {/* Legend */}
      <div className="p-2 border-t border-cyber-border flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-4">
          <span className="text-cyber-muted">CONFIDENCE:</span>
          <div className="flex items-center gap-1">
            <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-cyan-400 rounded" />
            <span className="text-cyber-muted">Low → High</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-cyber-muted">On-ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-cyber-muted">Off-ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-cyber-muted">Hybrid</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER: GET LEDGER COLOR BASED ON LENS
// =============================================================================

function getLedgerColor(ledger: Ledger, lens: UILens, connectors: any[]): string {
  switch (lens) {
    case 'domain':
      return DOMAIN_COLORS[ledger.domain] || '#888888';
    
    case 'trust':
      const relatedConnectors = connectors.filter(
        c => c.from === ledger.id || c.to === ledger.id
      );
      if (relatedConnectors.length === 0) return '#888888';
      const avgTrust = relatedConnectors.reduce((sum, c) => sum + c.trust_score, 0) / relatedConnectors.length;
      if (avgTrust > 0.7) return TRUST_COLORS.high;
      if (avgTrust > 0.4) return TRUST_COLORS.medium;
      return TRUST_COLORS.low;
    
    case 'fog':
      const riskCount = ledger.risk_flags.length;
      if (riskCount > 2) return '#FF4444';
      if (riskCount > 0) return '#FFD700';
      return '#888888';
    
    case 'flow':
      return ledger.supports_ilp_adapter ? '#00FF88' : '#666666';
    
    default:
      return '#888888';
  }
}

// =============================================================================
// EXPORT HOOK FOR IMPERATIVE CONTROL
// =============================================================================

export function useCytoscapeControls() {
  const cyRef = useRef<Core | null>(null);

  const addCorridor = (
    source: string,
    target: string,
    label: string,
    confidence: number
  ) => {
    const cy = cyRef.current;
    if (!cy) return;

    if (cy.edges(`[source = "${source}"][target = "${target}"]`).length > 0) return;

    cy.add({
      group: 'edges',
      data: { source, target, label, confidence },
    });

    cy.layout({ name: 'cola', animate: true } as any).run();
  };

  const focusNode = (id: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(id);
    cy.animate({
      fit: { eles: node, padding: 80 },
      duration: 500,
    });
  };

  return { cyRef, addCorridor, focusNode };
}

export default CytoscapeMap;
