// AgentPanel.tsx
// Shows the AI Agent in action - the "brain" of CARV

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Brain, Send, CheckCircle, XCircle, AlertTriangle,
  Loader, MessageSquare, Shield, Zap, Clock, ArrowRight,
  Settings, ToggleLeft, ToggleRight, Eye, Sparkles,
  ChevronDown, ChevronUp, Activity, Lock
} from 'lucide-react';

import { 
  getOrchestrator, 
  CARVOrchestrator,
  AgentPaymentResult,
  PRESET_REGIMES,
} from '../../services/carv';
import type { PaymentDecision, AgentThought } from '../../services/carv';

// ==================== TYPES ====================

interface AgentMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  data?: {
    decision?: PaymentDecision;
    result?: AgentPaymentResult;
  };
}

// ==================== MAIN COMPONENT ====================

export function AgentPanel() {
  const [orchestrator, setOrchestrator] = useState<CARVOrchestrator | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [regime, setRegime] = useState<keyof typeof PRESET_REGIMES>('conservative');
  const [requireLLM, setRequireLLM] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize orchestrator
  useEffect(() => {
    const orch = getOrchestrator({
      mode: 'test',
      regimePreset: 'conservative',
      llmProvider: 'mock',
      requireLLMApproval: true,
    });
    orch.initialize();
    setOrchestrator(orch);

    // Welcome message
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: '🤖 AI Payment Agent ready. Tell me what payment you want to make in plain English.',
      timestamp: new Date(),
    }]);

    return () => orch.shutdown();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update orchestrator settings
  useEffect(() => {
    if (orchestrator) {
      orchestrator.setMode(mode);
      orchestrator.setRegime(regime);
      orchestrator.setLLMRequired(requireLLM);
    }
  }, [orchestrator, mode, regime, requireLLM]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !orchestrator || isProcessing) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Add thinking message
      const thinkingId = `thinking-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: thinkingId,
        type: 'agent',
        content: '🤔 Analyzing your request...',
        timestamp: new Date(),
      }]);

      // Execute the payment request
      const result = await orchestrator.executeAgentPayment({
        task: userMessage.content,
      });

      // Remove thinking message and add result
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingId);
        return [...filtered, {
          id: `result-${Date.now()}`,
          type: 'agent',
          content: formatResult(result),
          timestamp: new Date(),
          data: { result },
        }];
      });
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatResult = (result: AgentPaymentResult): string => {
    if (result.success) {
      return `✅ **Payment Sent!**

**Details:**
- To: \`${result.pie?.payee}\`
- Amount: ${result.pie?.amount} ${result.pie?.asset}
- TX: \`${result.route?.tx_hash?.slice(0, 20)}...\`
- Venue: ${result.route?.venue}
- Time: ${result.timing.total}ms

${result.llmDecision ? `💭 ${result.llmDecision.reasoning}` : ''}`;
    }

    // For non-payment requests, show a helpful response
    if (result.failedAt === 'llm' && result.llmDecision) {
      const decision = result.llmDecision;
      
      // Check if it was a clarification request vs a rejection
      const isNeedingInfo = decision.reasoning.includes('need more') || 
                           decision.reasoning.includes('Missing:') ||
                           decision.reasoning.includes("didn't understand");
      
      if (isNeedingInfo) {
        return `🤔 **I need more details**

${decision.reasoning}

${decision.alternativeActions?.length ? `**Try this:**\n${decision.alternativeActions.map(a => `💡 ${a}`).join('\n')}` : ''}`;
      }

      // It was a question or non-payment
      return `💬 ${decision.reasoning}

${decision.alternativeActions?.length ? `**Suggestions:**\n${decision.alternativeActions.map(a => `→ ${a}`).join('\n')}` : ''}`;
    }

    // Other failures (regime, route, etc.)
    return `❌ **Payment Failed**

**Reason:** ${result.error}

${result.llmDecision?.warnings?.length ? `**Warnings:**\n${result.llmDecision.warnings.map(w => `⚠️ ${w}`).join('\n')}` : ''}

${result.llmDecision?.alternativeActions?.length ? `**What to do:**\n${result.llmDecision.alternativeActions.map(a => `→ ${a}`).join('\n')}` : ''}`;
  };

  return (
    <div className="flex flex-col h-full bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-cyber-dark">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${mode === 'test' ? 'bg-cyber-cyan/20' : 'bg-cyber-green/20'}`}>
            <Bot className={`w-5 h-5 ${mode === 'test' ? 'text-cyber-cyan' : 'text-cyber-green'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-sm text-cyber-text">AI PAYMENT AGENT</span>
              <span className={`px-2 py-0.5 rounded text-[9px] border ${
                mode === 'test'
                  ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
                  : 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
              }`}>
                {mode === 'test' ? '🎮 TEST' : '💰 LIVE'}
              </span>
            </div>
            <p className="text-[10px] text-cyber-muted">
              {regime.charAt(0).toUpperCase() + regime.slice(1)} regime • {requireLLM ? 'AI approval required' : 'Direct execution'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg border transition-colors ${
            showSettings
              ? 'bg-cyber-cyan/20 border-cyber-cyan/50 text-cyber-cyan'
              : 'border-cyber-border text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-cyber-border overflow-hidden"
          >
            <div className="p-4 bg-cyber-dark/50 space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyber-text">Mode</p>
                  <p className="text-[10px] text-cyber-muted">Test = no real money</p>
                </div>
                <button
                  onClick={() => setMode(mode === 'test' ? 'live' : 'test')}
                  className={`px-3 py-1.5 rounded border text-xs flex items-center gap-2 ${
                    mode === 'test'
                      ? 'border-cyber-yellow/50 text-cyber-yellow'
                      : 'border-cyber-green/50 text-cyber-green'
                  }`}
                >
                  {mode === 'test' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {mode === 'test' ? 'Test Mode' : 'Live Mode'}
                </button>
              </div>

              {/* Regime Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyber-text">Risk Regime</p>
                  <p className="text-[10px] text-cyber-muted">Controls limits & rules</p>
                </div>
                <select
                  value={regime}
                  onChange={(e) => setRegime(e.target.value as keyof typeof PRESET_REGIMES)}
                  className="px-3 py-1.5 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text"
                >
                  <option value="conservative">🛡️ Conservative</option>
                  <option value="moderate">⚖️ Moderate</option>
                  <option value="aggressive">🔥 Aggressive</option>
                </select>
              </div>

              {/* LLM Approval Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyber-text">AI Approval</p>
                  <p className="text-[10px] text-cyber-muted">Require AI to approve payments</p>
                </div>
                <button
                  onClick={() => setRequireLLM(!requireLLM)}
                  className={`px-3 py-1.5 rounded border text-xs flex items-center gap-2 ${
                    requireLLM
                      ? 'border-cyber-cyan/50 text-cyber-cyan'
                      : 'border-cyber-muted text-cyber-muted'
                  }`}
                >
                  {requireLLM ? <Brain size={14} /> : <Zap size={14} />}
                  {requireLLM ? 'Required' : 'Skip AI'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-cyber-border bg-cyber-dark">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Send 5 XRP to rABC123 for coffee..."
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-sm text-cyber-text placeholder:text-cyber-muted/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-4 py-3 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-cyber-muted mt-2 text-center">
          {mode === 'test' ? '🎮 Practice mode - no real money will be used' : '⚠️ Live mode - real payments!'}
        </p>
      </form>
    </div>
  );
}

// ==================== MESSAGE BUBBLE ====================

function MessageBubble({ message }: { message: AgentMessage }) {
  const [expanded, setExpanded] = useState(false);

  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const result = message.data?.result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        {/* Avatar */}
        {!isUser && !isSystem && (
          <div className="flex items-center gap-2 mb-1">
            <Bot size={14} className="text-cyber-cyan" />
            <span className="text-[10px] text-cyber-muted">AI Agent</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`p-3 rounded-lg ${
          isUser
            ? 'bg-cyber-cyan/20 border border-cyber-cyan/30'
            : isSystem
            ? 'bg-cyber-purple/10 border border-cyber-purple/20'
            : 'bg-cyber-darker border border-cyber-border'
        }`}>
          {/* Content */}
          <div className="text-sm text-cyber-text whitespace-pre-wrap">
            {message.content.split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>

          {/* Result Details */}
          {result && (
            <div className="mt-3 pt-3 border-t border-cyber-border/50">
              {/* Success/Fail Indicator */}
              <div className={`flex items-center gap-2 mb-2 ${
                result.success ? 'text-cyber-green' : 'text-cyber-red'
              }`}>
                {result.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span className="text-xs font-medium">
                  {result.success ? 'Transaction Complete' : `Failed at ${result.failedAt}`}
                </span>
              </div>

              {/* Timing */}
              <div className="flex items-center gap-4 text-[10px] text-cyber-muted mb-2">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {result.timing.total}ms total
                </span>
                {result.timing.llm && (
                  <span>LLM: {result.timing.llm}ms</span>
                )}
                {result.timing.route && (
                  <span>Route: {result.timing.route}ms</span>
                )}
              </div>

              {/* Expandable Details */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] text-cyber-cyan hover:text-cyber-text"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Hide details' : 'Show details'}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="p-2 rounded bg-cyber-dark/50 text-[10px] font-mono text-cyber-muted overflow-x-auto">
                      <pre>{JSON.stringify({
                        pie: result.pie ? {
                          id: result.pie.intent_id,
                          amount: result.pie.amount,
                          asset: result.pie.asset,
                          payee: result.pie.payee,
                          status: result.pie.status,
                        } : null,
                        route: result.route,
                        llm: result.llmDecision ? {
                          approved: result.llmDecision.approved,
                          confidence: result.llmDecision.confidence,
                        } : null,
                        regime: result.regimeValidation ? {
                          passed: result.regimeValidation.passed,
                          riskScore: result.regimeValidation.riskScore,
                        } : null,
                      }, null, 2)}</pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className={`text-[9px] text-cyber-muted mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  );
}

// ==================== MINI AGENT (for embedding) ====================

export function MiniAgent({ onPaymentComplete }: { onPaymentComplete?: (result: AgentPaymentResult) => void }) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AgentPaymentResult | null>(null);

  const handleQuickPayment = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const orchestrator = getOrchestrator();
      await orchestrator.initialize();
      
      const result = await orchestrator.executeAgentPayment({ task: input });
      setLastResult(result);
      onPaymentComplete?.(result);
      
      if (result.success) {
        setInput('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-cyber-darker border border-cyber-border">
      <div className="flex items-center gap-2 mb-3">
        <Bot size={16} className="text-cyber-cyan" />
        <span className="text-xs font-cyber text-cyber-cyan">AI PAYMENT</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send 5 XRP to rABC..."
          className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-xs text-cyber-text"
          onKeyDown={(e) => e.key === 'Enter' && handleQuickPayment()}
        />
        <button
          onClick={handleQuickPayment}
          disabled={isProcessing || !input.trim()}
          className="px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs disabled:opacity-50"
        >
          {isProcessing ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>

      {lastResult && (
        <div className={`mt-2 p-2 rounded text-[10px] ${
          lastResult.success
            ? 'bg-cyber-green/10 text-cyber-green'
            : 'bg-cyber-red/10 text-cyber-red'
        }`}>
          {lastResult.success
            ? `✅ Sent ${lastResult.pie?.amount} ${lastResult.pie?.asset}`
            : `❌ ${lastResult.error}`
          }
        </div>
      )}
    </div>
  );
}

export default AgentPanel;
