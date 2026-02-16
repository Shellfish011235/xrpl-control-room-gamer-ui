// Pay page — Send only. Chat, receipts, streams live in the Agent panel (FAB / nav).

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useAgentPanelStore } from '../store/agentPanelStore';
import { PaymentChannelManager } from '../components/micropayments/PaymentChannelManager';
import { CostComparator } from '../components/micropayments/CostComparator';

export default function MicropaymentsPage() {
  const setAgentOpen = useAgentPanelStore((s) => s.setOpen);
  const openAgentEconomy = () => setAgentOpen(true, 'economy');

  return (
    <div className="min-h-screen px-4 md:px-8 pt-24 md:pt-28 pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-cyber-purple/20 shrink-0">
              <Layers size={22} className="text-cyber-purple" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-cyber text-cyber-text">Send</h1>
              <p className="text-cyber-muted text-sm">Payment channels: open once, send many. Fees ~$0.00003 per tx.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <button type="button" onClick={openAgentEconomy} className="text-cyber-glow hover:underline">Receipts &amp; caps</button>
            <span className="text-cyber-muted">·</span>
            <button type="button" onClick={() => setAgentOpen(true)} className="text-cyber-purple hover:underline">Chat pay</button>
            <span className="text-cyber-muted">·</span>
            <Link to="/learn" className="text-cyber-cyan hover:underline">Learn</Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="min-w-0">
            <PaymentChannelManager showCreateForm={true} />
          </div>
          <div className="space-y-5">
            <div className="p-5 rounded-xl border border-cyber-border bg-cyber-darker/40">
              <h3 className="text-[10px] text-cyber-muted uppercase tracking-wider mb-4 font-cyber">Flow</h3>
              <div className="space-y-3">
                {[
                  { step: 1, action: 'Open channel', desc: '1 tx on XRPL (~$0.00003)' },
                  { step: 2, action: 'Send claims', desc: '100,000+ off-chain, free' },
                  { step: 3, action: 'Claim', desc: 'Receiver claims anytime (1 tx)' },
                  { step: 4, action: 'Close', desc: 'Settle remaining' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-cyber-purple/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-cyber text-cyber-purple">{s.step}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-cyber-text">{s.action}</p>
                      <p className="text-[10px] text-cyber-muted">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-xl border border-cyber-border bg-cyber-darker/40">
              <CostComparator targetAmount={0.001} showChart={false} />
            </div>
          </div>
        </motion.div>

        <p className="text-[10px] text-cyber-muted border-t border-cyber-border/50 pt-4 max-w-2xl">
          We do not transmit money or hold your funds. You sign in your own wallet. Not legal or financial advice. Use in compliance with applicable laws.
        </p>
      </div>
    </div>
  );
}
