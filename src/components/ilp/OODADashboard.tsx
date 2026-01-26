// OODA Dashboard Component
// Displays the OODA loop state, Feynman summary, and Lear invariants

import { motion } from 'framer-motion';
import {
  Eye, Compass, Brain, Play, Pause,
  CheckCircle, XCircle, BookOpen,
  RefreshCw, Shield
} from 'lucide-react';
import { useILPStore, useILPOODA, useILPFeynman, useILPInvariants } from '../../store/ilpStore';
import type { OODAPhase } from '../../services/ilp/types';

interface OODADashboardProps {
  compact?: boolean;
}

export function OODADashboard({ compact = false }: OODADashboardProps) {
  const { oodaRunning, startOODA, stopOODA } = useILPStore();
  const ooda = useILPOODA();
  const feynman = useILPFeynman();
  const { invariants, violations } = useILPInvariants();

  const phaseIcons: Record<OODAPhase, React.ReactNode> = {
    observe: <Eye size={14} />,
    orient: <Compass size={14} />,
    decide: <Brain size={14} />,
    act: <Play size={14} />,
  };

  const phaseColors: Record<OODAPhase, string> = {
    observe: 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/10',
    orient: 'text-cyber-purple border-cyber-purple/30 bg-cyber-purple/10',
    decide: 'text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/10',
    act: 'text-cyber-green border-cyber-green/30 bg-cyber-green/10',
  };

  const phases: OODAPhase[] = ['observe', 'orient', 'decide', 'act'];

  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 text-cyber-cyan ${oodaRunning ? 'animate-spin' : ''}`} />
          <span className="font-cyber text-sm text-cyber-cyan">OODA LOOP</span>
          <span className={`px-2 py-0.5 rounded text-[9px] border ${
            oodaRunning 
              ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' 
              : 'bg-cyber-muted/20 text-cyber-muted border-cyber-border'
          }`}>
            {oodaRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>
        <button
          onClick={oodaRunning ? stopOODA : startOODA}
          className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
            oodaRunning
              ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
              : 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
          }`}
        >
          {oodaRunning ? <Pause size={12} /> : <Play size={12} />}
          {oodaRunning ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Phase Indicators */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {phases.map((phase) => (
          <div
            key={phase}
            className={`p-2 rounded border text-center transition-all ${
              ooda.phase === phase
                ? phaseColors[phase]
                : 'border-cyber-border/50 text-cyber-muted bg-cyber-darker/30'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {phaseIcons[phase]}
              <span className="text-[10px] font-cyber uppercase">{phase}</span>
            </div>
            {ooda.phase === phase && (
              <motion.div
                layoutId="active-phase"
                className="h-0.5 bg-current rounded-full mt-1"
              />
            )}
          </div>
        ))}
      </div>

      {/* Current State */}
      {!compact && (
        <div className="space-y-2 mb-4">
          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
            <p className="text-[10px] text-cyber-cyan flex items-center gap-1 mb-1">
              <Eye size={10} /> LAST OBSERVATION
            </p>
            <p className="text-[10px] text-cyber-text">{ooda.observation || 'Awaiting observation...'}</p>
          </div>
          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
            <p className="text-[10px] text-cyber-purple flex items-center gap-1 mb-1">
              <Compass size={10} /> LAST ORIENTATION
            </p>
            <p className="text-[10px] text-cyber-text">{ooda.orientation || 'Awaiting orientation...'}</p>
          </div>
          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
            <p className="text-[10px] text-cyber-yellow flex items-center gap-1 mb-1">
              <Brain size={10} /> LAST DECISION
            </p>
            <p className="text-[10px] text-cyber-text">{ooda.decision || 'Awaiting decision...'}</p>
          </div>
          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
            <p className="text-[10px] text-cyber-green flex items-center gap-1 mb-1">
              <Play size={10} /> LAST ACTION
            </p>
            <p className="text-[10px] text-cyber-text">{ooda.action || 'Awaiting action...'}</p>
          </div>
        </div>
      )}

      {/* Feynman Summary */}
      <div className="mb-4 p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} className="text-cyber-purple" />
          <span className="text-[10px] font-cyber text-cyber-purple">FEYNMAN SUMMARY</span>
          <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] ${
            feynman.complexity === 'simple' ? 'bg-cyber-green/20 text-cyber-green' :
            feynman.complexity === 'moderate' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
            'bg-cyber-red/20 text-cyber-red'
          }`}>
            {feynman.complexity}
          </span>
        </div>
        <p className="text-xs text-cyber-text leading-relaxed">
          {feynman.summary || 'Generating summary...'}
        </p>
      </div>

      {/* Lear Invariants */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-cyber-cyan" />
          <span className="text-[10px] font-cyber text-cyber-cyan">LEAR INVARIANTS</span>
          {violations.length > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] bg-cyber-red/20 text-cyber-red">
              {violations.length} VIOLATED
            </span>
          )}
        </div>
        <div className="space-y-1">
          {invariants.map(inv => (
            <div
              key={inv.id}
              className={`p-2 rounded text-[10px] flex items-center gap-2 ${
                inv.violated
                  ? 'bg-cyber-red/10 border border-cyber-red/30'
                  : 'bg-cyber-green/10 border border-cyber-green/30'
              }`}
            >
              {inv.violated ? (
                <XCircle size={12} className="text-cyber-red" />
              ) : (
                <CheckCircle size={12} className="text-cyber-green" />
              )}
              <div className="flex-1">
                <p className={inv.violated ? 'text-cyber-red' : 'text-cyber-green'}>
                  {inv.name}
                </p>
                <p className="text-cyber-muted text-[9px]">{inv.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OODADashboard;
