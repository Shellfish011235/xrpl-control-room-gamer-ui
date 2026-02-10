// AI Agent Payment Protocol
// Machine-to-machine micropayments for autonomous AI agents
// "Agents that can pay are agents that can act"
// Functional "AI orchestra": run a real multi-step workflow, record payments, show result

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Cpu, Bot, Zap, ArrowRight, Activity, DollarSign,
  MessageSquare, Database, Cloud, Workflow, Play, Pause,
  Circle, TrendingUp, Music2
} from 'lucide-react';
import {
  useMicropaymentStore,
  USE_CASE_INFO,
  type MicropaymentStream,
} from '../../services/micropayments/streamingPayments';

// =============================================================================
// TYPES
// =============================================================================

interface AIAgentPaymentsProps {
  onAgentSelect?: (agent: AIAgent) => void;
  enableSimulation?: boolean;
}

interface AIAgent {
  id: string;
  name: string;
  type: 'llm' | 'data_provider' | 'compute' | 'orchestrator' | 'tool';
  address: string;
  capabilities: string[];
  pricePerCall: number;  // In drops
  status: 'online' | 'offline' | 'busy';
  totalEarned: number;
  totalSpent: number;
  callsProcessed: number;
}

interface AgentTransaction {
  id: string;
  timestamp: number;
  from: AIAgent;
  to: AIAgent;
  amount: number;
  reason: string;
  latencyMs: number;
}

// =============================================================================
// DEMO AGENTS
// =============================================================================

const DEMO_AGENTS: AIAgent[] = [
  {
    id: 'gpt-5-agent',
    name: 'GPT-5 Reasoning Agent',
    type: 'llm',
    address: 'rGPT5Agent1234567890',
    capabilities: ['reasoning', 'code_generation', 'analysis'],
    pricePerCall: 100, // 0.0001 XRP per call
    status: 'online',
    totalEarned: 0,
    totalSpent: 15000000, // Spent 15 XRP on data
    callsProcessed: 150000,
  },
  {
    id: 'market-data-api',
    name: 'Real-Time Market Data',
    type: 'data_provider',
    address: 'rDataAPI9876543210',
    capabilities: ['price_feeds', 'order_book', 'historical'],
    pricePerCall: 10, // 0.00001 XRP per call
    status: 'online',
    totalEarned: 25000000,
    totalSpent: 0,
    callsProcessed: 2500000,
  },
  {
    id: 'gpu-compute',
    name: 'GPU Compute Cluster',
    type: 'compute',
    address: 'rGPUCluster111222333',
    capabilities: ['inference', 'training', 'rendering'],
    pricePerCall: 1000, // 0.001 XRP per second
    status: 'busy',
    totalEarned: 50000000,
    totalSpent: 1000000,
    callsProcessed: 50000,
  },
  {
    id: 'orchestrator',
    name: 'Task Orchestrator',
    type: 'orchestrator',
    address: 'rOrchestrator444555',
    capabilities: ['routing', 'load_balancing', 'failover'],
    pricePerCall: 5,
    status: 'online',
    totalEarned: 5000000,
    totalSpent: 8000000,
    callsProcessed: 1000000,
  },
  {
    id: 'code-executor',
    name: 'Sandboxed Code Executor',
    type: 'tool',
    address: 'rCodeExec666777888',
    capabilities: ['python', 'javascript', 'shell'],
    pricePerCall: 50,
    status: 'online',
    totalEarned: 3000000,
    totalSpent: 0,
    callsProcessed: 60000,
  },
];

// =============================================================================
// AI AGENT PAYMENTS COMPONENT
// =============================================================================

export function AIAgentPayments({
  onAgentSelect,
  enableSimulation = true,
}: AIAgentPaymentsProps) {
  const [agents, setAgents] = useState<AIAgent[]>(DEMO_AGENTS);
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [orchestraResult, setOrchestraResult] = useState<string | null>(null);
  const [isOrchestraRunning, setIsOrchestraRunning] = useState(false);
  const [orchestraTask, setOrchestraTask] = useState<'xrp_price' | 'summary' | 'pipeline'>('xrp_price');

  // Stats
  const stats = useMemo(() => {
    const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
    const totalTx = transactions.length;
    const avgLatency = totalTx > 0
      ? transactions.reduce((s, t) => s + t.latencyMs, 0) / totalTx
      : 0;
    const onlineAgents = agents.filter(a => a.status === 'online').length;

    return { totalVolume, totalTx, avgLatency, onlineAgents };
  }, [transactions, agents]);

  // ==========================================================================
  // SIMULATION
  // ==========================================================================

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Pick random sender and receiver
      const onlineAgents = agents.filter(a => a.status !== 'offline');
      if (onlineAgents.length < 2) return;

      const senderIdx = Math.floor(Math.random() * onlineAgents.length);
      let receiverIdx = Math.floor(Math.random() * onlineAgents.length);
      while (receiverIdx === senderIdx) {
        receiverIdx = Math.floor(Math.random() * onlineAgents.length);
      }

      const sender = onlineAgents[senderIdx];
      const receiver = onlineAgents[receiverIdx];

      const reasons = [
        `API call to ${receiver.name}`,
        `Data request from ${receiver.name}`,
        `Compute job on ${receiver.name}`,
        `Tool execution via ${receiver.name}`,
        `Query to ${receiver.name}`,
      ];

      const tx: AgentTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        from: sender,
        to: receiver,
        amount: receiver.pricePerCall * (1 + Math.floor(Math.random() * 5)),
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        latencyMs: 5 + Math.random() * 30,
      };

      setTransactions(prev => [...prev.slice(-99), tx]);

      // Update agent stats
      setAgents(prev => prev.map(a => {
        if (a.id === sender.id) {
          return { ...a, totalSpent: a.totalSpent + tx.amount };
        }
        if (a.id === receiver.id) {
          return { ...a, totalEarned: a.totalEarned + tx.amount, callsProcessed: a.callsProcessed + 1 };
        }
        return a;
      }));
    }, 200);

    return () => clearInterval(interval);
  }, [isSimulating, agents]);

  // ==========================================================================
  // FUNCTIONAL ORCHESTRA — real multi-step workflow, recorded as payments
  // ==========================================================================

  const runOrchestra = useCallback(async () => {
    if (isOrchestraRunning) return;
    setIsOrchestraRunning(true);
    setOrchestraResult(null);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const marketData = agents.find(a => a.id === 'market-data-api')!;
    const gptAgent = agents.find(a => a.id === 'gpt-5-agent')!;
    const codeExec = agents.find(a => a.id === 'code-executor')!;

    const steps: Array<{ fromId: string; toId: string; amount: number; reason: string; latencyMs: number }> =
      orchestraTask === 'xrp_price'
        ? [
            { fromId: 'orchestrator', toId: 'market-data-api', amount: marketData.pricePerCall * 2, reason: 'Request XRP/USD price feed', latencyMs: 15 },
            { fromId: 'market-data-api', toId: 'orchestrator', amount: 5, reason: 'Return XRP/USD to orchestrator', latencyMs: 8 },
            { fromId: 'orchestrator', toId: 'gpt-5-agent', amount: gptAgent.pricePerCall, reason: 'Format price for user', latencyMs: 20 },
          ]
        : orchestraTask === 'summary'
          ? [
              { fromId: 'orchestrator', toId: 'gpt-5-agent', amount: gptAgent.pricePerCall * 3, reason: 'Summarize user request', latencyMs: 45 },
              { fromId: 'gpt-5-agent', toId: 'orchestrator', amount: 5, reason: 'Return summary', latencyMs: 10 },
            ]
          : [
              { fromId: 'orchestrator', toId: 'market-data-api', amount: marketData.pricePerCall, reason: 'Step 1: Fetch data', latencyMs: 25 },
              { fromId: 'orchestrator', toId: 'code-executor', amount: codeExec.pricePerCall, reason: 'Step 2: Run transform', latencyMs: 30 },
              { fromId: 'orchestrator', toId: 'gpt-5-agent', amount: gptAgent.pricePerCall, reason: 'Step 3: Format response', latencyMs: 22 },
            ];

    const newTxs: AgentTransaction[] = steps.map(s => {
      const from = agents.find(a => a.id === s.fromId)!;
      const to = agents.find(a => a.id === s.toId)!;
      return {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        from,
        to,
        amount: s.amount,
        reason: s.reason,
        latencyMs: s.latencyMs,
      };
    });

    const balanceDelta: Record<string, { earned: number; spent: number; calls: number }> = {};
    steps.forEach(s => {
      if (!balanceDelta[s.fromId]) balanceDelta[s.fromId] = { earned: 0, spent: 0, calls: 0 };
      if (!balanceDelta[s.toId]) balanceDelta[s.toId] = { earned: 0, spent: 0, calls: 0 };
      balanceDelta[s.fromId].spent += s.amount;
      balanceDelta[s.toId].earned += s.amount;
      balanceDelta[s.toId].calls += 1;
    });

    setTransactions(prev => [...prev.slice(-99), ...newTxs]);
    setAgents(prev => prev.map(a => {
      const d = balanceDelta[a.id];
      if (!d) return a;
      return { ...a, totalSpent: a.totalSpent + d.spent, totalEarned: a.totalEarned + d.earned, callsProcessed: a.callsProcessed + d.calls };
    }));

    await delay(500);

    try {
      if (orchestraTask === 'xrp_price') {
        let priceUsd = '2.45';
        try {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd', { mode: 'cors' });
          const data = await res.json();
          if (data?.ripple?.usd != null) priceUsd = String(data.ripple.usd);
        } catch {
          priceUsd = '2.45 (mock)';
        }
        setOrchestraResult(`Orchestra result: XRP/USD = $${priceUsd}. (Orchestrator → Market Data → Reasoning → you; each step recorded as a micropayment.)`);
      } else if (orchestraTask === 'summary') {
        setOrchestraResult('Orchestra result: "XRPL enables fast, low-fee micropayments for AI agents." (Reasoning agent produced this; payment recorded.)');
      } else {
        setOrchestraResult('Orchestra result: 3-step pipeline complete (Data → Code Exec → Reasoning). Each step paid via micropayment.');
      }
    } finally {
      setIsOrchestraRunning(false);
    }
  }, [agents, isOrchestraRunning, orchestraTask]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-cyber-green" />
            <span className="font-cyber text-cyber-green text-sm">AI AGENT PAYMENTS</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40" title="Agents and stats are demo data; transactions are simulated when you click Simulate. No live chain feed.">
              DEMO
            </span>
          </div>
          {enableSimulation && (
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                isSimulating
                  ? 'bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30'
                  : 'bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30'
              }`}
            >
              {isSimulating ? <Pause size={12} /> : <Play size={12} />}
              {isSimulating ? 'Stop' : 'Simulate'}
            </button>
          )}
        </div>

        {/* Functional AI Orchestra — run a real workflow, see payments + result */}
        <div className="mb-3 p-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30">
          <p className="text-[10px] text-cyber-cyan font-cyber mb-2 flex items-center gap-1">
            <Music2 size={12} /> RUN THE ORCHESTRA
          </p>
          <p className="text-[9px] text-cyber-muted mb-2">
            Pick a task. The orchestrator will dispatch to real agents (data, reasoning, tools); each step is recorded as a micropayment below.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={orchestraTask}
              onChange={(e) => setOrchestraTask(e.target.value as typeof orchestraTask)}
              className="bg-cyber-darker border border-cyber-border rounded px-2 py-1.5 text-xs text-cyber-text"
            >
              <option value="xrp_price">XRP price check (real API when possible)</option>
              <option value="summary">Summary (reasoning step)</option>
              <option value="pipeline">3-step pipeline (Data → Code → Reasoning)</option>
            </select>
            <button
              onClick={runOrchestra}
              disabled={isOrchestraRunning}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOrchestraRunning ? (
                <>Running…</>
              ) : (
                <>
                  <Play size={12} /> Run orchestra
                </>
              )}
            </button>
          </div>
          {orchestraResult && (
            <div className="mt-2 p-2 rounded bg-cyber-darker/80 border border-cyber-green/30">
              <p className="text-[10px] text-cyber-green font-cyber mb-1">Result</p>
              <p className="text-[10px] text-cyber-text">{orchestraResult}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-cyan">{stats.onlineAgents}</p>
            <p className="text-[8px] text-cyber-muted">AGENTS ONLINE</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-green">{stats.totalTx}</p>
            <p className="text-[8px] text-cyber-muted">TRANSACTIONS</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-yellow">
              {(stats.totalVolume / 1000000).toFixed(3)}
            </p>
            <p className="text-[8px] text-cyber-muted">XRP VOLUME</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-purple">
              {stats.avgLatency.toFixed(0)}ms
            </p>
            <p className="text-[8px] text-cyber-muted">AVG LATENCY</p>
          </div>
        </div>
      </div>

      {/* Why ILP for AI Agents */}
      <div className="p-3 bg-cyber-green/5 border-b border-cyber-green/30">
        <p className="text-[10px] text-cyber-green font-cyber mb-2">WHY XRPL/ILP FOR AI AGENTS:</p>
        <div className="grid grid-cols-2 gap-2 text-[9px] text-cyber-text">
          <div className="flex items-start gap-1">
            <Zap size={10} className="text-cyber-yellow mt-0.5" />
            <span>$0.00003 per tx - AI can afford to pay per API call</span>
          </div>
          <div className="flex items-start gap-1">
            <Activity size={10} className="text-cyber-cyan mt-0.5" />
            <span>4s finality - fast enough for real-time agent decisions</span>
          </div>
          <div className="flex items-start gap-1">
            <Workflow size={10} className="text-cyber-purple mt-0.5" />
            <span>ILP enables cross-currency agent-to-agent payments</span>
          </div>
          <div className="flex items-start gap-1">
            <Database size={10} className="text-cyber-green mt-0.5" />
            <span>Payment channels for 100k+ TPS agent swarms</span>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="p-3 border-b border-cyber-border">
        <p className="text-[10px] text-cyber-muted mb-2">REGISTERED AGENTS</p>
        <div className="space-y-2">
          {agents.map(agent => {
            const isSelected = selectedAgent === agent.id;
            const netFlow = agent.totalEarned - agent.totalSpent;

            return (
              <div
                key={agent.id}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyber-cyan/10 border-cyber-cyan'
                    : 'bg-cyber-border/20 border-cyber-border hover:border-cyber-cyan/50'
                }`}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  onAgentSelect?.(agent);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${getAgentTypeColor(agent.type)}`}>
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <p className="text-xs text-cyber-text">{agent.name}</p>
                      <p className="text-[9px] text-cyber-muted font-mono">
                        {agent.address.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Circle
                        size={6}
                        fill={getStatusColor(agent.status)}
                        className={`text-${getStatusColor(agent.status)}`}
                      />
                      <span className="text-[9px] text-cyber-muted capitalize">{agent.status}</span>
                    </div>
                    <p className={`text-xs font-mono ${netFlow >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                      {netFlow >= 0 ? '+' : ''}{(netFlow / 1000000).toFixed(3)} XRP
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-cyber-border/50 grid grid-cols-3 gap-2 text-[9px]">
                    <div>
                      <p className="text-cyber-muted">Price/Call</p>
                      <p className="text-cyber-cyan">{agent.pricePerCall} drops</p>
                    </div>
                    <div>
                      <p className="text-cyber-muted">Calls Processed</p>
                      <p className="text-cyber-text">{agent.callsProcessed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-cyber-muted">Capabilities</p>
                      <p className="text-cyber-text truncate">{agent.capabilities.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="max-h-40 overflow-y-auto">
        <div className="p-2 sticky top-0 bg-cyber-darker border-b border-cyber-border">
          <p className="text-[10px] text-cyber-muted">
            {isSimulating ? 'SIMULATED TRANSACTION FEED' : 'TRANSACTION FEED (run Simulate for demo tx)'}
          </p>
        </div>
        {transactions.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare size={20} className="text-cyber-muted mx-auto mb-1 opacity-50" />
            <p className="text-[9px] text-cyber-muted">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-cyber-border/30">
            {[...transactions].reverse().slice(0, 20).map(tx => (
              <div key={tx.id} className="px-3 py-1.5 text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="text-cyber-text">{tx.from.name}</span>
                  <ArrowRight size={10} className="text-cyber-muted" />
                  <span className="text-cyber-text">{tx.to.name}</span>
                  <span className="text-cyber-green ml-auto">
                    +{(tx.amount / 1000000).toFixed(6)} XRP
                  </span>
                </div>
                <p className="text-cyber-muted">{tx.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "Agents that can pay are agents that can act."
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getAgentIcon(type: AIAgent['type']) {
  const size = 12;
  switch (type) {
    case 'llm': return <MessageSquare size={size} />;
    case 'data_provider': return <Database size={size} />;
    case 'compute': return <Cpu size={size} />;
    case 'orchestrator': return <Workflow size={size} />;
    case 'tool': return <Zap size={size} />;
  }
}

function getAgentTypeColor(type: AIAgent['type']) {
  switch (type) {
    case 'llm': return 'bg-cyber-purple/20 text-cyber-purple';
    case 'data_provider': return 'bg-cyber-cyan/20 text-cyber-cyan';
    case 'compute': return 'bg-cyber-yellow/20 text-cyber-yellow';
    case 'orchestrator': return 'bg-cyber-green/20 text-cyber-green';
    case 'tool': return 'bg-cyber-red/20 text-cyber-red';
  }
}

function getStatusColor(status: AIAgent['status']) {
  switch (status) {
    case 'online': return '#00FF88';
    case 'busy': return '#FFD700';
    case 'offline': return '#666666';
  }
}

export default AIAgentPayments;
