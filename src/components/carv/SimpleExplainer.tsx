// SimpleExplainer.tsx
// Grandma-friendly explanations for CARV concepts

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Shield, DollarSign, FileText, Send,
  CheckCircle, AlertTriangle, Clock, Wallet, TrendingUp,
  Eye, EyeOff, ChevronDown, ChevronUp, Lightbulb,
  CreditCard, Receipt, Lock, Unlock, Calculator
} from 'lucide-react';

// ==================== PLAIN ENGLISH DEFINITIONS ====================

export const SIMPLE_TERMS: Record<string, { simple: string; emoji: string; example?: string }> = {
  // Core Concepts
  'CARV': {
    simple: 'A safety system that checks and records every payment you make',
    emoji: '🛡️',
    example: 'Like a careful accountant who double-checks everything before sending money'
  },
  'PIE': {
    simple: 'A payment request - contains who gets paid, how much, and why',
    emoji: '📝',
    example: 'Like writing a check with extra details about what it\'s for'
  },
  'Payment Intent Envelope': {
    simple: 'Same as PIE - just a fancy name for a payment request',
    emoji: '✉️',
  },
  
  // Modes
  'Test Mode': {
    simple: 'Practice mode - NO real money moves. Safe to experiment!',
    emoji: '🎮',
    example: 'Like playing a video game with fake money'
  },
  'Live Mode': {
    simple: 'REAL money mode - actual payments will happen. Be careful!',
    emoji: '💰',
    example: 'Like using your real debit card'
  },
  
  // Flow Steps
  'Compute': {
    simple: 'Step 1: Create the payment request with all the details',
    emoji: '📋',
  },
  'Validate': {
    simple: 'Step 2: Check if this payment is safe and within your limits',
    emoji: '✅',
  },
  'Attest': {
    simple: 'Step 3: Digitally sign the payment to prove it\'s really from you',
    emoji: '🔐',
  },
  'Route': {
    simple: 'Step 4: Send the payment through the best available path',
    emoji: '🚀',
  },
  'Account': {
    simple: 'Step 5: Record the payment for your financial records and taxes',
    emoji: '📊',
  },
  
  // Safety Features
  'Daily Volume Cap': {
    simple: 'Maximum total amount you can send in one day',
    emoji: '📅',
    example: 'Like a daily spending limit on your debit card'
  },
  'Max Single Amount': {
    simple: 'Maximum amount for any single payment',
    emoji: '1️⃣',
    example: 'Like a per-transaction limit at an ATM'
  },
  'Self-Loop Block': {
    simple: 'Prevents you from accidentally sending money to yourself',
    emoji: '🚫',
  },
  
  // Technical (hidden in simple mode)
  'Merkle Tree': {
    simple: 'A way to bundle and verify multiple payments together',
    emoji: '🌳',
    example: 'Like putting multiple receipts in an envelope and sealing it'
  },
  'Regime Summary': {
    simple: 'Your personal rules for how you want to trade (conservative, aggressive, etc.)',
    emoji: '📜',
    example: 'Like setting "I only want to make safe investments"'
  },
  'FIFO': {
    simple: 'First In, First Out - the oldest purchase gets counted first when you sell',
    emoji: '📦',
    example: 'Like eating the oldest groceries first'
  },
  'Cost Basis': {
    simple: 'What you originally paid for something (used for taxes)',
    emoji: '🧾',
  },
  'Venue': {
    simple: 'Where the payment goes through (like choosing which bank to use)',
    emoji: '🏦',
  },
};

// ==================== TOOLTIP COMPONENT ====================

interface TooltipProps {
  term: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function SimpleTooltip({ term, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const info = SIMPLE_TERMS[term];
  
  if (!info) return <>{children}</>;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span 
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <HelpCircle size={12} className="text-cyber-muted hover:text-cyber-cyan" />
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-50 ${positionClasses[position]} w-64 p-3 rounded-lg bg-cyber-dark border border-cyber-cyan/30 shadow-xl`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{info.emoji}</span>
              <div>
                <p className="text-xs text-cyber-text font-medium mb-1">{term}</p>
                <p className="text-[11px] text-cyber-muted leading-relaxed">{info.simple}</p>
                {info.example && (
                  <p className="text-[10px] text-cyber-cyan/70 mt-2 italic">
                    💡 {info.example}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ==================== WHAT IS THIS? PANEL ====================

interface WhatIsThisProps {
  title: string;
  children: React.ReactNode;
}

export function WhatIsThis({ title, children }: WhatIsThisProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-cyber-cyan/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-cyber-cyan" />
          <span className="text-xs text-cyber-cyan">What is {title}?</span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-cyber-cyan" />
        ) : (
          <ChevronDown size={14} className="text-cyber-cyan" />
        )}
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-cyber-cyan/20"
          >
            <div className="p-3 text-xs text-cyber-muted leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== SIMPLE MODE WELCOME ====================

export function SimpleWelcome({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cyber-panel p-6 mb-6 bg-gradient-to-br from-cyber-cyan/10 to-cyber-purple/10"
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🛡️</div>
        <h2 className="font-cyber text-xl text-cyber-text mb-2">Welcome to Your Payment Safety System</h2>
        <p className="text-sm text-cyber-muted max-w-lg mx-auto">
          This tool helps you send payments safely by checking every transaction 
          before it happens and keeping records for your taxes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SimpleFeatureCard
          emoji="🎮"
          title="Practice First"
          description="You're in TEST MODE - no real money moves. Try things out safely!"
          color="yellow"
        />
        <SimpleFeatureCard
          emoji="✅"
          title="Safety Checks"
          description="Every payment is checked against your limits before sending"
          color="green"
        />
        <SimpleFeatureCard
          emoji="📊"
          title="Tax Records"
          description="All transactions are recorded so tax time is easy"
          color="cyan"
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onDismiss}
          className="px-6 py-2 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-colors"
        >
          Got it, let's start!
        </button>
      </div>
    </motion.div>
  );
}

function SimpleFeatureCard({ 
  emoji, 
  title, 
  description, 
  color 
}: { 
  emoji: string; 
  title: string; 
  description: string; 
  color: 'yellow' | 'green' | 'cyan' | 'purple';
}) {
  const colorClasses = {
    yellow: 'border-cyber-yellow/30 bg-cyber-yellow/5',
    green: 'border-cyber-green/30 bg-cyber-green/5',
    cyan: 'border-cyber-cyan/30 bg-cyber-cyan/5',
    purple: 'border-cyber-purple/30 bg-cyber-purple/5',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-2xl mb-2">{emoji}</div>
      <h3 className="text-sm font-medium text-cyber-text mb-1">{title}</h3>
      <p className="text-xs text-cyber-muted">{description}</p>
    </div>
  );
}

// ==================== SIMPLE FLOW EXPLANATION ====================

export function SimpleFlowExplainer() {
  const steps = [
    { emoji: '📝', name: 'Create', desc: 'You fill in who to pay and how much' },
    { emoji: '✅', name: 'Check', desc: 'System makes sure it\'s within your limits' },
    { emoji: '🔐', name: 'Sign', desc: 'Payment is secured with your digital signature' },
    { emoji: '🚀', name: 'Send', desc: 'Payment goes through the best route' },
    { emoji: '📊', name: 'Record', desc: 'Transaction saved for your records' },
  ];

  return (
    <div className="flex items-center justify-between py-4 px-2">
      {steps.map((step, i) => (
        <React.Fragment key={step.name}>
          <div className="text-center">
            <div className="text-2xl mb-1">{step.emoji}</div>
            <p className="text-xs font-medium text-cyber-text">{step.name}</p>
            <p className="text-[10px] text-cyber-muted">{step.desc}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-cyber-cyan/30 mx-2 relative top-[-12px]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ==================== SIMPLE QUICK ACTIONS ====================

interface SimpleQuickActionsProps {
  onSendPayment: () => void;
  onViewHistory: () => void;
  onExportTaxes: () => void;
  testMode: boolean;
}

export function SimpleQuickActions({ 
  onSendPayment, 
  onViewHistory, 
  onExportTaxes,
  testMode 
}: SimpleQuickActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <SimpleActionButton
        emoji="💸"
        label="Send Payment"
        sublabel={testMode ? "(Practice Mode)" : "(Real Money!)"}
        onClick={onSendPayment}
        color={testMode ? 'cyan' : 'red'}
      />
      <SimpleActionButton
        emoji="📜"
        label="View History"
        sublabel="See all transactions"
        onClick={onViewHistory}
        color="purple"
      />
      <SimpleActionButton
        emoji="📊"
        label="Export for Taxes"
        sublabel="Download CSV file"
        onClick={onExportTaxes}
        color="green"
      />
    </div>
  );
}

function SimpleActionButton({
  emoji,
  label,
  sublabel,
  onClick,
  color,
}: {
  emoji: string;
  label: string;
  sublabel: string;
  onClick: () => void;
  color: 'cyan' | 'purple' | 'green' | 'red';
}) {
  const colorClasses = {
    cyan: 'border-cyber-cyan/50 hover:bg-cyber-cyan/20 text-cyber-cyan',
    purple: 'border-cyber-purple/50 hover:bg-cyber-purple/20 text-cyber-purple',
    green: 'border-cyber-green/50 hover:bg-cyber-green/20 text-cyber-green',
    red: 'border-cyber-red/50 hover:bg-cyber-red/20 text-cyber-red',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border bg-cyber-darker/50 ${colorClasses[color]} transition-colors text-center`}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[10px] text-cyber-muted">{sublabel}</p>
    </button>
  );
}

// ==================== STATUS EXPLAINERS ====================

export function SimpleStatusBadge({ status }: { status: string }) {
  const statusInfo: Record<string, { emoji: string; label: string; color: string }> = {
    'pending': { emoji: '⏳', label: 'Waiting...', color: 'text-cyber-yellow' },
    'validated': { emoji: '✅', label: 'Approved', color: 'text-cyber-green' },
    'attested': { emoji: '🔐', label: 'Signed', color: 'text-cyber-cyan' },
    'routing': { emoji: '🚀', label: 'Sending...', color: 'text-cyber-purple' },
    'settled': { emoji: '✨', label: 'Complete!', color: 'text-cyber-green' },
    'failed': { emoji: '❌', label: 'Failed', color: 'text-cyber-red' },
    'rejected': { emoji: '🚫', label: 'Rejected', color: 'text-cyber-red' },
    'expired': { emoji: '⏰', label: 'Expired', color: 'text-cyber-muted' },
  };

  const info = statusInfo[status] || { emoji: '❓', label: status, color: 'text-cyber-muted' };

  return (
    <span className={`inline-flex items-center gap-1 ${info.color}`}>
      <span>{info.emoji}</span>
      <span className="text-xs">{info.label}</span>
    </span>
  );
}

// ==================== SAFETY INDICATOR ====================

export function SafetyIndicator({ 
  dailyUsed, 
  dailyLimit,
  testMode 
}: { 
  dailyUsed: number; 
  dailyLimit: number;
  testMode: boolean;
}) {
  const percentUsed = (dailyUsed / dailyLimit) * 100;
  const remaining = dailyLimit - dailyUsed;
  
  let status: 'safe' | 'caution' | 'danger';
  if (percentUsed < 50) status = 'safe';
  else if (percentUsed < 80) status = 'caution';
  else status = 'danger';

  const statusConfig = {
    safe: { emoji: '✅', color: 'text-cyber-green', bg: 'bg-cyber-green', label: 'Safe to trade' },
    caution: { emoji: '⚠️', color: 'text-cyber-yellow', bg: 'bg-cyber-yellow', label: 'Getting close to limit' },
    danger: { emoji: '🛑', color: 'text-cyber-red', bg: 'bg-cyber-red', label: 'Near daily limit!' },
  };

  const config = statusConfig[status];

  return (
    <div className="p-4 rounded-lg bg-cyber-darker/50 border border-cyber-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.emoji}</span>
          <div>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
            <p className="text-[10px] text-cyber-muted">
              {testMode ? '(Practice mode - no real money)' : '⚠️ Real money mode!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-cyber-text">{remaining.toFixed(2)} XRP</p>
          <p className="text-[10px] text-cyber-muted">left today</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-cyber-darker overflow-hidden">
        <div 
          className={`h-full ${config.bg} transition-all`}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-cyber-muted">
        <span>Used: {dailyUsed.toFixed(2)}</span>
        <span>Limit: {dailyLimit.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default {
  SIMPLE_TERMS,
  SimpleTooltip,
  WhatIsThis,
  SimpleWelcome,
  SimpleFlowExplainer,
  SimpleQuickActions,
  SimpleStatusBadge,
  SafetyIndicator,
};
