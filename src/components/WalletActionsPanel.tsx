/**
 * Control Room — read-only balances/offers + Sign in Xaman for Send/DEX/Cancel.
 * No custody: no seed, no in-app signing. Connect wallet (Xaman or watch-only); sign in Xaman.
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { dropsToXrp, xrpToDrops } from 'xrpl';
import { isValidClassicAddress } from 'xrpl';
import { useWalletStore } from '../store/walletStore';
import { getXRPLClient, getNetwork, setNetwork } from '../services/xrplClient';
import { xamanService } from '../services/xaman';
import type { SigningRequest } from '../services/xaman';

interface OfferRow {
  seq: number;
  taker_gets: string | { currency: string; issuer: string; value: string };
  taker_pays: string | { currency: string; issuer: string; value: string };
}

function fmtIOUAmount(a: string | { currency?: string; issuer?: string; value?: string } | undefined): string {
  if (!a) return '';
  if (typeof a === 'string') return `${dropsToXrp(a)} XRP`;
  const issuer = String(a.issuer ?? '');
  return `${a.value ?? ''} ${a.currency ?? ''} (${issuer.slice(0, 6)}…${issuer.slice(-4)})`;
}

export type WalletPanelSection = 'all' | 'send' | 'dex' | 'offers';

interface WalletActionsPanelProps {
  showLockForm?: boolean;
  showSection?: WalletPanelSection;
}

export default function WalletActionsPanel({ showLockForm = true, showSection = 'all' }: WalletActionsPanelProps = {}) {
  const address = useWalletStore((s) => {
    const w = s.activeWalletId ? s.wallets.find((x) => x.id === s.activeWalletId) : s.wallets[0];
    return w?.address ?? null;
  });
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const refreshWallet = useWalletStore((s) => s.refreshWallet);
  const activeWallet = useWalletStore((s) => {
    const w = s.activeWalletId ? s.wallets.find((x) => x.id === s.activeWalletId) : s.wallets[0];
    return w ?? null;
  });

  const [dest, setDest] = useState('');
  const [amtXrp, setAmtXrp] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');
  const [xrpAmount, setXrpAmount] = useState('');
  const [tokenCurrency, setTokenCurrency] = useState('RLUSD');
  const [tokenIssuer, setTokenIssuer] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [dexStatus, setDexStatus] = useState('');
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [offersStatus, setOffersStatus] = useState('');
  const net = useMemo(() => getNetwork(), []);
  const [networkUI, setNetworkUI] = useState<'testnet' | 'mainnet'>(net);

  const pendingSignRef = useRef<{ id: string; type: 'send' | 'dex' | 'cancel'; cancelSeq?: number } | null>(null);

  async function ensureClient() {
    setNetwork(networkUI);
    return await getXRPLClient();
  }

  const refreshOffers = useCallback(async () => {
    setOffersStatus('');
    if (!address) return;
    try {
      const client = await ensureClient();
      setOffersStatus('Loading…');
      const res = await client.request({ command: 'account_offers', account: address, ledger_index: 'validated' });
      const result = res.result as { offers?: OfferRow[] };
      setOffers(result.offers ?? []);
      setOffersStatus('');
    } catch (e: unknown) {
      setOffersStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [address, networkUI]);

  useEffect(() => {
    const onSigned = (req: SigningRequest) => {
      const p = pendingSignRef.current;
      if (!p || req.id !== p.id) return;
      pendingSignRef.current = null;
      if (p.type === 'send') {
        setSendStatus(`✅ Sent. Hash: ${req.txHash ?? '—'}`);
        setDest('');
        setAmtXrp('');
      } else if (p.type === 'dex') {
        setDexStatus(`✅ Offer placed. Hash: ${req.txHash ?? '—'}`);
      } else if (p.type === 'cancel') {
        setOffersStatus(`✅ Cancelled. Hash: ${req.txHash ?? '—'}`);
      }
      refreshOffers();
      if (activeWallet?.id && refreshWallet) refreshWallet(activeWallet.id);
    };
    const onRejected = (req: SigningRequest) => {
      const p = pendingSignRef.current;
      if (!p || req.id !== p.id) return;
      pendingSignRef.current = null;
      if (p.type === 'send') setSendStatus('Rejected.');
      else if (p.type === 'dex') setDexStatus('Rejected.');
      else if (p.type === 'cancel') setOffersStatus('Rejected.');
    };
    const onExpired = (req: SigningRequest) => {
      const p = pendingSignRef.current;
      if (!p || req.id !== p.id) return;
      pendingSignRef.current = null;
      if (p.type === 'send') setSendStatus('Expired.');
      else if (p.type === 'dex') setDexStatus('Expired.');
      else if (p.type === 'cancel') setOffersStatus('Expired.');
    };
    xamanService.on('signingSigned', onSigned);
    xamanService.on('signingRejected', onRejected);
    xamanService.on('signingExpired', onExpired);
    return () => {
      xamanService.off('signingSigned', onSigned);
      xamanService.off('signingRejected', onRejected);
      xamanService.off('signingExpired', onExpired);
    };
  }, [refreshOffers, activeWallet?.id, refreshWallet]);

  async function sendXrp() {
    setSendStatus('');
    if (!address) return;
    if (!isValidClassicAddress(dest.trim())) {
      setSendStatus('Destination address invalid.');
      return;
    }
    const amt = Number(amtXrp);
    if (!Number.isFinite(amt) || amt <= 0) {
      setSendStatus('Amount must be > 0.');
      return;
    }
    if (!xamanService.hasApiCredentials()) {
      setSendStatus('Add Xaman API key in Settings to sign.');
      return;
    }
    try {
      const client = await ensureClient();
      const tx = {
        TransactionType: 'Payment',
        Account: address,
        Destination: dest.trim(),
        Amount: xrpToDrops(String(amt)),
      };
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const req = await xamanService.requestCustomTransactionSignature(
        prepared as unknown as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
        address
      );
      pendingSignRef.current = { id: req.id, type: 'send' };
      setSendStatus('Waiting for signature in Xaman…');
    } catch (e: unknown) {
      setSendStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function placeOffer() {
    setDexStatus('');
    if (!address) return;
    const issuer = tokenIssuer.trim();
    if (!isValidClassicAddress(issuer)) {
      setDexStatus('Token issuer address invalid.');
      return;
    }
    const cur = tokenCurrency.trim().toUpperCase();
    if (!cur) {
      setDexStatus('Token currency required.');
      return;
    }
    if (!xamanService.hasApiCredentials()) {
      setDexStatus('Add Xaman API key in Settings to sign.');
      return;
    }
    try {
      const client = await ensureClient();
      const x = Number(xrpAmount);
      const t = Number(tokenAmount);
      if (!Number.isFinite(x) || x <= 0 || !Number.isFinite(t) || t <= 0) {
        setDexStatus('Amounts must be > 0.');
        return;
      }
      const tx =
        mode === 'sell'
          ? { TransactionType: 'OfferCreate', Account: address, TakerGets: { currency: cur, issuer, value: String(t) }, TakerPays: xrpToDrops(String(x)) }
          : { TransactionType: 'OfferCreate', Account: address, TakerGets: xrpToDrops(String(x)), TakerPays: { currency: cur, issuer, value: String(t) } };
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const req = await xamanService.requestCustomTransactionSignature(
        prepared as unknown as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
        address
      );
      pendingSignRef.current = { id: req.id, type: 'dex' };
      setDexStatus('Waiting for signature in Xaman…');
    } catch (e: unknown) {
      setDexStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function cancelOffer(offerSeq: number) {
    setOffersStatus('');
    if (!address) return;
    if (!xamanService.hasApiCredentials()) {
      setOffersStatus('Add Xaman API key in Settings to sign.');
      return;
    }
    try {
      const client = await ensureClient();
      const tx = { TransactionType: 'OfferCancel', Account: address, OfferSequence: offerSeq };
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const req = await xamanService.requestCustomTransactionSignature(
        prepared as unknown as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
        address
      );
      pendingSignRef.current = { id: req.id, type: 'cancel', cancelSeq: offerSeq };
      setOffersStatus('Waiting for signature in Xaman…');
    } catch (e: unknown) {
      setOffersStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => {
    setNetwork(networkUI);
  }, [networkUI]);

  if (!address) {
    return (
      <div className="p-4 rounded-2xl border border-cyber-border/50 bg-cyber-darker/40">
        <p className="text-cyber-muted text-sm">Connect a wallet (Profile → Wallets) to view balances and sign in Xaman.</p>
      </div>
    );
  }

  const hasXaman = xamanService.hasApiCredentials();

  return (
    <div className="p-4 rounded-2xl border border-cyber-border/50 bg-cyber-darker/40">
      {showLockForm && (
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-xl font-cyber text-cyber-glow">CONTROL ROOM — ACTIONS</div>
            <div className="text-xs text-cyber-muted mt-1">Mode: <span className="text-cyber-text">{networkUI}</span></div>
            {!hasXaman && (
              <div className="text-xs text-cyber-yellow mt-1">Add Xaman API key in Settings to sign Send/DEX/Cancel.</div>
            )}
          </div>
          <button type="button" onClick={() => refreshOffers()} className="px-3 py-2 rounded-xl border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 text-sm" disabled={!address}>
            Refresh Offers
          </button>
        </div>
      )}

      <div className={`mt-4 grid gap-4 ${showSection === 'all' ? 'md:grid-cols-2' : ''}`}>
        {(showSection === 'all' || showSection === 'send') && (
          <div className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
            <div className="text-sm text-cyber-text mb-2">Send XRP (sign in Xaman)</div>
            <div className="grid gap-2">
              <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Destination r..." className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <input value={amtXrp} onChange={(e) => setAmtXrp(e.target.value)} placeholder="Amount XRP" className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <button type="button" onClick={sendXrp} disabled={!hasXaman} className="px-4 py-2 rounded-xl border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 text-sm disabled:opacity-50">
                Sign in Xaman…
              </button>
              {sendStatus && <div className="text-xs text-cyber-muted">{sendStatus}</div>}
            </div>
          </div>
        )}
        {(showSection === 'all' || showSection === 'dex') && (
          <div className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
            <div className="text-sm text-cyber-text mb-2">DEX Limit Order (sign in Xaman)</div>
            <div className="grid gap-2">
              <select value={mode} onChange={(e) => setMode(e.target.value as 'sell' | 'buy')} className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text text-sm">
                <option value="sell">Sell XRP for Token</option>
                <option value="buy">Buy XRP using Token</option>
              </select>
              <input value={xrpAmount} onChange={(e) => setXrpAmount(e.target.value)} placeholder="XRP amount" className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <input value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} placeholder="Token amount" className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={tokenCurrency} onChange={(e) => setTokenCurrency(e.target.value.toUpperCase())} placeholder="Currency" className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
                <input value={tokenIssuer} onChange={(e) => setTokenIssuer(e.target.value)} placeholder="Issuer r..." className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              </div>
              <button type="button" onClick={placeOffer} disabled={!hasXaman} className="px-4 py-2 rounded-xl border border-cyber-glow/40 text-cyber-glow hover:bg-cyber-glow/10 text-sm disabled:opacity-50">
                Sign in Xaman…
              </button>
              {dexStatus && <div className="text-xs text-cyber-muted">{dexStatus}</div>}
              <div className="text-xs text-cyber-yellow">Trustline required for the token. Sign in Xaman.</div>
            </div>
          </div>
        )}
      </div>

      {(showSection === 'all' || showSection === 'offers') && (
        <div className="mt-4 p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-cyber-text">Open Offers</div>
            <button type="button" onClick={() => refreshOffers()} className="px-3 py-2 rounded-xl border border-cyber-muted/40 text-cyber-muted hover:bg-cyber-muted/10 text-sm">
              Refresh
            </button>
          </div>
          {offersStatus && <div className="mt-2 text-xs text-cyber-muted">{offersStatus}</div>}
          {!offers?.length ? (
            <div className="mt-3 text-sm text-cyber-muted">No open offers.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {offers.map((o) => (
                <div key={o.seq} className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-darker/40">
                  <div className="text-xs text-cyber-muted">Seq: <span className="text-cyber-text">{o.seq}</span></div>
                  <div className="mt-1 text-sm text-cyber-text">Gets: {fmtIOUAmount(o.taker_gets)} · Pays: {fmtIOUAmount(o.taker_pays)}</div>
                  <button type="button" onClick={() => cancelOffer(o.seq)} disabled={!hasXaman} className="mt-2 px-3 py-2 rounded-xl border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/10 text-sm disabled:opacity-50">
                    Cancel (sign in Xaman)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
