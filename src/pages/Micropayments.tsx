// Micropayments Page - XRPL/ILP Micropayment Dominance Showcase
// "The network where fees are smaller than the payments themselves"

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, DollarSign, Bot, Globe, Layers, BarChart2,
  TrendingUp, Award, ArrowRight, Target, Cpu, HelpCircle, Wallet
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

const TAB_IDS = ['overview', 'streams', 'channels', 'web', 'agents', 'adoption', 'openclaw'] as const;
type TabId = typeof TAB_IDS[number];

export default function MicropaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const location = useLocation();

  // Open a specific tab when navigating from Agent Economy (e.g. Link state: { tab: 'openclaw' })
  useEffect(() => {
    const stateTab = (location.state as { tab?: TabId })?.tab;
    if (stateTab && TAB_IDS.includes(stateTab)) setActiveTab(stateTab);
  }, [location.state]);

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
          className="mb-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyber-yellow to-cyber-green">
              <Zap size={24} className="text-cyber-darker" />
            </div>
            <div>
              <h1 className="text-2xl font-cyber text-cyber-text">MICROPAYMENTS</h1>
              <p className="text-xs text-cyber-muted">🔴 MAINNET LIVE · Network ID: ra7Zj3G…xyo64</p>
            </div>
          </div>
          <p className="text-cyber-muted text-sm max-w-2xl">
            The network where fees are smaller than the payments themselves. 
            XRPL + ILP enable true micropayments: streaming content revenue, 
            AI agent transactions, pay-per-API-call, and more.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <span className="text-cyber-muted">AI agent economy:</span>
            <Link to="/agent-economy" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30 text-cyber-glow hover:bg-cyber-glow/20 font-cyber transition-colors">
              <Wallet size={12} />
              Agent Economy (receipts &amp; caps)
            </Link>
            <Link to="/carv" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20 font-cyber transition-colors">
              <Bot size={12} />
              Secure Payment Agent
            </Link>
            <span className="text-[10px] text-cyber-muted ml-1">· Use within applicable laws; no custody.</span>
          </div>
        </motion.div>

        {/* New here? — what this page does and how to use it */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="cyber-panel p-4 mb-6 border-cyber-cyan/40 bg-cyber-cyan/5"
        >
          <div className="flex items-start gap-3">
            <HelpCircle size={20} className="text-cyber-cyan mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-cyber text-cyber-cyan text-sm mb-2">New here? What this page does</h2>
              <p className="text-xs text-cyber-text mb-3">
                This page explains <strong>why XRPL + ILP are built for micropayments</strong> and lets you try demos. 
                You don’t need to read everything—follow the steps below to get value in under a minute.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyber-cyan/20 text-cyber-cyan flex items-center justify-center font-cyber">1</span>
                  <div>
                    <p className="text-cyber-text font-medium">Skim the numbers</p>
                    <p className="text-cyber-muted text-[10px]">Glance at the four stats below (fee, TPS, finality, min payment).</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyber-cyan/20 text-cyber-cyan flex items-center justify-center font-cyber">2</span>
                  <div>
                    <p className="text-cyber-text font-medium">Try the demo</p>
                    <p className="text-cyber-muted text-[10px]">Click the <strong>Streams</strong> tab, then <strong>Start Demo</strong> to see micropayments flow.</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyber-cyan/20 text-cyber-cyan flex items-center justify-center font-cyber">3</span>
                  <div>
                    <p className="text-cyber-text font-medium">Explore by interest</p>
                    <p className="text-cyber-muted text-[10px]">Use the tabs: Channels (how payments work), Web Monetization, AI Agents, Adoption.</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-cyber-muted mt-3 pt-2 border-t border-cyber-border/50">
                Building something? Start with <strong>Channels</strong> (payment channel flow) or <strong>Web Monetization</strong> (W3C + ILP).
              </p>
            </div>
          </div>
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

        {/* Why this makes money — plain-language breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="cyber-panel p-4 mb-6 border-cyber-yellow/40 bg-cyber-yellow/5"
        >
          <div className="flex items-start gap-3">
            <DollarSign size={24} className="text-cyber-yellow mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-cyber text-cyber-yellow text-sm mb-2">Why this makes money (simple breakdown)</h2>
              <p className="text-xs text-cyber-text mb-3">
                <strong>Micropayments</strong> = tiny payments (e.g. $0.001 per second of video, or $0.0001 per API call). On most blockchains the <em>fee is bigger than the payment</em>, so they’re useless. On XRPL the fee is ~$0.00003, so you can actually charge tiny amounts and <strong>you keep almost all of it</strong>. Money flows to whoever provides the thing being paid for.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-cyber-darker/60 border border-cyber-border/40">
                  <p className="text-cyber-yellow font-semibold mb-1.5">Who gets paid</p>
                  <ul className="space-y-1 text-cyber-muted text-[11px]">
                    <li><strong className="text-cyber-text">Creators</strong> — per second of video/music or per article (you earn as they watch/read).</li>
                    <li><strong className="text-cyber-text">API / data providers</strong> — per request (AI, data feeds, APIs).</li>
                    <li><strong className="text-cyber-text">Game devs</strong> — instant tiny payments for in-game items or power-ups.</li>
                    <li><strong className="text-cyber-text">You (platform)</strong> — small fee or margin on each stream or channel you enable.</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-cyber-darker/60 border border-cyber-border/40">
                  <p className="text-cyber-yellow font-semibold mb-1.5">Where the money comes from</p>
                  <ul className="space-y-1 text-cyber-muted text-[11px]">
                    <li>Users pay tiny amounts instead of subscriptions or big one-off fees.</li>
                    <li>AI agents / apps pay per use (data, compute, API calls) instead of flat SaaS.</li>
                    <li>Volume: 100,000 micropayments at $0.001 = $100 in value flow; fees stay cents.</li>
                    <li>You monetize by <strong className="text-cyber-text">enabling the pipe</strong> (streams, channels, APIs) and taking a small cut or fee.</li>
                  </ul>
                </div>
              </div>
              <p className="text-[10px] text-cyber-muted mt-3 pt-2 border-t border-cyber-border/50">
                The demo on the <strong>Streams</strong> tab shows those tiny payments flowing in real time (simulated). Each line = one revenue stream; the numbers = who gets paid and how much.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
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
          <p className="text-[10px] text-cyber-muted mt-1.5 px-0.5">
            Overview = intro &amp; cost comparison · Streams = simulated demo (visual/education) · Channels = payment channel flow · Web = W3C monetization · AI Agents = agent payments · Adoption = ecosystem
          </p>
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
              <p className="text-[11px] text-cyber-muted mb-1">
                This tab is <strong className="text-cyber-text">visual + education only</strong>: a simulated demo of how ILP micropayment streams look when money flows. It does not connect to real Rafiki/ILP or the ledger. To build real streams, use <a href="https://github.com/interledger/rafiki" target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline">Rafiki</a> or ILP-enabled infrastructure.
              </p>
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
                    XRPL/ILP is one of the very few networks where micropayments like this are economically viable (fees &lt; payment size).
                  </p>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-cyber-border/30">
                      <p className="text-[10px] text-cyber-green">✓ AI agent pays ~$0.0001 per data API call (XRPL fee ~$0.00003)</p>
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
                <div className="cyber-panel p-4 border-cyber-border bg-cyber-darker/40">
                  <p className="text-[10px] text-cyber-muted font-cyber mb-2">WHO ELSE / IS THIS VIABLE?</p>
                  <p className="text-[10px] text-cyber-text mb-2">
                    The use case is real: pay-per-call for AI agents exists elsewhere (e.g. <strong>x402</strong> on Solana/Base, OpenLibx402, APINow). XRPL/ILP has <strong>live micropayment adopters</strong> for content (Cinnamon, Puma), remittance (ODL), and ILP infrastructure (Rafiki, Uphold). AI-agent-specific adoption on XRPL is <strong>emerging</strong>—infrastructure is ready; this app and OpenClaw are part of that. So yes: viable product/tool; adoption still growing.
                  </p>
                  <p className="text-[9px] text-cyber-muted">See Adoption tab for full list of XRPL/ILP projects.</p>
                </div>
                <div className="cyber-panel p-4 border-cyber-cyan/30 bg-cyber-cyan/5">
                  <p className="text-[10px] text-cyber-cyan font-cyber mb-2">BUILD VS INTEGRATE / TESTING</p>
                  <p className="text-[10px] text-cyber-text mb-2">
                    Orchestra today = <strong>in-app demo</strong> (we built the mock agents). To go real: <strong>build</strong> our own agent services, <strong>integrate</strong> external ones (x402, OpenClaw, future XRPL registry), or <strong>mix both</strong>. Testing: demo = manual; real agents = unit + integration tests, testnet for payments. See <code className="text-[9px] bg-cyber-darker px-1 rounded">docs/AI-AGENT-ECONOMY-INTEGRATION.md</code> → “Run the Orchestra”.
                  </p>
                </div>
                <div className="cyber-panel p-4 border-cyber-green/30 bg-cyber-green/5">
                  <p className="text-[10px] text-cyber-green font-cyber mb-2">RECOMMENDED NEXT AGENTS</p>
                  <p className="text-[10px] text-cyber-text mb-2">
                    Other dashboard data you could add as agents: <strong>Prediction markets</strong> (Polymarket – predictionMarkets.ts), <strong>Analytics / screener</strong> (analyticsService, cryptoScreener), <strong>Order book</strong> (Binance depth), <strong>ILP pathfinding</strong> (carPathfinding), <strong>Alerts</strong> (alertNotifications), <strong>NFT metadata</strong> (assetsStore). See doc section “Other agents we recommend”.
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
