// Micropayment Cost Comparator
// Visual comparison of XRPL vs other networks for micropayments
// "When fees matter more than the payment, you've chosen the wrong network"

import React, { useState, useMemo } from 'react';
import {
  BarChart2, DollarSign, Clock, Zap, Award, TrendingDown,
  AlertTriangle, Check, X, Info
} from 'lucide-react';
import {
  NETWORK_COSTS,
  type CostComparison,
} from '../../services/micropayments/streamingPayments';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

// =============================================================================
// TYPES
// =============================================================================

interface CostComparatorProps {
  targetAmount?: number;  // Amount in USD to compare
  showChart?: boolean;
  highlightXRPL?: boolean;
}

// =============================================================================
// COST COMPARATOR
// =============================================================================

export function CostComparator({
  targetAmount = 0.01,
  showChart = true,
  highlightXRPL = true,
}: CostComparatorProps) {
  const [amount, setAmount] = useState(targetAmount);
  const [sortBy, setSortBy] = useState<'score' | 'fee' | 'finality'>('score');

  // Calculate fee percentage for each network
  const networkAnalysis = useMemo(() => {
    return NETWORK_COSTS.map(network => {
      const feePercent = (network.feePerTx / amount) * 100;
      const isViable = feePercent < 10; // Fee should be <10% of payment
      const isOptimal = feePercent < 1;  // Fee should be <1% for micropayments
      
      return {
        ...network,
        feePercent,
        isViable,
        isOptimal,
        feeForAmount: network.feePerTx,
        netReceived: Math.max(0, amount - network.feePerTx),
        efficiency: Math.max(0, 100 - feePercent),
      };
    }).sort((a, b) => {
      switch (sortBy) {
        case 'fee': return a.feePerTx - b.feePerTx;
        case 'finality': return a.finality - b.finality;
        default: return b.micropaymentScore - a.micropaymentScore;
      }
    });
  }, [amount, sortBy]);

  // Chart data
  const chartData = useMemo(() => {
    return networkAnalysis.map(n => ({
      name: n.network,
      score: n.micropaymentScore,
      fee: Math.min(100, n.feePercent), // Cap at 100% for chart
      finality: Math.min(60, n.finality), // Cap at 60s for chart
      isXRPL: n.network.includes('XRPL') || n.network.includes('ILP'),
    }));
  }, [networkAnalysis]);

  // Radar data for XRPL vs avg
  const radarData = useMemo(() => {
    const xrplChannel = networkAnalysis.find(n => n.network === 'XRPL Payment Channel');
    const avgOthers = networkAnalysis.filter(n => !n.network.includes('XRPL') && !n.network.includes('ILP'));
    
    const avgFee = avgOthers.reduce((s, n) => s + n.feePerTx, 0) / avgOthers.length;
    const avgFinality = avgOthers.reduce((s, n) => s + n.finality, 0) / avgOthers.length;
    const avgTps = avgOthers.reduce((s, n) => s + n.tps, 0) / avgOthers.length;
    const avgScore = avgOthers.reduce((s, n) => s + n.micropaymentScore, 0) / avgOthers.length;

    return [
      { metric: 'Low Fees', xrpl: 100, others: Math.max(0, 100 - (avgFee / 0.001) * 10) },
      { metric: 'Fast Finality', xrpl: 100, others: Math.max(0, 100 - avgFinality * 2) },
      { metric: 'High TPS', xrpl: 100, others: Math.min(100, (avgTps / 100000) * 100) },
      { metric: 'Micropay Score', xrpl: xrplChannel?.micropaymentScore || 100, others: avgScore },
      { metric: 'Min Viable Tx', xrpl: 100, others: 20 }, // XRPL can do $0.0001, others avg $0.1+
    ];
  }, [networkAnalysis]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-cyber-green" />
            <span className="font-cyber text-cyber-green text-sm">MICROPAYMENT COST COMPARISON</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40" title="Fee and TPS figures are reference benchmarks, not live network data.">
              REFERENCE
            </span>
          </div>
        </div>

        {/* Amount Selector */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-cyber-muted">Payment Amount:</span>
          <div className="flex gap-1">
            {[0.001, 0.01, 0.1, 1, 10].map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`px-2 py-1 rounded text-[10px] transition-colors ${
                  amount === amt
                    ? 'bg-cyber-cyan text-cyber-darker'
                    : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-cyber-muted">Sort by:</span>
          <div className="flex gap-1">
            {(['score', 'fee', 'finality'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-0.5 rounded text-[9px] capitalize transition-colors ${
                  sortBy === s
                    ? 'bg-cyber-purple text-white'
                    : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="p-3 bg-cyber-green/10 border-b border-cyber-green/30">
        <div className="flex items-start gap-2">
          <Award size={16} className="text-cyber-green mt-0.5" />
          <div>
            <p className="text-xs text-cyber-green font-cyber">XRPL PAYMENT CHANNELS WIN</p>
            <p className="text-[10px] text-cyber-text mt-1">
              For a ${amount.toFixed(4)} payment, XRPL Payment Channel fee is{' '}
              <span className="text-cyber-green font-bold">
                ${(0.000001).toFixed(6)}
              </span>{' '}
              ({((0.000001 / amount) * 100).toFixed(4)}% of payment).
              Ethereum L1 would cost <span className="text-cyber-red">${(0.12).toFixed(2)}</span>{' '}
              ({((0.12 / amount) * 100).toFixed(0)}% - {Math.round(0.12 / amount)}x the payment itself!)
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {showChart && (
        <div className="p-3 border-b border-cyber-border">
          <p className="text-[10px] text-cyber-muted mb-2">MICROPAYMENT SCORE (Higher = Better)</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#888' }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 9, fill: '#888' }} 
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f1a',
                  border: '1px solid #1e3a5f',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isXRPL ? '#00FF88' : entry.score > 50 ? '#00D4FF' : '#FF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Network Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-cyber-border/30">
              <th className="p-2 text-left text-cyber-muted">Network</th>
              <th className="p-2 text-right text-cyber-muted">Fee/Tx</th>
              <th className="p-2 text-right text-cyber-muted">Fee %</th>
              <th className="p-2 text-right text-cyber-muted">Finality</th>
              <th className="p-2 text-right text-cyber-muted">TPS</th>
              <th className="p-2 text-center text-cyber-muted">Viable?</th>
            </tr>
          </thead>
          <tbody>
            {networkAnalysis.map((network, i) => {
              const isXRPL = network.network.includes('XRPL') || network.network.includes('ILP');
              
              return (
                <tr
                  key={network.network}
                  className={`border-t border-cyber-border/30 ${
                    isXRPL && highlightXRPL ? 'bg-cyber-green/10' : ''
                  }`}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      {isXRPL && <Zap size={10} className="text-cyber-green" />}
                      <span className={isXRPL ? 'text-cyber-green font-bold' : 'text-cyber-text'}>
                        {network.network}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono text-cyber-text">
                    ${network.feePerTx < 0.001 ? network.feePerTx.toFixed(6) : network.feePerTx.toFixed(4)}
                  </td>
                  <td className={`p-2 text-right font-mono ${
                    network.feePercent < 1 ? 'text-cyber-green' :
                    network.feePercent < 10 ? 'text-cyber-yellow' :
                    'text-cyber-red'
                  }`}>
                    {network.feePercent < 100 ? network.feePercent.toFixed(2) : '>100'}%
                  </td>
                  <td className="p-2 text-right font-mono text-cyber-text">
                    {network.finality < 1 ? `${(network.finality * 1000).toFixed(0)}ms` : `${network.finality}s`}
                  </td>
                  <td className="p-2 text-right font-mono text-cyber-text">
                    {network.tps.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    {network.isOptimal ? (
                      <Check size={12} className="text-cyber-green mx-auto" />
                    ) : network.isViable ? (
                      <AlertTriangle size={12} className="text-cyber-yellow mx-auto" />
                    ) : (
                      <X size={12} className="text-cyber-red mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TigerBeetle vs public / channel stacks */}
      <div className="px-3 py-2 border-t border-cyber-border/60 bg-cyber-darker/40 flex gap-2 items-start">
        <Info size={12} className="text-cyber-cyan shrink-0 mt-0.5" aria-hidden />
        <p className="text-[9px] text-cyber-muted leading-relaxed text-left">
          <span className="text-cyber-text/90 font-cyber">TigerBeetle</span> is shown as a{' '}
          <strong className="text-cyber-text/90 font-normal">high-throughput ledger database</strong> (OLTP-style
          double-entry)—something you operate <em>alongside</em> payments or settlement. The other rows are mostly{' '}
          <strong className="text-cyber-text/90 font-normal">public chains, L2s, or channel / routing protocols</strong>{' '}
          (different designs, not the same product). Fee/TPS here stay <span className="text-cyber-cyan">reference</span>{' '}
          benchmarks; TigerBeetle’s “fee” models marginal infra, not L1 gas.
        </p>
      </div>

      {/* Summary */}
      <div className="p-3 border-t border-cyber-border bg-cyber-darker/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-cyber text-cyber-green">
              {networkAnalysis.filter(n => n.isOptimal).length}
            </p>
            <p className="text-[8px] text-cyber-muted">OPTIMAL (&lt;1% fee)</p>
          </div>
          <div>
            <p className="text-lg font-cyber text-cyber-yellow">
              {networkAnalysis.filter(n => n.isViable && !n.isOptimal).length}
            </p>
            <p className="text-[8px] text-cyber-muted">VIABLE (1-10% fee)</p>
          </div>
          <div>
            <p className="text-lg font-cyber text-cyber-red">
              {networkAnalysis.filter(n => !n.isViable).length}
            </p>
            <p className="text-[8px] text-cyber-muted">NOT VIABLE (&gt;10%)</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "When fees matter more than the payment, you've chosen the wrong network."
        </p>
      </div>
    </div>
  );
}

export default CostComparator;
