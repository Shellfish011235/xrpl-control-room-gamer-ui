// CARV Page - Verifiable AI Payment Rail Co-Processor
// Full control panel for the CARV system

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Shield, AlertTriangle, Settings, RefreshCw,
  Activity, Zap, FileText, Route, Database,
  ToggleLeft, ToggleRight, Play, Pause, Download,
  Book, ExternalLink, Info, HelpCircle, ChevronRight, ChevronDown,
  GraduationCap, Lightbulb, Target, CheckCircle2, X
} from 'lucide-react';

import { CARVDashboard, PIEViewer, EventLog, VenuePanel, TaxLedger } from '../components/carv';
import { useCARVStore } from '../store/carvStore';

// ==================== GUIDE SECTION ====================

interface GuideStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  tips?: string[];
}

const CARV_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'what-is-carv',
    title: 'What is CARV?',
    icon: <Cpu size={16} className="text-cyber-cyan" />,
    content: 'CARV (Compute → Attest → Route → Validate) is a co-processor that creates cryptographically signed Payment Intent Envelopes (PIEs) for AI-assisted payments. It provides an auditable trail of every transaction decision.',
    tips: [
      'PIEs contain: amount, payee, purpose, regime context hash, and cryptographic signatures',
      'Each transaction is validated against safety rules before execution',
      'All transactions are recorded in an accounting ledger for tax reporting'
    ]
  },
  {
    id: 'test-mode',
    title: 'Test Mode vs Live Mode',
    icon: <ToggleLeft size={16} className="text-cyber-yellow" />,
    content: 'ALWAYS start in Test Mode! Test Mode simulates all transactions without using real funds. This lets you learn how the system works safely.',
    tips: [
      'Test Mode: Yellow badge - all transactions are simulated',
      'Live Mode: Green badge - REAL funds will be used (dangerous!)',
      'Never switch to Live Mode until you fully understand the system'
    ]
  },
  {
    id: 'flow',
    title: 'The CARV Flow',
    icon: <Route size={16} className="text-cyber-purple" />,
    content: 'Every payment goes through 5 stages: Compute (generate PIE) → Validate (safety checks) → Attest (sign & batch) → Route (execute via venue) → Account (record for taxes).',
    tips: [
      'Compute: Creates the Payment Intent Envelope from your request',
      'Validate: Checks against daily limits, max amount, self-loop prevention',
      'Attest: Signs PIE and batches into a Merkle tree for verification',
      'Route: Sends to the appropriate venue (XRPL, ILP, Simulation)',
      'Account: Records in FIFO accounting ledger with cost basis'
    ]
  },
  {
    id: 'safety',
    title: 'Safety Features',
    icon: <Shield size={16} className="text-cyber-green" />,
    content: 'CARV has multiple safety layers to protect you. These include daily volume caps, per-transaction limits, self-loop prevention, and regime anchoring.',
    tips: [
      'Daily Volume Cap: Maximum total you can transact per day',
      'Max Single Amount: Limits any single transaction size',
      'Self-Loop Block: Prevents sending to yourself in live mode',
      'Rejection Streak Alert: Warns if too many transactions fail'
    ]
  },
  {
    id: 'regime',
    title: 'Regime Context (Salience Anchor)',
    icon: <Target size={16} className="text-cyber-orange" />,
    content: 'The Regime Context anchors your trading strategy to a specific mindset. It creates a hash that\'s embedded in every PIE, ensuring consistency.',
    tips: [
      'Default: "Conservative, low-risk trading for learning purposes"',
      'You can customize this to match your trading philosophy',
      'The hash ensures PIEs are tied to your intended strategy'
    ]
  },
  {
    id: 'tax',
    title: 'Tax Accounting',
    icon: <FileText size={16} className="text-cyber-red" />,
    content: 'CARV automatically tracks cost basis using FIFO (First In, First Out) accounting. You can export Form 8949-ready CSV files for tax reporting.',
    tips: [
      'Every transaction records acquisition date, cost basis, and FMV',
      'Export Tax button generates IRS-compatible CSV',
      'Consult a tax professional for proper filing guidance',
      'This is NOT tax advice - always verify with a professional'
    ]
  }
];

function CARVGuide({ onClose }: { onClose: () => void }) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['what-is-carv']));

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="cyber-panel p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan">CARV USER GUIDE</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-cyber-glow/10 rounded text-cyber-muted hover:text-cyber-text"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Start Banner */}
      <div className="mb-4 p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
        <div className="flex items-start gap-3">
          <Lightbulb size={18} className="text-cyber-cyan shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-cyber-cyan font-medium">Quick Start</p>
            <p className="text-xs text-cyber-muted mt-1">
              1. Make sure <span className="text-cyber-yellow">TEST MODE</span> is enabled (yellow badge)<br />
              2. Click <span className="text-cyber-text">+ Quick Trade</span> to create your first PIE<br />
              3. Watch the Event Log to see the CARV flow in action<br />
              4. Check the Tax Ledger to see how transactions are recorded
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Guide Steps */}
      <div className="space-y-2">
        {CARV_GUIDE_STEPS.map((step) => (
          <div
            key={step.id}
            className="rounded border border-cyber-border/50 overflow-hidden"
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-cyber-glow/5 transition-colors text-left"
            >
              {step.icon}
              <span className="text-sm text-cyber-text flex-1">{step.title}</span>
              {expandedSteps.has(step.id) ? (
                <ChevronDown size={14} className="text-cyber-muted" />
              ) : (
                <ChevronRight size={14} className="text-cyber-muted" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSteps.has(step.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-cyber-border/30"
                >
                  <div className="p-3 bg-cyber-darker/30">
                    <p className="text-xs text-cyber-muted mb-2">{step.content}</p>
                    {step.tips && (
                      <div className="space-y-1">
                        {step.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px]">
                            <CheckCircle2 size={10} className="text-cyber-green shrink-0 mt-0.5" />
                            <span className="text-cyber-muted">{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Warning Footer */}
      <div className="mt-4 pt-3 border-t border-cyber-border">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-cyber-red shrink-0 mt-0.5" />
          <p className="text-[10px] text-cyber-muted">
            <span className="text-cyber-red font-medium">IMPORTANT:</span> This is experimental software. 
            Always use TEST MODE when learning. Never use funds you can't afford to lose. 
            This is NOT financial advice. Consult professionals before any real transactions.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function CARVPage() {
  const [showDocs, setShowDocs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const {
    initialized,
    testMode,
    walletAddress,
    regimeSummary,
    dailyVolumeCap,
    maxSingleAmount,
    currentDailyVolume,
    pendingPIEs,
    recentPIEs,
    batches,
    ledgerEntries,
    taxLots,
    venues,
    events,
    stats,
    initialize,
    setTestMode,
    setRegimeSummary,
    setDailyVolumeCap,
    setMaxSingleAmount,
    setWalletAddress,
    createPIE,
    forceBatch,
    generateTaxReport,
    downloadTaxCSV,
    clearEvents,
    reset,
  } = useCARVStore();

  // Initialize on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              testMode ? 'bg-cyber-yellow/20' : 'bg-cyber-green/20'
            }`}>
              <Cpu className={`w-6 h-6 ${testMode ? 'text-cyber-yellow' : 'text-cyber-green'}`} />
            </div>
            <div>
              <h1 className="font-cyber text-xl text-cyber-text flex items-center gap-2">
                CARV CO-PROCESSOR
                <span className={`px-2 py-0.5 rounded text-xs border ${
                  testMode 
                    ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30' 
                    : 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                }`}>
                  {testMode ? 'TEST MODE' : 'LIVE'}
                </span>
              </h1>
              <p className="text-xs text-cyber-muted">
                Verifiable AI Payment Rail • Compute → Validate → Attest → Route → Account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Help/Guide Button */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`px-3 py-1.5 rounded border text-xs flex items-center gap-1 ${
                showGuide
                  ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10'
                  : 'border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/30'
              }`}
            >
              <HelpCircle size={14} />
              How to Use
            </button>
            <button
              onClick={() => setShowDocs(!showDocs)}
              className="px-3 py-1.5 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs flex items-center gap-1"
            >
              <Book size={14} />
              Docs
            </button>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`px-3 py-1.5 rounded border text-xs flex items-center gap-2 ${
                testMode 
                  ? 'border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/10' 
                  : 'border-cyber-green/50 text-cyber-green hover:bg-cyber-green/10'
              }`}
            >
              {testMode ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
              {testMode ? 'Test Mode' : 'Live Mode'}
            </button>
          </div>
        </div>

        {/* Warning Banner for Live Mode */}
        {!testMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 rounded bg-cyber-red/10 border border-cyber-red/30 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-cyber-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-cyber-red font-medium">LIVE MODE - Real Funds at Risk</p>
              <p className="text-xs text-cyber-muted mt-1">
                Transactions will use real funds. Ensure you understand the risks. 
                This is experimental software - NOT financial advice. 
                Use dedicated wallet with amounts you can afford to lose.
              </p>
            </div>
          </motion.div>
        )}

        {/* First Time User Banner - Only show when guide is closed */}
        {!showGuide && !showDocs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <GraduationCap size={18} className="text-cyber-cyan" />
              <p className="text-xs text-cyber-muted">
                <span className="text-cyber-cyan font-medium">New to CARV?</span> Learn how this AI payment co-processor works before making any transactions.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(true)}
              className="px-3 py-1 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs hover:bg-cyber-cyan/30 flex items-center gap-1"
            >
              <HelpCircle size={12} />
              Show Guide
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* User Guide Section */}
      <AnimatePresence>
        {showGuide && <CARVGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>

      {/* Documentation Panel */}
      {showDocs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 cyber-panel p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-cyber text-sm text-cyber-cyan">CARV DOCUMENTATION</span>
            <button onClick={() => setShowDocs(false)} className="text-cyber-muted hover:text-cyber-text">✕</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <p className="text-cyber-cyan font-cyber mb-1">WHAT IS CARV?</p>
                <p className="text-cyber-muted">
                  CARV (Compute-Attest-Route-Validate) is a co-processor that wraps LLM outputs 
                  in signed Payment Intent Envelopes (PIEs). Each PIE contains cryptographic proofs, 
                  regime context hashes, and routing constraints.
                </p>
              </div>
              
              <div>
                <p className="text-cyber-cyan font-cyber mb-1">FLOW</p>
                <ol className="text-cyber-muted space-y-1 list-decimal list-inside">
                  <li><span className="text-cyber-text">Compute:</span> Generate PIE from task/prompt</li>
                  <li><span className="text-cyber-text">Validate:</span> Single + aggregate safety checks</li>
                  <li><span className="text-cyber-text">Attest:</span> Sign & batch into Merkle tree</li>
                  <li><span className="text-cyber-text">Route:</span> Execute via venue (XRPL, ILP, etc.)</li>
                  <li><span className="text-cyber-text">Account:</span> Record in tax ledger (FIFO basis)</li>
                </ol>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-cyber-cyan font-cyber mb-1">SAFETY FEATURES</p>
                <ul className="text-cyber-muted space-y-1">
                  <li>• <span className="text-cyber-green">TEST_MODE:</span> Simulates all transactions</li>
                  <li>• <span className="text-cyber-yellow">Daily Volume Cap:</span> Limits total daily exposure</li>
                  <li>• <span className="text-cyber-yellow">Max Single Amount:</span> Per-transaction limit</li>
                  <li>• <span className="text-cyber-red">Self-Loop Block:</span> Prevents payer=payee in live</li>
                  <li>• <span className="text-cyber-purple">Regime Anchoring:</span> LLM context salience</li>
                  <li>• <span className="text-cyber-orange">Rejection Streak Alert:</span> Escalation on failures</li>
                </ul>
              </div>
              
              <div>
                <p className="text-cyber-red font-cyber mb-1">DISCLAIMER</p>
                <p className="text-cyber-muted text-[10px]">
                  This is experimental software for personal, non-commercial use only. 
                  NOT financial/investment/legal advice. High risk of fund loss. 
                  Consult professionals before use. Report gains/losses for tax purposes.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Main Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-8"
        >
          <CARVDashboard />
        </motion.div>

        {/* Right Column - Config & Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 space-y-4"
        >
          {/* Configuration Panel */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
              <Settings size={16} className="text-cyber-cyan" />
              <span className="font-cyber text-sm text-cyber-cyan">CONFIGURATION</span>
            </div>

            <div className="space-y-4">
              {/* Wallet Address */}
              <div>
                <label className="text-[10px] text-cyber-muted">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text font-mono"
                />
              </div>

              {/* Volume Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-cyber-muted">Daily Cap</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dailyVolumeCap}
                    onChange={(e) => setDailyVolumeCap(parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted">Max Single</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxSingleAmount}
                    onChange={(e) => setMaxSingleAmount(parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearEvents}
                  className="flex-1 px-2 py-1.5 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs"
                >
                  Clear Events
                </button>
                <button
                  onClick={reset}
                  className="flex-1 px-2 py-1.5 rounded border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 text-xs"
                >
                  Reset System
                </button>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
              <Activity size={16} className="text-cyber-purple" />
              <span className="font-cyber text-sm text-cyber-purple">SYSTEM STATS</span>
            </div>

            <div className="space-y-3">
              <StatRow label="Initialized" value={initialized ? 'Yes' : 'No'} color={initialized ? 'green' : 'red'} />
              <StatRow label="Mode" value={testMode ? 'TEST' : 'LIVE'} color={testMode ? 'yellow' : 'green'} />
              <StatRow label="Pending PIEs" value={pendingPIEs.length} />
              <StatRow label="Total Batches" value={batches.length} />
              <StatRow label="Ledger Entries" value={ledgerEntries.length} />
              <StatRow label="Open Tax Lots" value={taxLots.filter(l => l.quantity > l.disposed_quantity).length} />
              <StatRow label="Active Venues" value={venues.filter(v => v.enabled).length} />
              <StatRow label="Event Count" value={events.length} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
              <Zap size={16} className="text-cyber-orange" />
              <span className="font-cyber text-sm text-cyber-orange">QUICK ACTIONS</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={forceBatch}
                disabled={pendingPIEs.length === 0}
                className="px-3 py-2 rounded bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple text-xs hover:bg-cyber-purple/30 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Database size={12} />
                Force Batch
              </button>
              <button
                onClick={() => downloadTaxCSV(
                  new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                  new Date().toISOString().split('T')[0]
                )}
                className="px-3 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30 flex items-center justify-center gap-1"
              >
                <Download size={12} />
                Export Tax
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section - Full Width Event Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 cyber-panel p-4"
      >
        <EventLog events={events} maxDisplay={20} />
      </motion.div>

      {/* Footer Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 p-3 rounded bg-cyber-darker/30 border border-cyber-border/50"
      >
        <div className="flex items-start gap-2">
          <Info size={14} className="text-cyber-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-cyber-muted">
            <span className="text-cyber-yellow">Legal Disclaimer:</span> This is an experimental prototype 
            for personal, non-commercial use only with your own funds. NOT financial/investment/legal advice, 
            licensed service, or suitable for third-party funds. HIGH RISK — possible total loss of funds. 
            Consult attorney & tax professional. Report gains/losses to IRS. 
            <span className="text-cyber-cyan ml-1">Florida, USA jurisdiction.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Helper Component
function StatRow({ 
  label, 
  value, 
  color = 'text' 
}: { 
  label: string; 
  value: string | number; 
  color?: 'text' | 'green' | 'red' | 'yellow' | 'cyan' | 'purple';
}) {
  const colorClass = {
    text: 'text-cyber-text',
    green: 'text-cyber-green',
    red: 'text-cyber-red',
    yellow: 'text-cyber-yellow',
    cyan: 'text-cyber-cyan',
    purple: 'text-cyber-purple',
  }[color];

  return (
    <div className="flex justify-between text-xs">
      <span className="text-cyber-muted">{label}</span>
      <span className={colorClass}>{value}</span>
    </div>
  );
}
