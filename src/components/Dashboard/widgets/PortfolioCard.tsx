import { Link } from 'react-router-dom';
import { Wallet, ChevronRight } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';
import { useXRPPrice } from '../../../services/websocketPriceFeeds';
import { useDashboardStore } from '../../../store/dashboardStore';

export function PortfolioCard() {
  const wallets = useWalletStore((s) => s.wallets);
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { price: xrpPrice } = useXRPPrice();
  const gamerMode = useDashboardStore((s) => s.gamerMode);

  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : null;
  const balance = activeWallet?.balance ?? 0;
  const valueUsd = balance * (xrpPrice ?? 2.48);

  return (
    <div
      className={`
        rounded-xl border h-full flex flex-col overflow-hidden
        ${gamerMode ? 'bg-cyber-panel/90 border-cyber-purple/30' : 'cyber-panel border-cyber-border'}
      `}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan">Portfolio</span>
        </div>
        <Link
          to="/"
          className="text-[10px] text-cyber-muted hover:text-cyber-glow flex items-center gap-1 transition-colors"
        >
          Profile <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center">
        {wallets.length === 0 ? (
          <p className="text-sm text-cyber-muted">Connect Xaman to see balance</p>
        ) : (
          <>
            <p className="text-2xl font-cyber text-cyber-text">{balance.toFixed(2)} XRP</p>
            <p className="text-xs text-cyber-muted mt-1">
              ≈ ${valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            {activeWallet && (
              <p className="text-[10px] text-cyber-muted mt-2 font-mono truncate">{activeWallet.address.slice(0, 12)}…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
