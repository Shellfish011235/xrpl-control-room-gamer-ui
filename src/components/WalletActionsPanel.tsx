/**
 * Control Room Wallet — secure unlock, send XRP, DEX limit order, view/cancel offers.
 * Uses useSecureWallet (encrypted seed) + xrplClient singleton (testnet/mainnet).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { dropsToXrp, xrpToDrops } from 'xrpl';
import { isValidClassicAddress } from 'xrpl';
import type { Wallet } from 'xrpl';
import { useControlRoomWallet } from '../context/ControlRoomWalletContext';
import { getXRPLClient, getNetwork, setNetwork } from '../services/xrplClient';

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
  /** When false, lock UI is not shown (parent shows ControlRoomLockView). When locked and false, panel renders null. */
  showLockForm?: boolean;
  /** When set, only render this section when unlocked. Used by Control Room layout. */
  showSection?: WalletPanelSection;
}

export default function WalletActionsPanel({ showLockForm = true, showSection = 'all' }: WalletActionsPanelProps = {}) {
  const { wallet, address, locked, error, hasSavedSeed, unlock, saveSeed, lock, clearSavedWallet } = useControlRoomWallet();

  const [pw, setPw] = useState('');
  const [seedInput, setSeedInput] = useState('');
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

  async function ensureClient() {
    setNetwork(networkUI);
    return await getXRPLClient();
  }

  async function refreshOffers() {
    setOffersStatus('');
    if (!address) return;
    try {
      const client = await ensureClient();
      setOffersStatus('Loading open offers…');
      const res = await client.request({
        command: 'account_offers',
        account: address,
        ledger_index: 'validated',
      });
      const result = res.result as { offers?: OfferRow[] };
      setOffers(result.offers ?? []);
      setOffersStatus('');
    } catch (e: unknown) {
      setOffersStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function doUnlock() {
    setSendStatus('');
    setDexStatus('');
    setOffersStatus('');
    const ok = await unlock(pw);
    if (ok) {
      setPw('');
      await refreshOffers();
    }
  }

  async function importAndSaveSeed() {
    setSendStatus('');
    setDexStatus('');
    setOffersStatus('');
    if (!seedInput.trim()) return;
    if (!pw.trim()) {
      setOffersStatus('Set a password first (used to encrypt your seed locally).');
      return;
    }
    try {
      await saveSeed(seedInput.trim(), pw);
      setSeedInput('');
      setPw('');
      await refreshOffers();
    } catch (e: unknown) {
      setOffersStatus(String(e instanceof Error ? e.message : e));
    }
  }

  async function sendXrp() {
    setSendStatus('');
    if (!wallet || !address) return;
    if (!isValidClassicAddress(dest.trim())) {
      setSendStatus('Destination address invalid.');
      return;
    }
    const amt = Number(amtXrp);
    if (!Number.isFinite(amt) || amt <= 0) {
      setSendStatus('Amount must be > 0.');
      return;
    }
    try {
      const client = await ensureClient();
      const tx: Record<string, unknown> = {
        TransactionType: 'Payment',
        Account: address,
        Destination: dest.trim(),
        Amount: xrpToDrops(String(amt)),
      };
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const signed = wallet.sign(prepared as unknown as Parameters<Wallet['sign']>[0]);
      setSendStatus('Submitting…');
      const res = await client.submitAndWait(signed.tx_blob);
      const meta = res?.result?.meta as { TransactionResult?: string } | undefined;
      const tr = meta?.TransactionResult;
      if (tr !== 'tesSUCCESS') {
        setSendStatus(`Failed: ${tr ?? 'unknown'}`);
        return;
      }
      const hash = (res.result as { hash?: string }).hash ?? '';
      setSendStatus(`✅ Sent. Hash: ${hash}`);
      setDest('');
      setAmtXrp('');
      await refreshOffers();
    } catch (e: unknown) {
      setSendStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function placeOffer() {
    setDexStatus('');
    if (!wallet || !address) return;
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
    try {
      const client = await ensureClient();
      const x = Number(xrpAmount);
      const t = Number(tokenAmount);
      if (!Number.isFinite(x) || x <= 0) {
        setDexStatus('XRP amount must be > 0.');
        return;
      }
      if (!Number.isFinite(t) || t <= 0) {
        setDexStatus('Token amount must be > 0.');
        return;
      }
      let tx: Record<string, unknown>;
      if (mode === 'sell') {
        // Sell XRP for token: you pay XRP (TakerPays), you get token (TakerGets)
        tx = {
          TransactionType: 'OfferCreate',
          Account: address,
          TakerGets: { currency: cur, issuer, value: String(t) },
          TakerPays: xrpToDrops(String(x)),
        };
      } else {
        // Buy XRP using token: you pay token (TakerPays), you get XRP (TakerGets)
        tx = {
          TransactionType: 'OfferCreate',
          Account: address,
          TakerGets: xrpToDrops(String(x)),
          TakerPays: { currency: cur, issuer, value: String(t) },
        };
      }
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const signed = wallet.sign(prepared as unknown as Parameters<Wallet['sign']>[0]);
      setDexStatus('Submitting…');
      const res = await client.submitAndWait(signed.tx_blob);
      const meta = res?.result?.meta as { TransactionResult?: string } | undefined;
      const tr = meta?.TransactionResult;
      if (tr !== 'tesSUCCESS') {
        setDexStatus(`Failed: ${tr ?? 'unknown'}`);
        return;
      }
      const hash = (res.result as { hash?: string }).hash ?? '';
      setDexStatus(`✅ Offer placed. Hash: ${hash}`);
      await refreshOffers();
    } catch (e: unknown) {
      setDexStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function cancelOffer(offerSeq: number) {
    setOffersStatus('');
    if (!wallet || !address) return;
    try {
      const client = await ensureClient();
      const tx: Record<string, unknown> = {
        TransactionType: 'OfferCancel',
        Account: address,
        OfferSequence: offerSeq,
      };
      const prepared = await client.autofill(tx as unknown as Parameters<typeof client.autofill>[0]);
      const signed = wallet.sign(prepared as unknown as Parameters<Wallet['sign']>[0]);
      setOffersStatus('Cancelling…');
      const res = await client.submitAndWait(signed.tx_blob);
      const meta = res?.result?.meta as { TransactionResult?: string } | undefined;
      const tr = meta?.TransactionResult;
      if (tr !== 'tesSUCCESS') {
        setOffersStatus(`Cancel failed: ${tr ?? 'unknown'}`);
        return;
      }
      const hash = (res.result as { hash?: string }).hash ?? '';
      setOffersStatus(`✅ Cancelled. Hash: ${hash}`);
      await refreshOffers();
    } catch (e: unknown) {
      setOffersStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => {
    setNetwork(networkUI);
  }, [networkUI]);

  if (!showLockForm && locked) return null;

  return (
    <div className="p-4 rounded-2xl border border-cyber-border/50 bg-cyber-darker/40">
      {showLockForm && (
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xl font-cyber text-cyber-glow">CONTROL ROOM WALLET — ACTIONS</div>
          <div className="text-xs text-cyber-muted mt-1">
            Mode: <span className="text-cyber-text">{networkUI}</span> (start with testnet)
          </div>
          <div className="text-xs text-cyber-yellow mt-1">
            ⚠️ In-browser signing is risky for mainnet. Use testnet while building.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNetworkUI((n) => (n === 'testnet' ? 'mainnet' : 'testnet'))}
            className="px-3 py-2 rounded-xl border border-cyber-muted/40 text-cyber-muted hover:bg-cyber-muted/10 transition-colors text-sm"
          >
            Toggle Network
          </button>
          <button
            type="button"
            onClick={() => refreshOffers()}
            className="px-3 py-2 rounded-xl border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors text-sm disabled:opacity-50"
            disabled={!address}
          >
            Refresh Offers
          </button>
        </div>
      </div>
      )}

      {showLockForm && (
      <div className="mt-4 p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
        <div className="text-xs text-cyber-muted">Wallet Status</div>
        <div className="mt-1 text-sm text-cyber-text">
          {locked ? '🔒 Locked' : '✅ Unlocked'}{' '}
          {address ? (
            <span className="text-cyber-muted">— {address.slice(0, 10)}…{address.slice(-6)}</span>
          ) : null}
        </div>
        {error ? <div className="mt-2 text-sm text-cyber-red">{error}</div> : null}
      </div>
      )}

      {locked ? (
        <div className="mt-4 grid gap-3">
          <div className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
            <div className="text-xs text-cyber-muted mb-2">Unlock (if you already saved a seed)</div>
            <div className="flex gap-2">
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Password"
                className="flex-1 px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
              />
              <button
                type="button"
                onClick={doUnlock}
                disabled={!hasSavedSeed || !pw.trim()}
                className="px-4 py-2 rounded-xl border border-cyber-glow/40 text-cyber-glow hover:bg-cyber-glow/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Unlock
              </button>
            </div>
            {!hasSavedSeed ? (
              <div className="mt-2 text-xs text-cyber-yellow">No saved wallet found yet. Import a seed + set password below.</div>
            ) : null}
          </div>
          <div className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
            <div className="text-xs text-cyber-muted mb-2">Import seed + encrypt locally</div>
            <div className="grid gap-2">
              <input
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="Seed (s....) — paste carefully"
                className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
              />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Set password to encrypt seed"
                className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
              />
              <button
                type="button"
                onClick={importAndSaveSeed}
                disabled={!seedInput.trim() || !pw.trim()}
                className="px-4 py-2 rounded-xl border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Import + Save
              </button>
              {offersStatus ? <div className="text-xs text-cyber-muted">{offersStatus}</div> : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`mt-4 grid gap-4 ${showSection === 'all' ? 'md:grid-cols-2' : ''}`}>
            {(showSection === 'all' || showSection === 'send') && (
            <div className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
              <div className="text-sm text-cyber-text mb-2">Send XRP</div>
              <div className="grid gap-2">
                <input
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="Destination r..."
                  className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                />
                <input
                  value={amtXrp}
                  onChange={(e) => setAmtXrp(e.target.value)}
                  placeholder="Amount XRP"
                  className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                />
                <button
                  type="button"
                  onClick={sendXrp}
                  className="px-4 py-2 rounded-xl border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 text-sm"
                >
                  Send
                </button>
                {sendStatus ? <div className="text-xs text-cyber-muted">{sendStatus}</div> : null}
              </div>
            </div>
            )}
            {(showSection === 'all' || showSection === 'dex') && (
            <div className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
              <div className="text-sm text-cyber-text mb-2">DEX Limit Order (OfferCreate)</div>
              <div className="grid gap-2">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'sell' | 'buy')}
                  className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text text-sm"
                >
                  <option value="sell">Sell XRP for Token</option>
                  <option value="buy">Buy XRP using Token</option>
                </select>
                <input
                  value={xrpAmount}
                  onChange={(e) => setXrpAmount(e.target.value)}
                  placeholder="XRP amount"
                  className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                />
                <input
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="Token amount"
                  className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={tokenCurrency}
                    onChange={(e) => setTokenCurrency(e.target.value.toUpperCase())}
                    placeholder="Currency (e.g. RLUSD)"
                    className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                  />
                  <input
                    value={tokenIssuer}
                    onChange={(e) => setTokenIssuer(e.target.value)}
                    placeholder="Issuer r..."
                    className="px-3 py-2 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={placeOffer}
                  className="px-4 py-2 rounded-xl border border-cyber-glow/40 text-cyber-glow hover:bg-cyber-glow/10 text-sm"
                >
                  Place Offer
                </button>
                {dexStatus ? <div className="text-xs text-cyber-muted">{dexStatus}</div> : null}
                <div className="text-xs text-cyber-yellow">You must have a trustline for the token (TrustSet) before holding it.</div>
              </div>
            </div>
            )}
          </div>

          {(showSection === 'all' || showSection === 'offers') && (
          <div className="mt-4 p-3 rounded-xl border border-cyber-border/50 bg-cyber-dark/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-cyber-text">Open Offers</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refreshOffers()}
                  className="px-3 py-2 rounded-xl border border-cyber-muted/40 text-cyber-muted hover:bg-cyber-muted/10 text-sm"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => lock()}
                  className="px-3 py-2 rounded-xl border border-cyber-yellow/40 text-cyber-yellow hover:bg-cyber-yellow/10 text-sm"
                >
                  Lock
                </button>
                <button
                  type="button"
                  onClick={() => clearSavedWallet()}
                  className="px-3 py-2 rounded-xl border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/10 text-sm"
                >
                  Clear Saved
                </button>
              </div>
            </div>
            {offersStatus ? <div className="mt-2 text-xs text-cyber-muted">{offersStatus}</div> : null}
            {!offers?.length ? (
              <div className="mt-3 text-sm text-cyber-muted">No open offers.</div>
            ) : (
              <div className="mt-3 grid gap-2">
                {offers.map((o) => (
                  <div key={o.seq} className="p-3 rounded-xl border border-cyber-border/50 bg-cyber-darker/40">
                    <div className="text-xs text-cyber-muted">
                      OfferSequence: <span className="text-cyber-text">{o.seq}</span>
                    </div>
                    <div className="mt-1 text-sm text-cyber-text">
                      Gets: {fmtIOUAmount(o.taker_gets)} <br />
                      Pays: {fmtIOUAmount(o.taker_pays)}
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelOffer(o.seq)}
                      className="mt-2 px-3 py-2 rounded-xl border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/10 text-sm"
                    >
                      Cancel Offer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
