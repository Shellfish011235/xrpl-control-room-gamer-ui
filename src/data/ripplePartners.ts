/**
 * Companies partnering with Ripple or utilizing Ripple/XRP/XRPL.
 * Categories: payments (ODL/RippleNet), banks, RLUSD/exchanges, treasury/listed.
 * Sources: Ripple public pages, RippleNet/ODL announcements. Not exhaustive.
 */

export type PartnerCategory = 'payments' | 'banks' | 'rlusd_exchanges' | 'treasury_listed' | 'infrastructure';

export interface RipplePartner {
  name: string;
  category: PartnerCategory;
  /** Short description (e.g. "ODL corridor", "RLUSD exchange") */
  note?: string;
  url?: string;
  region?: string;
}

export const RIPPLE_PARTNER_CATEGORIES: Record<PartnerCategory, string> = {
  payments: 'Payments / ODL',
  banks: 'Banks & institutions',
  rlusd_exchanges: 'RLUSD / Exchanges',
  treasury_listed: 'XRP treasury / Listed',
  infrastructure: 'Infrastructure',
};

export const RIPPLE_PARTNERS: RipplePartner[] = [
  // Payments / ODL / RippleNet
  { name: 'Santander', category: 'payments', note: 'OnePay FX, RippleNet', url: 'https://www.santander.com', region: 'Spain/UK' },
  { name: 'MoneyGram', category: 'payments', note: 'ODL corridors', url: 'https://www.moneygram.com', region: 'USA' },
  { name: 'Tranglo', category: 'payments', note: 'Cross-border settlement', url: 'https://tranglo.com', region: 'Malaysia' },
  { name: 'Bitso', category: 'payments', note: 'ODL liquidity', url: 'https://bitso.com', region: 'Mexico' },
  { name: 'Coins.ph', category: 'payments', note: 'ODL USD-PHP', url: 'https://coins.ph', region: 'Philippines' },
  { name: 'Bitstamp', category: 'payments', note: 'ODL EUR corridors', url: 'https://www.bitstamp.net', region: 'Luxembourg' },
  { name: 'SBI Remit', category: 'payments', note: 'RippleNet', region: 'Japan' },
  { name: 'Instarem', category: 'payments', note: 'RippleNet', region: 'Singapore' },
  { name: 'Nium', category: 'payments', note: 'RippleNet', url: 'https://www.nium.com', region: 'Global' },
  { name: 'Sentbe', category: 'payments', note: 'RippleNet', region: 'South Korea' },
  // Banks & institutions
  { name: 'SBI Holdings', category: 'banks', note: 'RippleNet, SBI VC Trade', url: 'https://www.sbigroup.co.jp', region: 'Japan' },
  { name: 'MUFG', category: 'banks', note: 'Ripple technology', url: 'https://www.mufg.jp', region: 'Japan' },
  { name: 'PNC Bank', category: 'banks', note: 'RippleNet', url: 'https://www.pnc.com', region: 'USA' },
  { name: 'Standard Chartered', category: 'banks', note: 'RippleNet', url: 'https://www.sc.com', region: 'Global' },
  { name: 'BBVA', category: 'banks', note: 'RippleNet', url: 'https://www.bbva.com', region: 'Spain' },
  { name: 'RAKBANK', category: 'banks', note: 'RippleNet', url: 'https://www.rakbank.ae', region: 'UAE' },
  { name: 'Siam Commercial Bank', category: 'banks', note: 'RippleNet', region: 'Thailand' },
  { name: 'National Australia Bank', category: 'banks', note: 'RippleNet', url: 'https://www.nab.com.au', region: 'Australia' },
  { name: 'Westpac', category: 'banks', note: 'RippleNet', url: 'https://www.westpac.com.au', region: 'Australia' },
  // RLUSD / Exchanges
  { name: 'Kraken', category: 'rlusd_exchanges', note: 'RLUSD', url: 'https://www.kraken.com', region: 'USA' },
  { name: 'Uphold', category: 'rlusd_exchanges', note: 'RLUSD', url: 'https://uphold.com', region: 'USA' },
  { name: 'Gemini', category: 'rlusd_exchanges', note: 'RLUSD', url: 'https://www.gemini.com', region: 'USA' },
  { name: 'Bitstamp', category: 'rlusd_exchanges', note: 'RLUSD, XRP', url: 'https://www.bitstamp.net', region: 'Luxembourg' },
  // XRP treasury / Listed companies
  { name: 'Evernorth Holdings', category: 'treasury_listed', note: 'XRP treasury', url: 'https://www.nasdaq.com/market-activity/stocks/XRPN', region: 'USA' },
  { name: 'Hyperscale Data', category: 'treasury_listed', note: 'XRP acquisition', region: 'USA' },
  { name: 'VivoPower', category: 'treasury_listed', note: 'XRP treasury (planned)', region: 'USA' },
  { name: 'Worksport', category: 'treasury_listed', note: 'XRP reserve', region: 'USA' },
  // Infrastructure
  { name: 'XRPL Foundation', category: 'infrastructure', note: 'XRPL development', url: 'https://xrplf.org', region: 'Global' },
  { name: 'Ripple (XRP Ledger)', category: 'infrastructure', note: 'Core ledger, ODL', url: 'https://ripple.com', region: 'USA' },
];

export function getPartnersByCategory(): Record<PartnerCategory, RipplePartner[]> {
  const byCategory = {} as Record<PartnerCategory, RipplePartner[]>;
  const categories: PartnerCategory[] = ['payments', 'banks', 'rlusd_exchanges', 'treasury_listed', 'infrastructure'];
  categories.forEach((cat) => {
    byCategory[cat] = RIPPLE_PARTNERS.filter((p) => p.category === cat);
  });
  return byCategory;
}
