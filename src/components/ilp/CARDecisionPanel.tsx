// CAR Decision Panel - View and Manage Cryptographic Audit Records
// Displays decision history, stats, and allows export for compliance

import React, { useState, useMemo } from 'react';
import {
  Shield, CheckCircle, XCircle, Clock, Download, Trash2,
  Filter, ChevronDown, ChevronUp, AlertTriangle, Activity,
  FileText, BarChart2, Eye, ArrowRight
} from 'lucide-react';
import {
  useCARLog,
  type CARDecision,
  type CARStats,
  getDecisionColor,
  generateComplianceReport,
} from '../../services/ilp/carDecisionLog';

// =============================================================================
// TYPES
// =============================================================================

interface CARDecisionPanelProps {
  onDecisionSelect?: (decision: CARDecision) => void;
  onHighlightElements?: (nodes: string[], edges: string[]) => void;
  compact?: boolean;
}

type FilterType = 'all' | 'approved' | 'rejected' | CARDecision['type'];

// =============================================================================
// CAR DECISION PANEL
// =============================================================================

export function CARDecisionPanel({
  onDecisionSelect,
  onHighlightElements,
  compact = false,
}: CARDecisionPanelProps) {
  const { decisions, getStats, clearDecisions, exportDecisions } = useCARLog();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(!compact);

  const stats = useMemo(() => getStats(), [decisions, getStats]);

  // ==========================================================================
  // FILTERED DECISIONS
  // ==========================================================================

  const filteredDecisions = useMemo(() => {
    let filtered = [...decisions].reverse(); // Most recent first

    switch (filter) {
      case 'approved':
        return filtered.filter(d => d.decision.approved);
      case 'rejected':
        return filtered.filter(d => !d.decision.approved);
      case 'route_validation':
      case 'corridor_approval':
      case 'ledger_trust':
      case 'risk_assessment':
      case 'amendment_impact':
        return filtered.filter(d => d.type === filter);
      default:
        return filtered;
    }
  }, [decisions, filter]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleExport = () => {
    const data = exportDecisions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car-decisions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    const report = generateComplianceReport(decisions);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car-compliance-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDecisionClick = (decision: CARDecision) => {
    setExpandedId(prev => prev === decision.id ? null : decision.id);
    onDecisionSelect?.(decision);
    onHighlightElements?.(
      decision.graphImpact.affectedNodes,
      decision.graphImpact.affectedEdges
    );
  };

  const handleClear = () => {
    if (window.confirm('Clear all CAR decisions? This cannot be undone.')) {
      clearDecisions();
    }
  };

  // ==========================================================================
  // FORMAT HELPERS
  // ==========================================================================

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: CARDecision['type']) => {
    switch (type) {
      case 'route_validation': return <ArrowRight size={12} />;
      case 'corridor_approval': return <Activity size={12} />;
      case 'ledger_trust': return <Shield size={12} />;
      case 'risk_assessment': return <AlertTriangle size={12} />;
      case 'amendment_impact': return <FileText size={12} />;
    }
  };

  const getTypeLabel = (type: CARDecision['type']) => {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // ==========================================================================
  // COMPACT RENDER
  // ==========================================================================

  if (compact) {
    return (
      <div className="bg-cyber-darker rounded border border-cyber-border p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Shield size={12} className="text-cyber-purple" />
            <span className="text-[10px] text-cyber-purple font-cyber">CAR LOG</span>
          </div>
          <span className="text-[9px] text-cyber-muted">{decisions.length} decisions</span>
        </div>
        
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-cyber-green">✓ {stats.approvedCount}</span>
          <span className="text-cyber-red">✗ {stats.rejectedCount}</span>
          <span className="text-cyber-muted">
            {(stats.avgConfidence * 100).toFixed(0)}% avg
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // FULL RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-cyber-purple" />
            <span className="font-cyber text-cyber-purple text-sm">CAR DECISION LOG</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-1 rounded hover:bg-cyber-border text-cyber-muted hover:text-cyber-text"
              title="Toggle Stats"
            >
              <BarChart2 size={12} />
            </button>
            <button
              onClick={handleExportReport}
              className="p-1 rounded hover:bg-cyber-border text-cyber-muted hover:text-cyber-text"
              title="Export Compliance Report"
            >
              <FileText size={12} />
            </button>
            <button
              onClick={handleExport}
              className="p-1 rounded hover:bg-cyber-border text-cyber-muted hover:text-cyber-text"
              title="Export JSON"
            >
              <Download size={12} />
            </button>
            <button
              onClick={handleClear}
              className="p-1 rounded hover:bg-cyber-red/20 text-cyber-muted hover:text-cyber-red"
              title="Clear All"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border text-center">
              <p className="text-lg font-cyber text-cyber-text">{stats.totalDecisions}</p>
              <p className="text-[8px] text-cyber-muted">TOTAL</p>
            </div>
            <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30 text-center">
              <p className="text-lg font-cyber text-cyber-green">{stats.approvedCount}</p>
              <p className="text-[8px] text-cyber-green">APPROVED</p>
            </div>
            <div className="p-2 rounded bg-cyber-red/10 border border-cyber-red/30 text-center">
              <p className="text-lg font-cyber text-cyber-red">{stats.rejectedCount}</p>
              <p className="text-[8px] text-cyber-red">REJECTED</p>
            </div>
            <div className="p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-center">
              <p className="text-lg font-cyber text-cyber-cyan">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </p>
              <p className="text-[8px] text-cyber-cyan">AVG CONF</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={10} className="text-cyber-muted" />
          {(['all', 'approved', 'rejected', 'route_validation', 'corridor_approval', 'amendment_impact'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                filter === f
                  ? 'bg-cyber-purple text-white'
                  : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
              }`}
            >
              {f === 'all' ? 'All' : f === 'approved' ? '✓' : f === 'rejected' ? '✗' : getTypeLabel(f as CARDecision['type']).slice(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Decision List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredDecisions.length === 0 ? (
          <div className="p-6 text-center">
            <Shield size={24} className="text-cyber-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs text-cyber-muted">No decisions recorded</p>
            <p className="text-[9px] text-cyber-muted mt-1">
              Decisions are logged when routes are validated
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cyber-border">
            {filteredDecisions.map(decision => (
              <div
                key={decision.id}
                className={`p-2 hover:bg-cyber-border/30 cursor-pointer transition-colors ${
                  expandedId === decision.id ? 'bg-cyber-border/20' : ''
                }`}
                onClick={() => handleDecisionClick(decision)}
              >
                {/* Decision Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {decision.decision.approved ? (
                      <CheckCircle size={14} className="text-cyber-green" />
                    ) : (
                      <XCircle size={14} className="text-cyber-red" />
                    )}
                    <div className="flex items-center gap-1 text-cyber-muted">
                      {getTypeIcon(decision.type)}
                      <span className="text-[9px]">{getTypeLabel(decision.type)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[9px] font-mono"
                      style={{ color: getDecisionColor(decision) }}
                    >
                      {(decision.decision.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-cyber-muted">
                      {formatTime(decision.timestamp)}
                    </span>
                    {expandedId === decision.id ? (
                      <ChevronUp size={12} className="text-cyber-muted" />
                    ) : (
                      <ChevronDown size={12} className="text-cyber-muted" />
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="mt-1 text-[10px] text-cyber-text">
                  {decision.subject.from && decision.subject.to ? (
                    <span className="font-mono">
                      {decision.subject.from} → {decision.subject.to}
                    </span>
                  ) : (
                    <span className="font-mono">{decision.subject.id}</span>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === decision.id && (
                  <div className="mt-2 pt-2 border-t border-cyber-border/50">
                    {/* Reason */}
                    <p className="text-[9px] text-cyber-muted mb-2">
                      {decision.decision.reason}
                    </p>

                    {/* Factors */}
                    {decision.decision.factors.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[8px] text-cyber-muted mb-1">FACTORS:</p>
                        <div className="space-y-1">
                          {decision.decision.factors.map((factor, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-cyber-border rounded overflow-hidden">
                                <div
                                  className="h-full bg-cyber-cyan"
                                  style={{ width: `${factor.score * 100}%` }}
                                />
                              </div>
                              <span className="text-[8px] text-cyber-muted w-20 truncate">
                                {factor.name}
                              </span>
                              <span className="text-[8px] text-cyber-cyan">
                                {(factor.score * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Provenance */}
                    <div className="flex items-center gap-2 text-[8px] text-cyber-muted">
                      <span>Source: {decision.provenance.source}</span>
                      {decision.provenance.method && (
                        <span>• Method: {decision.provenance.method}</span>
                      )}
                    </div>

                    {/* Graph Impact */}
                    <div className="mt-1 flex items-center gap-2 text-[8px]">
                      <Eye size={10} className="text-cyber-purple" />
                      <span className="text-cyber-muted">
                        Affects {decision.graphImpact.affectedNodes.length} nodes, {decision.graphImpact.affectedEdges.length} edges
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "Every edge in the graph is a decision. Every decision has a record."
        </p>
      </div>
    </div>
  );
}

export default CARDecisionPanel;
