/**
 * Track tab: receipts, limits, pending approvals. Frames the agent as a tool to stay in control and keep records.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AgentsTab,
  RequestsTab,
  CapsTab,
  ReceiptsTab,
  agentEconomyTabs,
  type AgentEconomyTabId,
} from '../pages/AgentEconomy';
import { AgentRuntimeStatus } from './agents/AgentRuntimeStatus';

export function AgentEconomyDrawerContent() {
  const [tab, setTab] = useState<AgentEconomyTabId>('receipts');

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 shrink-0">
        <AgentRuntimeStatus />
      </div>
      <p className="text-[11px] text-cyber-muted px-3 pt-1 pb-1 shrink-0">
        Stay in control: receipts for taxes, spend limits so you don’t overspend, and optional paid tools when they help you.
      </p>
      <div className="flex gap-1 p-2 border-b border-cyber-border/60 shrink-0 overflow-x-auto">
        {agentEconomyTabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-cyber whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50'
                  : 'text-cyber-muted hover:text-cyber-text border border-transparent'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <AnimatePresence mode="wait">
          {tab === 'agents' && (
            <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AgentsTab />
            </motion.div>
          )}
          {tab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RequestsTab />
            </motion.div>
          )}
          {tab === 'caps' && (
            <motion.div key="caps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CapsTab />
            </motion.div>
          )}
          {tab === 'receipts' && (
            <motion.div key="receipts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReceiptsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AgentEconomyDrawerContent;
