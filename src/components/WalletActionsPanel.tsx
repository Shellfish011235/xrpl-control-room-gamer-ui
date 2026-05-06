/**
 * Control Room — read-only balances/offers + Sign in Xaman for Send/DEX/Cancel.
 * Safety Kernel v0.2: all signing requests pass through evaluateSafetyIntent.
 * No custody: no seed, no in-app signing. Connect wallet (Xaman or watch-only); sign in Xaman.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { dropsToXrp, xrpToDrops, isValidClassicAddress } from 'xrpl';
import { useWalletStore } from '../store/walletStore';
import { useSettingsStore } from '../store/settingsStore';
import { useXrplAddressBookSorted, useXrplAddressBookStore } from '../store/xrplAddressBookStore';
import { getXRPLClient, setNetwork } from '../services/xrplClient';
import { xamanService } from '../services/xaman';
import type { SigningRequest } from '../services/xaman';
import { evaluateSafetyIntent, summarizeSafetyDecision } from '../safety/safetyKernel';
import type { SafetyDecision } from '../safety/safetyTypes';
import { recordWalletSafetyReceipt } from '../receipts/walletActionReceiptHelpers';
import { IntentPreviewCard } from './safety/IntentPreviewCard';

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

  const network = useSettingsStore((s) => s.network);
  const safetyMode = useSettingsStore((s) => s.safetyMode);
  const mainnetConfirmedAt = useSettingsStore((s) => s.mainnetConfirmedAt);

  const [dest, setDest] = useState('');
  const [destTagStr, setDestTagStr] = useState('');
  const [saveLabel, setSaveLabel] = useState('');
  const [amtXrp, setAmtXrp] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const savedContacts = useXrplAddressBookSorted();
  const addOrUpdateContact = useXrplAddressBookStore((s) => s.addOrUpdateContact);
  const removeContact = useXrplAddressBookStore((s) => s.removeContact);
  const recordUse = useXrplAddressBookStore((s) => s.recordUse);
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');
  const [xrpAmount, setXrpAmount] = useState('');
  const [tokenCurrency, setTokenCurrency] = useState('RLUSD');
  const [tokenIssuer, setTokenIssuer] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [dexStatus, setDexStatus] = useState('');
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [offersStatus, setOffersStatus] = useState('');
  const [sendPreview, setSendPreview] = useState<SafetyDecision | null>(null);

  const pendingSignRef = useRef<{ id: string; type: 'send' | 'dex' | 'cancel'; cancelSeq?: number } | null>(null);

  async function ensureClient() {
    setNetwork(network);
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
  }, [address, network]);

  useEffect(() => {
    setNetwork(network);
  }, [network]);

  useEffect(() => {
    const onSigned = (req: SigningRequest) => {
      const p = pendingSignRef.current;
      if (!p || req.id !== p.id) return;
      pendingSignRef.current = null;
      void recordWalletSafetyReceipt({
        title: 'Xaman signing flow completed',
        summary: `Type: ${p.type}. Hash: ${req.txHash ?? '—'}. No custody or in-app keys; external wallet only.`,
        mode: 'user_approved_signing',
        status: 'passed',
      });
      if (p.type === 'send') {
        setSendStatus(`✅ Sent. Hash: ${req.txHash ?? '—'}`);
        setDest('');
        setDestTagStr('');
        setAmtXrp('');
        setSendPreview(null);
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
      void recordWalletSafetyReceipt({
        title: 'Xaman request rejected',
        summary: `Type: ${p.type}. User declined or dismissed in wallet.`,
        mode: 'user_approved_signing',
        status: 'needs_review',
      });
      if (p.type === 'send') setSendStatus('Rejected.');
      else if (p.type === 'dex') setDexStatus('Rejected.');
      else if (p.type === 'cancel') setOffersStatus('Rejected.');
    };
    const onExpired = (req: SigningRequest) => {
      const p = pendingSignRef.current;
      if (!p || req.id !== p.id) return;
      pendingSignRef.current = null;
      void recordWalletSafetyReceipt({
        title: 'Xaman request expired',
        summary: `Type: ${p.type}.`,
        mode: 'user_approved_signing',
        status: 'needs_review',
      });
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
    setSendPreview(null);
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
    let destinationTag: number | undefined;
    if (destTagStr.trim()) {
      const t = parseInt(destTagStr.trim(), 10);
      if (!Number.isFinite(t) || t < 0 || t > 0xffffffff) {
        setSendStatus('Destination tag must be a valid 32-bit unsigned integer.');
        return;
      }
      destinationTag = t;
    }

    const decision = evaluateSafetyIntent(
      {
        id: `send-${Date.now()}`,
        source: 'wallet_actions',
        action: 'send_xrp',
        capability: 'request_wallet_signature',
        mode: safetyMode,
        network,
        amountXrp: amt,
        destination: dest.trim(),
        destinationTag,
        transactionType: 'Payment',
        metadata: { activeWalletId, mainnetConfirmedAt },
      },
      safetyMode
    );
    setSendPreview(decision);

    if (!decision.allowed) {
      setSendStatus(`Blocked by Safety Kernel: ${decision.reasons.join(' ')}`);
      await recordWalletSafetyReceipt({
        title: 'Blocked signing request (send XRP)',
        summary: `${decision.reasons.join('; ')} Warnings: ${decision.warnings.join('; ')}`,
        mode: 'blocked',
        status: 'blocked',
      });
      return;
    }
    if (decision.status === 'needs_review') {
      const ok = typeof window !== 'undefined' && window.confirm(summarizeSafetyDecision(decision));
      if (!ok) return;
    } else if (decision.warnings.length && network === 'mainnet') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm(`${decision.warnings.join('\n')}\n\nContinue to create Xaman request?`);
      if (!ok) return;
    }

    try {
      const client = await ensureClient();
      recordUse(dest.trim());
      const tx: Record<string, unknown> = {
        TransactionType: 'Payment',
        Account: address,
        Destination: dest.trim(),
        Amount: xrpToDrops(String(amt)),
      };
      if (destinationTag !== undefined) tx.DestinationTag = destinationTag;
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const req = await xamanService.requestCustomTransactionSignature(
        prepared as unknown as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
        address
      );
      pendingSignRef.current = { id: req.id, type: 'send' };
      setSendStatus('Waiting for signature in Xaman…');
      await recordWalletSafetyReceipt({
        title: 'Xaman signing request created (Payment)',
        summary: `To ${dest.trim().slice(0, 10)}… Amount ${amt} XRP. ${decision.warnings.join(' ')}`,
        mode: 'user_approved_signing',
        status: 'needs_review',
      });
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
    const x = Number(xrpAmount);
    const t = Number(tokenAmount);
    if (!Number.isFinite(x) || x <= 0 || !Number.isFinite(t) || t <= 0) {
      setDexStatus('Amounts must be > 0.');
      return;
    }

    const decision = evaluateSafetyIntent(
      {
        id: `dex-${Date.now()}`,
        source: 'wallet_actions',
        action: 'place_offer',
        capability: 'request_wallet_signature',
        mode: safetyMode,
        network,
        amountXrp: x,
        issuer,
        currency: cur,
        transactionType: 'OfferCreate',
        metadata: { activeWalletId, mainnetConfirmedAt, tokenAmount: t, dexMode: mode },
      },
      safetyMode
    );

    if (!decision.allowed) {
      setDexStatus(`Blocked by Safety Kernel: ${decision.reasons.join(' ')}`);
      await recordWalletSafetyReceipt({
        title: 'Blocked signing request (DEX offer)',
        summary: decision.reasons.join('; '),
        mode: 'blocked',
        status: 'blocked',
      });
      return;
    }
    if (decision.status === 'needs_review') {
      const ok = typeof window !== 'undefined' && window.confirm(summarizeSafetyDecision(decision));
      if (!ok) return;
    } else if (decision.warnings.length && network === 'mainnet') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm(`${decision.warnings.join('\n')}\n\nContinue to create Xaman request?`);
      if (!ok) return;
    }

    try {
      const client = await ensureClient();
      const tx =
        mode === 'sell'
          ? {
              TransactionType: 'OfferCreate',
              Account: address,
              TakerGets: { currency: cur, issuer, value: String(t) },
              TakerPays: xrpToDrops(String(x)),
            }
          : {
              TransactionType: 'OfferCreate',
              Account: address,
              TakerGets: xrpToDrops(String(x)),
              TakerPays: { currency: cur, issuer, value: String(t) },
            };
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const req = await xamanService.requestCustomTransactionSignature(
        prepared as unknown as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
        address
      );
      pendingSignRef.current = { id: req.id, type: 'dex' };
      setDexStatus('Waiting for signature in Xaman…');
      await recordWalletSafetyReceipt({
        title: 'Xaman signing request created (OfferCreate)',
        summary: `${cur} @ ${issuer.slice(0, 8)}… XRP leg ${x}`,
        mode: 'user_approved_signing',
        status: 'needs_review',
      });
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

    const decision = evaluateSafetyIntent(
      {
        id: `cancel-${Date.now()}`,
        source: 'wallet_actions',
        action: 'cancel_offer',
        capability: 'request_wallet_signature',
        mode: safetyMode,
        network,
        transactionType: 'OfferCancel',
        metadata: { activeWalletId, mainnetConfirmedAt, offerSeq },
      },
      safetyMode
    );

    if (!decision.allowed) {
      setOffersStatus(`Blocked by Safety Kernel: ${decision.reasons.join(' ')}`);
      await recordWalletSafetyReceipt({
        title: 'Blocked signing request (cancel offer)',
        summary: decision.reasons.join('; '),
        mode: 'blocked',
        status: 'blocked',
      });
      return;
    }
    if (decision.status === 'needs_review') {
      const ok = typeof window !== 'undefined' && window.confirm(summarizeSafetyDecision(decision));
      if (!ok) return;
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
      await recordWalletSafetyReceipt({
        title: 'Xaman signing request created (OfferCancel)',
        summary: `Offer sequence ${offerSeq}`,
        mode: 'user_approved_signing',
        status: 'needs_review',
      });
    } catch (e: unknown) {
      setOffersStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

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
            <div className="text-xs text-cyber-muted mt-1">
              Network: <span className="text-cyber-text">{network}</span>
              {' · '}
              Safety: <span className="text-cyber-cyan">{safetyMode.replace(/_/g, ' ')}</span>
            </div>
            {safetyMode !== 'user_approved_signing' && (
              <div className="text-xs text-cyber-yellow mt-1 max-w-xl">
                Switch <strong className="text-cyber-text">Safety Mode</strong> to <strong>User-approved Wallet Signing</strong>{' '}
                (Compliance Guard) to create Xaman signing requests.
              </div>
            )}
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
              {sendPreview && (
                <IntentPreviewCard
                  title="Safety check — Payment"
                  action="send_xrp"
                  network={network}
                  amountXrp={Number(amtXrp) || undefined}
                  destination={dest.trim() || undefined}
                  destinationTag={destTagStr.trim() ? parseInt(destTagStr, 10) : undefined}
                  decision={sendPreview}
                  onCancel={() => setSendPreview(null)}
                />
              )}
              {savedContacts.length > 0 && (
                <details className="rounded-xl border border-cyber-border/60 bg-cyber-darker/40 px-2 py-1">
                  <summary className="cursor-pointer text-xs text-cyber-muted py-1">
                    Saved addresses ({savedContacts.length}) — tap to pick or remove
                  </summary>
                  <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto pb-1">
                    {savedContacts.map((c) => (
                      <li key={c.id} className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          className="min-w-0 flex-1 truncate rounded border border-cyber-border/50 px-2 py-1 text-left text-cyber-text hover:bg-cyber-cyan/10"
                          onClick={() => {
                            setDest(c.address);
                            setDestTagStr(c.destinationTag != null ? String(c.destinationTag) : '');
                            setSaveLabel(c.label === 'Saved' ? '' : c.label);
                          }}
                        >
                          <span className="text-cyber-glow">{c.label}</span>
                          <span className="text-cyber-muted"> · </span>
                          <span className="font-mono">
                            {c.address.slice(0, 10)}…{c.address.slice(-6)}
                          </span>
                          {c.destinationTag != null ? <span className="text-cyber-muted"> · tag {c.destinationTag}</span> : null}
                        </button>
                        <button
                          type="button"
                          className="shrink-0 px-2 py-1 text-cyber-red hover:bg-cyber-red/10 rounded"
                          title="Remove from saved"
                          onClick={() => removeContact(c.id)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Destination r..." className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <input value={destTagStr} onChange={(e) => setDestTagStr(e.target.value)} placeholder="Destination tag (optional)" className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <input value={amtXrp} onChange={(e) => setAmtXrp(e.target.value)} placeholder="Amount XRP" className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm" />
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="Label (e.g. Hot wallet)"
                  className="min-w-[140px] flex-1 px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!isValidClassicAddress(dest.trim())) {
                      setSendStatus('Enter a valid destination before saving.');
                      return;
                    }
                    let tag: number | undefined;
                    if (destTagStr.trim()) {
                      const t = parseInt(destTagStr.trim(), 10);
                      if (!Number.isFinite(t) || t < 0) {
                        setSendStatus('Invalid destination tag for save.');
                        return;
                      }
                      tag = t;
                    }
                    addOrUpdateContact({
                      address: dest.trim(),
                      label: saveLabel.trim() || undefined,
                      destinationTag: tag,
                    });
                    setSendStatus('Saved to this browser.');
                    setTimeout(() => setSendStatus((s) => (s === 'Saved to this browser.' ? '' : s)), 2500);
                  }}
                  className="px-3 py-2 rounded-xl border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-text/40 text-sm"
                >
                  Save address
                </button>
              </div>
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
                  <div className="text-xs text-cyber-muted">
                    Seq: <span className="text-cyber-text">{o.seq}</span>
                  </div>
                  <div className="mt-1 text-sm text-cyber-text">
                    Gets: {fmtIOUAmount(o.taker_gets)} · Pays: {fmtIOUAmount(o.taker_pays)}
                  </div>
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
