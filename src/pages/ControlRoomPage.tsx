/**
 * Control Room — locked vs unlocked split, top bar, sidebar, sectioned content.
 * When locked: only header (logo + network) + tagline + unlock/import panel.
 * When unlocked: top bar + sidebar + main (Home, Wallet, Trade, Offers, Agents, Settings).
 */

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNetwork, setNetwork } from '../services/xrplClient';
import { ControlRoomWalletProvider, useControlRoomWallet } from '../context/ControlRoomWalletContext';
import ControlRoomTopBar from '../components/ControlRoomTopBar';
import ControlRoomLockView from '../components/ControlRoomLockView';
import ControlRoomSidebar from '../components/ControlRoomSidebar';
import type { ControlRoomSection } from '../components/ControlRoomSidebar';
import ControlRoomHomeSection from '../components/ControlRoomHomeSection';
import WalletActionsPanel from '../components/WalletActionsPanel';
import { AgentHub } from '../components/AgentHub';

const TOP_BAR_H = 56;
const APP_NAV_H = 64;

function ControlRoomContent() {
  const { locked, address, lock, clearSavedWallet } = useControlRoomWallet();
  const net = useMemo(() => getNetwork(), []);
  const [networkUI, setNetworkUI] = useState<'testnet' | 'mainnet'>(net);
  const [section, setSection] = useState<ControlRoomSection>('home');

  const handleNetworkChange = useCallback((next: 'testnet' | 'mainnet') => {
    setNetwork(next);
    setNetworkUI(next);
  }, []);

  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    // Could use react-hot-toast here
    if (typeof window !== 'undefined' && (window as unknown as { __controlRoomToast?: (msg: string) => void }).__controlRoomToast) {
      (window as unknown as { __controlRoomToast: (msg: string) => void }).__controlRoomToast('Address copied');
    }
  }, [address]);

  return (
    <div className="min-h-screen bg-[var(--cyber-darker)]">
      <ControlRoomTopBar
        locked={locked}
        address={address}
        networkUI={networkUI}
        onNetworkChange={handleNetworkChange}
        onLock={lock}
      />

      {locked ? (
        <div className="pt-[calc(3.5rem+4rem)] flex flex-col items-center justify-start min-h-screen">
          <p className="text-sm text-cyber-muted mb-2">Control Room – XRPL Ops Terminal</p>
          <ControlRoomLockView />
        </div>
      ) : (
        <div className="flex pt-[calc(3.5rem+4rem)] min-h-screen">
          <ControlRoomSidebar
            section={section}
            onSectionChange={setSection}
            collapsed={false}
          />
          <main
            className="flex-1 overflow-auto p-6"
            style={{ minHeight: `calc(100vh - ${APP_NAV_H + TOP_BAR_H}px)` }}
          >
            <AnimatePresence mode="wait">
              {section === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ControlRoomHomeSection
                    address={address}
                    networkUI={networkUI}
                    onSectionChange={setSection}
                    onCopyAddress={copyAddress}
                  />
                </motion.div>
              )}
              {section === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="neon-panel">
                    <p className="text-xs text-cyber-muted mb-2">Receive</p>
                    {address && (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-sm text-cyber-text truncate bg-[var(--cyber-dark)] px-3 py-2 rounded-lg">
                          {address}
                        </code>
                        <button
                          type="button"
                          onClick={copyAddress}
                          className="neon-button text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                  <WalletActionsPanel showLockForm={false} showSection="send" />
                </motion.div>
              )}
              {section === 'trade' && (
                <motion.div
                  key="trade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WalletActionsPanel showLockForm={false} showSection="dex" />
                </motion.div>
              )}
              {section === 'offers' && (
                <motion.div
                  key="offers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WalletActionsPanel showLockForm={false} showSection="offers" />
                </motion.div>
              )}
              {section === 'agents' && (
                <motion.div
                  key="agents"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-4xl"
                >
                  <AgentHub />
                </motion.div>
              )}
              {section === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="neon-panel max-w-md space-y-4"
                >
                  <h3 className="font-cyber text-cyber-glow">Settings</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={lock}
                      className="neon-button w-full text-cyber-yellow border-cyber-yellow/50"
                    >
                      Lock wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.confirm('Clear saved wallet from this device? This cannot be undone.')) {
                          clearSavedWallet();
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 w-full text-sm"
                    >
                      Clear saved wallet
                    </button>
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

export default function ControlRoomPage() {
  return (
    <ControlRoomWalletProvider>
      <ControlRoomContent />
    </ControlRoomWalletProvider>
  );
}
