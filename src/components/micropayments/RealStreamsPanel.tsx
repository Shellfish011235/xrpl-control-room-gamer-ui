/**
 * Real streaming: payment channels (create, list from ledger) and repeated Payments (stream).
 * No demo — uses XRPL mainnet and Xaman for signing.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
  Plus,
  Send,
  RefreshCw,
  ExternalLink,
  Zap,
  AlertCircle,
  Loader,
  Play,
  Square,
} from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import { getPaymentChannels, buildPaymentChannelCreateTx, type PaymentChannelLedgerEntry } from '../../services/xrplService';
import { xamanService } from '../../services/xaman/xamanService';
import { isValidXRPLAddress } from '../../services/xrplService';

export function RealStreamsPanel() {
  const { wallets, activeWalletId } = useWalletStore();
  const activeWallet = wallets.find((w) => w.id === activeWalletId);
  const senderAddress = activeWallet?.address && activeWallet?.provider !== 'demo' ? activeWallet.address : null;

  const [channels, setChannels] = useState<PaymentChannelLedgerEntry[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [createForm, setCreateForm] = useState(false);
  const [createDest, setCreateDest] = useState('');
  const [createAmount, setCreateAmount] = useState('10');
  const [createSettleDelay, setCreateSettleDelay] = useState('3600');
  const [createPublicKey, setCreatePublicKey] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [streamRecipient, setStreamRecipient] = useState('');
  const [streamAmount, setStreamAmount] = useState('0.1');
  const [streamCount, setStreamCount] = useState('5');
  const [streamIntervalSec, setStreamIntervalSec] = useState('3');
  const [streaming, setStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamCancelRef = useRef(false);

  const fetchChannels = useCallback(async () => {
    if (!senderAddress) {
      setChannels([]);
      return;
    }
    setChannelsLoading(true);
    try {
      const list = await getPaymentChannels(senderAddress);
      setChannels(list);
    } catch (e) {
      console.error(e);
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  }, [senderAddress]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreateChannel = async () => {
    if (!senderAddress || !createDest.trim()) {
      setCreateError('Enter destination address.');
      return;
    }
    if (!isValidXRPLAddress(createDest.trim())) {
      setCreateError('Invalid XRPL destination address.');
      return;
    }
    const amount = parseFloat(createAmount);
    if (isNaN(amount) || amount < 1) {
      setCreateError('Amount must be at least 1 XRP.');
      return;
    }
    const settleDelay = parseInt(createSettleDelay, 10);
    if (isNaN(settleDelay) || settleDelay < 60) {
      setCreateError('Settle delay must be at least 60 seconds.');
      return;
    }
    const pubKey = createPublicKey.trim().replace(/\s/g, '');
    if (pubKey.length !== 64 && pubKey.length !== 66) {
      setCreateError('Public key must be 64 or 66 hex characters (from your wallet).');
      return;
    }
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      const tx = buildPaymentChannelCreateTx({
        account: senderAddress,
        amountXRP: amount,
        destination: createDest.trim(),
        settleDelaySeconds: settleDelay,
        publicKeyHex: pubKey,
      });
      const req = await xamanService.requestCustomTransactionSignature(tx as any, senderAddress);
      const onSigned = (r: { id: string }) => {
        if (r.id === req.id) {
          xamanService.off('signingSigned', onSigned);
          xamanService.off('signingRejected', onRejected);
          setCreateSubmitting(false);
          setCreateForm(false);
          setCreateDest('');
          setCreateAmount('10');
          setCreateSettleDelay('3600');
          setCreatePublicKey('');
          fetchChannels();
        }
      };
      const onRejected = (r: { id: string }) => {
        if (r.id === req.id) {
          xamanService.off('signingSigned', onSigned);
          xamanService.off('signingRejected', onRejected);
          setCreateSubmitting(false);
          setCreateError('Signing rejected.');
        }
      };
      xamanService.on('signingSigned', onSigned);
      xamanService.on('signingRejected', onRejected);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create channel');
      setCreateSubmitting(false);
    }
  };

  const runStream = useCallback(async () => {
    if (!senderAddress || !streamRecipient.trim()) {
      setStreamError('Connect wallet and enter recipient.');
      return;
    }
    if (!isValidXRPLAddress(streamRecipient.trim())) {
      setStreamError('Invalid XRPL recipient address.');
      return;
    }
    const amount = parseFloat(streamAmount);
    if (isNaN(amount) || amount <= 0) {
      setStreamError('Amount must be greater than 0.');
      return;
    }
    const count = Math.min(20, Math.max(1, parseInt(streamCount, 10) || 1));
    const intervalMs = Math.max(1000, (parseInt(streamIntervalSec, 10) || 1) * 1000);
    setStreamError(null);
    setStreaming(true);
    setStreamProgress(0);
    streamCancelRef.current = false;

    for (let i = 0; i < count; i++) {
      if (streamCancelRef.current) break;
      setStreamProgress(i + 1);
      try {
        const req = await xamanService.requestPaymentSignature(
          {
            destination: streamRecipient.trim(),
            amount,
            currency: 'XRP',
          },
          senderAddress
        );
        await new Promise<void>((resolve, reject) => {
          const onSigned = (r: { id: string }) => {
            if (r.id === req.id) {
              clearTimeout(timer);
              xamanService.off('signingSigned', onSigned);
              xamanService.off('signingRejected', onRejected);
              resolve();
            }
          };
          const onRejected = (r: { id: string }) => {
            if (r.id === req.id) {
              clearTimeout(timer);
              xamanService.off('signingSigned', onSigned);
              xamanService.off('signingRejected', onRejected);
              reject(new Error('Rejected'));
            }
          };
          xamanService.on('signingSigned', onSigned);
          xamanService.on('signingRejected', onRejected);
          const timer = setTimeout(() => {
            xamanService.off('signingSigned', onSigned);
            xamanService.off('signingRejected', onRejected);
            reject(new Error('Timeout'));
          }, 5 * 60 * 1000);
        });
      } catch (e) {
        setStreamError(e instanceof Error ? e.message : 'Stream stopped');
        break;
      }
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
    setStreaming(false);
  }, [senderAddress, streamRecipient, streamAmount, streamCount, streamIntervalSec]);

  const stopStream = () => {
    streamCancelRef.current = true;
    setStreaming(false);
  };

  const shortAddr = (a: string) => (a ? `${a.slice(0, 8)}...${a.slice(-6)}` : '');

  return (
    <div className="flex flex-col gap-4">
      {!senderAddress ? (
        <div className="rounded-lg border border-cyber-yellow/50 bg-cyber-yellow/10 p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-cyber-yellow shrink-0 mt-0.5" />
          <p className="text-xs text-cyber-text">
            Connect a real wallet (Xaman or other) in the app to create payment channels and send streams. Demo wallets cannot sign real transactions.
          </p>
        </div>
      ) : (
        <>
          {/* Payment channels */}
          <section className="rounded-lg border border-cyber-border overflow-hidden">
            <div className="p-3 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-cyber-purple" />
                <span className="font-cyber text-cyber-purple text-xs">YOUR PAYMENT CHANNELS</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchChannels}
                  disabled={channelsLoading}
                  className="p-1.5 rounded text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={channelsLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setCreateForm(!createForm)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30"
                >
                  <Plus size={12} />
                  Create channel
                </button>
              </div>
            </div>

            {createForm && (
              <div className="p-3 border-b border-cyber-border bg-cyber-darker/80 space-y-2">
                <input
                  type="text"
                  value={createDest}
                  onChange={(e) => setCreateDest(e.target.value)}
                  placeholder="Destination address (r...)"
                  className="w-full px-2 py-1.5 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text placeholder:text-cyber-muted"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-cyber-muted">Amount (XRP)</label>
                    <input
                      type="text"
                      value={createAmount}
                      onChange={(e) => setCreateAmount(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-cyber-muted">Settle delay (sec)</label>
                    <input
                      type="text"
                      value={createSettleDelay}
                      onChange={(e) => setCreateSettleDelay(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-cyber-muted">Public key (hex, 64 chars — from your wallet)</label>
                  <input
                    type="text"
                    value={createPublicKey}
                    onChange={(e) => setCreatePublicKey(e.target.value)}
                    placeholder="32D2471DB72B27E3..."
                    className="w-full mt-0.5 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text placeholder:text-cyber-muted font-mono"
                  />
                </div>
                {createError && (
                  <p className="text-[10px] text-cyber-red">{createError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateChannel}
                    disabled={createSubmitting}
                    className="flex-1 py-1.5 rounded bg-cyber-purple text-white text-xs hover:bg-cyber-purple/80 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {createSubmitting ? <Loader size={12} className="animate-spin" /> : null}
                    Sign in Xaman to create
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm(false)}
                    className="px-3 py-1.5 rounded bg-cyber-border text-cyber-muted text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {channelsLoading ? (
                <div className="p-4 flex justify-center">
                  <Loader size={20} className="animate-spin text-cyber-cyan" />
                </div>
              ) : channels.length === 0 ? (
                <div className="p-4 text-center text-xs text-cyber-muted">
                  No payment channels. Create one to enable off-chain streaming (claims require your key).
                </div>
              ) : (
                channels.map((ch) => {
                  const amountDrops = parseInt(ch.Amount, 10) || 0;
                  const balanceDrops = parseInt(ch.Balance, 10) || 0;
                  const amountXRP = (amountDrops / 1_000_000).toFixed(2);
                  const balanceXRP = (balanceDrops / 1_000_000).toFixed(4);
                  return (
                    <div
                      key={ch.index}
                      className="p-2 border-b border-cyber-border/50 flex items-center justify-between text-[10px]"
                    >
                      <div>
                        <span className="text-cyber-muted">→ {shortAddr(ch.Destination)}</span>
                        <span className="text-cyber-text ml-1"> {balanceXRP} / {amountXRP} XRP</span>
                      </div>
                      <a
                        href={`https://livenet.xrpl.org/accounts/${ch.Account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-cyan hover:underline flex items-center gap-0.5"
                      >
                        Explorer <ExternalLink size={10} />
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Stream now: repeated Payments */}
          <section className="rounded-lg border border-cyber-border overflow-hidden">
            <div className="p-3 border-b border-cyber-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-cyber-yellow" />
                <span className="font-cyber text-cyber-yellow text-xs">STREAM NOW (real XRP)</span>
              </div>
              <p className="text-[10px] text-cyber-muted mb-2">
                Send multiple payments in sequence. Each payment requires one sign in Xaman.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={streamRecipient}
                  onChange={(e) => setStreamRecipient(e.target.value)}
                  placeholder="Recipient address (r...)"
                  className="w-full px-2 py-1.5 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text placeholder:text-cyber-muted"
                  disabled={streaming}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-cyber-muted">XRP per payment</label>
                    <input
                      type="text"
                      value={streamAmount}
                      onChange={(e) => setStreamAmount(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text"
                      disabled={streaming}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-cyber-muted">Count (max 20)</label>
                    <input
                      type="text"
                      value={streamCount}
                      onChange={(e) => setStreamCount(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text"
                      disabled={streaming}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-cyber-muted">Interval (sec)</label>
                    <input
                      type="text"
                      value={streamIntervalSec}
                      onChange={(e) => setStreamIntervalSec(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text"
                      disabled={streaming}
                    />
                  </div>
                </div>
                {streamError && <p className="text-[10px] text-cyber-red">{streamError}</p>}
                {streaming && (
                  <p className="text-[10px] text-cyber-cyan">
                    Payment {streamProgress} — sign in Xaman when prompted.
                  </p>
                )}
                <div className="flex gap-2">
                  {!streaming ? (
                    <button
                      type="button"
                      onClick={runStream}
                      className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow text-xs hover:bg-cyber-yellow/30"
                    >
                      <Play size={12} />
                      Start stream
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopStream}
                      className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-red/20 border border-cyber-red/50 text-cyber-red text-xs hover:bg-cyber-red/30"
                    >
                      <Square size={12} />
                      Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <p className="text-[10px] text-cyber-muted px-1">
            Until XRPL Batch (XLS-56) ships, each payment needs one sign. To run the agent economy with far fewer signs, use <a href="https://xahau.network" target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline">Xahau</a>: Hooks can <a href="https://docs.xahau.network/concepts/emitted-transactions" target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline">emit payments</a> without a signature per tx. See <code className="text-cyber-muted">docs/AGENT-ECONOMY-UNTIL-BATCH.md</code> in the repo.
          </p>
        </>
      )}
    </div>
  );
}

export default RealStreamsPanel;
