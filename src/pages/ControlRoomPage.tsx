/**
 * Control Room — Mission Control v0.1. Non-custodial: no keys, no seeds, no in-app mainnet auto-execution.
 *
 * Sub-panels (Quant, Compliance, Security, Task Receipts) are simulation- or policy-display layers unless explicitly noted;
 * they do not submit XRPL transactions or write memos. Wallet / Xaman flows are unchanged in this file.
 */

import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getNetwork, setNetwork } from '../services/xrplClient';
import { useWalletStore } from '../store/walletStore';
import ControlRoomTopBar from '../components/ControlRoomTopBar';
import ControlRoomSidebar from '../components/ControlRoomSidebar';
import type { ControlRoomSection } from '../components/ControlRoomSidebar';
import ControlRoomHomeSection from '../components/ControlRoomHomeSection';
import WalletActionsPanel from '../components/WalletActionsPanel';
import { AgentHub } from '../components/AgentHub';
import { Wallet, User, DollarSign, BarChart3, ArrowDownUp, ArrowRightLeft, Sparkles, BookOpen } from 'lucide-react';
import { ILPIntelligencePanel } from '../components/ilp/ILPIntelligencePanel';
import { HiddenAnalyticsPanel } from '../components/analytics/HiddenAnalyticsPanel';
import { MissionControlPanel } from '../components/control-room/MissionControlPanel';
import { PlaceholderControlRoomPanel } from '../components/control-room/PlaceholderControlRoomPanel';
import { PrivateQuantLabPanel } from '../components/control-room/PrivateQuantLabPanel';
import { ComplianceGuardPanel } from '../components/control-room/ComplianceGuardPanel';
import { SecurityOpsPanel } from '../components/control-room/SecurityOpsPanel';
import { TaskReceiptsPanel } from '../components/control-room/TaskReceiptsPanel';

const TOP_BAR_H = 56;
const APP_NAV_H = 64;

const panelClass = 'max-w-4xl w-full';

export default function ControlRoomPage() {
  const address = useWalletStore((s) => {
    const id = s.activeWalletId;
    const w = id ? s.wallets.find((x) => x.id === id) : s.wallets[0];
    return w?.address ?? null;
  });

  const net = useMemo(() => getNetwork(), []);
  const [networkUI, setNetworkUI] = useState<'testnet' | 'mainnet'>(net);
  const [section, setSection] = useState<ControlRoomSection>('mission');

  const handleNetworkChange = useCallback((next: 'testnet' | 'mainnet') => {
    setNetwork(next);
    setNetworkUI(next);
  }, []);

  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
  }, [address]);

  const hasWallet = !!address;
  const fromMissionSubroute = section === 'wallet' || section === 'trade' || section === 'offers';

  return (
    <div className="min-h-screen bg-[var(--cyber-darker)]">
      <ControlRoomTopBar
        locked={false}
        address={address}
        networkUI={networkUI}
        onNetworkChange={handleNetworkChange}
        onLock={() => {}}
      />

      {!hasWallet ? (
        <div className="pt-[calc(3.5rem+4rem)] flex flex-col items-center justify-center min-h-[60vh] px-6 pb-12">
          <p className="text-sm text-cyber-muted mb-2">Control Room – XRPL Mission Control</p>
          <div className="max-w-md neon-panel text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-cyber-glow/20">
              <Wallet className="w-8 h-8 text-cyber-glow" />
            </div>
            <h2 className="text-xl font-cyber text-cyber-glow">Connect Wallet</h2>
            <p className="text-sm text-cyber-muted">
              Add a wallet via <strong>Profile → Wallets</strong>: connect with Xaman or enter an address to watch
              (read-only). No keys or seeds stored.
            </p>
            <p className="text-xs text-cyber-yellow">
              All signing happens in Xaman or your wallet app — never in this browser.
            </p>
            <div className="pt-4 border-t border-[var(--cyber-border)]">
              <p className="text-xs text-cyber-muted uppercase tracking-wider mb-3">Explore the app</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10 text-xs font-cyber transition-colors"
                >
                  <User size={14} /> Profile
                </Link>
                <Link
                  to="/pay"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10 text-xs font-cyber transition-colors"
                >
                  <DollarSign size={14} /> Pay
                </Link>
                <Link
                  to="/portfolio"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-glow/50 text-cyber-glow hover:bg-cyber-glow/10 text-xs font-cyber transition-colors"
                >
                  ETFs &amp; RLUSD
                </Link>
                <Link
                  to="/tools/ledger-impact"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-glow/50 text-xs font-cyber transition-colors"
                >
                  <BarChart3 size={14} /> Ledger Impact
                </Link>
                <Link
                  to="/tools/dex-order"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-glow/50 text-xs font-cyber transition-colors"
                >
                  <ArrowDownUp size={14} /> DEX
                </Link>
                <Link
                  to="/tools/bridges"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-glow/50 text-xs font-cyber transition-colors"
                >
                  <ArrowRightLeft size={14} /> Bridges
                </Link>
                <Link
                  to="/tools/agents"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-glow/50 text-xs font-cyber transition-colors"
                >
                  <Sparkles size={14} /> Agents
                </Link>
                <Link
                  to="/learn"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-glow/50 text-xs font-cyber transition-colors"
                >
                  <BookOpen size={14} /> Learn
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex pt-[calc(3.5rem+4rem)] min-h-screen">
          <ControlRoomSidebar section={section} onSectionChange={setSection} collapsed={false} />
          <main
            className="flex-1 overflow-auto p-6"
            style={{ minHeight: `calc(100vh - ${APP_NAV_H + TOP_BAR_H}px)` }}
          >
            {fromMissionSubroute && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setSection('mission')}
                  className="text-xs font-cyber text-cyber-cyan hover:underline"
                >
                  ← Back to Mission Control
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {section === 'mission' && (
                <motion.div
                  key="mission"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className={panelClass}>
                    <MissionControlPanel />
                  </div>
                  <ControlRoomHomeSection
                    address={address}
                    networkUI={networkUI}
                    onSectionChange={setSection}
                    onCopyAddress={copyAddress}
                  />
                </motion.div>
              )}

              {section === 'agent_fleet' && (
                <motion.div
                  key="agent_fleet"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={panelClass}
                >
                  <AgentHub />
                </motion.div>
              )}

              {section === 'private_quant' && (
                <motion.div
                  key="private_quant"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={panelClass}
                >
                  <PrivateQuantLabPanel />
                </motion.div>
              )}

              {section === 'policy_firewall' && (
                <motion.div key="policy_firewall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PlaceholderControlRoomPanel
                    title="Policy Firewall"
                    description="Enforceable rules for what agents and tools may request before a human or wallet approves. Central to keeping execution bounded."
                    status="Planned"
                    bullets={['Allow/deny by intent, destination, and amount class', 'Audit trail ties to task receipts (planned)']}
                  />
                </motion.div>
              )}

              {section === 'task_receipts' && (
                <motion.div
                  key="task_receipts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={panelClass}
                >
                  <TaskReceiptsPanel />
                </motion.div>
              )}

              {section === 'security_ops' && (
                <motion.div
                  key="security_ops"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={panelClass}
                >
                  <SecurityOpsPanel />
                </motion.div>
              )}

              {section === 'compliance_guard' && (
                <motion.div
                  key="compliance_guard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={panelClass}
                >
                  <ComplianceGuardPanel />
                </motion.div>
              )}

              {section === 'payment_rails' && (
                <motion.div key="payment_rails" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl">
                  <ILPIntelligencePanel />
                </motion.div>
              )}

              {section === 'ledger_intel' && (
                <motion.div key="ledger_intel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl">
                  <HiddenAnalyticsPanel />
                </motion.div>
              )}

              {section === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="neon-panel max-w-md space-y-4">
                  <h3 className="font-cyber text-cyber-glow">Settings</h3>
                  <p className="text-sm text-cyber-muted">
                    Mission Control is a visualization and orchestration layer. No custody — connect Xaman to sign. No
                    keys stored; no autonomous mainnet execution in this release.
                  </p>
                </motion.div>
              )}

              {section === 'wallet' && (
                <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 max-w-2xl">
                  <div className="neon-panel">
                    <p className="text-xs text-cyber-muted mb-2">Receive</p>
                    {address && (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-sm text-cyber-text truncate bg-[var(--cyber-dark)] px-3 py-2 rounded-lg">
                          {address}
                        </code>
                        <button type="button" onClick={copyAddress} className="neon-button text-sm">
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                  <WalletActionsPanel showLockForm={false} showSection="send" />
                </motion.div>
              )}

              {section === 'trade' && (
                <motion.div key="trade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="max-w-2xl">
                    <WalletActionsPanel showLockForm={false} showSection="dex" />
                  </div>
                </motion.div>
              )}

              {section === 'offers' && (
                <motion.div key="offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="max-w-2xl">
                    <WalletActionsPanel showLockForm={false} showSection="offers" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </div>
  );
}
