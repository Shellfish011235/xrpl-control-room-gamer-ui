/**
 * Net payment intents by asset: compute net flows, minimize obligations.
 * Simple in-memory graph: no graphlib; cycle resolution via net-zero pairs.
 */

import type { Intent, PaymentIntent, NettedObligation, Asset } from '../types/agentIntents';

function assetKey(a: Asset): string {
  if (a.kind === 'XRP') return 'XRP';
  if (a.kind === 'IOU') return `${a.currency}:${a.issuer}`;
  return `${a.issuer}:${a.mptId}`;
}

/** Group intents by asset (only PAYMENT for now) */
function groupByAsset(intents: Intent[]): Map<string, PaymentIntent[]> {
  const map = new Map<string, PaymentIntent[]>();
  for (const i of intents) {
    if (i.type !== 'PAYMENT') continue;
    const key = assetKey(i.asset);
    const list = map.get(key) ?? [];
    list.push(i);
    map.set(key, list);
  }
  return map;
}

/** Net flow: address -> signed amount (positive = receives, negative = sends) */
function computeNetFlows(payments: PaymentIntent[]): Map<string, number> {
  const flows = new Map<string, number>();
  for (const p of payments) {
    const amt = parseFloat(p.amount) || 0;
    const from = p.from;
    const to = p.to;
    flows.set(from, (flows.get(from) ?? 0) - amt);
    flows.set(to, (flows.get(to) ?? 0) + amt);
  }
  return flows;
}

/** Resolve A->B and B->A to single net direction */
function resolveCycles(obligations: NettedObligation[]): NettedObligation[] {
  const byPair = new Map<string, NettedObligation>();
  for (const o of obligations) {
    const key = o.from < o.to ? `${o.from}|${o.to}` : `${o.to}|${o.from}`;
    const existing = byPair.get(key);
    const amt = parseFloat(o.amount) || 0;
    if (!existing) {
      byPair.set(key, { ...o });
      continue;
    }
    const existingAmt = parseFloat(existing.amount) || 0;
    const from = o.from;
    const to = o.to;
    if (existing.from === from) {
      const newAmt = existingAmt - amt;
      if (newAmt <= 0) byPair.delete(key);
      else byPair.set(key, { ...existing, amount: String(newAmt) });
    } else {
      const newAmt = existingAmt - amt;
      if (newAmt <= 0) byPair.delete(key);
      else byPair.set(key, { from: existing.to, to: existing.from, asset: existing.asset, amount: String(newAmt) });
    }
  }
  return Array.from(byPair.values()).filter((o) => parseFloat(o.amount) > 0);
}

/** Turn net flows into minimal obligations (debtors -> creditors) */
function minimizeDebts(
  flows: Map<string, number>,
  asset: Asset
): NettedObligation[] {
  const debtors: { addr: string; amount: number }[] = [];
  const creditors: { addr: string; amount: number }[] = [];
  flows.forEach((amount, addr) => {
    if (amount > 0) creditors.push({ addr, amount });
    if (amount < 0) debtors.push({ addr, amount: -amount });
  });
  const obligations: NettedObligation[] = [];
  let di = 0;
  let ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di];
    const c = creditors[ci];
    const match = Math.min(d.amount, c.amount);
    if (match > 0) {
      obligations.push({
        from: d.addr,
        to: c.addr,
        asset,
        amount: String(match),
      });
      d.amount -= match;
      c.amount -= match;
    }
    if (d.amount <= 0) di++;
    if (c.amount <= 0) ci++;
  }
  return resolveCycles(obligations);
}

export interface NettingResult {
  netted: NettedObligation[];
  remainder: Intent[];
}

export function netPayments(intents: Intent[]): NettingResult {
  const paymentGroups = groupByAsset(intents);
  const netted: NettedObligation[] = [];
  const nonPayment: Intent[] = intents.filter((i) => i.type !== 'PAYMENT');

  paymentGroups.forEach((payments, key) => {
    const flows = computeNetFlows(payments);
    const asset = payments[0].asset;
    const obligations = minimizeDebts(flows, asset);
    netted.push(...obligations);
  });

  return {
    netted,
    remainder: nonPayment,
  };
}
