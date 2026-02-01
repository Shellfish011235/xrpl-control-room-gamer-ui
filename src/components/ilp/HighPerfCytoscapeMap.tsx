// High-Performance Cytoscape Map
// Optimized for 500+ nodes with:
// - Viewport culling
// - Level of detail (LOD)
// - Batch updates with RAF
// - Progressive rendering
// - Debounced layout calculations

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
// @ts-ignore
import cola from 'cytoscape-cola';
import { useILPStore } from '../../store/ilpStore';
import type { Ledger, Corridor, UILens } from '../../services/ilp/types';

// Register cola layout once
if (!cytoscape.prototype.hasOwnProperty('cola')) {
  cytoscape.use(cola);
}

// =============================================================================
// PERFORMANCE CONSTANTS
// =============================================================================

const PERF_CONFIG = {
  // Batch size for progressive rendering
  BATCH_SIZE: 50,
  // Delay between batches (ms)
  BATCH_DELAY: 16, // ~60fps
  // Viewport padding for culling
  VIEWPORT_PADDING: 100,
  // Min zoom for LOD simplification
  LOD_ZOOM_THRESHOLD: 0.5,
  // Debounce delay for layout (ms)
  LAYOUT_DEBOUNCE: 100,
  // Max elements before switching to fast mode
  FAST_MODE_THRESHOLD: 200,
};

// =============================================================================
// TYPES
// =============================================================================

interface HighPerfMapProps {
  onNodeClick?: (ledgerId: string) => void;
  onEdgeClick?: (corridorId: string) => void;
  height?: number;
  enableLOD?: boolean;
  enableCulling?: boolean;
  enableProgressiveRender?: boolean;
}

interface PerformanceStats {
  nodeCount: number;
  edgeCount: number;
  visibleNodes: number;
  visibleEdges: number;
  fps: number;
  lastLayoutTime: number;
}

// =============================================================================
// DOMAIN COLORS
// =============================================================================

const DOMAIN_COLORS: Record<string, string> = {
  'on-ledger': '#00D4FF',
  'off-ledger': '#FF6B35',
  'hybrid': '#A855F7',
};

// =============================================================================
// HIGH PERFORMANCE CYTOSCAPE MAP
// =============================================================================

export function HighPerfCytoscapeMap({
  onNodeClick,
  onEdgeClick,
  height = 500,
  enableLOD = true,
  enableCulling = true,
  enableProgressiveRender = true,
}: HighPerfMapProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());
  
  const [stats, setStats] = useState<PerformanceStats>({
    nodeCount: 0,
    edgeCount: 0,
    visibleNodes: 0,
    visibleEdges: 0,
    fps: 60,
    lastLayoutTime: 0,
  });
  const [isRendering, setIsRendering] = useState(false);

  const {
    ledgers,
    connectors,
    corridors,
    activeLens,
    activeRoute,
    selectedLedger,
    selectLedger,
  } = useILPStore();

  // ==========================================================================
  // BUILD ELEMENTS WITH MEMOIZATION
  // ==========================================================================

  const elements = useMemo(() => {
    const nodes = ledgers.map(ledger => ({
      group: 'nodes' as const,
      data: {
        id: ledger.id,
        label: ledger.symbol || ledger.name,
        color: getLedgerColor(ledger, activeLens, connectors),
        domain: ledger.domain,
        finality: ledger.finality_seconds,
        tps: ledger.tps_estimate,
        ilpSupport: ledger.supports_ilp_adapter,
        isXRPL: ledger.id === 'xrpl',
      },
    }));

    const edges = corridors.map(corridor => {
      const connector = connectors.find(c => c.id === corridor.connector_id);
      const trust = connector?.trust_score || 0.5;

      return {
        group: 'edges' as const,
        data: {
          id: corridor.id,
          source: corridor.from_ledger,
          target: corridor.to_ledger,
          confidence: trust,
          bidirectional: corridor.bidirectional,
        },
      };
    });

    return { nodes, edges };
  }, [ledgers, corridors, connectors, activeLens]);

  // ==========================================================================
  // PROGRESSIVE RENDERING
  // ==========================================================================

  const renderProgressively = useCallback((cy: Core, nodes: any[], edges: any[]) => {
    if (!enableProgressiveRender || nodes.length < PERF_CONFIG.FAST_MODE_THRESHOLD) {
      // Small graph - render all at once
      cy.add([...nodes, ...edges]);
      return Promise.resolve();
    }

    setIsRendering(true);
    
    return new Promise<void>((resolve) => {
      let nodeIndex = 0;
      let edgeIndex = 0;

      const renderBatch = () => {
        cy.startBatch();

        // Render nodes in batches
        const nodeEnd = Math.min(nodeIndex + PERF_CONFIG.BATCH_SIZE, nodes.length);
        for (let i = nodeIndex; i < nodeEnd; i++) {
          cy.add(nodes[i]);
        }
        nodeIndex = nodeEnd;

        // Once all nodes are in, start adding edges
        if (nodeIndex >= nodes.length) {
          const edgeEnd = Math.min(edgeIndex + PERF_CONFIG.BATCH_SIZE, edges.length);
          for (let i = edgeIndex; i < edgeEnd; i++) {
            cy.add(edges[i]);
          }
          edgeIndex = edgeEnd;
        }

        cy.endBatch();

        // Update stats
        setStats(prev => ({
          ...prev,
          nodeCount: cy.nodes().length,
          edgeCount: cy.edges().length,
        }));

        // Continue or finish
        if (nodeIndex < nodes.length || edgeIndex < edges.length) {
          requestAnimationFrame(renderBatch);
        } else {
          setIsRendering(false);
          resolve();
        }
      };

      requestAnimationFrame(renderBatch);
    });
  }, [enableProgressiveRender]);

  // ==========================================================================
  // VIEWPORT CULLING
  // ==========================================================================

  const updateVisibility = useCallback((cy: Core) => {
    if (!enableCulling) return;

    const extent = cy.extent();
    const padding = PERF_CONFIG.VIEWPORT_PADDING;
    
    cy.startBatch();
    
    let visibleNodes = 0;
    let visibleEdges = 0;

    cy.nodes().forEach((node: NodeSingular) => {
      const pos = node.position();
      const inViewport = 
        pos.x >= extent.x1 - padding &&
        pos.x <= extent.x2 + padding &&
        pos.y >= extent.y1 - padding &&
        pos.y <= extent.y2 + padding;

      if (inViewport) {
        node.style('display', 'element');
        visibleNodes++;
      } else {
        node.style('display', 'none');
      }
    });

    cy.edges().forEach((edge: EdgeSingular) => {
      const source = edge.source();
      const target = edge.target();
      const visible = source.style('display') === 'element' || target.style('display') === 'element';
      
      if (visible) {
        edge.style('display', 'element');
        visibleEdges++;
      } else {
        edge.style('display', 'none');
      }
    });

    cy.endBatch();

    setStats(prev => ({ ...prev, visibleNodes, visibleEdges }));
  }, [enableCulling]);

  // ==========================================================================
  // LEVEL OF DETAIL
  // ==========================================================================

  const updateLOD = useCallback((cy: Core) => {
    if (!enableLOD) return;

    const zoom = cy.zoom();
    const isZoomedOut = zoom < PERF_CONFIG.LOD_ZOOM_THRESHOLD;

    cy.startBatch();

    if (isZoomedOut) {
      // Simplified view - hide labels, reduce detail
      cy.style()
        .selector('node')
        .style({
          'label': '',
          'border-width': 1,
        })
        .selector('edge')
        .style({
          'label': '',
          'width': 1,
        })
        .update();
    } else {
      // Full detail view
      cy.style()
        .selector('node')
        .style({
          'label': 'data(label)',
          'border-width': 2,
        })
        .selector('edge')
        .style({
          'label': 'data(label)',
          'width': 'mapData(confidence, 0, 1, 1, 4)',
        })
        .update();
    }

    cy.endBatch();
  }, [enableLOD]);

  // ==========================================================================
  // DEBOUNCED LAYOUT
  // ==========================================================================

  const runLayout = useCallback((cy: Core, animate = true) => {
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    layoutTimeoutRef.current = setTimeout(() => {
      const startTime = performance.now();

      const nodeCount = cy.nodes().length;
      const layoutName = nodeCount > PERF_CONFIG.FAST_MODE_THRESHOLD ? 'grid' : 'cola';

      cy.layout({
        name: layoutName,
        animate: animate && nodeCount < PERF_CONFIG.FAST_MODE_THRESHOLD,
        fit: true,
        padding: 50,
        nodeSpacing: nodeCount > 100 ? 40 : 80,
        ...(layoutName === 'cola' ? {
          edgeLength: 120,
          convergenceThreshold: 0.02,
          maxSimulationTime: 2000,
        } : {}),
      } as any).run();

      setStats(prev => ({
        ...prev,
        lastLayoutTime: performance.now() - startTime,
      }));
    }, PERF_CONFIG.LAYOUT_DEBOUNCE);
  }, []);

  // ==========================================================================
  // FPS MONITOR
  // ==========================================================================

  useEffect(() => {
    let running = true;

    const measureFPS = () => {
      if (!running) return;

      const now = performance.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      setStats(prev => ({
        ...prev,
        fps: Math.round(1000 / delta),
      }));

      frameRef.current = requestAnimationFrame(measureFPS);
    };

    frameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // ==========================================================================
  // INITIALIZE CYTOSCAPE
  // ==========================================================================

  useEffect(() => {
    if (!cyRef.current) return;

    if (!cyInstance.current) {
      cyInstance.current = cytoscape({
        container: cyRef.current,
        style: getCytoscapeStyles(),
        wheelSensitivity: 0.15,
        minZoom: 0.1,
        maxZoom: 4,
        boxSelectionEnabled: false,
        autounselectify: false,
      });

      const cy = cyInstance.current;

      // Event handlers
      cy.on('tap', 'node', (evt) => {
        const nodeId = evt.target.id();
        selectLedger(selectedLedger === nodeId ? null : nodeId);
        onNodeClick?.(nodeId);
      });

      cy.on('tap', 'edge', (evt) => {
        onEdgeClick?.(evt.target.id());
      });

      // Viewport change handlers for culling/LOD
      cy.on('viewport', () => {
        updateVisibility(cy);
        updateLOD(cy);
      });

      // Progressive render
      renderProgressively(cy, elements.nodes, elements.edges).then(() => {
        runLayout(cy, false);
      });
    } else {
      // Update existing instance
      const cy = cyInstance.current;
      
      cy.startBatch();
      cy.elements().remove();
      cy.endBatch();

      renderProgressively(cy, elements.nodes, elements.edges).then(() => {
        runLayout(cy);
      });
    }
  }, [elements, renderProgressively, runLayout, updateVisibility, updateLOD, selectLedger, selectedLedger, onNodeClick, onEdgeClick]);

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  useEffect(() => {
    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, []);

  // ==========================================================================
  // IMPERATIVE API
  // ==========================================================================

  const addNodes = useCallback((nodes: any[]) => {
    const cy = cyInstance.current;
    if (!cy) return;

    cy.startBatch();
    nodes.forEach(node => cy.add(node));
    cy.endBatch();
    runLayout(cy);
  }, [runLayout]);

  const addEdge = useCallback((source: string, target: string, confidence: number) => {
    const cy = cyInstance.current;
    if (!cy) return;

    const id = `${source}-${target}-${Date.now()}`;
    cy.add({
      group: 'edges',
      data: { id, source, target, confidence },
    });
    runLayout(cy);
  }, [runLayout]);

  const focusNode = useCallback((id: string) => {
    const cy = cyInstance.current;
    if (!cy) return;

    const node = cy.getElementById(id);
    if (node.length === 0) return;

    cy.animate({
      fit: { eles: node, padding: 100 },
      duration: 300,
      easing: 'ease-out-cubic',
    });
  }, []);

  const fitAll = useCallback(() => {
    const cy = cyInstance.current;
    if (!cy) return;
    cy.fit(undefined, 50);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (ledgers.length === 0) {
    return (
      <div className="w-full bg-cyber-darker rounded-lg border border-cyber-border flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-cyber-muted">Loading ILP Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header with Stats */}
      <div className="p-2 border-b border-cyber-border flex items-center justify-between">
        <div>
          <h3 className="font-cyber text-cyber-cyan text-sm">ILP NETWORK (HIGH-PERF)</h3>
          <p className="text-[9px] text-cyber-muted">
            {stats.nodeCount} nodes • {stats.edgeCount} edges • 
            {enableCulling && ` ${stats.visibleNodes}/${stats.nodeCount} visible •`}
            {` ${stats.fps} FPS`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRendering && (
            <span className="text-[9px] text-cyber-yellow animate-pulse">Rendering...</span>
          )}
          <button
            onClick={fitAll}
            className="px-2 py-1 text-[9px] bg-cyber-border rounded hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors"
          >
            FIT
          </button>
        </div>
      </div>

      {/* Cytoscape Container */}
      <div ref={cyRef} style={{ height: height - 50 }} className="w-full" />

      {/* Performance Legend */}
      <div className="p-1 border-t border-cyber-border text-[8px] text-cyber-muted flex items-center justify-between">
        <span>Layout: {stats.lastLayoutTime.toFixed(0)}ms</span>
        <div className="flex gap-2">
          {enableLOD && <span className="text-cyber-cyan">LOD</span>}
          {enableCulling && <span className="text-cyber-green">CULL</span>}
          {enableProgressiveRender && <span className="text-cyber-purple">PROG</span>}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CYTOSCAPE STYLES
// =============================================================================

function getCytoscapeStyles(): cytoscape.Stylesheet[] {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'color': '#FFF',
        'font-size': 10,
        'font-family': 'monospace',
        'border-width': 2,
        'border-color': '#00FFFF',
        'text-outline-width': 1,
        'text-outline-color': '#000',
        'width': 35,
        'height': 35,
        'text-margin-y': 4,
      },
    },
    {
      selector: 'node[isXRPL]',
      style: {
        'width': 55,
        'height': 55,
        'font-size': 12,
        'font-weight': 'bold',
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#FFFFFF',
        'border-width': 3,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 'mapData(confidence, 0, 1, 1, 4)',
        'line-color': 'mapData(confidence, 0, 1, #FF4444, #00FFCC)',
        'target-arrow-color': 'mapData(confidence, 0, 1, #FF4444, #00FFCC)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      },
    },
    {
      selector: 'edge[bidirectional]',
      style: {
        'source-arrow-shape': 'triangle',
        'source-arrow-color': 'mapData(confidence, 0, 1, #FF4444, #00FFCC)',
      },
    },
  ];
}

// =============================================================================
// HELPER
// =============================================================================

function getLedgerColor(ledger: Ledger, lens: UILens, connectors: any[]): string {
  switch (lens) {
    case 'domain':
      return DOMAIN_COLORS[ledger.domain] || '#888';
    case 'trust':
      const related = connectors.filter(c => c.from === ledger.id || c.to === ledger.id);
      if (related.length === 0) return '#888';
      const avg = related.reduce((s, c) => s + c.trust_score, 0) / related.length;
      return avg > 0.7 ? '#00FF88' : avg > 0.4 ? '#FFD700' : '#FF4444';
    case 'flow':
      return ledger.supports_ilp_adapter ? '#00FF88' : '#666';
    default:
      return '#888';
  }
}

export default HighPerfCytoscapeMap;
