/**
 * Learn — all educational content in one place.
 * Overview, adoption, web pay, AI agents, OpenClaw. No payment actions here.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Bot, MessageSquare, Receipt, Zap } from 'lucide-react';
import { CostComparator } from '../components/micropayments/CostComparator';
import { StreamVisualizer } from '../components/micropayments/StreamVisualizer';
import { AdoptionTracker } from '../components/micropayments/AdoptionTracker';
import { WebMonetizationDashboard } from '../components/micropayments/WebMonetizationDashboard';
import { AIAgentPayments } from '../components/micropayments/AIAgentPayments';
import { OpenClawDashboard } from '../components/micropayments/OpenClawDashboard';
import { AgentEconomyHub } from '../components/AgentEconomyHub';

const SECTIONS = [
  { id: 'howto', label: 'How to use' },
  { id: 'agenteconomy', label: 'Agent economy' },
  { id: 'overview', label: 'Overview' },
  { id: 'adoption', label: 'Adoption' },
  { id: 'web', label: 'Web pay' },
  { id: 'agents', label: 'AI agents' },
  { id: 'openclaw', label: 'OpenClaw' },
] as const;

export default function Learn() {
  const location = useLocation();
  const stateSection = (location.state as { section?: string } | null)?.section;
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>(
    stateSection && SECTIONS.some(s => s.id === stateSection) ? stateSection as (typeof SECTIONS)[number]['id'] : 'howto'
  );
  useEffect(() => {
    if (stateSection && SECTIONS.some(s => s.id === stateSection)) {
      setSection(stateSection as (typeof SECTIONS)[number]['id']);
    }
  }, [stateSection]);

  return (
    <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={22} className="text-cyber-cyan" />
            <h1 className="text-2xl font-cyber text-cyber-text">Learn</h1>
          </div>
          <p className="text-cyber-muted text-sm">How micropayments, XRPL, and the agent economy work.</p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-cyber-border">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`px-3 py-2 rounded-lg text-sm font-cyber whitespace-nowrap transition-colors ${
                section === s.id ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50' : 'text-cyber-muted hover:text-cyber-text border border-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <motion.div key={section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {section === 'howto' && (
            <div className="space-y-6">
              <div className="cyber-panel p-4 border-cyber-cyan/30 bg-cyber-cyan/5">
                <h2 className="font-cyber text-cyber-cyan text-lg mb-2">How a normal person uses this</h2>
                <p className="text-sm text-cyber-text mb-4">
                  The <strong>payment agent</strong> is the blue robot button in the bottom-right corner (and the &quot;Payment agent&quot; link in the nav). Open it from any page. Inside you get three tabs: <strong>Chat</strong>, <strong>Track</strong>, and <strong>Streams</strong>. Here’s what you actually do with each.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="cyber-panel p-4 border-cyber-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={20} className="text-cyber-cyan" />
                    <h3 className="font-cyber text-cyber-text">Chat — Send XRP to anyone</h3>
                  </div>
                  <p className="text-xs text-cyber-muted mb-3">Use this when you want to send a one-off payment.</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-cyber-text">
                    <li>Open the agent (tap the robot button or nav &quot;Payment agent&quot;).</li>
                    <li>Go to the <strong>Chat</strong> tab.</li>
                    <li>Connect your wallet (e.g. Xaman) if you haven’t — the app will prompt you.</li>
                    <li>Either use <strong>Quick send</strong>: type the recipient’s XRP address (starts with <code className="text-cyber-cyan">r...</code>), amount in XRP, and an optional note, then hit Send. Or type in the chat something like &quot;Send 10 XRP to rABC123...&quot; and the agent will guide you.</li>
                    <li>Your wallet will ask you to approve the payment. After you sign, the XRP is sent on the real XRPL.</li>
                  </ol>
                  <p className="text-[11px] text-cyber-muted mt-3">Example: paying a friend, tipping a creator, or paying an invoice.</p>
                </div>

                <div className="cyber-panel p-4 border-cyber-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt size={20} className="text-cyber-green" />
                    <h3 className="font-cyber text-cyber-text">Track — See what you spent and set limits</h3>
                  </div>
                  <p className="text-xs text-cyber-muted mb-3">Use this to stay in control of your spending.</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-cyber-text">
                    <li>Open the agent → <strong>Track</strong> tab.</li>
                    <li><strong>Receipts</strong>: list of payments you’ve made (for your records or taxes).</li>
                    <li><strong>Limits</strong>: set a cap so the agent never spends more than you’re comfortable with.</li>
                    <li><strong>Pending</strong>: anything waiting for your approval.</li>
                    <li><strong>Tools</strong>: optional paid features; use them only if you want to.</li>
                  </ol>
                  <p className="text-[11px] text-cyber-muted mt-3">Example: checking where your XRP went, or making sure the agent can’t send more than 50 XRP without you.</p>
                </div>

                <div className="cyber-panel p-4 border-cyber-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={20} className="text-cyber-yellow" />
                    <h3 className="font-cyber text-cyber-text">Streams — Send money in a stream or set up a channel</h3>
                  </div>
                  <p className="text-xs text-cyber-muted mb-3">Use this when you want several small payments in a row, or to prepare for lots of small payments to the same person.</p>
                  <ul className="space-y-2 text-sm text-cyber-text list-none">
                    <li className="flex gap-2">
                      <ArrowRight size={14} className="text-cyber-yellow shrink-0 mt-0.5" />
                      <span><strong>Stream now</strong>: You choose a recipient, an amount per payment (e.g. 0.1 XRP), how many payments (e.g. 5), and how many seconds between each. You hit Start. Your wallet will ask you to sign once per payment. Good for: tipping in small chunks, testing, or any time you want &quot;send 0.1 XRP, five times.&quot;</span>
                    </li>
                    <li className="flex gap-2">
                      <ArrowRight size={14} className="text-cyber-yellow shrink-0 mt-0.5" />
                      <span><strong>Payment channels</strong>: You lock XRP (e.g. 10 XRP) into a &quot;channel&quot; for one recipient. Later, you can send them many small amounts from that channel without a new on-chain transaction every time. Setting one up needs your wallet and your public key (from your wallet). Best for: paying the same person or service often.</span>
                    </li>
                  </ul>
                  <p className="text-[11px] text-cyber-muted mt-3">OpenClaw tab: micropayments to recipients and optional skill creators. This project does not collect any platform fees or royalties.</p>
                </div>
              </div>

              <div className="cyber-panel p-4 border-cyber-glow/30 bg-cyber-darker">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={18} className="text-cyber-glow" />
                  <h3 className="font-cyber text-cyber-text text-sm">TL;DR</h3>
                </div>
                <p className="text-xs text-cyber-muted">
                  <strong className="text-cyber-text">Send XRP</strong> → Open agent → Chat → Quick send (or type in chat). <strong className="text-cyber-text">See spending / set limits</strong> → Track. <strong className="text-cyber-text">Send a stream of small payments</strong> → Streams → Stream now. <strong className="text-cyber-text">Pay the same person many times later</strong> → Streams → create a payment channel. You need a real XRP wallet (e.g. Xaman) to sign; demo wallets can’t send real XRP.
                </p>
              </div>
            </div>
          )}

          {section === 'agenteconomy' && (
            <AgentEconomyHub />
          )}

          {section === 'overview' && (
            <>
              <p className="text-xs text-cyber-muted">Demo of tiny payments flowing. Simulated only.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <CostComparator targetAmount={0.01} showChart={true} />
                <StreamVisualizer height={320} showStats={true} />
              </div>
              <div className="cyber-panel p-4">
                <h3 className="font-cyber text-cyber-cyan mb-3 text-sm">Use cases</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: '🎬', name: 'Content', desc: 'Pay per second' },
                    { icon: '🔌', name: 'API', desc: 'Pay per call' },
                    { icon: '🎮', name: 'Gaming', desc: 'In-game pay' },
                    { icon: '📡', name: 'IoT', desc: 'Data streams' },
                  ].map((uc) => (
                    <div key={uc.name} className="p-3 rounded bg-cyber-border/30 text-center">
                      <span className="text-xl">{uc.icon}</span>
                      <p className="text-xs text-cyber-text mt-1">{uc.name}</p>
                      <p className="text-[10px] text-cyber-muted">{uc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {section === 'adoption' && (
            <>
              <p className="text-xs text-cyber-muted">Who uses XRPL/ILP micropayments.</p>
              <AdoptionTracker showMarketing={true} showDevTools={true} />
            </>
          )}

          {section === 'web' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <WebMonetizationDashboard enableDemo={true} />
              </div>
              <div className="space-y-4">
                <div className="cyber-panel p-4 border-cyber-cyan/30">
                  <h3 className="font-cyber text-cyber-cyan mb-2 text-sm">W3C + ILP</h3>
                  <p className="text-xs text-cyber-text mb-2">Web Monetization uses Interledger. XRPL settles cross-currency.</p>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2"><ArrowRight size={10} className="text-cyber-green" /><span className="text-cyber-muted">Browser detects payment pointer</span></div>
                    <div className="flex items-center gap-2"><ArrowRight size={10} className="text-cyber-green" /><span className="text-cyber-muted">Streams micropayments</span></div>
                    <div className="flex items-center gap-2"><ArrowRight size={10} className="text-cyber-green" /><span className="text-cyber-muted">Creator gets paid</span></div>
                  </div>
                </div>
                <div className="cyber-panel p-4 border-cyber-green/30 bg-cyber-green/5">
                  <p className="text-xs text-cyber-green font-cyber mb-1">XRPL advantage</p>
                  <p className="text-[10px] text-cyber-text">~$0.36/hr: XRPL fees ~$0.01/hr. Ethereum L1 ~$120/hr (1000 txs at ~$0.12 each).</p>
                </div>
              </div>
            </div>
          )}

          {section === 'agents' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <AIAgentPayments enableSimulation={true} />
              </div>
              <div className="space-y-4">
                <div className="cyber-panel p-4 border-cyber-green/30">
                  <p className="text-xs text-cyber-text mb-2">Agents pay for data, compute, tools. XRPL keeps fees smaller than the payment.</p>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-cyber-border/30"><p className="text-[10px] text-cyber-green">✓ Pay per API call</p></div>
                    <div className="p-2 rounded bg-cyber-border/30"><p className="text-[10px] text-cyber-green">✓ Channels for scale</p></div>
                  </div>
                </div>
                <div className="cyber-panel p-4 border-cyber-yellow/30 bg-cyber-yellow/5">
                  <p className="text-[10px] text-cyber-text">Ethereum L1: 1000 × $0.12 ≈ $120/min. XRPL: $0.03/min.</p>
                </div>
              </div>
            </div>
          )}

          {section === 'openclaw' && (
            <>
              <div className="cyber-panel p-4 border-cyber-purple/30 bg-cyber-purple/5">
                <p className="text-xs text-cyber-text mb-3">OpenClaw: open-source AI agent. XRPL micropayments power the agent economy.</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded bg-cyber-darker"><p className="text-lg font-cyber text-cyber-green">3%</p><p className="text-[9px] text-cyber-muted">FEE</p></div>
                  <div className="p-2 rounded bg-cyber-darker"><p className="text-lg font-cyber text-cyber-cyan">134k+</p><p className="text-[9px] text-cyber-muted">STARS</p></div>
                  <div className="p-2 rounded bg-cyber-darker"><p className="text-lg font-cyber text-cyber-yellow">$0.00003</p><p className="text-[9px] text-cyber-muted">XRPL FEE</p></div>
                </div>
              </div>
              <OpenClawDashboard />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
