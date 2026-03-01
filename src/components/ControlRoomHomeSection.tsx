/**
 * Control Room Home: hero balance card + quick actions (Send, Receive, Place Trade, View Offers).
 */

import { motion } from 'framer-motion';
import { Send, QrCode, ArrowLeftRight, List } from 'lucide-react';
import { useXrplAccount } from '../hooks/useXrplAccount';
import type { ControlRoomSection } from './ControlRoomSidebar';

interface ControlRoomHomeSectionProps {
  address: string | null;
  networkUI: 'testnet' | 'mainnet';
  onSectionChange: (s: ControlRoomSection) => void;
  onCopyAddress: () => void;
}

export default function ControlRoomHomeSection({
  address,
  networkUI,
  onSectionChange,
  onCopyAddress,
}: ControlRoomHomeSectionProps) {
  const useTestnet = networkUI === 'testnet';
  const { xrpBalance, tokens, error, loading } = useXrplAccount(address ?? undefined, useTestnet);

  const isAccountNotFound =
    error &&
    (error.toLowerCase().includes('account not found') ||
      error.toLowerCase().includes('actnotfound') ||
      error === 'Account not found.');

  const quickActions = [
    { id: 'wallet' as const, label: 'Send XRP', icon: Send, section: 'wallet' as ControlRoomSection },
    { id: 'receive', label: 'Receive', icon: QrCode, section: 'wallet' as ControlRoomSection },
    { id: 'trade' as const, label: 'Place Trade', icon: ArrowLeftRight, section: 'trade' as ControlRoomSection },
    { id: 'offers' as const, label: 'View Offers', icon: List, section: 'offers' as ControlRoomSection },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero balance card */}
      <div className="neon-panel">
        <p className="text-xs text-cyber-muted mb-1">Balance</p>
        {loading && !xrpBalance && !error && <p className="text-cyber-muted">Loading…</p>}
        {error && !isAccountNotFound && <p className="text-cyber-red text-sm">{error}</p>}
        {isAccountNotFound && (
          <p className="text-cyber-muted text-sm mb-2">
            Address not activated on this network. Fund it with XRP to see balance, or switch network.
          </p>
        )}
        {(isAccountNotFound || (!loading && xrpBalance != null)) && (
          <>
            <p className="text-3xl font-mono font-cyber text-[var(--cyber-glow)] neon-glow">
              {isAccountNotFound ? '0' : xrpBalance} <span className="text-lg text-cyber-text">XRP</span>
            </p>
            {!isAccountNotFound && tokens.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--cyber-border)]">
                <p className="text-xs text-cyber-muted mb-2">Tokens</p>
                <div className="grid grid-cols-2 gap-2">
                  {tokens.slice(0, 6).map((t) => (
                    <div key={`${t.currency}-${t.peer}`} className="text-sm font-mono text-cyber-text">
                      {t.balance} {t.currency}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(({ id, label, icon: Icon, section }) => (
          <motion.button
            key={id}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => id === 'receive' ? onCopyAddress() : onSectionChange(section)}
            className="neon-panel flex flex-col items-center gap-2 py-4 text-[var(--cyber-cyan)] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-shadow"
          >
            <Icon className="w-6 h-6" />
            <span className="text-sm font-cyber">{label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
