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
    <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-cyber text-cyber-text">Send</h1>
          <p className="text-cyber-muted text-sm mt-1">Payment channels: open once, send many. Fees ~$0.00003 per tx.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={openAgentEconomy} className="text-xs text-cyber-glow hover:underline">Receipts &amp; caps</button>
            <span className="text-cyber-muted">·</span>
            <button type="button" onClick={() => setAgentOpen(true)} className="text-xs text-cyber-purple hover:underline">Chat pay</button>
            <span className="text-cyber-muted">·</span>
            <Link to="/learn" className="text-xs text-cyber-cyan hover:underline">Learn</Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <PaymentChannelManager showCreateForm={true} />
          <div className="space-y-4">
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <h3 className="font-cyber text-cyber-purple mb-3 text-sm">Flow</h3>
              <div className="space-y-3">
                {[
                  { step: 1, action: 'Open channel', desc: '1 tx on XRPL (~$0.00003)' },
                  { step: 2, action: 'Send claims', desc: '100,000+ off-chain, free' },
                  { step: 3, action: 'Claim', desc: 'Receiver claims anytime (1 tx)' },
                  { step: 4, action: 'Close', desc: 'Settle remaining' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyber-purple/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-cyber-purple">{s.step}</span>
                    </div>
                    <div>
                      <p className="text-xs text-cyber-text">{s.action}</p>
                      <p className="text-[10px] text-cyber-muted">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <CostComparator targetAmount={0.001} showChart={false} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
