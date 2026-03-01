/**
 * Control Room top bar: logo, network toggle, address + Lock (when unlocked), optional alert.
 */

import { Lock, Bell } from 'lucide-react';
import { getNetwork, setNetwork } from '../services/xrplClient';

interface ControlRoomTopBarProps {
  locked: boolean;
  address: string | null;
  networkUI: 'testnet' | 'mainnet';
  onNetworkChange: (net: 'testnet' | 'mainnet') => void;
  onLock: () => void;
}

export default function ControlRoomTopBar({
  locked,
  address,
  networkUI,
  onNetworkChange,
  onLock,
}: ControlRoomTopBarProps) {
  function selectTestnet() {
    setNetwork('testnet');
    onNetworkChange('testnet');
  }
  function selectMainnet() {
    setNetwork('mainnet');
    onNetworkChange('mainnet');
  }

  return (
    <header className="fixed top-16 left-0 right-0 z-40 h-12 md:h-14 flex items-center justify-between px-4 bg-[var(--cyber-darker)]/95 border-b border-[var(--cyber-border)] backdrop-blur-sm">
      {/* Left: logo / title */}
      <div className="flex items-center gap-2">
        <span className="font-cyber text-lg text-[var(--cyber-cyan)] neon-glow">XRPL Control Room</span>
      </div>

      {/* Center: network pill */}
      <div className="absolute left-1/2 -translate-x-1/2 flex rounded-full border border-[var(--cyber-border)] p-0.5 bg-[var(--cyber-darker)]">
        <button
          type="button"
          onClick={selectTestnet}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            networkUI === 'testnet'
              ? 'bg-[var(--cyber-cyan)]/20 text-[var(--cyber-cyan)]'
              : 'text-cyber-muted hover:text-cyber-text'
          }`}
        >
          Testnet
        </button>
        <button
          type="button"
          onClick={selectMainnet}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            networkUI === 'mainnet'
              ? 'bg-amber-500/20 text-amber-400'
              : 'text-cyber-muted hover:text-cyber-text'
          }`}
        >
          Mainnet
        </button>
      </div>

      {/* Right: address + Lock + optional alert */}
      <div className="flex items-center gap-2">
        {!locked && address && (
          <span className="font-mono text-xs text-cyber-muted max-w-[120px] truncate" title={address}>
            r…{address.slice(-4)}
          </span>
        )}
        {!locked && (
          <button
            type="button"
            onClick={onLock}
            className="p-2 rounded-lg border border-cyber-yellow/40 text-cyber-yellow hover:bg-cyber-yellow/10 transition-colors"
            title="Lock wallet"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          className="p-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text transition-colors"
          title="Alerts / tx results"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
