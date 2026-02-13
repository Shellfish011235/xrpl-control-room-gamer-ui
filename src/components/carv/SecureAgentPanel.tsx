// SecureAgentPanel.tsx
// AI Payment Agent with Xaman wallet integration and full security
// Two-step confirmation: Agent shows plan → User confirms → Sign in Xaman

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, CheckCircle, XCircle, AlertTriangle,
  Loader, Shield, Zap, Clock, ArrowRight, ArrowDown,
  Settings, Eye, Sparkles, Wallet, RefreshCw,
  ChevronDown, ChevronUp, Lock, Unlock, History,
  QrCode, Smartphone, DollarSign, TrendingUp, Copy
} from 'lucide-react';

import { securePaymentAgent, PaymentPlan, AuditLogEntry, SecurityConfig } from '../../services/securePaymentAgent';
import { xamanService } from '../../services/xaman';
import { getXamanMode, initializeXaman } from '../../config/xaman';
import { useWalletStore } from '../../store/walletStore';
import { usePlatformModeStore } from '../../store/platformModeStore';
import { getTransaction, waitForTransaction, TransactionResult } from '../../services/xrplService';

// ==================== TYPES ====================

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system' | 'plan';
  content: string;
  timestamp: Date;
  plan?: PaymentPlan;
}

// ==================== MAIN COMPONENT ====================

export function SecureAgentPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showXamanSetup, setShowXamanSetup] = useState(false);
  const [config, setConfig] = useState<SecurityConfig>(securePaymentAgent.getConfig());
  const [walletConnected, setWalletConnected] = useState(false);
  const [activePlan, setActivePlan] = useState<PaymentPlan | null>(null);
  const [xamanMode, setXamanMode] = useState(getXamanMode());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const platformLive = usePlatformModeStore((s) => s.mode === 'live');
  const setPlatformMode = usePlatformModeStore((s) => s.setMode);
  const { wallets, activeWalletId } = useWalletStore();
  const activeWallet = wallets.find(w => w.id === activeWalletId);

  // Initialize — richer welcome (chatbot-style)
  useEffect(() => {
    const modeMessage = xamanMode === 'production'
      ? '🔐 **Real signing is on** — I’ll send transactions to your Xaman app to sign. Use the **Live** toggle at the top to send real payments.'
      : platformLive
        ? '📡 **Platform is Live** — add your Xaman API key below (Connect Xaman) to sign real payments.'
        : 'Switch to **Live** (toggle at top of page) and add your Xaman API key below to send real payments. In Demo, I’ll simulate everything.';

    setMessages([
      {
        id: 'welcome-1',
        type: 'agent',
        content: `Hi — I’m your **Secure Payment Agent**. I can send XRP or convert and pay in USD/EUR to any XRPL address. You tell me in plain English; I build the payment and you approve it in Xaman.`,
        timestamp: new Date(),
      },
      {
        id: 'welcome-2',
        type: 'system',
        content: `${modeMessage}\n\n**Connect your wallet** above to start, then say something like:\n\n• "Send 10 XRP to rABC..."\n• "Pay $50 to rXYZ..."\n• "How does this work?"`,
        timestamp: new Date(),
      },
    ]);
  }, [xamanMode, platformLive]);

  // Auto-connect wallet if available
  useEffect(() => {
    if (activeWallet && !walletConnected && activeWallet.provider !== 'demo') {
      connectWallet();
    }
  }, [activeWallet]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect wallet
  const connectWallet = async () => {
    if (!activeWallet) {
      addMessage('system', '⚠️ No wallet selected. Add a wallet first.');
      return;
    }

    try {
      await securePaymentAgent.connectWallet(activeWallet.address);
      setWalletConnected(true);
      addMessage('agent', `✅ **Connected** to ${activeWallet.label}.\n\nYour balance: **${activeWallet.balance?.toFixed(2) ?? '?'} XRP**`);
      addMessage('agent', `What would you like to do? You can say:\n\n• **"Send 5 XRP to r..."** — I’ll build the payment and show you a QR to sign in Xaman.\n• **"Pay $25 to r..."** — I’ll convert to the right amount and do the same.\n• **"Help"** or **"What can you do?"** — I’ll explain more.`);
    } catch (error) {
      addMessage('system', `❌ Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Map errors to user-friendly messages (explainability + compliance)
  const toUserFriendlyError = (error: unknown): string => {
    const msg = error instanceof Error ? error.message : String(error);
    if (/Insufficient XRP/i.test(msg)) return msg; // Keep full balance message
    if (/wallet not connected|no payer address|connect.*wallet/i.test(msg)) return 'Wallet session lost. Tap **Connect Wallet** again, then try your payment.';
    if (/network|fetch|failed to fetch|ECONNREFUSED|timeout/i.test(msg)) return 'Network error. Check your connection and try again.';
    if (/rate limit|too many requests|429/i.test(msg)) return 'Rate limit reached. Please wait a moment before trying again.';
    if (/Real signing failed|API key|apps\.xumm/i.test(msg)) return 'Xaman signing failed. Check your API key at apps.xumm.dev and that this site is in your allowed origins.';
    if (/single transaction limit|exceeds.*limit/i.test(msg)) return msg; // Keep limit message
    if (/daily limit|limit_exceeded/i.test(msg)) return 'Daily spend limit reached. Adjust caps in Agent Economy or try again tomorrow.';
    if (/whitelist|blocked|not allowed/i.test(msg)) return 'This destination is not on your whitelist. Add it in settings or disable whitelist-only mode.';
    if (/invalid address|destination|r[A-Za-z0-9]{24,34}/i.test(msg) && msg.length < 80) return 'Invalid or missing destination address. Use a valid XRPL address (r...).';
    if (/cooldown|wait.*between/i.test(msg)) return 'Please wait a few seconds between transactions (cooldown).';
    if (/expired|Plan expired/i.test(msg)) return 'This payment plan expired. Please submit your request again.';
    if (msg && msg.length > 120) return msg.slice(0, 120) + '…';
    return msg || 'Something went wrong. Please try again.';
  };

  // Add message
  const addMessage = (type: Message['type'], content: string, plan?: PaymentPlan) => {
    setMessages(prev => [...prev, {
      id: `${type}-${Date.now()}`,
      type,
      content,
      timestamp: new Date(),
      plan,
    }]);
  };

  // Handle user input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    addMessage('user', userInput);
    setIsProcessing(true);

    try {
      if (!walletConnected) {
        addMessage('agent', "🔒 Connect your wallet first using the **Connect Wallet** button above — then I can help you send payments.");
        addMessage('agent', "Once connected, tell me what you want to pay (e.g. \"Send 10 XRP to r...\") and I’ll walk you through it.");
        setIsProcessing(false);
        return;
      }

      // Help / how does this work — reply with conversation, no payment
      const helpTriggers = /^(help|what can you do|how does this work|how do i|what do you do|explain|hi|hello)\s*$/i;
      if (helpTriggers.test(userInput.replace(/[.?!]+$/, '').trim())) {
        addMessage('agent', `Here’s how it works:\n\n1. **You tell me** what to pay — e.g. "Send 20 XRP to rABC..." or "Pay $30 to rXYZ...".\n2. **I build a payment plan** and show you the amount, fees, and destination.\n3. **You tap Confirm** — I’ll show a QR (or link) to open in **Xaman**.\n4. **You sign in Xaman** — the transaction is sent. I never hold your funds; you approve every payment.\n\nYou can send **XRP** or **USD/EUR** (I’ll convert via the XRPL). Want to try a payment? Just type it above.`);
        setIsProcessing(false);
        return;
      }

      // Add thinking indicator
      addMessage('agent', '🤔 Looking at your request...');

      // Create payment plan
      const plan = await securePaymentAgent.createPaymentPlan(userInput);
      setActivePlan(plan);

      // Remove thinking message, add conversational wrap, then show plan
      setMessages(prev => prev.filter(m => m.content !== '🤔 Looking at your request...'));
      addMessage('agent', 'Here’s your **payment plan**. Check the details below — when it looks right, tap **Confirm** and I’ll show you the QR to sign in Xaman.');
      addMessage('plan', '', plan);

    } catch (error) {
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.content !== '🤔 Analyzing your request...'));
      addMessage('agent', `❌ ${toUserFriendlyError(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and execute plan - two step process
  const handleConfirmPlan = async (planId: string) => {
    setIsProcessing(true);
    
    // Step 1: Start signing - this returns immediately with the signing request
    try {
      const planWithSigningRequest = await securePaymentAgent.startSigning(planId);
      
      // Update the UI immediately to show signing instructions
      setMessages(prev => prev.map(m => {
        if (m.plan?.id === planId) {
          return {
            ...m,
            plan: {
              ...m.plan,
              status: 'signing' as const,
              execution: planWithSigningRequest.execution
            }
          };
        }
        return m;
      }));

      // Now the UI shows the signing instructions - user can sign manually
      // Step 2: Wait for the signing to complete
      const result = await securePaymentAgent.waitForSigning(planId);
      
      setActivePlan(null);

      if (result.status === 'completed') {
        const txHash = result.execution?.txHash;
        
        // Show immediate success with signing confirmation
        addMessage('agent', `🔐 **Signed in Xaman!**\n\nTransaction submitted to XRPL. Verifying on ledger...`);
        
        // Try to verify the transaction on XRPL
        if (txHash && !txHash.startsWith('DEMO_') && !txHash.startsWith('MANUAL_CONFIRM')) {
          try {
            addMessage('system', `⏳ Waiting for ledger confirmation...`);
            
            const txResult = await waitForTransaction(txHash, 20000, 2000);
            
            // Remove the waiting message
            setMessages(prev => prev.filter(m => !m.content.includes('Waiting for ledger confirmation')));
            
            if (txResult.validated && txResult.success) {
              // Full success with XRPL confirmation
              addMessage('agent', 
                `✅ **Transaction Confirmed on XRPL!**\n\n` +
                `📤 **Sent:** ${result.execution?.actualCost} XRP\n` +
                `📍 **To:** ${result.intent.destination?.slice(0, 8)}...${result.intent.destination?.slice(-6)}\n` +
                `🔗 **TX Hash:** \`${txHash.slice(0, 12)}...${txHash.slice(-8)}\`\n` +
                `📊 **Ledger:** #${txResult.ledgerIndex}\n` +
                `💰 **Fee:** ${txResult.fee.toFixed(6)} XRP\n\n` +
                `[View on XRPL Explorer](https://livenet.xrpl.org/transactions/${txHash})`
              );
            } else if (txResult.error) {
              addMessage('agent', 
                `⚠️ **Transaction Status Unknown**\n\n` +
                `The transaction was signed but we couldn't verify it on the ledger.\n\n` +
                `TX Hash: \`${txHash}\`\n\n` +
                `[Check on XRPL Explorer](https://livenet.xrpl.org/transactions/${txHash})`
              );
            }
          } catch (verifyError) {
            // Couldn't verify, but tx was signed
            addMessage('agent', 
              `✅ **Payment Signed!**\n\n` +
              `Transaction: \`${txHash}\`\n` +
              `Cost: ${result.execution?.actualCost} XRP\n\n` +
              `[View on XRPL Explorer](https://livenet.xrpl.org/transactions/${txHash})`
            );
          }
        } else {
          // Demo or manual confirmation mode
          const isDemoTx = txHash?.startsWith('DEMO_');
          const demoLine = isDemoTx
            ? (platformLive
                ? '📡 **Simulated** — real signing failed or no API key. Add your Xaman API key (Connect Xaman) to sign for real.'
                : '🎮 **Simulated (demo)** — switch to Live and add Xaman API key to sign for real.')
            : 'Check your Xaman app for transaction details.';
          addMessage('agent', 
            (isDemoTx ? '🔄 **Payment simulated**\n\n' : '✅ **Payment Processed!**\n\n') +
            `Amount: ${result.execution?.actualCost} XRP\n` +
            `Reference: \`${txHash}\`\n\n` +
            demoLine
          );
        }
        
        // Refresh wallet balance
        if (activeWallet) {
          setTimeout(() => {
            useWalletStore.getState().refreshWallet(activeWallet.id);
          }, 3000);
        }

        addMessage('agent', 'All set. Want to send another? Just type it below — or ask **"help"** if you have questions.');
        
      } else if (result.status === 'failed') {
        addMessage('agent', `❌ **Payment failed**\n\n${result.execution?.error || 'Unknown error'}`);
        addMessage('agent', 'You can try again with a different amount or address, or say **"help"** if you want to double-check the format.');
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.content !== '🤔 Looking at your request...'));
      addMessage('agent', `❌ ${toUserFriendlyError(error)}`);
      addMessage('agent', 'Want to try again? Make sure you include an amount and an XRPL address (starts with **r**). Or say **"help"** for a quick guide.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick message from suggestion chip (same flow as handleSubmit but with explicit text)
  const handleQuickMessage = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;
    setInput('');
    addMessage('user', userText.trim());
    setIsProcessing(true);
    try {
      if (!walletConnected) {
        addMessage('agent', "🔒 Connect your wallet first using the **Connect Wallet** button above — then I can help you send payments.");
        setIsProcessing(false);
        return;
      }
      const helpTriggers = /^(help|what can you do|how does this work|how do i|what do you do|explain|hi|hello)\s*$/i;
      if (helpTriggers.test(userText.replace(/[.?!]+$/, '').trim())) {
        addMessage('agent', `Here’s how it works:\n\n1. **You tell me** what to pay — e.g. "Send 20 XRP to rABC..." or "Pay $30 to rXYZ...".\n2. **I build a payment plan** and show you the amount, fees, and destination.\n3. **You tap Confirm** — I’ll show a QR (or link) to open in **Xaman**.\n4. **You sign in Xaman** — the transaction is sent. I never hold your funds; you approve every payment.\n\nYou can send **XRP** or **USD/EUR** (I’ll convert via the XRPL). Want to try a payment? Just type it above.`);
        setIsProcessing(false);
        return;
      }
      addMessage('agent', '🤔 Looking at your request...');
      const plan = await securePaymentAgent.createPaymentPlan(userText.trim());
      setActivePlan(plan);
      setMessages(prev => prev.filter(m => m.content !== '🤔 Looking at your request...'));
      addMessage('agent', 'Here’s your **payment plan**. Check the details below — when it looks right, tap **Confirm** and I’ll show you the QR to sign in Xaman.');
      addMessage('plan', '', plan);
    } catch (error) {
      setMessages(prev => prev.filter(m => m.content !== '🤔 Looking at your request...'));
      addMessage('agent', `❌ ${toUserFriendlyError(error)}`);
      addMessage('agent', 'You can try again with a different amount or address, or say **"help"** for a quick guide.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel plan
  const handleCancelPlan = (planId: string) => {
    securePaymentAgent.cancelPlan(planId);
    setActivePlan(null);
    addMessage('agent', 'No problem — payment cancelled.');
    addMessage('agent', 'If you want to try again with a different amount or address, just type it below.');
  };

  // Update config
  const handleConfigChange = (updates: Partial<SecurityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    securePaymentAgent.setConfig(newConfig);
  };

  // Save Xaman credentials (browser only needs API Key; Secret is optional for backend)
  const handleSaveXamanCredentials = () => {
    if (apiKeyInput.trim()) {
      xamanService.setApiCredentials(apiKeyInput.trim(), apiSecretInput.trim() || undefined);
      setXamanMode('production');
      setShowXamanSetup(false);
      setApiKeyInput('');
      setApiSecretInput('');
      addMessage('system', '✅ Xaman API connected! You can now make real payments from the chat.\n\nYour API key is saved in your browser. Sign in Xaman when the QR appears.');
    }
  };

  // Clear Xaman credentials
  const handleClearXamanCredentials = () => {
    xamanService.clearCredentials();
    setXamanMode('demo');
    addMessage('system', '🎮 Switched to Demo Mode. Your API credentials have been removed.');
  };

  return (
    <div className="flex flex-col h-full bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-cyber-dark">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${walletConnected ? 'bg-cyber-green/20' : 'bg-cyber-yellow/20'}`}>
            <Shield className={`w-5 h-5 ${walletConnected ? 'text-cyber-green' : 'text-cyber-yellow'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-sm text-cyber-text">SECURE PAYMENT AGENT</span>
              <span className={`px-2 py-0.5 rounded text-[9px] border ${
                walletConnected
                  ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                  : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
              }`}>
                {walletConnected ? '🔐 CONNECTED' : '🔓 DISCONNECTED'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-cyber-muted">
                Daily limit: {securePaymentAgent.getRemainingDailyLimit().toFixed(2)} XRP remaining
              </p>
              <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                (platformLive || xamanMode === 'production') ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' : 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30'
              }`}>
                {(platformLive || xamanMode === 'production') ? 'LIVE' : 'DEMO'} {xamanMode === 'production' ? '· Xaman' : ''}
              </span>
              {!platformLive && xamanMode !== 'production' && (
                <button
                  type="button"
                  onClick={() => setPlatformMode('live')}
                  className="px-3 py-1.5 rounded-lg text-xs font-cyber bg-cyber-green/20 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/30"
                >
                  → Go Live
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Xaman Setup Button */}
          <button
            onClick={() => setShowXamanSetup(!showXamanSetup)}
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              xamanMode === 'production'
                ? 'bg-cyber-green/20 border border-cyber-green/50 text-cyber-green'
                : platformLive
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30'
                  : 'bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/30'
            }`}
          >
            <Smartphone size={14} />
            {xamanMode === 'production' ? 'Xaman Connected' : platformLive ? 'Add Xaman (real signing)' : 'Connect Xaman'}
          </button>
          
          {!walletConnected && activeWallet && (
            <button
              onClick={connectWallet}
              className="px-3 py-1.5 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs flex items-center gap-1"
            >
              <Wallet size={14} />
              Connect Wallet
            </button>
          )}
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className={`p-2 rounded-lg border transition-colors ${
              showAuditLog
                ? 'bg-cyber-purple/20 border-cyber-purple/50 text-cyber-purple'
                : 'border-cyber-border text-cyber-muted hover:text-cyber-text'
            }`}
          >
            <History size={16} />
          </button>
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
      </div>

      {/* Xaman Setup Panel - Easy API Key Entry */}
      <AnimatePresence>
        {showXamanSetup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-cyber-border overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-br from-cyber-cyan/5 to-cyber-purple/5">
              {xamanMode === 'demo' ? (
                // Setup Form
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">📱</div>
                    <h3 className="font-cyber text-cyber-cyan">Connect Your Xaman Wallet</h3>
                    <p className="text-xs text-cyber-muted mt-1">
                      Enable real payments by connecting your Xaman app
                    </p>
                  </div>

                  {/* Step by step instructions */}
                  <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm text-cyber-text font-medium">📋 How to get your API keys:</h4>
                    <ol className="text-xs text-cyber-muted space-y-2 list-decimal list-inside">
                      <li>
                        Go to{' '}
                        <a 
                          href="https://apps.xumm.dev" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyber-cyan underline hover:text-cyber-text"
                        >
                          apps.xumm.dev
                        </a>
                        {' '}and sign in with your Xaman app
                      </li>
                      <li>Click "Create new application"</li>
                      <li>Give it a name (e.g., "My Payment Agent")</li>
                      <li>Copy your <strong>API Key</strong> (this is all you need).</li>
                      <li>Paste it below — <strong>leave API Secret blank</strong>.</li>
                    </ol>
                  </div>

                  <p className="text-xs text-cyber-green bg-cyber-green/10 border border-cyber-green/30 rounded-lg px-3 py-2 mb-3">
                    ✓ Only the <strong>API Key</strong> is required to sign transactions from this app. You do <strong>not</strong> need the API Secret.
                  </p>

                  {/* Input Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-cyber-muted block mb-1">API Key <span className="text-cyber-green">(required)</span></label>
                      <input
                        type="text"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Paste your API Key from apps.xumm.dev..."
                        className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-sm text-cyber-text placeholder:text-cyber-muted/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-cyber-muted block mb-1">API Secret <span className="text-cyber-muted/70">(leave blank – not used in this app)</span></label>
                      <input
                        type="password"
                        value={apiSecretInput}
                        onChange={(e) => setApiSecretInput(e.target.value)}
                        placeholder="Leave blank"
                        className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-sm text-cyber-text placeholder:text-cyber-muted/50"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveXamanCredentials}
                    disabled={!apiKeyInput.trim()}
                    className="w-full py-3 rounded-lg bg-cyber-green/20 border border-cyber-green/50 text-cyber-green font-medium hover:bg-cyber-green/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Shield size={16} />
                    Save & Connect
                  </button>

                  <p className="text-[10px] text-cyber-muted text-center">
                    🔒 Only your API Key is saved in this browser. API Secret is not stored or used.
                  </p>
                  <p className="text-[10px] text-cyber-cyan text-center mt-2">
                    After saving: switch to <strong>Live</strong> with the Platform toggle at the top of the page, then send a payment below.
                  </p>
                </div>
              ) : (
                // Already Connected
                <div className="text-center space-y-4">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-cyber text-cyber-green">Xaman Connected!</h3>
                  <p className="text-xs text-cyber-muted">
                    To send a <strong>real</strong> payment from your wallet:
                  </p>
                  <ol className="text-xs text-cyber-muted text-left list-decimal list-inside space-y-1 bg-cyber-darker/50 rounded-lg p-3">
                    <li>Switch to <strong className="text-cyber-green">Live</strong> using the Platform toggle at the <strong>top of the page</strong> (nav bar or bar below it).</li>
                    <li>Type your payment below (e.g. &quot;Send 5 XRP to rABC...&quot;) and send.</li>
                    <li>Confirm the plan, then <strong>scan the QR with Xaman</strong> (or tap Open in Xaman) to sign. The transaction is sent when you approve in the app.</li>
                  </ol>
                  <div className="bg-cyber-darker/50 rounded-lg p-3">
                    <p className="text-xs text-cyber-muted">API Key</p>
                    <p className="text-sm text-cyber-text font-mono">{xamanService.getMaskedApiKey()}</p>
                  </div>

                  <button
                    onClick={handleClearXamanCredentials}
                    className="px-4 py-2 rounded border border-cyber-red/50 text-cyber-red text-sm hover:bg-cyber-red/10"
                  >
                    Disconnect Xaman
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted block mb-1">Daily Limit (XRP)</label>
                  <input
                    type="number"
                    value={config.dailyLimit}
                    onChange={(e) => handleConfigChange({ dailyLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-sm text-cyber-text"
                  />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted block mb-1">Max Per Transaction (XRP)</label>
                  <input
                    type="number"
                    value={config.singleTxLimit}
                    onChange={(e) => handleConfigChange({ singleTxLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-sm text-cyber-text"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyber-text">Whitelist Only</p>
                  <p className="text-[10px] text-cyber-muted">Only allow payments to pre-approved addresses</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ whitelistOnly: !config.whitelistOnly })}
                  className={`px-3 py-1.5 rounded border text-xs ${
                    config.whitelistOnly
                      ? 'border-cyber-green/50 text-cyber-green bg-cyber-green/10'
                      : 'border-cyber-border text-cyber-muted'
                  }`}
                >
                  {config.whitelistOnly ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Log Panel */}
      <AnimatePresence>
        {showAuditLog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-cyber-border overflow-hidden max-h-48"
          >
            <div className="p-4 bg-cyber-dark/50 overflow-y-auto max-h-44">
              <h4 className="text-xs font-cyber text-cyber-purple mb-2">AUDIT LOG</h4>
              <div className="space-y-1">
                {securePaymentAgent.getAuditLog(20).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-[10px]">
                    <span className={`w-2 h-2 rounded-full ${
                      entry.status === 'success' ? 'bg-cyber-green' :
                      entry.status === 'failed' ? 'bg-cyber-red' : 'bg-cyber-yellow'
                    }`} />
                    <span className="text-cyber-muted">{entry.timestamp.toLocaleTimeString()}</span>
                    <span className="text-cyber-text">{entry.action.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onConfirm={handleConfirmPlan}
            onCancel={handleCancelPlan}
            isProcessing={isProcessing}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-cyber-border bg-cyber-dark">
        {/* Suggestion chips — quick ways to start a message */}
        {walletConnected && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] text-cyber-muted self-center mr-1">Try:</span>
            <button
              type="button"
              onClick={() => setInput('Send 5 XRP to ')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs bg-cyber-darker/80 border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors disabled:opacity-50"
            >
              Send 5 XRP
            </button>
            <button
              type="button"
              onClick={() => setInput('Pay $20 to ')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs bg-cyber-darker/80 border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors disabled:opacity-50"
            >
              Pay $20 USD
            </button>
            <button
              type="button"
              onClick={() => handleQuickMessage('What can you do?')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs bg-cyber-darker/80 border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors disabled:opacity-50"
            >
              What can you do?
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={walletConnected ? 'e.g., Pay $50 to rABC123...' : 'Connect wallet to start...'}
            disabled={isProcessing || !walletConnected}
            className="flex-1 px-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-sm text-cyber-text placeholder:text-cyber-muted/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim() || !walletConnected}
            className="px-4 py-3 rounded-lg bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-cyber-muted">
            {walletConnected 
              ? '🔐 All transactions require your approval in Xaman' 
              : '⚠️ Connect your wallet to make payments'}
          </p>
          {walletConnected && activeWallet && (
            <p className="text-[10px] text-cyber-green">
              Balance: {activeWallet.balance?.toFixed(2)} XRP
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

// ==================== MESSAGE BUBBLE ====================

function MessageBubble({
  message,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  message: Message;
  onConfirm: (planId: string) => void;
  onCancel: (planId: string) => void;
  isProcessing: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (message.type === 'plan' && message.plan) {
    return <PaymentPlanCard plan={message.plan} onConfirm={onConfirm} onCancel={onCancel} isProcessing={isProcessing} />;
  }

  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        {!isUser && !isSystem && (
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-cyber-green" />
            <span className="text-[10px] text-cyber-muted">Secure Agent</span>
          </div>
        )}

        <div className={`p-3 rounded-lg ${
          isUser
            ? 'bg-cyber-cyan/20 border border-cyber-cyan/30'
            : isSystem
            ? 'bg-cyber-purple/10 border border-cyber-purple/20'
            : message.content.includes('✅') && message.content.includes('Confirmed')
            ? 'bg-cyber-green/10 border-2 border-cyber-green/50'
            : message.content.includes('❌')
            ? 'bg-cyber-red/10 border border-cyber-red/30'
            : 'bg-cyber-darker border border-cyber-border'
        }`}>
          <div className="text-sm text-cyber-text whitespace-pre-wrap">
            <MessageContent content={message.content} />
          </div>
        </div>

        <p className={`text-[9px] text-cyber-muted mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  );
}

// ==================== MESSAGE CONTENT RENDERER ====================

function MessageContent({ content }: { content: string }) {
  // Parse markdown-like content: **bold**, `code`, [text](url)
  const parts: React.ReactNode[] = [];
  let remaining = content;
  let key = 0;

  while (remaining.length > 0) {
    // Check for link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Check for bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Check for code `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // Find the earliest match
    const matches = [
      linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index! } : null,
      boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
      codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
    ].filter(Boolean).sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }

    const earliest = matches[0]!;
    
    // Add text before the match
    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }

    // Add the matched element
    if (earliest.type === 'link') {
      const [, text, url] = earliest.match!;
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:text-cyber-text underline inline-flex items-center gap-1"
        >
          {text}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      );
    } else if (earliest.type === 'bold') {
      const [, text] = earliest.match!;
      parts.push(<strong key={key++} className="font-semibold text-cyber-text">{text}</strong>);
    } else if (earliest.type === 'code') {
      const [, text] = earliest.match!;
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-cyber-dark text-cyber-cyan text-xs font-mono">
          {text}
        </code>
      );
    }

    // Continue with remaining text
    remaining = remaining.slice(earliest.index + earliest.match![0].length);
  }

  return <>{parts}</>;
}

// ==================== PAYMENT PLAN CARD ====================

function PaymentPlanCard({
  plan,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  plan: PaymentPlan;
  onConfirm: (planId: string) => void;
  onCancel: (planId: string) => void;
  isProcessing: boolean;
}) {
  const [showSteps, setShowSteps] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const isExpired = new Date() > plan.expiresAt;
  const canConfirm = plan.status === 'draft' && !isExpired && !isProcessing;
  const signingRequest = plan.execution?.signingRequest;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield size={14} className="text-cyber-green" />
        <span className="text-[10px] text-cyber-muted">Payment Plan</span>
      </div>

      <div className={`rounded-lg border-2 overflow-hidden ${
        plan.status === 'draft' ? 'border-cyber-cyan/50 bg-cyber-cyan/5' :
        plan.status === 'completed' ? 'border-cyber-green/50 bg-cyber-green/5' :
        plan.status === 'failed' ? 'border-cyber-red/50 bg-cyber-red/5' :
        'border-cyber-border bg-cyber-darker'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-cyber-border/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-cyber text-cyber-text">{plan.intent.description}</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] ${
              plan.status === 'draft' ? 'bg-cyber-cyan/20 text-cyber-cyan' :
              plan.status === 'completed' ? 'bg-cyber-green/20 text-cyber-green' :
              plan.status === 'failed' ? 'bg-cyber-red/20 text-cyber-red' :
              'bg-cyber-yellow/20 text-cyber-yellow'
            }`}>
              {plan.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-cyber-muted">
            To: {plan.intent.destinationName || plan.intent.destination}
          </p>
        </div>

        {/* Steps */}
        <div className="p-4">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center gap-1 text-xs text-cyber-muted hover:text-cyber-text mb-3"
          >
            {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {plan.plan.steps.length} step{plan.plan.steps.length > 1 ? 's' : ''}
          </button>

          <AnimatePresence>
            {showSteps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {plan.plan.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyber-cyan/20 flex items-center justify-center text-xs text-cyber-cyan shrink-0">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-cyber-text">{step.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-cyber-muted">
                        <span>{step.from.amount} {step.from.currency}</span>
                        <ArrowRight size={10} />
                        <span>{step.to.amount} {step.to.currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="p-4 bg-cyber-dark/50 border-t border-cyber-border/50">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] text-cyber-muted">Total Cost</p>
              <p className="font-cyber text-cyber-green">{plan.plan.totalCost} XRP</p>
            </div>
            <div>
              <p className="text-[10px] text-cyber-muted">Fees</p>
              <p className="text-sm text-cyber-text">{plan.plan.fees.total} XRP</p>
            </div>
            <div>
              <p className="text-[10px] text-cyber-muted">Time</p>
              <p className="text-sm text-cyber-text">{plan.plan.estimatedTime}</p>
            </div>
          </div>

          {/* Risks */}
          {plan.plan.risks.length > 0 && (
            <div className="mb-4 p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={12} className="text-cyber-yellow" />
                <span className="text-[10px] text-cyber-yellow">Warnings</span>
              </div>
              {plan.plan.risks.map((risk, i) => (
                <p key={i} className="text-[10px] text-cyber-muted">• {risk}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          {plan.status === 'draft' && (
            <div className="flex gap-2">
              <button
                onClick={() => onCancel(plan.id)}
                disabled={isProcessing}
                className="flex-1 py-2 rounded border border-cyber-red/50 text-cyber-red text-sm hover:bg-cyber-red/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(plan.id)}
                disabled={!canConfirm}
                className="flex-1 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-sm hover:bg-cyber-green/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Smartphone size={14} />
                    Confirm & Sign in Xaman
                  </>
                )}
              </button>
            </div>
          )}

          {isExpired && plan.status === 'draft' && (
            <p className="text-center text-xs text-cyber-red mt-2">
              Plan expired. Please create a new one.
            </p>
          )}

          {/* QR Code for Xaman signing */}
          {plan.status === 'signing' && signingRequest && (
            <XamanSigningUI 
              signingRequest={signingRequest} 
              planId={plan.id}
              txDetails={{
                destination: plan.intent.destination,
                amount: plan.intent.targetAmount,
                currency: plan.intent.targetCurrency,
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== XAMAN SIGNING UI ====================

function XamanSigningUI({
  signingRequest,
  planId,
  txDetails,
}: {
  signingRequest: {
    id: string;
    qrCodeUrl?: string;
    deepLink?: string;
    status: string;
  };
  planId: string;
  txDetails?: {
    destination?: string;
    amount?: string;
    currency?: string;
  };
}) {
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [signingStatus, setSigningStatus] = useState<'waiting' | 'signed' | 'rejected' | 'expired'>('waiting');
  const [copied, setCopied] = useState<string | null>(null);
  const isDeepLinkFallback = signingRequest.id.startsWith('local_');

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Listen for signing events
  useEffect(() => {
    const handleSigned = (data: any) => {
      if (data.id === signingRequest.id) {
        setSigningStatus('signed');
      }
    };
    const handleRejected = (data: any) => {
      if (data.id === signingRequest.id) {
        setSigningStatus('rejected');
      }
    };
    const handleExpired = (data: any) => {
      if (data.id === signingRequest.id) {
        setSigningStatus('expired');
      }
    };
    const handleWaiting = (data: any) => {
      if (data.id === signingRequest.id) {
        setSigningStatus('waiting');
      }
    };

    xamanService.on('signingSigned', handleSigned);
    xamanService.on('signingRejected', handleRejected);
    xamanService.on('signingExpired', handleExpired);
    xamanService.on('signingWaiting', handleWaiting);

    return () => {
      xamanService.off('signingSigned', handleSigned);
      xamanService.off('signingRejected', handleRejected);
      xamanService.off('signingExpired', handleExpired);
      xamanService.off('signingWaiting', handleWaiting);
    };
  }, [signingRequest.id]);

  const handleOpenXaman = () => {
    if (signingRequest.deepLink) {
      // Try to open the deep link
      window.location.href = signingRequest.deepLink;
    }
  };

  const handleManualConfirm = () => {
    xamanService.confirmDeepLinkSigned(signingRequest.id, txHash || undefined);
  };

  const handleCancel = () => {
    xamanService.cancelDeepLinkRequest(signingRequest.id);
  };

  return (
    <div className="mt-4 pt-4 border-t border-cyber-border/50">
      <div className="text-center">
        {/* Deep Link Fallback - Manual Signing Mode */}
        {isDeepLinkFallback && txDetails && (
          <div className="mb-4">
            <div className="p-3 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-cyber-yellow" />
                <span className="text-xs text-cyber-yellow font-medium">Manual Signing Required</span>
              </div>
              <p className="text-[10px] text-cyber-muted">
                Browser security prevents direct signing. Please send manually in Xaman.
              </p>
            </div>

            {/* Transaction Details to Copy */}
            <div className="bg-cyber-darker rounded-lg p-4 mb-4 text-left">
              <h4 className="text-xs font-cyber text-cyber-cyan mb-3">📋 TRANSACTION DETAILS</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-cyber-muted mb-1">Send Amount:</p>
                  <div className="flex items-center gap-2">
                    <span className="font-cyber text-lg text-cyber-green">{txDetails.amount} {txDetails.currency}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-cyber-muted mb-1">To Address:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-cyber-text bg-cyber-dark px-2 py-1 rounded font-mono break-all flex-1">
                      {txDetails.destination}
                    </code>
                    <button
                      onClick={() => txDetails.destination && copyToClipboard(txDetails.destination, 'address')}
                      className="p-2 rounded bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 shrink-0"
                      title="Copy address"
                    >
                      {copied === 'address' ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step by step instructions */}
            <div className="bg-cyber-darker/50 rounded-lg p-4 mb-4 text-left">
              <h4 className="text-xs font-cyber text-cyber-purple mb-3">📱 HOW TO SEND</h4>
              <ol className="text-xs text-cyber-muted space-y-2 list-decimal list-inside">
                <li>Open your <strong className="text-cyber-cyan">Xaman</strong> app</li>
                <li>Tap <strong className="text-cyber-text">Send</strong></li>
                <li>Paste the address above (tap copy button)</li>
                <li>Enter amount: <strong className="text-cyber-green">{txDetails.amount} {txDetails.currency}</strong></li>
                <li>Confirm and sign the transaction</li>
                <li>Come back here and click "I Signed It"</li>
              </ol>
            </div>
          </div>
        )}

        {/* Regular API Mode - QR Code */}
        {!isDeepLinkFallback && (
          <>
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode size={16} className="text-cyber-cyan" />
              <span className="text-sm text-cyber-cyan font-cyber">SCAN WITH XAMAN</span>
            </div>
            
            {signingRequest.qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg inline-block mb-3">
                <img 
                  src={signingRequest.qrCodeUrl} 
                  alt="Scan with Xaman" 
                  className="w-48 h-48"
                />
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-cyber-muted mb-2">
                Or tap to open in Xaman app:
              </p>
              
              <button
                onClick={handleOpenXaman}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-cyan/20 border-2 border-cyber-cyan text-cyber-cyan text-sm font-medium hover:bg-cyber-cyan/30 transition-colors"
              >
                <Smartphone size={18} />
                Open in Xaman
              </button>
            </div>
          </>
        )}

        {/* Status indicator */}
        {signingStatus === 'waiting' && (
          <div className="flex items-center justify-center gap-2 text-cyber-muted mb-4">
            <Loader size={14} className="animate-spin" />
            <p className="text-xs">Waiting for approval in your Xaman app...</p>
          </div>
        )}
        
        {signingStatus === 'signed' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center gap-2 text-cyber-green mb-4"
          >
            <div className="w-12 h-12 rounded-full bg-cyber-green/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-cyber-green" />
            </div>
            <p className="text-sm font-medium">Signed Successfully!</p>
            <p className="text-xs text-cyber-muted">Verifying on XRPL ledger...</p>
          </motion.div>
        )}

        {signingStatus === 'rejected' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center gap-2 text-cyber-red mb-4"
          >
            <div className="w-12 h-12 rounded-full bg-cyber-red/20 flex items-center justify-center">
              <XCircle size={24} className="text-cyber-red" />
            </div>
            <p className="text-sm font-medium">Signing Rejected</p>
            <p className="text-xs text-cyber-muted">Transaction was cancelled in Xaman</p>
          </motion.div>
        )}

        {signingStatus === 'expired' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center gap-2 text-cyber-yellow mb-4"
          >
            <div className="w-12 h-12 rounded-full bg-cyber-yellow/20 flex items-center justify-center">
              <Clock size={24} className="text-cyber-yellow" />
            </div>
            <p className="text-sm font-medium">Request Expired</p>
            <p className="text-xs text-cyber-muted">Please try again</p>
          </motion.div>
        )}

        {/* Manual confirmation for deep link fallback - Always shown when in fallback mode */}
        {isDeepLinkFallback && (
          <div className="mt-4 pt-4 border-t border-cyber-border/50">
            <div className="p-4 rounded-lg bg-cyber-green/5 border border-cyber-green/30">
              <h4 className="text-sm font-cyber text-cyber-green mb-3 text-center">
                ✅ Did you send it in Xaman?
              </h4>
              
              <div className="mb-3">
                <label className="text-[10px] text-cyber-muted block mb-1">
                  Transaction Hash (optional - paste from Xaman)
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="e.g., A1B2C3D4E5F6..."
                  className="w-full px-3 py-2 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text placeholder:text-cyber-muted/50 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded border border-cyber-red/50 text-cyber-red text-sm hover:bg-cyber-red/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualConfirm}
                  className="flex-1 py-3 rounded bg-cyber-green/20 border-2 border-cyber-green text-cyber-green text-sm font-medium hover:bg-cyber-green/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  I Signed It
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Non-fallback confirmation prompt */}
        {!isDeepLinkFallback && signingStatus === 'waiting' && (
          <div className="mt-4 pt-4 border-t border-cyber-border/50">
            <button
              onClick={() => setShowManualConfirm(!showManualConfirm)}
              className="text-xs text-cyber-muted hover:text-cyber-text flex items-center gap-1 mx-auto"
            >
              {showManualConfirm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Having trouble? Confirm manually
            </button>

            <AnimatePresence>
              {showManualConfirm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 p-4 rounded-lg bg-cyber-darker border border-cyber-border overflow-hidden"
                >
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 rounded border border-cyber-red/50 text-cyber-red text-xs hover:bg-cyber-red/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualConfirm}
                      className="flex-1 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30 flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={12} />
                      I Signed It
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel button */}
        <div className="mt-4">
          <button
            onClick={handleCancel}
            className="text-xs text-cyber-muted hover:text-cyber-red"
          >
            Cancel signing request
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecureAgentPanel;
