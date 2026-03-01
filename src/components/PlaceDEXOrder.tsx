/**
 * Place DEX Order – OfferCreate via autofill, sign with Xumm (or GemWallet when available).
 * Testnet only. Shows tx status and confirmation toast; refreshes portfolio on success.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowDownUp, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { xamanService } from '../services/xaman';
import type { SigningRequest } from '../services/xaman';
import { prepareDexOrder, type DexOrderSide } from '../services/dexOrderService';

type TxStatus = 'idle' | 'preparing' | 'waiting_signature' | 'success' | 'rejected' | 'expired' | 'error';

const TOAST_DURATION_MS = 5000;

export default function PlaceDEXOrder() {
  const { wallets, activeWalletId, refreshWallet } = useWalletStore();
  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : wallets[0];

  const [side, setSide] = useState<DexOrderSide>('sell');
  const [amountXrp, setAmountXrp] = useState('');
  const [tokenCurrency, setTokenCurrency] = useState('');
  const [tokenIssuer, setTokenIssuer] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [status, setStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const signingRequestIdRef = useRef<string | null>(null);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  useEffect(() => {
    if (status !== 'waiting_signature') return;
    const reqId = signingRequestIdRef.current;
    if (!reqId) return;

    const onSigned = (req: SigningRequest) => {
      if (req.id !== reqId) return;
      signingRequestIdRef.current = null;
      setStatus('success');
      setTxHash(req.txHash ?? null);
      setToast({ type: 'success', message: 'Order placed successfully.' });
      if (activeWallet?.id && refreshWallet) refreshWallet(activeWallet.id);
    };
    const onRejected = (req: SigningRequest) => {
      if (req.id !== reqId) return;
      signingRequestIdRef.current = null;
      setStatus('rejected');
      setToast({ type: 'error', message: 'Signing rejected.' });
    };
    const onExpired = (req: SigningRequest) => {
      if (req.id !== reqId) return;
      signingRequestIdRef.current = null;
      setStatus('expired');
      setToast({ type: 'error', message: 'Signing request expired.' });
    };

    xamanService.on('signingSigned', onSigned);
    xamanService.on('signingRejected', onRejected);
    xamanService.on('signingExpired', onExpired);
    return () => {
      xamanService.off('signingSigned', onSigned);
      xamanService.off('signingRejected', onRejected);
      xamanService.off('signingExpired', onExpired);
    };
  }, [status, activeWallet?.id, refreshWallet]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeWallet?.address) {
        setToast({ type: 'error', message: 'Connect a wallet first.' });
        return;
      }
      const amount = parseFloat(amountXrp);
      const price = parseFloat(limitPrice);
      if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(price) || price <= 0) {
        setToast({ type: 'error', message: 'Enter valid amount and limit price.' });
        return;
      }
      if (!tokenCurrency.trim() || !tokenIssuer.trim()) {
        setToast({ type: 'error', message: 'Token currency and issuer are required.' });
        return;
      }

      setErrorMessage(null);
      setStatus('preparing');

      try {
        const tx = await prepareDexOrder({
          account: activeWallet.address,
          side,
          amountXrp: amount,
          tokenCurrency: tokenCurrency.trim(),
          tokenIssuer: tokenIssuer.trim(),
          limitPrice: price,
        });

        if (!xamanService.hasApiCredentials()) {
          setStatus('error');
          setToast({ type: 'error', message: 'Add Xaman API key in Settings to sign orders.' });
          return;
        }

        const req = await xamanService.requestCustomTransactionSignature(
          tx as unknown as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
          activeWallet.address
        );
        signingRequestIdRef.current = req.id;
        setStatus('waiting_signature');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to prepare or send order';
        setStatus('error');
        setErrorMessage(msg);
        setToast({ type: 'error', message: msg });
      }
    },
    [activeWallet, side, amountXrp, limitPrice, tokenCurrency, tokenIssuer]
  );

  const isSubmitting = status === 'preparing' || status === 'waiting_signature';

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-darker/50 p-4 space-y-4">
      <h3 className="font-cyber text-sm font-bold uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
        <ArrowDownUp size={16} />
        Place DEX Order
      </h3>
      <p className="text-xs text-cyber-muted">
        Testnet only. OfferCreate is prepared with autofill and signed via Xaman.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-cyber transition-colors ${
              side === 'sell'
                ? 'border-cyber-glow bg-cyber-glow/20 text-cyber-glow'
                : 'border-cyber-border text-cyber-muted hover:text-cyber-text'
            }`}
          >
            Sell XRP
          </button>
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-cyber transition-colors ${
              side === 'buy'
                ? 'border-cyber-glow bg-cyber-glow/20 text-cyber-glow'
                : 'border-cyber-border text-cyber-muted hover:text-cyber-text'
            }`}
          >
            Buy XRP
          </button>
        </div>

        <div>
          <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">
            Amount (XRP)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={amountXrp}
            onChange={(e) => setAmountXrp(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">
            Token currency
          </label>
          <input
            type="text"
            value={tokenCurrency}
            onChange={(e) => setTokenCurrency(e.target.value)}
            placeholder="USD"
            className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm font-mono"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">
            Token issuer (r...)
          </label>
          <input
            type="text"
            value={tokenIssuer}
            onChange={(e) => setTokenIssuer(e.target.value)}
            placeholder="rIssuer..."
            className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm font-mono"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-[10px] text-cyber-muted uppercase tracking-wider mb-1">
            Limit price (token per 1 XRP)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="100"
            className="w-full px-3 py-2 rounded-lg border border-cyber-border bg-cyber-dark text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-xs text-cyber-red">
            <AlertCircle size={14} />
            {errorMessage}
          </div>
        )}

        {status === 'success' && txHash && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-cyber-green/10 border border-cyber-green/30 text-xs text-cyber-green">
            <CheckCircle2 size={14} />
            <a
              href={`https://testnet.xrpl.org/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline truncate"
            >
              {txHash.slice(0, 16)}…
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !activeWallet}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-cyber-glow/50 bg-cyber-glow/20 text-cyber-glow font-cyber text-sm uppercase tracking-wider hover:bg-cyber-glow/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'preparing' && <Loader2 size={16} className="animate-spin" />}
          {status === 'waiting_signature' && (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sign in Xaman…
            </>
          )}
          {(status === 'idle' || status === 'error' || status === 'rejected' || status === 'expired' || status === 'success') && (
            <>
              <Send size={16} />
              Place order
            </>
          )}
        </button>
      </form>

      {toast && (
        <div
          role="alert"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg ${
            toast.type === 'success'
              ? 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green'
              : 'bg-cyber-red/20 border-cyber-red/50 text-cyber-red'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
