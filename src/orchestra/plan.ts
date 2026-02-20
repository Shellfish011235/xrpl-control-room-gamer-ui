/**
 * Build settlement plan: netted obligations + remainder intents → PlannedTx.
 * XRPL payload shape compatible with xrpl.js / submission layer.
 * Uses browser-safe encoding (no Node Buffer).
 */

import { stringToHex } from '../lib/encoding';
import type {
  Intent,
  NettedObligation,
  SettlementPlan,
  PlannedTx,
  PaymentIntent,
  OfferMakeIntent,
  OfferCancelIntent,
  Asset,
} from '../types/agentIntents';
import type { NettingResult } from './netting';

function assetToXRPLAmount(asset: Asset, amount: string): string | { currency: string; issuer: string; value: string } {
  if (asset.kind === 'XRP') return String(Math.round(parseFloat(amount) * 1e6));
  if (asset.kind === 'IOU') return { currency: asset.currency, issuer: asset.issuer, value: amount };
  return { currency: 'MPT', issuer: (asset as { issuer: string }).issuer, value: amount };
}

function obligationToPaymentTx(obl: NettedObligation, seq: number): PlannedTx {
  const payload: Record<string, unknown> = {
    TransactionType: 'Payment',
    Account: obl.from,
    Destination: obl.to,
    Amount: obl.asset.kind === 'XRP' ? String(Math.round(parseFloat(obl.amount) * 1e6)) : {
      currency: obl.asset.kind === 'IOU' ? obl.asset.currency : 'MPT',
      value: obl.amount,
      issuer: obl.asset.kind === 'IOU' ? obl.asset.issuer : obl.asset.issuer,
    },
    Memo: { MemoData: Buffer.from(JSON.stringify({ batch: true, seq })).toString('hex') },
  };
  return {
    kind: 'XRPL_TX',
    txType: 'Payment',
    account: obl.from,
    payload,
    dependsOn: [],
  };
}

function intentToPlannedTx(intent: Intent, seq: number): PlannedTx | null {
  if (intent.type === 'PAYMENT') {
    const p = intent as PaymentIntent;
    const amount = p.asset.kind === 'XRP'
      ? String(Math.round(parseFloat(p.amount) * 1e6))
      : { currency: (p.asset as { kind: 'IOU'; currency: string }).currency, value: p.amount, issuer: (p.asset as { kind: 'IOU'; issuer: string }).issuer };
    return {
      kind: 'XRPL_TX',
      txType: 'Payment',
      account: p.from,
      payload: {
        TransactionType: 'Payment',
        Account: p.from,
        Destination: p.to,
        Amount: amount,
        Memo: p.memo ? { MemoData: Array.from(new TextEncoder().encode(p.memo)).map((b) => b.toString(16).padStart(2, '0')).join('') } : undefined,
      },
      dependsOn: [],
    };
  }
  if (intent.type === 'OFFER_MAKE') {
    const o = intent as OfferMakeIntent;
    const payload: Record<string, unknown> = {
      TransactionType: 'OfferCreate',
      Account: o.owner,
      TakerGets: assetToXRPLAmount(o.takerGets.asset, o.takerGets.amount),
      TakerPays: assetToXRPLAmount(o.takerPays.asset, o.takerPays.amount),
      ...(o.flags != null && { Flags: o.flags }),
      ...(o.expiration != null && { Expiration: o.expiration }),
      ...(o.memo && { Memo: { MemoData: stringToHex(o.memo) } }),
    };
    return { kind: 'XRPL_TX', txType: 'OfferCreate', account: o.owner, payload, dependsOn: [] };
  }
  if (intent.type === 'OFFER_CANCEL') {
    const c = intent as OfferCancelIntent;
    const payload: Record<string, unknown> = {
      TransactionType: 'OfferCancel',
      Account: c.owner,
      OfferSequence: c.offerSequence,
    };
    return { kind: 'XRPL_TX', txType: 'OfferCancel', account: c.owner, payload, dependsOn: [] };
  }
  // AMM_SWAP etc.: stub
  return {
    kind: 'XRPL_TX',
    txType: (intent as Intent).type,
    account: (intent as { owner?: string }).owner ?? '',
    payload: { TransactionType: (intent as Intent).type },
    dependsOn: [],
  };
}

export interface BuildPlanOptions {
  maxTx: number;
}

export function buildPlan(
  result: NettingResult,
  options: BuildPlanOptions
): SettlementPlan {
  const windowId = `win_${Date.now()}`;
  const xrplTxs: PlannedTx[] = [];
  let seq = 0;

  for (const obl of result.netted) {
    if (xrplTxs.length >= options.maxTx) break;
    xrplTxs.push(obligationToPaymentTx(obl, seq++));
  }
  for (const intent of result.remainder) {
    if (xrplTxs.length >= options.maxTx) break;
    const tx = intentToPlannedTx(intent, seq++);
    if (tx) xrplTxs.push(tx);
  }

  const intentsIn = result.netted.length + result.remainder.length;
  const txsOut = xrplTxs.length;
  return {
    id: `plan_${Date.now()}`,
    windowId,
    netting: result.netted.length > 0 ? result.netted : undefined,
    xrplTxs,
    summary: {
      intentsIn,
      txsOut,
      nettingSavings: Math.max(0, intentsIn - txsOut),
    },
  };
}
