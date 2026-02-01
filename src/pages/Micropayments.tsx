// Micropayments Page - XRPL/ILP Micropayment Dominance Showcase
// "The network where fees are smaller than the payments themselves"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, DollarSign, Bot, Globe, Layers, BarChart2,
  TrendingUp, Award, ArrowRight, Target, Cpu
} from 'lucide-react';

import { StreamVisualizer } from '../components/micropayments/StreamVisualizer';
import { CostComparator } from '../components/micropayments/CostComparator';
import { PaymentChannelManager } from '../components/micropayments/PaymentChannelManager';
import { WebMonetizationDashboard } from '../components/micropayments/WebMonetizationDashboard';
import { AIAgentPayments } from '../components/micropayments/AIAgentPayments';
import { AdoptionTracker } from '../components/micropayments/AdoptionTracker';
import { OpenClawDashboard } from '../components/micropayments/OpenClawDashboard';

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function MicropaymentsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'streams' | 'channels' | 'web' | 'agents' | 'adoption' | 'openclaw'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={14} /> },
    { id: 'openclaw', label: 'OpenClaw', icon: <Cpu size={14} /> },
    { id: 'adoption', label: 'Adoption', icon: <Target size={14} /> },
    { id: 'streams', label: 'Streams', icon: <Zap size={14} /> },
    { id: 'channels', label: 'Channels', icon: <Layers size={14} /> },
    { id: 'web', label: 'Web Monetization', icon: <Globe size={14} /> },
    { id: 'agents', label: 'AI Agents', icon: <Bot size={14} /> },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyber-yellow to-cyber-green">
              <Zap size={24} className="text-cyber-darker" />
            </div>
            <div>
              <h1 className="text-2xl font-cyber text-cyber-text">MICROPAYMENTS</h1>
              <p className="text-sm text-cyber-muted">XRPL/ILP Micropayment Dominance</p>
            </div>
          </div>
          <p className="text-cyber-muted text-sm max-w-2xl">
            The network where fees are smaller than the payments themselves. 
            XRPL + ILP enable true micropayments: streaming content revenue, 
            AI agent transactions, pay-per-API-call, and more.
          </p>
        </motion.div>

        {/* Key Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="cyber-panel p-4 text-center border-cyber-green/30">
            <p className="text-3xl font-cyber text-cyber-green">$0.00003</p>
            <p className="text-xs text-cyber-muted">Fee per XRPL Transaction</p>
          </div>
          <div className="cyber-panel p-4 text-center border-cyber-cyan/30">
            <p className="text-3xl font-cyber text-cyber-cyan">100K+</p>
            <p className="text-xs text-cyber-muted">TPS via Payment Channels</p>
          </div>
          <div className="cyber-panel p-4 text-center border-cyber-yellow/30">
            <p className="text-3xl font-cyber text-cyber-yellow">4s</p>
            <p className="text-xs text-cyber-muted">Finality Time</p>
          </div>
          <div className="cyber-panel p-4 text-center border-cyber-purple/30">
            <p className="text-3xl font-cyber text-cyber-purple">$0.0001</p>
            <p className="text-xs text-cyber-muted">Min Viable Payment</p>
          </div>
        </motion.div>

        {/* XRPL Dominance Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="cyber-panel p-4 mb-6 border-cyber-green/50 bg-cyber-green/5"
        >
          <div className="flex items-start gap-3">
            <Award size={24} className="text-cyber-green mt-1" />
            <div>
              <p className="font-cyber text-cyber-green mb-2">WHY XRPL/ILP DOMINATES MICROPAYMENTS</p>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-cyber-text">
                <div>
                  <p className="text-cyber-green font-bold mb-1">Fee Ratio</p>
                  <p className="text-xs text-cyber-muted">
                    A $0.01 payment on XRPL costs $0.00003 in fees (0.3%).
                    On Ethereum L1, the same payment costs $2.50+ (25,000%+).
                  </p>
                </div>
                <div>
                  <p className="text-cyber-cyan font-bold mb-1">Payment Channels</p>
                  <p className="text-xs text-cyber-muted">
                    Open a channel once, send 100,000+ instant payments off-chain,
                    settle with one transaction. 2 fees for unlimited micropayments.
                  </p>
                </div>
                <div>
                  <p className="text-cyber-purple font-bold mb-1">ILP Cross-Currency</p>
                  <p className="text-xs text-cyber-muted">
                    Interledger enables streaming payments across any currency.
                    AI agent in USD pays data provider in EUR, settles via XRPL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-cyber whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-cyber-cyan text-cyber-darker'
                  : 'bg-cyber-border/50 text-cyber-muted hover:text-cyber-text hover:bg-cyber-border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <CostComparator targetAmount={0.01} showChart={true} />
              <StreamVisualizer height={400} />
            </div>
          )}

          {activeTab === 'streams' && (
            <div className="space-y-6">
              <StreamVisualizer height={500} showStats={true} />
              <div className="cyber-panel p-4">
                <h3 className="font-cyber text-cyber-cyan mb-3">USE CASES</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { icon: '🎬', name: 'Content Streaming', desc: 'Pay per second of video/music' },
                    { icon: '🔌', name: 'API Metering', desc: 'Pay per API call' },
                    { icon: '🎮', name: 'Gaming', desc: 'Instant in-game purchases' },
                    { icon: '📡', name: 'IoT Data', desc: 'Sensors selling data streams' },
                  ].map(uc => (
                    <div key={uc.name} className="p-3 rounded bg-cyber-border/30 text-center">
                      <span className="text-2xl">{uc.icon}</span>
                      <p className="text-xs text-cyber-text mt-1">{uc.name}</p>
                      <p className="text-[9px] text-cyber-muted">{uc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="grid md:grid-cols-2 gap-6">
              <PaymentChannelManager showCreateForm={true} />
              <div className="space-y-4">
                <div className="cyber-panel p-4 border-cyber-purple/30">
                  <h3 className="font-cyber text-cyber-purple mb-3">PAYMENT CHANNEL FLOW</h3>
                  <div className="space-y-3">
                    {[
                      { step: 1, action: 'PaymentChannelCreate', desc: 'Open channel on XRPL (1 tx, ~$0.00003)' },
                      { step: 2, action: 'Off-Chain Claims', desc: 'Send 100,000+ signed claims instantly (FREE)' },
                      { step: 3, action: 'PaymentChannelClaim', desc: 'Receiver claims balance anytime (1 tx)' },
                      { step: 4, action: 'PaymentChannelClose', desc: 'Close and settle remaining balance' },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyber-purple/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-cyber-purple">{s.step}</span>
                        </div>
                        <div>
                          <p className="text-xs text-cyber-text font-mono">{s.action}</p>
                          <p className="text-[10px] text-cyber-muted">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <CostComparator targetAmount={0.001} showChart={false} />
              </div>
            </div>
          )}

          {activeTab === 'web' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <WebMonetizationDashboard enableDemo={true} />
              </div>
              <div className="space-y-4">
                <div className="cyber-panel p-4 border-cyber-cyan/30">
                  <h3 className="font-cyber text-cyber-cyan mb-3">W3C STANDARD + ILP</h3>
                  <p className="text-xs text-cyber-text mb-3">
                    Web Monetization is a <strong>W3C proposed standard</strong> that uses 
                    Interledger Protocol (ILP) for the payment layer.
                  </p>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <ArrowRight size={10} className="text-cyber-green" />
                      <span className="text-cyber-muted">Browser detects payment pointer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={10} className="text-cyber-green" />
                      <span className="text-cyber-muted">ILP streams micropayments (~$0.36/hr)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={10} className="text-cyber-green" />
                      <span className="text-cyber-muted">XRPL settles cross-currency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={10} className="text-cyber-green" />
                      <span className="text-cyber-muted">Creator receives in their currency</span>
                    </div>
                  </div>
                </div>
                <div className="cyber-panel p-4 border-cyber-green/30 bg-cyber-green/5">
                  <p className="text-xs text-cyber-green font-cyber mb-2">XRPL ADVANTAGE</p>
                  <p className="text-[10px] text-cyber-text">
                    At $0.36/hour, you make ~360 payments per hour (~$0.001 each).
                    On XRPL/ILP, total fees: ~$0.01/hour.
                    On Ethereum L1, total fees: ~$900/hour.
                    <span className="text-cyber-green font-bold"> XRPL is 90,000x cheaper.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <AIAgentPayments enableSimulation={true} />
              </div>
              <div className="space-y-4">
                <div className="cyber-panel p-4 border-cyber-green/30">
                  <h3 className="font-cyber text-cyber-green mb-3">THE AI AGENT ECONOMY</h3>
                  <p className="text-xs text-cyber-text mb-3">
                    Autonomous AI agents need to pay for resources: compute, data, tools, other agents.
                    XRPL/ILP is the only network where this is economically viable.
                  </p>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-cyber-border/30">
                      <p className="text-[10px] text-cyber-green">✓ GPT-5 agent pays $0.0001 per data API call</p>
                    </div>
                    <div className="p-2 rounded bg-cyber-border/30">
                      <p className="text-[10px] text-cyber-green">✓ Orchestrator pays GPU cluster per compute-second</p>
                    </div>
                    <div className="p-2 rounded bg-cyber-border/30">
                      <p className="text-[10px] text-cyber-green">✓ Agents negotiate prices via ILP quotes</p>
                    </div>
                    <div className="p-2 rounded bg-cyber-border/30">
                      <p className="text-[10px] text-cyber-green">✓ Payment channels enable swarm-scale TPS</p>
                    </div>
                  </div>
                </div>
                <div className="cyber-panel p-4 border-cyber-yellow/30 bg-cyber-yellow/5">
                  <p className="text-xs text-cyber-yellow font-cyber mb-2">WHY NOT ETHEREUM?</p>
                  <p className="text-[10px] text-cyber-text">
                    If an AI agent makes 1000 API calls/minute and each costs $0.0001,
                    that's $0.10/minute in payments.
                    <br/><br/>
                    <strong>On Ethereum L1:</strong> 1000 × $2.50 fee = <span className="text-cyber-red">$2,500/minute in fees</span>
                    <br/>
                    <strong>On XRPL:</strong> 1000 × $0.00003 fee = <span className="text-cyber-green">$0.03/minute in fees</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'adoption' && (
            <div className="grid md:grid-cols-1 gap-6">
              <AdoptionTracker showMarketing={true} showDevTools={true} />
            </div>
          )}

          {activeTab === 'openclaw' && (
            <div className="grid md:grid-cols-1 gap-6">
              <div className="cyber-panel p-4 border-cyber-purple/30 bg-cyber-purple/5 mb-4">
                <h3 className="font-cyber text-cyber-purple mb-2">OPENCLAW MONETIZATION</h3>
                <p className="text-xs text-cyber-text mb-3">
                  OpenClaw (formerly Clawdbot/Moltbot) is a viral open-source AI agent with 134k+ GitHub stars.
                  By integrating XRPL micropayments, you become the payment infrastructure for the AI agent economy.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-lg font-cyber text-cyber-green">3%</p>
                    <p className="text-[9px] text-cyber-muted">YOUR FEE PER TX</p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-lg font-cyber text-cyber-cyan">134k+</p>
                    <p className="text-[9px] text-cyber-muted">GITHUB STARS</p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-lg font-cyber text-cyber-yellow">$0.00003</p>
                    <p className="text-[9px] text-cyber-muted">XRPL FEE</p>
                  </div>
                </div>
              </div>
              <OpenClawDashboard />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
