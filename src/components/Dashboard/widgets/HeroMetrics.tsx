import { Link } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';
import { useXRPPrice } from '../../../services/websocketPriceFeeds';
import { heroMetricsMock } from '../../../data/dashboardMockData';
import { GamerToggle } from '../GamerToggle';
import { useDashboardStore } from '../../../store/dashboardStore';

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatNum(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

export function HeroMetrics() {
  const { price: liveXrpPrice } = useXRPPrice();
  const wallets = useWalletStore((s) => s.wallets);
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const gamerMode = useDashboardStore((s) => s.gamerMode);

  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : null;
  const balanceXrp = activeWallet?.balance ?? heroMetricsMock.connectedWalletBalance;
  const xrpPrice = liveXrpPrice ?? heroMetricsMock.xrpPrice;
  const totalValueUsd = balanceXrp != null ? balanceXrp * xrpPrice : heroMetricsMock.totalValueUsd;

  return (
    <div
      className={`
        rounded-xl border bg-cyber-panel/80 p-4 h-full flex flex-col justify-center
        ${gamerMode ? 'border-cyber-purple/40 shadow-[0_0_20px_rgba(168,85,247,0.08)]' : 'border-cyber-border'}
      `}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyber-muted mb-0.5">Portfolio value</p>
            <p className={`text-2xl font-cyber ${gamerMode ? 'text-cyber-purple' : 'text-cyber-glow'}`}>
              {formatUsd(totalValueUsd)}
            </p>
          </div>
          <div className="h-8 w-px bg-cyber-border hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyber-muted mb-0.5">XRP</p>
            <p className="text-lg text-cyber-text font-mono">{xrpPrice.toFixed(3)} USD</p>
          </div>
          <div className="h-8 w-px bg-cyber-border hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyber-muted mb-0.5">Ledger</p>
            <p className="text-lg text-cyber-text font-mono">
              #{heroMetricsMock.ledgerIndex.toLocaleString()}
            </p>
          </div>
          <div className="h-8 w-px bg-cyber-border hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyber-muted mb-0.5">24h Txns</p>
            <p className="text-lg text-cyber-text font-mono">{formatNum(heroMetricsMock.recentTxCount / 1000)}k</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border border-cyber-border bg-cyber-darker/80 px-3 py-2 text-sm text-cyber-text hover:border-cyber-glow/50 hover:text-cyber-glow transition-colors"
          >
            {activeWallet ? (
              <>
                <Wallet size={14} />
                <span className="hidden sm:inline">Wallet</span>
                <ArrowRight size={12} />
              </>
            ) : (
              <>
                <Wallet size={14} />
                <span>Connect Xaman</span>
              </>
            )}
          </Link>
          <GamerToggle />
        </div>
      </div>
    </div>
  );
}
