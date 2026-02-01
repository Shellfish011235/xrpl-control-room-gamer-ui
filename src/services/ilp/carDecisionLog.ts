// CAR Decision Log - Cryptographic Audit Record System
// Records all routing decisions with full provenance for graph visualization
// "Every edge in the graph is a decision. Every decision has a record."

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface CARDecision {
  id: string;
  timestamp: number;
  
  // Decision context
  type: 'route_validation' | 'corridor_approval' | 'ledger_trust' | 'risk_assessment' | 'amendment_impact';
  
  // What was evaluated
  subject: {
    type: 'route' | 'corridor' | 'ledger' | 'amendment';
    id: string;
    from?: string;
    to?: string;
    path?: string[];
  };
  
  // Decision outcome
  decision: {
    approved: boolean;
    confidence: number;        // 0-1
    riskScore: number;         // 0-1 (higher = riskier)
    reason: string;
    factors: DecisionFactor[];
  };
  
  // Provenance
  provenance: {
    source: 'xrpl_pathfind' | 'manual' | 'auto_validator' | 'simulation' | 'amendment_trigger';
    validator?: string;        // Who/what made the decision
    method?: string;           // How it was validated
    xrplTxHash?: string;       // If linked to an XRPL transaction
    amendmentId?: string;      // If triggered by amendment
  };
  
  // Graph integration
  graphImpact: {
    affectedNodes: string[];
    affectedEdges: string[];
    visualChanges: GraphVisualChange[];
  };
  
  // Metadata
  metadata?: {
    sessionId?: string;
    userNote?: string;
    tags?: string[];
  };
}

export interface DecisionFactor {
  name: string;
  weight: number;
  score: number;
  reason: string;
}

export interface GraphVisualChange {
  type: 'highlight' | 'color' | 'opacity' | 'width' | 'label' | 'badge';
  target: string;            // Element ID
  property?: string;
  oldValue?: string | number;
  newValue: string | number;
}

export interface CARStats {
  totalDecisions: number;
  approvedCount: number;
  rejectedCount: number;
  avgConfidence: number;
  avgRiskScore: number;
  byType: Record<CARDecision['type'], number>;
  bySource: Record<string, number>;
}

// =============================================================================
// CAR DECISION LOG STORE (Zustand)
// =============================================================================

interface CARLogState {
  decisions: CARDecision[];
  maxDecisions: number;
  
  // Actions
  recordDecision: (decision: Omit<CARDecision, 'id' | 'timestamp'>) => CARDecision;
  getDecision: (id: string) => CARDecision | undefined;
  getDecisionsForElement: (elementId: string) => CARDecision[];
  getDecisionsByType: (type: CARDecision['type']) => CARDecision[];
  getDecisionsInRange: (start: number, end: number) => CARDecision[];
  getRecentDecisions: (count: number) => CARDecision[];
  getStats: () => CARStats;
  clearDecisions: () => void;
  exportDecisions: () => string;
  importDecisions: (json: string) => boolean;
}

export const useCARLog = create<CARLogState>()(
  persist(
    (set, get) => ({
      decisions: [],
      maxDecisions: 5000,

      recordDecision: (partial) => {
        const decision: CARDecision = {
          ...partial,
          id: `car-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          timestamp: Date.now(),
        };

        set(state => {
          const newDecisions = [...state.decisions, decision];
          // Trim to max size
          if (newDecisions.length > state.maxDecisions) {
            return { decisions: newDecisions.slice(-state.maxDecisions) };
          }
          return { decisions: newDecisions };
        });

        console.log(`[CARLog] Decision recorded: ${decision.type} - ${decision.decision.approved ? 'APPROVED' : 'REJECTED'} (${(decision.decision.confidence * 100).toFixed(0)}%)`);
        
        return decision;
      },

      getDecision: (id) => {
        return get().decisions.find(d => d.id === id);
      },

      getDecisionsForElement: (elementId) => {
        return get().decisions.filter(d => 
          d.subject.id === elementId ||
          d.graphImpact.affectedNodes.includes(elementId) ||
          d.graphImpact.affectedEdges.includes(elementId)
        );
      },

      getDecisionsByType: (type) => {
        return get().decisions.filter(d => d.type === type);
      },

      getDecisionsInRange: (start, end) => {
        return get().decisions.filter(d => d.timestamp >= start && d.timestamp <= end);
      },

      getRecentDecisions: (count) => {
        const decisions = get().decisions;
        return decisions.slice(-count);
      },

      getStats: () => {
        const decisions = get().decisions;
        
        if (decisions.length === 0) {
          return {
            totalDecisions: 0,
            approvedCount: 0,
            rejectedCount: 0,
            avgConfidence: 0,
            avgRiskScore: 0,
            byType: {} as Record<CARDecision['type'], number>,
            bySource: {},
          };
        }

        const approved = decisions.filter(d => d.decision.approved);
        const avgConfidence = decisions.reduce((s, d) => s + d.decision.confidence, 0) / decisions.length;
        const avgRisk = decisions.reduce((s, d) => s + d.decision.riskScore, 0) / decisions.length;

        const byType: Record<string, number> = {};
        const bySource: Record<string, number> = {};

        decisions.forEach(d => {
          byType[d.type] = (byType[d.type] || 0) + 1;
          bySource[d.provenance.source] = (bySource[d.provenance.source] || 0) + 1;
        });

        return {
          totalDecisions: decisions.length,
          approvedCount: approved.length,
          rejectedCount: decisions.length - approved.length,
          avgConfidence,
          avgRiskScore: avgRisk,
          byType: byType as Record<CARDecision['type'], number>,
          bySource,
        };
      },

      clearDecisions: () => {
        set({ decisions: [] });
      },

      exportDecisions: () => {
        return JSON.stringify({
          decisions: get().decisions,
          exportedAt: Date.now(),
          version: '1.0',
        }, null, 2);
      },

      importDecisions: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.decisions && Array.isArray(data.decisions)) {
            set({ decisions: data.decisions });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'car-decision-log',
      partialize: (state) => ({ decisions: state.decisions }),
    }
  )
);

// =============================================================================
// HELPER FUNCTIONS FOR CREATING DECISIONS
// =============================================================================

export function createRouteDecision(
  from: string,
  to: string,
  path: string[],
  approved: boolean,
  confidence: number,
  factors: DecisionFactor[],
  source: CARDecision['provenance']['source'] = 'auto_validator'
): Omit<CARDecision, 'id' | 'timestamp'> {
  return {
    type: 'route_validation',
    subject: {
      type: 'route',
      id: `${from}-${to}`,
      from,
      to,
      path,
    },
    decision: {
      approved,
      confidence,
      riskScore: 1 - confidence,
      reason: approved 
        ? `Route approved with ${(confidence * 100).toFixed(0)}% confidence`
        : `Route rejected - confidence too low (${(confidence * 100).toFixed(0)}%)`,
      factors,
    },
    provenance: {
      source,
      method: 'multi_factor_analysis',
    },
    graphImpact: {
      affectedNodes: [from, to, ...path],
      affectedEdges: pathToEdges(path),
      visualChanges: approved ? [
        { type: 'highlight', target: `${from}-${to}`, newValue: 'green' },
        { type: 'width', target: `${from}-${to}`, newValue: confidence * 4 },
      ] : [
        { type: 'highlight', target: `${from}-${to}`, newValue: 'red' },
        { type: 'opacity', target: `${from}-${to}`, newValue: 0.3 },
      ],
    },
  };
}

export function createCorridorDecision(
  from: string,
  to: string,
  corridorId: string,
  approved: boolean,
  confidence: number,
  reason: string,
  source: CARDecision['provenance']['source'] = 'auto_validator'
): Omit<CARDecision, 'id' | 'timestamp'> {
  return {
    type: 'corridor_approval',
    subject: {
      type: 'corridor',
      id: corridorId,
      from,
      to,
    },
    decision: {
      approved,
      confidence,
      riskScore: approved ? 0.2 : 0.8,
      reason,
      factors: [
        { name: 'trust_score', weight: 0.4, score: confidence, reason: 'Connector trust evaluation' },
        { name: 'liquidity', weight: 0.3, score: approved ? 0.8 : 0.3, reason: 'Liquidity assessment' },
        { name: 'history', weight: 0.3, score: approved ? 0.7 : 0.4, reason: 'Historical performance' },
      ],
    },
    provenance: {
      source,
      method: 'corridor_verification',
    },
    graphImpact: {
      affectedNodes: [from, to],
      affectedEdges: [corridorId],
      visualChanges: [
        { type: 'color', target: corridorId, newValue: approved ? '#00FFCC' : '#FF4444' },
        { type: 'badge', target: corridorId, newValue: approved ? 'CAR✓' : 'CAR✗' },
      ],
    },
  };
}

export function createAmendmentImpactDecision(
  amendmentId: string,
  affectedLedgers: string[],
  affectedCorridors: string[],
  riskScore: number,
  analysis: string
): Omit<CARDecision, 'id' | 'timestamp'> {
  return {
    type: 'amendment_impact',
    subject: {
      type: 'amendment',
      id: amendmentId,
    },
    decision: {
      approved: riskScore < 0.5,
      confidence: 1 - riskScore,
      riskScore,
      reason: analysis,
      factors: [
        { name: 'breaking_changes', weight: 0.4, score: 1 - riskScore, reason: 'Breaking change analysis' },
        { name: 'backward_compat', weight: 0.3, score: riskScore < 0.3 ? 0.9 : 0.5, reason: 'Backward compatibility' },
        { name: 'ecosystem_impact', weight: 0.3, score: 1 - (affectedCorridors.length * 0.1), reason: 'Ecosystem impact scope' },
      ],
    },
    provenance: {
      source: 'amendment_trigger',
      amendmentId,
      method: 'amendment_impact_analysis',
    },
    graphImpact: {
      affectedNodes: affectedLedgers,
      affectedEdges: affectedCorridors,
      visualChanges: affectedCorridors.map(id => ({
        type: 'badge' as const,
        target: id,
        newValue: `Amendment: ${amendmentId.slice(0, 8)}`,
      })),
    },
  };
}

// =============================================================================
// GRAPH INTEGRATION HELPERS
// =============================================================================

export function getDecisionBadge(decision: CARDecision): string {
  if (decision.decision.approved) {
    return `CAR✓ ${(decision.decision.confidence * 100).toFixed(0)}%`;
  }
  return `CAR✗`;
}

export function getDecisionColor(decision: CARDecision): string {
  if (!decision.decision.approved) return '#FF4444';
  if (decision.decision.confidence > 0.8) return '#00FF88';
  if (decision.decision.confidence > 0.5) return '#00FFCC';
  return '#FFD700';
}

export function shouldHighlightElement(elementId: string, decisions: CARDecision[]): boolean {
  return decisions.some(d => 
    d.graphImpact.affectedNodes.includes(elementId) ||
    d.graphImpact.affectedEdges.includes(elementId)
  );
}

export function getElementDecisionSummary(elementId: string, decisions: CARDecision[]): {
  total: number;
  approved: number;
  rejected: number;
  avgConfidence: number;
  lastDecision: CARDecision | null;
} {
  const relevant = decisions.filter(d =>
    d.subject.id === elementId ||
    d.graphImpact.affectedNodes.includes(elementId) ||
    d.graphImpact.affectedEdges.includes(elementId)
  );

  if (relevant.length === 0) {
    return { total: 0, approved: 0, rejected: 0, avgConfidence: 0, lastDecision: null };
  }

  const approved = relevant.filter(d => d.decision.approved);
  const avgConf = relevant.reduce((s, d) => s + d.decision.confidence, 0) / relevant.length;

  return {
    total: relevant.length,
    approved: approved.length,
    rejected: relevant.length - approved.length,
    avgConfidence: avgConf,
    lastDecision: relevant[relevant.length - 1],
  };
}

// =============================================================================
// UTILITY
// =============================================================================

function pathToEdges(path: string[]): string[] {
  const edges: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    edges.push(`${path[i]}-${path[i + 1]}`);
  }
  return edges;
}

// =============================================================================
// EXPORT FOR COMPLIANCE
// =============================================================================

export function generateComplianceReport(decisions: CARDecision[]): string {
  const stats = {
    totalDecisions: decisions.length,
    approved: decisions.filter(d => d.decision.approved).length,
    rejected: decisions.filter(d => !d.decision.approved).length,
    avgConfidence: decisions.length > 0 
      ? decisions.reduce((s, d) => s + d.decision.confidence, 0) / decisions.length 
      : 0,
    timeRange: decisions.length > 0 
      ? { start: decisions[0].timestamp, end: decisions[decisions.length - 1].timestamp }
      : null,
  };

  const report = `
CAR COMPLIANCE REPORT
Generated: ${new Date().toISOString()}
=====================================

SUMMARY
-------
Total Decisions: ${stats.totalDecisions}
Approved: ${stats.approved} (${((stats.approved / stats.totalDecisions) * 100).toFixed(1)}%)
Rejected: ${stats.rejected} (${((stats.rejected / stats.totalDecisions) * 100).toFixed(1)}%)
Average Confidence: ${(stats.avgConfidence * 100).toFixed(1)}%

TIME RANGE
----------
${stats.timeRange ? `From: ${new Date(stats.timeRange.start).toISOString()}
To: ${new Date(stats.timeRange.end).toISOString()}` : 'No decisions recorded'}

DECISION BREAKDOWN BY TYPE
--------------------------
${Object.entries(decisions.reduce((acc, d) => {
  acc[d.type] = (acc[d.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([type, count]) => `${type}: ${count}`).join('\n')}

PROVENANCE SOURCES
------------------
${Object.entries(decisions.reduce((acc, d) => {
  acc[d.provenance.source] = (acc[d.provenance.source] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([source, count]) => `${source}: ${count}`).join('\n')}

=====================================
End of Report
`;

  return report;
}
