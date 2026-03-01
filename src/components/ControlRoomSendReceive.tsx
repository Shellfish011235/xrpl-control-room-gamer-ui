/**
 * Control Room wallet – Send XRP and Receive (show address + copy).
 * Only use when active wallet is control-room and hasSessionWallet().
 */

import React, { useState, useCallback } from 'react';
import { Send, Copy, Check, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import * as localWalletService from '../services/localWalletService';
import { useWalletStore } from '../store/walletStore';

const TOAST_MS = 4000;

export default function ControlRoomSendReceive() {
  const { activeWalletId, wallets, refreshWallet } = useWalletStore();
  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : wallets[0];

  const [destination, setDestination] = useState('');
  const [amountXrp, setAmountXrp] = useState('');
  const [destTag, setDestTag] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const sessionAddress = localWalletService.getAddress();
  const hasSession = localWalletService.hasSessionWallet();
  const isControlRoomActive = activeWallet?.provider === 'control-room';
  const address = hasSession ? sessionAddress : (isControlRoomActive ? activeWallet?.address : null);
  const canSend = hasSession && sessionAddress === activeWallet?.address;

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

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !sessionAddress || !activeWallet?.id) return;
    const dest = destination.trim();
    const amount = parseFloat(amountXrp);
    const tag = destTag.trim() ? parseInt(destTag, 10) : undefined;
    if (!dest || !Number.isFinite(amount) || amount <= 0) {
      setSendError('Enter a valid destination and amount.');
      return;
    }
    if (tag != null && (Number.isNaN(tag) || tag < 0 || tag > 0xFFFFFFFF)) {
      setSendError('Destination tag must be 0–4294967295.');
      return;
    }
    setSendError(null);
    setSending(true);
    try {
      const { hash } = await localWalletService.sendPayment({
        destination: dest,
        amountXrp: amount,
        destinationTag: tag,
      });
      setTxHash(hash);
      setDestination('');
      setAmountXrp('');
      setDestTag('');
      showToast('Payment sent successfully.');
      if (refreshWallet) refreshWallet(activeWallet.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed';
      setSendError(msg);
      showToast(msg, true);
    } finally {
      setSending(false);
    }
  }, [canSend, sessionAddress, activeWallet?.id, destination, amountXrp, destTag, refreshWallet, showToast]);

  if (!isControlRoomActive) return null;

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-darker/50 p-4 space-y-6">
      <h3 className="font-cyber text-sm font-bold uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
        <ArrowUpFromLine size={16} />
        Send & Receive
      </h3>
      <p className="text-xs text-cyber-muted">
        Control Room wallet – sign and submit from this browser. Testnet/mainnet follows app config.
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
        {!canSend && isControlRoomActive && (
          <p className="text-[10px] text-cyber-yellow">Import this wallet’s seed (Profile → Wallets) to send.</p>
        )}
      </div>

      {/* Send */}
      {canSend && (
      <div className="space-y-3 pt-2 border-t border-cyber-border">
        <h4 className="text-xs text-cyber-muted uppercase tracking-wider flex items-center gap-1">
          <Send size={12} />
          Send XRP
        </h4>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Destination (r...)</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="rDestination..."
              className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm font-mono"
              disabled={sending}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Amount (XRP)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={amountXrp}
                onChange={(e) => setAmountXrp(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm"
                disabled={sending}
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Dest. tag (optional)</label>
              <input
                type="number"
                min="0"
                max="4294967295"
                value={destTag}
                onChange={(e) => setDestTag(e.target.value)}
                placeholder="—"
                className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm"
                disabled={sending}
              />
            </div>
          </div>
          {sendError && (
            <p className="text-xs text-cyber-red">{sendError}</p>
          )}
          {txHash && (
            <p className="text-xs text-cyber-green">
              Sent.{' '}
              <a
                href={`https://testnet.xrpl.org/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View tx
              </a>
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-cyber-glow/50 bg-cyber-glow/20 text-cyber-glow font-cyber text-sm uppercase tracking-wider hover:bg-cyber-glow/30 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending…' : <><Send size={14} /> Send XRP</>}
          </button>
        </form>
      </div>
      )}

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
