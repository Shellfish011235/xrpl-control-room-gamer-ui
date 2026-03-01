/**
 * Control Room – Receive (show address + copy). Watch-only; no in-app signing.
 * To send, user must connect Xaman and sign there.
 */

import React, { useState, useCallback } from 'react';
import { Copy, Check, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

const TOAST_MS = 4000;

export default function ControlRoomSendReceive() {
  const { activeWalletId, wallets } = useWalletStore();
  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : wallets[0];

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const isControlRoomActive = activeWallet?.provider === 'control-room';
  const address = isControlRoomActive ? activeWallet?.address : null;

  const showToast = useCallback((message: string, isError?: boolean) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const displayAddress = address ?? activeWallet?.address ?? '';
  const handleCopyAddress = useCallback(() => {
    if (!displayAddress) return;
    navigator.clipboard.writeText(displayAddress).then(() => {
      setCopied(true);
      showToast('Address copied');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => showToast('Copy failed', true));
  }, [displayAddress, showToast]);


  if (!isControlRoomActive) return null;

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-darker/50 p-4 space-y-6">
      <h3 className="font-cyber text-sm font-bold uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
        <ArrowUpFromLine size={16} />
        Send & Receive
      </h3>
      <p className="text-xs text-cyber-muted">
        Watch-only address. To send XRP, add a Xaman wallet and sign in the app.
      </p>

      {/* Receive */}
      <div className="space-y-2">
        <h4 className="text-xs text-cyber-muted uppercase tracking-wider flex items-center gap-1">
          <ArrowDownToLine size={12} />
          Receive
        </h4>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-xs font-mono text-cyber-text truncate">
            {displayAddress}
          </code>
          <button
            type="button"
            onClick={handleCopyAddress}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border bg-cyber-darker text-cyber-text hover:bg-cyber-glow/10 hover:border-cyber-glow/30 transition-colors text-xs"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-cyber-muted">Share this address to receive XRP.</p>
        {isControlRoomActive && (
          <p className="text-[10px] text-cyber-yellow">To send, connect a Xaman wallet in Profile → Wallets and sign there.</p>
        )}
      </div>

      {toast && (
        <div
          role="alert"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-4 py-3 rounded-lg border shadow-lg text-sm ${
            toast.isError ? 'bg-cyber-red/20 border-cyber-red/50 text-cyber-red' : 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
