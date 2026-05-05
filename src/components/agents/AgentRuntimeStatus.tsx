import React, { useEffect } from 'react';
import { Activity, Shield, Radio, FileCheck, Sparkles } from 'lucide-react';
import { useAgentRuntimeStore } from '../../store/agentRuntimeStore';
import type { AgentTaskType } from '../../agents/types';

export function AgentRuntimeStatus() {
  const agents = useAgentRuntimeStore((s) => s.agents);
  const tasks = useAgentRuntimeStore((s) => s.tasks);
  const findings = useAgentRuntimeStore((s) => s.findings);
  const recommendations = useAgentRuntimeStore((s) => s.recommendations);
  const receipts = useAgentRuntimeStore((s) => s.receipts);
  const isRunning = useAgentRuntimeStore((s) => s.isRunning);
  const lastRunAt = useAgentRuntimeStore((s) => s.lastRunAt);
  const error = useAgentRuntimeStore((s) => s.error);
  const initializeAgents = useAgentRuntimeStore((s) => s.initializeAgents);
  const runQuickTask = useAgentRuntimeStore((s) => s.runQuickTask);

  useEffect(() => {
    if (!agents.length) initializeAgents();
  }, [agents.length, initializeAgents]);

  const latestTask = tasks[0];
  const latestFinding = findings[0];
  const latestRec = recommendations[0];
  const latestReceipt = receipts[0];

  const run = (type: AgentTaskType) => {
    void runQuickTask(type);
  };

  return (
    <div className="mb-3 rounded-xl border border-cyber-border/70 bg-cyber-dark/50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-cyber text-cyber-glow uppercase tracking-wider">
          <Activity size={14} className="text-cyber-cyan" />
          Agent runtime
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded border ${isRunning ? 'border-cyber-cyan text-cyber-cyan' : 'border-cyber-border text-cyber-muted'}`}>
          {isRunning ? 'Running…' : 'Idle'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-cyber-muted">
        <div>
          Active agents: <span className="text-cyber-text font-mono">{agents.length}</span>
        </div>
        <div className="truncate" title={lastRunAt}>
          Last run: <span className="text-cyber-text">{lastRunAt ? lastRunAt.slice(11, 19) : '—'}</span>
        </div>
        <div className="col-span-2 truncate" title={latestTask?.title}>
          Latest task: <span className="text-cyber-text">{latestTask?.title ?? '—'}</span>
        </div>
        <div className="col-span-2 truncate" title={latestFinding?.summary}>
          Latest finding: <span className="text-cyber-text">{latestFinding?.title ?? '—'}</span>
        </div>
        <div className="col-span-2 truncate" title={latestRec?.recommendation}>
          Latest recommendation: <span className="text-cyber-text">{latestRec?.title ?? '—'}</span>
        </div>
        <div className="col-span-2 font-mono text-[10px] break-all">
          Latest receipt hash: <span className="text-cyber-cyan">{latestReceipt?.outputHash ?? '—'}</span>
        </div>
      </div>
      {error ? <div className="text-[11px] text-red-400 border border-red-500/40 rounded px-2 py-1">{error}</div> : null}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={isRunning}
          onClick={() => run('network_health_check')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyber-border text-[10px] text-cyber-text hover:bg-cyber-cyan/10 disabled:opacity-50"
        >
          <Radio size={12} className="text-cyber-cyan" />
          Network check
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => run('ilp_endpoint_check')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyber-border text-[10px] text-cyber-text hover:bg-cyber-cyan/10 disabled:opacity-50"
        >
          <Activity size={12} className="text-cyber-glow" />
          ILP check
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => run('compliance_review')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyber-border text-[10px] text-cyber-text hover:bg-cyber-cyan/10 disabled:opacity-50"
        >
          <FileCheck size={12} className="text-cyber-yellow" />
          Compliance
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => run('security_review')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyber-border text-[10px] text-cyber-text hover:bg-cyber-cyan/10 disabled:opacity-50"
        >
          <Shield size={12} className="text-cyber-red" />
          Security
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => run('grant_readiness_review')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyber-border text-[10px] text-cyber-text hover:bg-cyber-cyan/10 disabled:opacity-50"
        >
          <Sparkles size={12} className="text-cyber-glow" />
          Grant readiness
        </button>
      </div>
      <p className="text-[10px] text-cyber-muted leading-snug">
        Observe / analyze / simulate only — no signing, payments, or custody. Receipts are local fingerprints.
      </p>
    </div>
  );
}

export default AgentRuntimeStatus;
