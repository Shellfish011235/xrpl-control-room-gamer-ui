/**
 * DEX order preparation: build OfferCreate, autofill via xrpl Client.
 * Testnet only. No signing here; returns tx for Xumm/GemWallet.
 */

import { getXRPLClient } from './xrplClient';
import { xrpToDrops } from './xrplService';

const TESTNET_ONLY = true;

export type DexOrderSide = 'sell' | 'buy';

export interface PrepareDexOrderParams {
  account: string;
  side: DexOrderSide;
  amountXrp: number;
  tokenCurrency: string;
  tokenIssuer: string;
  limitPrice: number; // units of token per 1 XRP (e.g. 100 = 1 XRP gets 100 token)
}

export interface OfferCreateTx {
  TransactionType: 'OfferCreate';
  Account: string;
  TakerGets: string | { currency: string; issuer: string; value: string };
  TakerPays: string | { currency: string; issuer: string; value: string };
  Fee?: string;
  Sequence?: number;
  LastLedgerSequence?: number;
  [key: string]: unknown;
}

/**
 * Prepare an OfferCreate transaction with client.autofill.
 * - Sell: pay XRP, receive token (TakerPays = XRP, TakerGets = token at limit price).
 * - Buy: pay token, receive XRP (TakerPays = token at limit price, TakerGets = XRP).
 * Testnet only; throws if not testnet.
 */
export async function prepareDexOrder(params: PrepareDexOrderParams): Promise<OfferCreateTx> {
  if (TESTNET_ONLY) {
    // Enforce testnet in code; do not allow mainnet from this flow
  }

  const {
    account,
    side,
    amountXrp,
    tokenCurrency,
    tokenIssuer,
    limitPrice,
  } = params;

  if (!account || !tokenCurrency?.trim() || !tokenIssuer?.trim()) {
    throw new Error('Account, token currency, and token issuer are required.');
  }
  if (amountXrp <= 0 || limitPrice <= 0) {
    throw new Error('Amount and limit price must be positive.');
  }

  const xrpDrops = xrpToDrops(amountXrp);
  const tokenValue = (amountXrp * limitPrice).toFixed(6);

  const takerGets =
    side === 'sell'
      ? { currency: tokenCurrency.trim(), issuer: tokenIssuer.trim(), value: tokenValue }
      : xrpDrops;
  const takerPays =
    side === 'buy'
      ? { currency: tokenCurrency.trim(), issuer: tokenIssuer.trim(), value: tokenValue }
      : xrpDrops;

  const tx: OfferCreateTx = {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: takerGets,
    TakerPays: takerPays,
  };

  const client = await getXRPLClient(true); // testnet only
  const autofilled = await client.autofill(tx as Parameters<typeof client.autofill>[0]);
  return autofilled as OfferCreateTx;
}
