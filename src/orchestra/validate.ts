/**
 * Intent validation: schema, policy (allowlisted assets), risk score.
 * Idempotency: callers should ensure intent id is UUID; memo can carry idempotency key.
 */

import type { Intent, PaymentIntent, Asset, ValidationResult } from '../types/agentIntents';

const ALLOWLISTED_XRP = true;
const ALLOWLISTED_IOU_ISSUERS = new Set<string>([]); // configure per env
const MAX_AMOUNT_XRP = 1_000_000; // cap for risk scoring
const VOLATILITY_RISK_FACTOR = 0.2;

function assetKey(a: Asset): string {
  if (a.kind === 'XRP') return 'XRP';
  if (a.kind === 'IOU') return `IOU:${a.currency}:${a.issuer}`;
  return `MPT:${a.issuer}:${a.mptId}`;
}

function isAssetAllowlisted(asset: Asset): boolean {
  if (asset.kind === 'XRP') return ALLOWLISTED_XRP;
  if (asset.kind === 'IOU') return ALLOWLISTED_IOU_ISSUERS.has(asset.issuer);
  return false;
}

function parseAmount(amount: string): number {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Risk score 0..1 based on amount and optional volatility.
 * Higher amount or volatility => higher score.
 */
function riskScore(
  amount: number,
  asset: Asset,
  volatility?: number
): number {
  let base = 0;
  if (asset.kind === 'XRP') {
    base = Math.min(1, amount / MAX_AMOUNT_XRP);
  } else {
    base = Math.min(1, amount / 1e9); // IOU: normalize as needed
  }
  const vol = volatility != null ? volatility * VOLATILITY_RISK_FACTOR : 0;
  return Math.min(1, base + vol);
}

function normalizeIntent(i: Intent): Intent {
  // Round amounts to 6 decimals for XRP-equivalent; clone so we don't mutate
  if (i.type === 'PAYMENT') {
    const amt = parseAmount(i.amount);
    const rounded = amt.toFixed(6);
    return { ...i, amount: rounded } as PaymentIntent;
  }
  return i;
}

export function validateIntent(
  intent: Intent,
  options?: { volatility?: number }
): ValidationResult {
  const reasons: string[] = [];

  if (!intent.id || !intent.agentId || !intent.type || intent.createdAt == null) {
    reasons.push('Missing required fields: id, agentId, type, createdAt');
    return { ok: false, reasons };
  }

  if (intent.expiresAt != null && intent.expiresAt < Date.now()) {
    reasons.push('Intent expired');
    return { ok: false, reasons };
  }

  switch (intent.type) {
    case 'PAYMENT': {
      const from = (intent as PaymentIntent).from;
      const to = (intent as PaymentIntent).to;
      const asset = (intent as PaymentIntent).asset;
      const amountStr = (intent as PaymentIntent).amount;
      if (!from || !to) {
        reasons.push('PAYMENT requires from and to');
        return { ok: false, reasons };
      }
      if (from === to) {
        reasons.push('Self-payment not allowed');
        return { ok: false, reasons };
      }
      if (!isAssetAllowlisted(asset)) {
        reasons.push(`Asset not allowlisted: ${assetKey(asset)}`);
        return { ok: false, reasons };
      }
      const amount = parseAmount(amountStr);
      if (amount <= 0) {
        reasons.push('Amount must be positive');
        return { ok: false, reasons };
      }
      const score = riskScore(amount, asset, options?.volatility);
      const normalized = normalizeIntent(intent) as Intent;
      return { ok: true, normalized, riskScore: score };
    }
    case 'OFFER_MAKE':
    case 'OFFER_CANCEL':
    case 'AMM_SWAP':
      // Minimal schema check; extend as needed
      return { ok: true, normalized: normalizeIntent(intent), riskScore: 0.5 };
    default:
      reasons.push(`Unsupported intent type: ${(intent as Intent).type}`);
      return { ok: false, reasons };
  }
}
