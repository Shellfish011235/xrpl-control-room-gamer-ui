/**
 * Agent Hub – OpenClaw-style dashboard: active agents, status, memory viz, Wake.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, Moon, AlertCircle, Clock, Brain, Trash2 } from 'lucide-react';
import { useAgentStore, type AgentDef, type MemoryEntry } from '../store/agentStore';
import { ALL_SKILLS } from '../skills';

function statusColor(s: string) {
  switch (s) {
    case 'active':
      return 'text-cyber-green border-cyber-green/50 bg-cyber-green/10';
    case 'waking':
      return 'text-cyber-cyan border-cyber-cyan/50 bg-cyber-cyan/10';
    case 'sleeping':
    case 'idle':
      return 'text-cyber-muted border-cyber-muted/50 bg-cyber-muted/5';
    case 'error':
      return 'text-cyber-red border-cyber-red/50 bg-cyber-red/10';
    default:
      return 'text-cyber-muted border-cyber-border';
  }
}

function AgentCard({
  agent,
  onWake,
  onSleep,
}: {
  agent: AgentDef;
  onWake: () => void;
  onSleep: () => void;
}) {
  const isActive = agent.status === 'active';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`cyber-panel p-4 rounded-lg border ${isActive ? 'border-cyber-glow/30' : 'border-cyber-border'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-cyber-glow/20' : 'bg-cyber-darker'}`}>
            <Bot size={20} className={isActive ? 'text-cyber-glow' : 'text-cyber-muted'} />
          </div>
          <div>
            <p className="font-cyber text-cyber-text">{agent.name}</p>
            <p className="text-[10px] text-cyber-muted">
              {agent.skillIds.join(', ')}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] border ${statusColor(agent.status)}`}>
          {agent.status}
        </span>
      </div>
      {agent.lastHeartbeat != null && (
        <p className="flex items-center gap-1 mt-2 text-[10px] text-cyber-muted">
          <Clock size={10} />
          {new Date(agent.lastHeartbeat).toLocaleTimeString()}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        {isActive ? (
          <button
            type="button"
            onClick={onSleep}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-cyber-muted/50 text-cyber-muted text-xs hover:bg-cyber-darker"
          >
            <Moon size={12} /> Sleep
          </button>
        ) : (
          <button
            type="button"
            onClick={onWake}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-cyber-glow/50 text-cyber-glow text-xs hover:bg-cyber-glow/10"
          >
            <Zap size={12} /> Wake
          </button>
        )}
      </div>
    </motion.div>
  );
}

function MemoryList({ entries }: { entries: MemoryEntry[] }) {
  const typeIcon = (t: string) => {
    switch (t) {
      case 'path': return '↗';
      case 'nft': return '🖼';
      case 'bridge': return '⇄';
      case 'alert': return '⚠';
      default: return '•';
    }
  };
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {entries.length === 0 ? (
        <p className="text-cyber-muted text-xs">No discoveries yet. Wake agents to run heartbeat.</p>
      ) : (
        entries.slice().reverse().map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border text-xs"
          >
            <span className="text-cyber-cyan">{typeIcon(e.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-cyber-text truncate">{e.summary}</p>
              <p className="text-[10px] text-cyber-muted">{e.agentId} · {new Date(e.ts).toLocaleTimeString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function AgentHub() {
  const {
    agents,
    memory,
    heartbeatRunning,
    wake,
    sleep,
    startHeartbeat,
    stopHeartbeat,
    addMemoryEntry,
    clearMemory,
  } = useAgentStore();

  useEffect(() => {
    return () => {
      useAgentStore.getState().stopHeartbeat();
    };
  }, []);

  const handleWake = (agentId: string) => {
    useAgentStore.getState().setStatus(agentId, 'waking');
    setTimeout(() => {
      useAgentStore.getState().wake(agentId);
      useAgentStore.getState().addMemoryEntry({
        type: 'discovery',
        summary: `${agentId} awakened`,
        agentId,
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-cyber text-cyber-glow flex items-center gap-2">
          <Brain size={20} />
          AGENT FLEET
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={heartbeatRunning ? stopHeartbeat : startHeartbeat}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs ${
              heartbeatRunning
                ? 'border-cyber-green/50 text-cyber-green bg-cyber-green/10'
                : 'border-cyber-border text-cyber-muted hover:text-cyber-cyan'
            }`}
          >
            <Zap size={12} />
            {heartbeatRunning ? 'Heartbeat ON (30s)' : 'Start heartbeat'}
          </button>
          <button
            type="button"
            onClick={clearMemory}
            className="flex items-center gap-1 px-2 py-1.5 rounded border border-cyber-border text-cyber-muted text-xs hover:bg-cyber-darker"
          >
            <Trash2 size={12} /> Clear memory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onWake={() => handleWake(agent.id)}
              onSleep={() => sleep(agent.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="cyber-panel p-4 rounded-lg border border-cyber-border">
        <h3 className="font-cyber text-sm text-cyber-text mb-2 flex items-center gap-2">
          <AlertCircle size={14} />
          MEMORY (discoveries · persisted)
        </h3>
        <MemoryList entries={memory} />
      </div>

      <div className="cyber-panel p-4 rounded-lg border border-cyber-border">
        <h3 className="font-cyber text-sm text-cyber-text mb-2">LOADED SKILLS</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SKILLS.map((s) => (
            <span
              key={s.name}
              className="px-2 py-1 rounded border border-cyber-cyan/30 text-cyber-cyan text-[10px]"
              title={s.prompt}
            >
              @{s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
