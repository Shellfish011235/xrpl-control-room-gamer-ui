/**
 * GlobalAgentPanel — AI agent + secure payment + economy + streams in one drawer.
 * Tabs: Chat (quick send + SecureAgentPanel) | Economy (receipts, caps, requests) | Streams (OpenClaw, AI streams).
 */

import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, ChevronDown, ChevronUp, Loader, Receipt, Zap } from 'lucide-react';
import { useAgentPanelStore } from '../store/agentPanelStore';
import { useCARVStore } from '../store/carvStore';
import { AiSafetyQuickRef } from './AiSafetyQuickRef';

const SecureAgentPanel = lazy(() =>
  import('./carv/SecureAgentPanel').then((m) => ({ default: m.SecureAgentPanel }))
);
const AgentEconomyDrawerContent = lazy(() =>
  import('./AgentEconomyDrawerContent').then((m) => ({ default: m.AgentEconomyDrawerContent }))
);
const StreamsDrawerContent = lazy(() =>
  import('./StreamsDrawerContent').then((m) => ({ default: m.StreamsDrawerContent }))
);

const PANEL_TABS = [
  { id: 'chat' as const, label: 'Chat', icon: Bot },
  { id: 'economy' as const, label: 'Track', icon: Receipt },
  { id: 'streams' as const, label: 'Streams', icon: Zap },
] as const;

function QuickSendStrip() {
  const [show, setShow] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { createPIE, initialize, initialized } = useCARVStore();

  const handleSend = async () => {
    if (!recipient.trim() || !amount.trim()) {
      setResult({ ok: false, message: 'Enter recipient and amount' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      if (!initialized) await initialize();
      const res = await createPIE({
        payee: recipient.trim(),
        amount: parseFloat(amount) || 0,
        asset: 'XRP',
        task: note.trim() || 'Payment via agent',
      });
      if (res?.success) {
        setResult({ ok: true, message: 'Sent!' });
        setRecipient('');
        setAmount('');
        setNote('');
      } else {
        setResult({ ok: false, message: res?.error || 'Failed' });
      }
    } catch (e) {
      setResult({ ok: false, message: 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-cyber-border/60 bg-cyber-darker/80">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-4 py-2 text-left text-xs text-cyber-muted hover:text-cyber-text"
      >
        <span className="font-cyber text-cyber-cyan">Quick send</span>
        {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient address"
                className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-xs text-cyber-text placeholder:text-cyber-muted"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount (XRP)"
                  className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-xs text-cyber-text placeholder:text-cyber-muted"
                />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-xs text-cyber-text placeholder:text-cyber-muted"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={submitting || !recipient.trim() || !amount.trim()}
                  className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs disabled:opacity-50"
                >
                  {submitting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                  Send
                </button>
                {result && (
                  <span className={`text-[10px] ${result.ok ? 'text-cyber-green' : 'text-cyber-red'}`}>
                    {result.message}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GlobalAgentPanel() {
  const { open, setOpen, panelTab, setPanelTab } = useAgentPanelStore();

  return (
    <>
      {/* FAB — open agent from any page */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-cyber-cyan/90 text-cyber-darker shadow-lg hover:bg-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-glow"
        aria-label="Open payment agent drawer (AI safety reference included)"
      >
        <Bot size={24} />
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-lg bg-cyber-darker border-l border-cyber-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border shrink-0">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-cyber-cyan" />
                  <span className="font-cyber text-cyber-text">Payment agent</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <AiSafetyQuickRef />

              {/* Main tabs: Chat | Economy | Streams */}
              <div className="flex gap-1 px-2 pb-2 border-b border-cyber-border/60 shrink-0">
                {PANEL_TABS.map((t) => {
                  const Icon = t.icon;
                  const isActive = panelTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPanelTab(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-cyber transition-colors ${
                        isActive
                          ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50'
                          : 'text-cyber-muted hover:text-cyber-text border border-transparent'
                      }`}
                    >
                      <Icon size={16} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {panelTab === 'chat' && <QuickSendStrip />}

              <div className="flex-1 min-h-0 overflow-auto">
                {panelTab === 'chat' && (
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center p-8">
                        <Loader size={24} className="animate-spin text-cyber-cyan" />
                      </div>
                    }
                  >
                    <SecureAgentPanel />
                  </Suspense>
                )}
                {panelTab === 'economy' && (
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center p-8">
                        <Loader size={24} className="animate-spin text-cyber-cyan" />
                      </div>
                    }
                  >
                    <AgentEconomyDrawerContent />
                  </Suspense>
                )}
                {panelTab === 'streams' && (
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center p-8">
                        <Loader size={24} className="animate-spin text-cyber-cyan" />
                      </div>
                    }
                  >
                    <StreamsDrawerContent />
                  </Suspense>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default GlobalAgentPanel;
