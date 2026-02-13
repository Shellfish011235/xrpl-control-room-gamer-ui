// AI Agent Payment Protocol
// Machine-to-machine micropayments for autonomous AI agents
// "Agents that can pay are agents that can act"
// Functional "AI orchestra": run a real multi-step workflow, record payments, show result

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Bot, Zap, ArrowRight, Activity, DollarSign,
  MessageSquare, Database, Cloud, Workflow, Play, Pause,
  Circle, TrendingUp, Music2, ChevronRight
} from 'lucide-react';
import {
  useMicropaymentStore,
  USE_CASE_INFO,
  type MicropaymentStream,
} from '../../services/micropayments/streamingPayments';
import { fetchCryptoSentiment, fetchXRPLMetrics } from '../../services/freeDataFeeds';
import { fetchPolymarketMarkets } from '../../services/predictionMarkets';
import { useOrchestraSimStore } from '../../store/orchestraSimStore';
import { usePlatformModeStore } from '../../store/platformModeStore';

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
// ORCHESTRA AGENTS — based on data sources used across the dashboard
// =============================================================================
// Each agent maps to a real service/API the app uses: Network (XRPScan, RPC),
// prices (CoinGecko, Binance), CARV (LLM), Micropayments (liveXRPLData), etc.

const DASHBOARD_AGENTS: AIAgent[] = [
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
    id: 'price-feed',
    name: 'Price Feed (CoinGecko / Binance)',
    type: 'data_provider',
    address: 'rPriceFeed9876543210',
    capabilities: ['xrp_usd', 'ticker', '24h_change'],
    pricePerCall: 10,
    status: 'online',
    totalEarned: 18000000,
    totalSpent: 0,
    callsProcessed: 1800000,
  },
  {
    id: 'xrpl-ledger',
    name: 'XRPL Ledger (RPC)',
    type: 'data_provider',
    address: 'rXRPLRPC111222333',
    capabilities: ['server_info', 'fee', 'account_channels'],
    pricePerCall: 15,
    status: 'online',
    totalEarned: 12000000,
    totalSpent: 0,
    callsProcessed: 800000,
  },
  {
    id: 'xrpscan',
    name: 'XRPScan (validators, amendments, metrics)',
    type: 'data_provider',
    address: 'rXRPScanAPI444555',
    capabilities: ['validators', 'nodes', 'amendments', 'metrics'],
    pricePerCall: 20,
    status: 'online',
    totalEarned: 9000000,
    totalSpent: 0,
    callsProcessed: 450000,
  },
  {
    id: 'reasoning',
    name: 'Reasoning (LLM)',
    type: 'llm',
    address: 'rLLMAgent1234567890',
    capabilities: ['reasoning', 'summarize', 'payment_decision'],
    pricePerCall: 100,
    status: 'online',
    totalEarned: 0,
    totalSpent: 12000000,
    callsProcessed: 120000,
  },
  {
    id: 'pathfinder',
    name: 'DEX Pathfinder (xrplPathfinding)',
    type: 'tool',
    address: 'rPathfind666777888',
    capabilities: ['path_find', 'quote', 'order_book'],
    pricePerCall: 50,
    status: 'online',
    totalEarned: 4000000,
    totalSpent: 0,
    callsProcessed: 80000,
  },
  {
    id: 'sentiment',
    name: 'Sentiment (SentiCrypt)',
    type: 'data_provider',
    address: 'rSentimentAPI999000',
    capabilities: ['crypto_sentiment', 'trend', 'score'],
    pricePerCall: 12,
    status: 'online',
    totalEarned: 3000000,
    totalSpent: 0,
    callsProcessed: 250000,
  },
  {
    id: 'tx-history',
    name: 'Tx History (xrplcluster)',
    type: 'data_provider',
    address: 'rTxHistoryABC123',
    capabilities: ['account_tx', 'ledger_tx', 'openclaw_feed'],
    pricePerCall: 25,
    status: 'online',
    totalEarned: 5000000,
    totalSpent: 0,
    callsProcessed: 200000,
  },
  {
    id: 'regulatory-watch',
    name: 'Regulatory Watch (Compliance)',
    type: 'data_provider',
    address: 'rRegWatchCOMP789',
    capabilities: ['regulatory_watch', 'compliance_check', 'jurisdiction_alerts'],
    pricePerCall: 18,
    status: 'online',
    totalEarned: 2200000,
    totalSpent: 0,
    callsProcessed: 120000,
  },
  {
    id: 'prediction-markets',
    name: 'Prediction Markets (Polymarket)',
    type: 'data_provider',
    address: 'rPolymarketPM123',
    capabilities: ['crypto_markets', 'probabilities', 'signals', 'XRP_relevance'],
    pricePerCall: 22,
    status: 'online',
    totalEarned: 2800000,
    totalSpent: 0,
    callsProcessed: 127000,
  },
];

// =============================================================================
// AI AGENT PAYMENTS COMPONENT
// =============================================================================

export function AIAgentPayments({
  onAgentSelect,
  enableSimulation = true,
}: AIAgentPaymentsProps) {
  const [agents, setAgents] = useState<AIAgent[]>(DASHBOARD_AGENTS);
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [orchestraResult, setOrchestraResult] = useState<string | null>(null);
  const [isOrchestraRunning, setIsOrchestraRunning] = useState(false);
  const [orchestraTask, setOrchestraTask] = useState<'xrp_price' | 'ledger_fee' | 'sentiment' | 'xrpscan_metrics' | 'pathfinder_quote' | 'tx_history' | 'compliance_snapshot' | 'prediction_markets' | 'summary' | 'pipeline'>('xrp_price');
  const simPayments = useOrchestraSimStore((s) => s.payments);
  const platformLive = usePlatformModeStore((s) => s.mode === 'live');

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
    const priceFeed = agents.find(a => a.id === 'price-feed')!;
    const xrplLedger = agents.find(a => a.id === 'xrpl-ledger')!;
    const sentimentAgent = agents.find(a => a.id === 'sentiment')!;
    const xrpscanAgent = agents.find(a => a.id === 'xrpscan')!;
    const pathfinderAgent = agents.find(a => a.id === 'pathfinder')!;
    const txHistoryAgent = agents.find(a => a.id === 'tx-history')!;
    const regulatoryWatchAgent = agents.find(a => a.id === 'regulatory-watch')!;
    const predictionMarketsAgent = agents.find(a => a.id === 'prediction-markets')!;
    const reasoning = agents.find(a => a.id === 'reasoning')!;

    const steps: Array<{ fromId: string; toId: string; amount: number; reason: string; latencyMs: number }> =
      orchestraTask === 'xrp_price'
        ? [
            { fromId: 'orchestrator', toId: 'price-feed', amount: priceFeed.pricePerCall * 2, reason: 'Request XRP/USD (CoinGecko)', latencyMs: 15 },
            { fromId: 'price-feed', toId: 'orchestrator', amount: 5, reason: 'Return XRP/USD to orchestrator', latencyMs: 8 },
            { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Format price for user', latencyMs: 20 },
          ]
        : orchestraTask === 'ledger_fee'
          ? [
              { fromId: 'orchestrator', toId: 'xrpl-ledger', amount: xrplLedger.pricePerCall * 2, reason: 'Request server_info + fee (RPC)', latencyMs: 25 },
              { fromId: 'xrpl-ledger', toId: 'orchestrator', amount: 5, reason: 'Return ledger + fee to orchestrator', latencyMs: 10 },
              { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Summarize ledger status', latencyMs: 18 },
            ]
          : orchestraTask === 'sentiment'
            ? [
                { fromId: 'orchestrator', toId: 'sentiment', amount: sentimentAgent.pricePerCall, reason: 'Request crypto sentiment (SentiCrypt)', latencyMs: 30 },
                { fromId: 'sentiment', toId: 'orchestrator', amount: 5, reason: 'Return trend + score to orchestrator', latencyMs: 8 },
                { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Format sentiment for user', latencyMs: 20 },
              ]
            : orchestraTask === 'xrpscan_metrics'
              ? [
                  { fromId: 'orchestrator', toId: 'xrpscan', amount: xrpscanAgent.pricePerCall * 2, reason: 'Request validators/metrics (XRPScan)', latencyMs: 35 },
                  { fromId: 'xrpscan', toId: 'orchestrator', amount: 5, reason: 'Return metrics to orchestrator', latencyMs: 10 },
                  { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Summarize network metrics', latencyMs: 18 },
                ]
              : orchestraTask === 'pathfinder_quote'
                ? [
                    { fromId: 'orchestrator', toId: 'pathfinder', amount: pathfinderAgent.pricePerCall, reason: 'Request path quote (ripple_path_find)', latencyMs: 40 },
                    { fromId: 'pathfinder', toId: 'orchestrator', amount: 5, reason: 'Return path/quote to orchestrator', latencyMs: 8 },
                    { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Format quote for user', latencyMs: 20 },
                  ]
                : orchestraTask === 'tx_history'
                  ? [
                      { fromId: 'orchestrator', toId: 'tx-history', amount: txHistoryAgent.pricePerCall, reason: 'Request account_tx (xrplcluster)', latencyMs: 30 },
                      { fromId: 'tx-history', toId: 'orchestrator', amount: 5, reason: 'Return tx list to orchestrator', latencyMs: 10 },
                      { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Summarize recent activity', latencyMs: 18 },
                    ]
                  : orchestraTask === 'compliance_snapshot'
                    ? [
                        { fromId: 'orchestrator', toId: 'regulatory-watch', amount: regulatoryWatchAgent.pricePerCall, reason: 'Request compliance snapshot (regulatory watch)', latencyMs: 28 },
                        { fromId: 'regulatory-watch', toId: 'orchestrator', amount: 5, reason: 'Return watch sources + stance to orchestrator', latencyMs: 8 },
                        { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Summarize how we stay in law', latencyMs: 20 },
                      ]
                    : orchestraTask === 'prediction_markets'
                    ? [
                        { fromId: 'orchestrator', toId: 'prediction-markets', amount: predictionMarketsAgent.pricePerCall * 2, reason: 'Request crypto prediction markets (Polymarket)', latencyMs: 35 },
                        { fromId: 'prediction-markets', toId: 'orchestrator', amount: 5, reason: 'Return markets + probabilities to orchestrator', latencyMs: 10 },
                        { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Summarize prediction signals for user', latencyMs: 22 },
                      ]
                    : orchestraTask === 'summary'
                    ? [
                        { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall * 3, reason: 'Summarize user request', latencyMs: 45 },
                        { fromId: 'reasoning', toId: 'orchestrator', amount: 5, reason: 'Return summary', latencyMs: 10 },
                      ]
                    : [
                        { fromId: 'orchestrator', toId: 'price-feed', amount: priceFeed.pricePerCall, reason: 'Step 1: Fetch XRP price', latencyMs: 25 },
                        { fromId: 'orchestrator', toId: 'sentiment', amount: sentimentAgent.pricePerCall, reason: 'Step 2: Fetch sentiment (SentiCrypt)', latencyMs: 30 },
                        { fromId: 'orchestrator', toId: 'reasoning', amount: reasoning.pricePerCall, reason: 'Step 3: Format response', latencyMs: 22 },
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
          if (res.ok) {
            const data = await res.json();
            if (data?.ripple?.usd != null) priceUsd = String(data.ripple.usd);
          }
          if (priceUsd === '2.45') {
            const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT', { mode: 'cors' });
            if (binanceRes.ok) {
              const binanceData = await binanceRes.json();
              const p = parseFloat(binanceData?.price);
              if (p > 0) priceUsd = String(p);
            }
          }
        } catch {
          try {
            const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT', { mode: 'cors' });
            if (binanceRes.ok) {
              const binanceData = await binanceRes.json();
              const p = parseFloat(binanceData?.price);
              if (p > 0) priceUsd = String(p);
            }
          } catch {
            priceUsd = '2.45 (mock)';
          }
        }
        setOrchestraResult(`Orchestra result: XRP/USD = $${priceUsd}. (Orchestrator → Price Feed → Reasoning; each step recorded as a micropayment.)`);
      } else if (orchestraTask === 'ledger_fee') {
        let ledgerSeq = '—';
        let feeXrp = '—';
        try {
          const [infoRes, feeRes] = await Promise.all([
            fetch('https://s1.ripple.com:51234/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ method: 'server_info', params: [{}] }),
            }),
            fetch('https://s1.ripple.com:51234/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ method: 'fee', params: [{}] }),
            }),
          ]);
          const infoData = await infoRes.json();
          const feeData = await feeRes.json();
          const seq = infoData.result?.info?.validated_ledger?.seq;
          const drops = feeData.result?.drops?.base_fee;
          if (seq != null) ledgerSeq = String(seq);
          if (drops != null) feeXrp = (Number(drops) / 1_000_000).toFixed(6);
        } catch {
          ledgerSeq = '— (mock)';
          feeXrp = '— (mock)';
        }
        setOrchestraResult(`Orchestra result: Ledger #${ledgerSeq}, base fee ${feeXrp} XRP. (Orchestrator → XRPL Ledger RPC → Reasoning; dashboard data.)`);
      } else if (orchestraTask === 'sentiment') {
        let trend = 'neutral';
        let score = 50;
        try {
          const { trend: t, score: s } = await fetchCryptoSentiment();
          trend = t;
          score = s;
        } catch {
          trend = 'neutral (mock)';
        }
        setOrchestraResult(`Orchestra result: Crypto sentiment ${trend}, score ${score}/100. (Orchestrator → SentiCrypt → Reasoning; same feed as dashboard.)`);
      } else if (orchestraTask === 'xrpscan_metrics') {
        let msg = 'Orchestra result: ';
        try {
          const metrics = await fetchXRPLMetrics();
          if (metrics) {
            msg += `Ledger #${metrics.ledger_index}, ${metrics.txn_count_24h?.toLocaleString() ?? '—'} txs (24h), ${metrics.txn_rate?.toFixed(1) ?? '—'} txs/s, avg fee ${metrics.avg_fee ?? '—'} drops. (Orchestrator → XRPScan → Reasoning; dashboard data.)`;
          } else {
            msg += 'XRPScan metrics unavailable (mock). Orchestrator → XRPScan → Reasoning.';
          }
        } catch {
          msg += 'XRPScan metrics error (mock). Orchestrator → XRPScan → Reasoning.';
        }
        setOrchestraResult(msg);
      } else if (orchestraTask === 'pathfinder_quote') {
        let msg = 'Orchestra result: ';
        try {
          const res = await fetch('https://s1.ripple.com:51234/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'ripple_path_find',
              params: [{
                source_account: 'rN7n7otQDd6FczFgLdlqtyMVrn3e1DjxvV',
                destination_account: 'rN7n7otQDd6FczFgLdlqtyMVrn3e1DjxvV',
                destination_amount: { currency: 'USD', value: '1', issuer: 'rN7n7otQDd6FczFgLdlqtyMVrn3e1DjxvV' },
              }],
            }),
          });
          const data = await res.json();
          const alts = data.result?.alternatives;
          const pathCount = Array.isArray(alts) ? alts.length : 0;
          msg += pathCount > 0
            ? `Pathfinder found ${pathCount} path(s). (Orchestrator → DEX Pathfinder → Reasoning; dashboard data.)`
            : 'Pathfinder: no path for demo params. (Orchestrator → DEX Pathfinder → Reasoning.)';
        } catch {
          msg += 'Pathfinder request failed (mock). Orchestrator → DEX Pathfinder → Reasoning.';
        }
        setOrchestraResult(msg);
      } else if (orchestraTask === 'tx_history') {
        let msg = 'Orchestra result: ';
        try {
          const res = await fetch('https://xrplcluster.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'account_tx',
              params: [{ account: 'ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64', limit: 10 }],
            }),
          });
          const data = await res.json();
          const txs = data.result?.transactions ?? [];
          msg += `${txs.length} recent tx(s) for demo account. (Orchestrator → Tx History → Reasoning; same as OpenClaw dashboard.)`;
        } catch {
          msg += 'Tx history unavailable (mock). Orchestrator → Tx History → Reasoning.';
        }
        setOrchestraResult(msg);
      } else if (orchestraTask === 'compliance_snapshot') {
        const snapshot = [
          'Watch: White House, SEC, CFTC, FinCEN; state (e.g. CO AI Act, FL); EU AI Act, MiCA.',
          'Stance: No custody, user signs only (Xaman), human-in-the-loop. Re-check before scaling (see REGULATORY-WATCH.md).',
        ].join(' ');
        setOrchestraResult(`Orchestra result: ${snapshot} (Orchestrator → Regulatory Watch → Reasoning.)`);
      } else if (orchestraTask === 'prediction_markets') {
        let msg = 'Orchestra result: ';
        try {
          const markets = await fetchPolymarketMarkets(undefined, 8);
          const cryptoRelevant = markets.filter(m => m.relevanceToXRP > 20 || m.category?.toLowerCase().includes('crypto')).slice(0, 3);
          if (cryptoRelevant.length > 0) {
            msg += `${cryptoRelevant.length} crypto-relevant market(s): ${cryptoRelevant.map(m => `"${m.question.slice(0, 40)}..." (${m.outcomes?.[0]?.probability != null ? (m.outcomes[0].probability * 100).toFixed(0) : '?'}%)`).join('; ')}. (Orchestrator → Polymarket → Reasoning; same as MemeticLab.)`;
          } else {
            msg += `${markets.length} Polymarket market(s) fetched. (Orchestrator → Prediction Markets → Reasoning; dashboard data.)`;
          }
        } catch {
          msg += 'Prediction markets unavailable (mock). Orchestrator → Polymarket → Reasoning.';
        }
        setOrchestraResult(msg);
      } else if (orchestraTask === 'summary') {
        setOrchestraResult('Orchestra result: "XRPL enables fast, low-fee micropayments for AI agents." (Reasoning agent produced this; payment recorded.)');
      } else {
        let priceUsd = '2.45';
        let trend = 'neutral';
        let score = 50;
        try {
          const sentimentData = await fetchCryptoSentiment();
          trend = sentimentData.trend;
          score = sentimentData.score;
        } catch {
          trend = 'neutral (mock)';
        }
        try {
          const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd', { mode: 'cors' });
          if (cgRes.ok) {
            const priceRes = await cgRes.json();
            if (priceRes?.ripple?.usd != null) priceUsd = String(priceRes.ripple.usd);
          }
          if (priceUsd === '2.45') {
            const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT', { mode: 'cors' });
            if (binanceRes.ok) {
              const binanceData = await binanceRes.json();
              const p = parseFloat(binanceData?.price);
              if (p > 0) priceUsd = String(p);
            }
          }
        } catch {
          try {
            const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT', { mode: 'cors' });
            if (binanceRes.ok) {
              const binanceData = await binanceRes.json();
              const p = parseFloat(binanceData?.price);
              if (p > 0) priceUsd = String(p);
            }
          } catch { /* keep 2.45 */ }
        }
        setOrchestraResult(`Orchestra result: XRP/USD = $${priceUsd}, sentiment ${trend} (${score}/100). Price → Sentiment → Reasoning; each step paid via micropayment (dashboard data).`);
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
            <span className={`px-1.5 py-0.5 rounded text-[8px] border ${platformLive ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/40' : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/40'}`} title={platformLive ? 'Platform is Live (agent payments still simulated until real backend).' : 'Agents and balances are simulated. Toggle Live in the nav bar for platform-wide live mode.'}>
              {platformLive ? 'LIVE' : 'DEMO'}
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

        {/* Functional AI Orchestra — simulated workflow; only e.g. XRP price may call a real API */}
        <div className="mb-3 p-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30">
          <p className="text-[10px] text-cyber-cyan font-cyber mb-2 flex items-center gap-1">
            <Music2 size={12} /> RUN THE ORCHESTRA
          </p>
          <p className="text-[9px] text-cyber-muted mb-2">
            Each agent = a <strong>dashboard data source</strong> (CoinGecko, XRPL RPC, XRPScan, SentiCrypt, CARV LLM, pathfinder, tx history). Payments are simulated; price, ledger, and sentiment tasks call the same APIs as the rest of the app. Each step is recorded as a micropayment below.
          </p>
          <p className="text-[9px] text-cyber-muted mb-2">
            <strong>Paper Trading link:</strong> Get suggestions (Price + Sentiment) on the <Link to="/terminal" className="text-cyber-cyan hover:underline inline-flex items-center gap-0.5">Terminal page <ChevronRight size={10} /></Link> → scroll to Paper Trading → <strong>Auto</strong> tab → &quot;Get suggestion&quot; / &quot;Apply&quot;. Those payments show here under &quot;From paper trading&quot;.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={orchestraTask}
              onChange={(e) => setOrchestraTask(e.target.value as typeof orchestraTask)}
              className="bg-cyber-darker border border-cyber-border rounded px-2 py-1.5 text-xs text-cyber-text"
            >
              <option value="xrp_price">XRP price (CoinGecko)</option>
              <option value="ledger_fee">Ledger + fee (XRPL RPC)</option>
              <option value="sentiment">Sentiment (SentiCrypt)</option>
              <option value="xrpscan_metrics">Network metrics (XRPScan)</option>
              <option value="pathfinder_quote">Path quote (DEX Pathfinder)</option>
              <option value="tx_history">Tx history (xrplcluster)</option>
              <option value="compliance_snapshot">Compliance snapshot (stay in law)</option>
              <option value="prediction_markets">Prediction markets (Polymarket)</option>
              <option value="summary">Summary (reasoning only)</option>
              <option value="pipeline">Pipeline: Price → Sentiment → Reasoning</option>
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

        {/* Stats — badge reflects platform mode; when live, no demo label */}
        {!platformLive && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[8px] text-cyber-yellow bg-cyber-yellow/10 px-1.5 py-0.5 rounded border border-cyber-yellow/30">
              {transactions.length > 0 || isSimulating ? 'SIMULATED' : 'DEMO'}
            </span>
            <span className="text-[8px] text-cyber-muted">Stats from in-app demo; no on-chain payments. Toggle Live in nav to switch.</span>
          </div>
        )}
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

      {/* Agent List — demo agents, not live on-chain */}
      <div className="p-3 border-b border-cyber-border">
        <p className="text-[10px] text-cyber-muted mb-2 flex items-center gap-2">
          REGISTERED AGENTS
          <span className="text-[8px] text-cyber-yellow bg-cyber-yellow/10 px-1.5 py-0.5 rounded border border-cyber-yellow/30">Based on dashboard data sources; payments simulated</span>
        </p>
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
                  <div className="mt-2 pt-2 border-t border-cyber-border/50 space-y-2 text-[9px]">
                    <div className="grid grid-cols-3 gap-2">
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
                    <p className="text-cyber-muted border-t border-cyber-border/30 pt-1.5">
                      Used in: {getAgentDashboardSource(agent.id)}
                    </p>
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
        {transactions.length === 0 && simPayments.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare size={20} className="text-cyber-muted mx-auto mb-1 opacity-50" />
            <p className="text-[9px] text-cyber-muted">No transactions yet. Run orchestra above, or <Link to="/terminal" className="text-cyber-cyan hover:underline">go to Terminal → Paper Trading → Auto</Link> and click &quot;Get suggestion&quot; then &quot;Apply&quot;.</p>
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
            {simPayments.length > 0 && (
              <>
                <div className="px-3 py-1 text-[8px] text-cyber-cyan font-cyber border-t border-cyber-cyan/30 mt-1">From paper trading</div>
                {[...simPayments].reverse().slice(0, 10).map(p => (
                  <div key={p.id} className="px-3 py-1.5 text-[9px]">
                    <div className="flex items-center gap-1">
                      <span className="text-cyber-text">{p.from}</span>
                      <ArrowRight size={10} className="text-cyber-muted" />
                      <span className="text-cyber-text">{p.to}</span>
                      <span className="text-cyber-green ml-auto">
                        +{(p.amount / 1000000).toFixed(6)} XRP
                      </span>
                    </div>
                    <p className="text-cyber-muted">{p.reason}</p>
                  </div>
                ))}
              </>
            )}
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

function getAgentDashboardSource(agentId: string): string {
  switch (agentId) {
    case 'orchestrator': return 'Orchestra routing, task dispatch';
    case 'price-feed': return 'Nav, Wallet, Terminal, livePrices, MemeticLab, CARV';
    case 'xrpl-ledger': return 'liveXRPLData, xrplService (server_info, fee, account_channels)';
    case 'xrpscan': return 'Network page (validators, agreement), LedgerImpactTool (amendments)';
    case 'reasoning': return 'CARV Secure Payment Agent (LLM)';
    case 'pathfinder': return 'xrplPathfinding, xrplDex (pathfinding, quotes)';
    case 'sentiment': return 'freeDataFeeds (SentiCrypt)';
    case 'tx-history': return 'OpenClawDashboard, account_tx (xrplcluster)';
    case 'regulatory-watch': return 'REGULATORY-WATCH.md, COMPLIANCE-GLOBAL-US-FLORIDA.md, regulatoryData';
    case 'prediction-markets': return 'MemeticLab, predictionMarkets, unifiedAnalyticsAggregator';
    default: return 'Dashboard';
  }
}

export default AIAgentPayments;
