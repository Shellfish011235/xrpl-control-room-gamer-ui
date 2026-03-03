/**
 * Control Room Home: hero balance card + quick actions + Ripple partners & ecosystem.
 */

import { motion } from 'framer-motion';
import { Send, QrCode, ArrowLeftRight, List, Building2, ExternalLink } from 'lucide-react';
import { useXrplAccount } from '../hooks/useXrplAccount';
import type { ControlRoomSection } from './ControlRoomSidebar';
import { getPartnersByCategory, RIPPLE_PARTNER_CATEGORIES, type PartnerCategory } from '../data/ripplePartners';

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

      {/* Ripple partners & ecosystem */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="neon-panel overflow-hidden"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--cyber-border)] mb-3">
          <Building2 className="w-5 h-5 text-[var(--cyber-glow)]" />
          <h2 className="text-sm font-cyber text-cyber-text">Partners &amp; ecosystem</h2>
          <a
            href="https://ripple.com/partners"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[10px] text-cyber-muted hover:text-cyber-cyan flex items-center gap-1"
          >
            Ripple partners <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[10px] text-cyber-muted mb-3">
          Companies partnering with Ripple or using Ripple/XRP/XRPL (payments, RLUSD, treasury). Illustrative; see ripple.com for official list.
        </p>
        <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
          {(Object.entries(getPartnersByCategory()) as [PartnerCategory, typeof RIPPLE_PARTNERS][])
            .filter(([, list]) => list.length > 0)
            .map(([cat, list]) => (
              <div key={cat}>
                <p className="text-[10px] text-cyber-cyan uppercase tracking-wider mb-2">
                  {RIPPLE_PARTNER_CATEGORIES[cat]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((partner) =>
                    partner.url ? (
                      <a
                        key={`${cat}-${partner.name}-${partner.region ?? ''}`}
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--cyber-darker)]/80 border border-[var(--cyber-border)] text-xs text-cyber-text hover:border-cyber-glow/50 hover:text-cyber-glow transition-colors"
                        title={partner.note}
                      >
                        {partner.name}
                        {partner.region && <span className="text-cyber-muted">({partner.region})</span>}
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    ) : (
                      <span
                        key={`${cat}-${partner.name}-${partner.region ?? ''}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--cyber-darker)]/80 border border-[var(--cyber-border)] text-xs text-cyber-text"
                        title={partner.note}
                      >
                        {partner.name}
                        {partner.region && <span className="text-cyber-muted">({partner.region})</span>}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
