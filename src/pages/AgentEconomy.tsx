/**
 * Agent Economy — structured paid actions, receipts, caps.
 * Routes: intents → priced services → Xaman sign → receipts.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, ListTodo, Receipt, Shield, Zap, ExternalLink, Loader2, CheckCircle,
  Lock, Unlock, Clock, Wallet, AlertCircle, Bot, DollarSign, ChevronRight
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useAgentEconomyStore } from '../store/agentEconomyStore';
import { usePlatformModeStore } from '../store/platformModeStore';
import { xamanService } from '../services/xaman';
import { AGENT_SERVICE_WALLET, POWER_MODE_UNLOCK_XRP, POWER_MODE_DURATION_MS } from '../lib/constants';
import { getXamanMode } from '../config/xaman';

// ==================== TABS ====================

export type AgentEconomyTabId = 'agents' | 'requests' | 'caps' | 'receipts';

export const agentEconomyTabs: { id: AgentEconomyTabId; label: string; icon: typeof Cpu }[] = [
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'caps', label: 'Limits', icon: Shield },
  { id: 'requests', label: 'Pending', icon: ListTodo },
  { id: 'agents', label: 'Tools', icon: Cpu },
];

// ==================== POWER MODE UNLOCK CARD ====================

interface SigningRequestDisplay {
  qrCodeUrl?: string;
  deepLink?: string;
}

export function PowerModeUnlockCard() {
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingRequest, setSigningRequest] = useState<SigningRequestDisplay | null>(null);
  const { wallets, activeWalletId } = useWalletStore();
  const {
    powerModeUnlock,
    setPowerModeUnlock,
    isPowerModeUnlocked,
    addReceipt,
    addPending,
    updatePending,
    removePending,
    getSpendTotalToday,
    spendCaps,
  } = useAgentEconomyStore();

  const activeWallet = wallets.find((w) => w.id === activeWalletId);
  const payerAddress = activeWallet?.provider !== 'demo' ? activeWallet?.address : null;
  const xamanProduction = getXamanMode() === 'production';
  const platformLive = usePlatformModeStore((s) => s.mode === 'live');
  const unlocked = isPowerModeUnlocked();
  const dailySpent = getSpendTotalToday();
  const underCap = dailySpent + POWER_MODE_UNLOCK_XRP <= spendCaps.dailyLimitXRP;

  const handleUnlock = async () => {
    if (!payerAddress) {
      setError('Add a wallet (or connect Xaman) first.');
      return;
    }
    if (!underCap) {
      setError(`Daily cap (${spendCaps.dailyLimitXRP} XRP) would be exceeded.`);
      return;
    }
    setError(null);
    setSigning(true);

    const jobId = `power-unlock-${Date.now()}`;
    const pendingId = addPending({
      jobId,
      task: 'Power Mode Unlock',
      priceXRP: POWER_MODE_UNLOCK_XRP,
      provider: 'Control Room',
      status: 'signing',
    });

    try {
      const request = await xamanService.requestPaymentSignature(
        {
          destination: AGENT_SERVICE_WALLET,
          amount: POWER_MODE_UNLOCK_XRP,
          currency: 'XRP',
          memo: jobId,
        },
        payerAddress
      );

      setSigningRequest({ qrCodeUrl: request.qrCodeUrl, deepLink: request.deepLink });
      updatePending(pendingId, { payloadId: request.id, status: 'signing' });

      const signed = await new Promise<{ txHash: string } | { rejected: true }>((resolve) => {
        const unsub = () => {
          clearTimeout(t);
          xamanService.off('signingSigned', onSigned);
          xamanService.off('signingRejected', onRejected);
          xamanService.off('signingExpired', onExpired);
        };
        const onSigned = (req: { txHash?: string }) => {
          if (req?.txHash) {
            unsub();
            resolve({ txHash: req.txHash });
          }
        };
        const onRejected = () => {
          unsub();
          resolve({ rejected: true });
        };
        const onExpired = () => {
          unsub();
          resolve({ rejected: true });
        };
        xamanService.on('signingSigned', onSigned);
        xamanService.on('signingRejected', onRejected);
        xamanService.on('signingExpired', onExpired);
        const t = setTimeout(() => {
          unsub();
          resolve({ rejected: true });
        }, 10 * 60 * 1000);
      });

      setSigningRequest(null);
      if ('rejected' in signed) {
        updatePending(pendingId, { status: 'rejected' });
        setError('Signing was cancelled or expired.');
        return;
      }

      const txHash = signed.txHash.startsWith('DEMO_') ? signed.txHash : signed.txHash;
      const expires = Date.now() + POWER_MODE_DURATION_MS;
      setPowerModeUnlock({ expires, txHash, jobId });
      addReceipt({
        jobId,
        action: 'power-mode-unlock',
        txHash,
        amountXRP: POWER_MODE_UNLOCK_XRP,
        destination: AGENT_SERVICE_WALLET,
        result: 'unlocked',
      });
      removePending(pendingId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signing failed');
      updatePending(pendingId, { status: 'rejected' });
      setSigningRequest(null);
    } finally {
      setSigning(false);
    }
  };

  const expiresAt = powerModeUnlock?.expires ? new Date(powerModeUnlock.expires) : null;

  return (
    <div className="cyber-panel p-4 border border-cyber-glow/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={18} className="text-cyber-yellow" />
        <h3 className="font-cyber text-cyber-text">Power Mode Unlock</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-4">
        Optional: pay {POWER_MODE_UNLOCK_XRP} XRP to unlock Advanced panels for 24 hours. Only if it’s worth it to you. Funds go to the service wallet (non-custodial).
      </p>
      {unlocked && expiresAt ? (
        <div className="flex items-center gap-2 text-cyber-green">
          <Unlock size={16} />
          <span className="text-sm">Unlocked until {expiresAt.toLocaleString()}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs text-cyber-muted">Price</span>
            <span className="font-cyber text-cyber-glow">{POWER_MODE_UNLOCK_XRP} XRP</span>
          </div>
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs text-cyber-muted">Provider</span>
            <span className="text-xs text-cyber-text">Control Room</span>
          </div>
          {error && (
            <p className="text-xs text-cyber-red mb-2 flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          {!xamanProduction && !platformLive && (
            <p className="text-xs text-cyber-yellow mb-2">Demo mode: switch to Live in the nav bar, or configure Xaman API key for real signing.</p>
          )}
          {platformLive && !xamanProduction && (
            <p className="text-xs text-cyber-cyan mb-2">Platform is Live. Configure Xaman (e.g. in CARV) to sign for real.</p>
          )}
          {signing && signingRequest && (
            <div className="mb-4 p-3 rounded-lg bg-cyber-darker border border-cyber-glow/30">
              <p className="text-xs text-cyber-muted mb-2">Scan with Xaman or tap below:</p>
              {signingRequest.qrCodeUrl && (
                <img src={signingRequest.qrCodeUrl} alt="Sign in Xaman" className="w-40 h-40 mx-auto mb-2 rounded" />
              )}
              {signingRequest.deepLink && (
                <a
                  href={signingRequest.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-cyber-cyan hover:underline"
                >
                  Open in Xaman
                </a>
              )}
            </div>
          )}
          <button
            onClick={handleUnlock}
            disabled={signing || !payerAddress || !underCap}
            className="w-full py-2.5 rounded-lg bg-cyber-glow/20 border border-cyber-glow/50 text-cyber-glow font-cyber text-sm hover:bg-cyber-glow/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {signing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Approve in Xaman…
              </>
            ) : (
              <>
                <Wallet size={16} />
                Approve in Xaman
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ==================== AGENTS TAB ====================

export function AgentsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-cyber-muted">
        Optional paid tools. You choose what to pay for—only when it helps you do more or earn back.
      </p>
      <PowerModeUnlockCard />
      <div className="cyber-panel p-4 border border-cyber-border rounded-lg">
        <p className="text-xs text-cyber-muted mb-2">More paid actions coming: Summary, Corridor Scan, Monitor Alerts. Each will show a fixed XRP price and require your Xaman signature.</p>
        <Link
          to="/pay"
          state={{ tab: 'agents' }}
          className="inline-flex items-center gap-2 text-xs text-cyber-cyan hover:underline"
        >
          Run the Orchestra (AI Agents) <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// ==================== REQUESTS TAB ====================

export function RequestsTab() {
  const { pending } = useAgentEconomyStore();
  const active = pending.filter((p) => p.status === 'pending' || p.status === 'signing');

  return (
    <div className="space-y-4">
      <p className="text-sm text-cyber-muted">Actions waiting for your approval. You decide what to sign—nothing goes out without you.</p>
      {active.length === 0 ? (
        <p className="text-xs text-cyber-muted">No pending requests.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((p) => (
            <li key={p.id} className="cyber-panel p-3 border border-cyber-border rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-cyber-text">{p.task}</p>
                <p className="text-xs text-cyber-muted">{p.priceXRP} XRP · {p.provider}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded ${p.status === 'signing' ? 'bg-cyber-yellow/20 text-cyber-yellow' : 'bg-cyber-muted/20 text-cyber-muted'}`}>
                {p.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==================== CAPS TAB ====================

export function CapsTab() {
  const { spendCaps, setSpendCaps, getSpendTotalToday } = useAgentEconomyStore();
  const spent = getSpendTotalToday();

  return (
    <div className="space-y-4">
      <p className="text-sm text-cyber-muted">Set limits so the agent never spends more than you’re comfortable with. Keeps you in control.</p>
      <div className="cyber-panel p-4 border border-cyber-border rounded-lg space-y-4">
        <div>
          <label className="text-xs text-cyber-muted block mb-1">Daily limit (XRP)</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={spendCaps.dailyLimitXRP}
            onChange={(e) => setSpendCaps({ dailyLimitXRP: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-cyber-text text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-cyber-muted block mb-1">Weekly limit (XRP)</label>
          <input
            type="number"
            min={1}
            max={100000}
            value={spendCaps.weeklyLimitXRP}
            onChange={(e) => setSpendCaps({ weeklyLimitXRP: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-cyber-text text-sm"
          />
        </div>
        <p className="text-xs text-cyber-muted">
          Spent today: <span className="text-cyber-glow">{spent.toFixed(2)}</span> XRP
        </p>
      </div>
    </div>
  );
}

// ==================== RECEIPTS TAB ====================

export function ReceiptsTab() {
  const { receipts } = useAgentEconomyStore();

  return (
    <div className="space-y-4">
      <p className="text-sm text-cyber-muted">Proof of what you paid or received. For taxes, records, and disputes.</p>
      {receipts.length === 0 ? (
        <p className="text-xs text-cyber-muted">No receipts yet.</p>
      ) : (
        <ul className="space-y-2">
          {receipts.slice(0, 50).map((r) => (
            <li key={r.id} className="cyber-panel p-3 border border-cyber-border rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-cyber-glow font-mono truncate">{r.txHash}</span>
                <span className="text-xs text-cyber-muted shrink-0">{r.amountXRP} XRP</span>
              </div>
              <p className="text-[10px] text-cyber-muted">
                {r.action} · {r.result ?? '—'} · {new Date(r.timestamp).toLocaleString()}
              </p>
              <a
                href={`https://livenet.xrpl.org/transactions/${r.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyber-cyan hover:underline inline-flex items-center gap-1 mt-1"
              >
                View on explorer <ExternalLink size={10} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==================== PAGE ====================

export default function AgentEconomy() {
  const [tab, setTab] = useState<AgentEconomyTabId>('agents');

  return (
    <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-glow/20">
              <Cpu size={24} className="text-cyber-glow" />
            </div>
            <div>
              <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">AGENT ECONOMY</h1>
              <p className="text-sm text-cyber-muted">Paid actions · Sign in Xaman · Receipts</p>
            </div>
          </div>
          <p className="text-cyber-muted text-sm max-w-2xl">
            Structured actions with clear price and destination. You sign; funds go wallet-to-wallet. No custody.
          </p>

          {/* How AI payments, OpenClaw, and Agent Economy fit together */}
          <div className="mt-4 p-4 rounded-xl border border-cyber-border/80 bg-cyber-darker/40">
            <p className="text-[11px] text-cyber-muted uppercase tracking-wider font-medium mb-3">AI agent economy in this app</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/pay"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30 text-cyber-glow hover:bg-cyber-glow/20 text-xs font-cyber transition-colors"
              >
                <Zap size={14} />
                Micropayments · OpenClaw &amp; AI streams
              </Link>
              <Link
                to="/pay"
                state={{ tab: 'openclaw' }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-green/10 border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20 text-xs font-cyber transition-colors"
              >
                <DollarSign size={14} />
                OpenClaw revenue
              </Link>
              <Link
                to="/pay/carv"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20 text-xs font-cyber transition-colors"
              >
                <Bot size={14} />
                Secure Payment Agent (pay in chat)
              </Link>
            </div>
            <p className="text-[10px] text-cyber-muted mt-2">This page = receipts, spend caps, and paid actions. OpenClaw = earn from plugin. CARV = AI payment agent with Xaman.</p>
            <p className="text-[9px] text-cyber-muted mt-1.5 border-t border-cyber-border/50 pt-2">Use must comply with applicable laws. No custody; you sign in Xaman. See compliance docs in repo.</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-cyber-border pb-2">
          {agentEconomyTabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-cyber transition-colors ${
                  isActive ? 'bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50' : 'text-cyber-muted hover:text-cyber-text border border-transparent'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

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
