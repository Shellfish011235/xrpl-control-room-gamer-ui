// Amendment Diff View Component
// Shows topology changes before/after XRPL amendment activation
// "Amendments reshape trust topology. See the delta, understand the shift."

import React, { useState, useMemo, useCallback } from 'react';
import { 
  GitCompare, Plus, Minus, RefreshCw, AlertTriangle,
  ChevronDown, ChevronUp, ArrowRight, Shield, Clock,
  Check, X, Eye, EyeOff
} from 'lucide-react';
import { 
  getReplayEngine, 
  type TopologySnapshot, 
  type TopologyDiff 
} from '../../services/ilp/timeSeriesReplay';

// =============================================================================
// TYPES
// =============================================================================

interface AmendmentDiffViewProps {
  beforeSnapshot?: TopologySnapshot | null;
  afterSnapshot?: TopologySnapshot | null;
  amendmentName?: string;
  onSelectSnapshot?: (type: 'before' | 'after', snapshot: TopologySnapshot) => void;
}

interface DiffHighlight {
  type: 'added' | 'removed' | 'modified';
  elementType: 'ledger' | 'corridor';
  id: string;
}

// =============================================================================
// AMENDMENT DIFF VIEW
// =============================================================================

export function AmendmentDiffView({
  beforeSnapshot,
  afterSnapshot,
  amendmentName = 'Amendment',
  onSelectSnapshot,
}: AmendmentDiffViewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('corridors');
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [selectedDiff, setSelectedDiff] = useState<DiffHighlight | null>(null);

  const replayEngine = getReplayEngine();

  // ==========================================================================
  // COMPUTE DIFF
  // ==========================================================================

  const diff = useMemo((): TopologyDiff | null => {
    if (!beforeSnapshot || !afterSnapshot) return null;
    return replayEngine.compareTopologies(beforeSnapshot.id, afterSnapshot.id);
  }, [beforeSnapshot, afterSnapshot, replayEngine]);

  // ==========================================================================
  // STATS
  // ==========================================================================

  const stats = useMemo(() => {
    if (!diff) return null;

    return {
      totalChanges: 
        diff.addedLedgers.length + 
        diff.removedLedgers.length + 
        diff.modifiedLedgers.length +
        diff.addedCorridors.length +
        diff.removedCorridors.length +
        diff.modifiedCorridors.length,
      ledgerChanges: diff.addedLedgers.length + diff.removedLedgers.length + diff.modifiedLedgers.length,
      corridorChanges: diff.addedCorridors.length + diff.removedCorridors.length + diff.modifiedCorridors.length,
      isBreaking: diff.removedCorridors.length > 0 || diff.removedLedgers.length > 0,
    };
  }, [diff]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const getDiffColor = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added': return 'text-cyber-green border-cyber-green/50 bg-cyber-green/10';
      case 'removed': return 'text-cyber-red border-cyber-red/50 bg-cyber-red/10';
      case 'modified': return 'text-cyber-yellow border-cyber-yellow/50 bg-cyber-yellow/10';
    }
  };

  const getDiffIcon = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added': return <Plus size={12} />;
      case 'removed': return <Minus size={12} />;
      case 'modified': return <RefreshCw size={12} />;
    }
  };

  // ==========================================================================
  // NO DATA STATE
  // ==========================================================================

  if (!beforeSnapshot || !afterSnapshot) {
    return (
      <div className="bg-cyber-darker rounded-lg border border-cyber-border p-6 text-center">
        <GitCompare size={32} className="text-cyber-muted mx-auto mb-3 opacity-50" />
        <h3 className="font-cyber text-cyber-text text-sm mb-2">Amendment Diff View</h3>
        <p className="text-xs text-cyber-muted mb-4">
          Select two topology snapshots to compare before/after an amendment activation
        </p>
        <div className="flex justify-center gap-4">
          <div className="p-3 rounded border border-dashed border-cyber-border text-center">
            <p className="text-[10px] text-cyber-muted mb-1">BEFORE</p>
            <p className="text-xs text-cyber-text">
              {beforeSnapshot ? beforeSnapshot.label : 'Not selected'}
            </p>
          </div>
          <ArrowRight size={20} className="text-cyber-muted self-center" />
          <div className="p-3 rounded border border-dashed border-cyber-border text-center">
            <p className="text-[10px] text-cyber-muted mb-1">AFTER</p>
            <p className="text-xs text-cyber-text">
              {afterSnapshot ? afterSnapshot.label : 'Not selected'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // NO CHANGES STATE
  // ==========================================================================

  if (diff && stats?.totalChanges === 0) {
    return (
      <div className="bg-cyber-darker rounded-lg border border-cyber-border">
        <div className="p-3 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-cyber-cyan" />
            <span className="font-cyber text-cyber-cyan text-sm">{amendmentName} DIFF</span>
          </div>
        </div>
        <div className="p-6 text-center">
          <Check size={32} className="text-cyber-green mx-auto mb-3" />
          <p className="text-sm text-cyber-text mb-1">No Changes Detected</p>
          <p className="text-xs text-cyber-muted">
            The topology is identical before and after the amendment
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-cyber-cyan" />
            <span className="font-cyber text-cyber-cyan text-sm">{amendmentName} DIFF</span>
          </div>
          <button
            onClick={() => setShowOnlyChanges(!showOnlyChanges)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors"
          >
            {showOnlyChanges ? <Eye size={10} /> : <EyeOff size={10} />}
            {showOnlyChanges ? 'Changes Only' : 'Show All'}
          </button>
        </div>

        {/* Snapshot Labels */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex-1 p-1.5 rounded bg-cyber-red/10 border border-cyber-red/30 text-cyber-red">
            <span className="opacity-70">BEFORE:</span> {beforeSnapshot.label}
          </div>
          <ArrowRight size={14} className="text-cyber-muted" />
          <div className="flex-1 p-1.5 rounded bg-cyber-green/10 border border-cyber-green/30 text-cyber-green">
            <span className="opacity-70">AFTER:</span> {afterSnapshot.label}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="p-2 border-b border-cyber-border bg-cyber-darker/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyber-green" />
                <span className="text-[9px] text-cyber-muted">
                  +{diff!.addedLedgers.length + diff!.addedCorridors.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyber-red" />
                <span className="text-[9px] text-cyber-muted">
                  -{diff!.removedLedgers.length + diff!.removedCorridors.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyber-yellow" />
                <span className="text-[9px] text-cyber-muted">
                  ~{diff!.modifiedLedgers.length + diff!.modifiedCorridors.length}
                </span>
              </div>
            </div>
            {stats.isBreaking && (
              <div className="flex items-center gap-1 text-cyber-red">
                <AlertTriangle size={12} />
                <span className="text-[9px]">Breaking Changes</span>
              </div>
            )}
          </div>
          <p className="text-[9px] text-cyber-muted mt-1">{diff!.summary}</p>
        </div>
      )}

      {/* Ledger Changes Section */}
      {diff && (diff.addedLedgers.length > 0 || diff.removedLedgers.length > 0 || diff.modifiedLedgers.length > 0) && (
        <div className="border-b border-cyber-border">
          <button
            onClick={() => toggleSection('ledgers')}
            className="w-full p-2 flex items-center justify-between hover:bg-cyber-border/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-cyber-purple" />
              <span className="text-xs text-cyber-text">Ledgers</span>
              <span className="text-[9px] text-cyber-muted">
                ({stats?.ledgerChanges} changes)
              </span>
            </div>
            {expandedSection === 'ledgers' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSection === 'ledgers' && (
            <div className="p-2 space-y-1.5 bg-cyber-darker/30">
              {/* Added Ledgers */}
              {diff.addedLedgers.map(ledger => (
                <div
                  key={`add-${ledger.id}`}
                  className={`p-2 rounded border ${getDiffColor('added')} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedDiff({ type: 'added', elementType: 'ledger', id: ledger.id })}
                >
                  <div className="flex items-center gap-2">
                    {getDiffIcon('added')}
                    <span className="text-xs font-mono">{ledger.name}</span>
                    <span className="text-[9px] opacity-70">({ledger.domain})</span>
                  </div>
                </div>
              ))}

              {/* Removed Ledgers */}
              {diff.removedLedgers.map(ledger => (
                <div
                  key={`rem-${ledger.id}`}
                  className={`p-2 rounded border ${getDiffColor('removed')} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedDiff({ type: 'removed', elementType: 'ledger', id: ledger.id })}
                >
                  <div className="flex items-center gap-2">
                    {getDiffIcon('removed')}
                    <span className="text-xs font-mono line-through">{ledger.name}</span>
                    <span className="text-[9px] opacity-70">({ledger.domain})</span>
                  </div>
                </div>
              ))}

              {/* Modified Ledgers */}
              {diff.modifiedLedgers.map(({ before, after, changes }) => (
                <div
                  key={`mod-${before.id}`}
                  className={`p-2 rounded border ${getDiffColor('modified')} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedDiff({ type: 'modified', elementType: 'ledger', id: before.id })}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getDiffIcon('modified')}
                    <span className="text-xs font-mono">{before.name}</span>
                  </div>
                  <div className="pl-5 text-[9px] opacity-80">
                    {changes.map((change, i) => (
                      <div key={i}>{change}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Corridor Changes Section */}
      {diff && (diff.addedCorridors.length > 0 || diff.removedCorridors.length > 0 || diff.modifiedCorridors.length > 0) && (
        <div className="border-b border-cyber-border">
          <button
            onClick={() => toggleSection('corridors')}
            className="w-full p-2 flex items-center justify-between hover:bg-cyber-border/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowRight size={12} className="text-cyber-cyan" />
              <span className="text-xs text-cyber-text">Corridors</span>
              <span className="text-[9px] text-cyber-muted">
                ({stats?.corridorChanges} changes)
              </span>
            </div>
            {expandedSection === 'corridors' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSection === 'corridors' && (
            <div className="p-2 space-y-1.5 bg-cyber-darker/30">
              {/* Added Corridors */}
              {diff.addedCorridors.map(corridor => (
                <div
                  key={`add-${corridor.id}`}
                  className={`p-2 rounded border ${getDiffColor('added')} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedDiff({ type: 'added', elementType: 'corridor', id: corridor.id })}
                >
                  <div className="flex items-center gap-2">
                    {getDiffIcon('added')}
                    <span className="text-xs font-mono">{corridor.from}</span>
                    <ArrowRight size={10} />
                    <span className="text-xs font-mono">{corridor.to}</span>
                    <span className="text-[9px] opacity-70">
                      ({(corridor.confidence * 100).toFixed(0)}% conf)
                    </span>
                  </div>
                </div>
              ))}

              {/* Removed Corridors */}
              {diff.removedCorridors.map(corridor => (
                <div
                  key={`rem-${corridor.id}`}
                  className={`p-2 rounded border ${getDiffColor('removed')} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedDiff({ type: 'removed', elementType: 'corridor', id: corridor.id })}
                >
                  <div className="flex items-center gap-2">
                    {getDiffIcon('removed')}
                    <span className="text-xs font-mono line-through">{corridor.from}</span>
                    <ArrowRight size={10} />
                    <span className="text-xs font-mono line-through">{corridor.to}</span>
                  </div>
                </div>
              ))}

              {/* Modified Corridors */}
              {diff.modifiedCorridors.map(({ before, after, changes }) => (
                <div
                  key={`mod-${before.id}`}
                  className={`p-2 rounded border ${getDiffColor('modified')} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedDiff({ type: 'modified', elementType: 'corridor', id: before.id })}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getDiffIcon('modified')}
                    <span className="text-xs font-mono">{before.from}</span>
                    <ArrowRight size={10} />
                    <span className="text-xs font-mono">{before.to}</span>
                  </div>
                  <div className="pl-5 text-[9px] opacity-80">
                    {changes.map((change, i) => (
                      <div key={i}>{change}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Diff Details */}
      {selectedDiff && (
        <div className="p-3 bg-cyber-cyan/5 border-t border-cyber-cyan/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-cyber-cyan font-cyber">
              {selectedDiff.elementType.toUpperCase()} DETAILS
            </span>
            <button
              onClick={() => setSelectedDiff(null)}
              className="text-cyber-muted hover:text-cyber-text"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-[10px] text-cyber-muted">
            {selectedDiff.type === 'added' && 'This element was added after the amendment'}
            {selectedDiff.type === 'removed' && 'This element was removed by the amendment'}
            {selectedDiff.type === 'modified' && 'This element was modified by the amendment'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "Amendments reshape trust topology. See the delta, understand the shift."
        </p>
      </div>
    </div>
  );
}

export default AmendmentDiffView;
