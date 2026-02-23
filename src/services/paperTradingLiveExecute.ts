/**
 * Build an XRPL OfferCreate for the Paper Trading panel when in Live mode.
 * Pair: XRP / USD (Bitstamp). User must have a USD trust line to trade.
 */

import { xrpToDrops } from './xrplService';

const USD_ISSUER_BITSTAMP = 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B';

export interface OfferCreatePayload {
  TransactionType: 'OfferCreate';
  Account: string;
  TakerGets: string | { currency: string; issuer: string; value: string };
  TakerPays: string | { currency: string; issuer: string; value: string };
}

/**
 * Build OfferCreate for a simple XRP/USD DEX trade.
 * - Buy XRP: you pay USD, get XRP → TakerGets = XRP, TakerPays = USD
 * - Sell XRP: you pay XRP, get USD → TakerGets = USD, TakerPays = XRP
 */
export function buildOfferCreate(
  account: string,
  side: 'buy' | 'sell',
  amountXrp: number,
  priceUsdPerXrp: number
): OfferCreatePayload {
  const xrpDrops = xrpToDrops(amountXrp);
  const usdValue = (amountXrp * priceUsdPerXrp).toFixed(2);

  if (side === 'buy') {
    return {
      TransactionType: 'OfferCreate',
      Account: account,
      TakerGets: xrpDrops,
      TakerPays: { currency: 'USD', issuer: USD_ISSUER_BITSTAMP, value: usdValue },
    };
  }
  return {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: { currency: 'USD', issuer: USD_ISSUER_BITSTAMP, value: usdValue },
    TakerPays: xrpDrops,
  };
}
