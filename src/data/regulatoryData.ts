// Shared Regulatory Data - Used by Home and WorldMap
// Comprehensive regulatory intelligence database

export type RegulatoryStatus = 'active' | 'pending' | 'proposed' | 'watch';
export type ImpactRating = 'positive' | 'negative' | 'neutral' | 'mixed';
export type RegulatoryCategory = 'crypto' | 'dlt' | 'ai' | 'banking' | 'sec' | 'irs' | 'global';

export interface RegulatoryItem {
  id: number;
  type: string;
  typeColor: string;
  jurisdiction: string;
  countryCode?: string; // ISO 3166-1 alpha-2
  status: RegulatoryStatus;
  title: string;
  desc: string;
  categories: RegulatoryCategory[];
  url: string;
  passLikelihood: number | null; // 0-100 or null for watch items
  xrplImpact: ImpactRating;
  industryImpact: ImpactRating;
  effectiveDate?: string;
  lastUpdated?: string;
}

export interface RegulatoryAgency {
  id: string;
  name: string;
  shortName: string;
  jurisdiction: string;
  countryCode?: string;
  url: string;
  category: 'regulatory' | 'patent' | 'tax' | 'legislative';
  color: string;
}

export interface CountryRegulatoryProfile {
  countryCode: string;
  countryName: string;
  overallStatus: 'favorable' | 'regulated' | 'developing' | 'restricted' | 'unclear';
  statusLabel: string;
  primaryAgency?: string;
  cryptoLegal: boolean;
  exchangesAllowed: boolean;
  stablecoinsRegulated: boolean;
  cbdcStatus: 'active' | 'pilot' | 'research' | 'none';
  xrplPresence: 'strong' | 'moderate' | 'emerging' | 'minimal';
  keyDevelopments: string[];
  activeItemIds: number[];
}

// ==================== REGULATORY ITEMS ====================

export const regulatoryItems: RegulatoryItem[] = [
  // ACTIVE Items (already passed, so passLikelihood = 100)
  { 
    id: 1, 
    type: 'SEC RULE', 
    typeColor: 'cyber-green', 
    jurisdiction: 'US', 
    countryCode: 'US',
    status: 'active', 
    title: 'Spot Bitcoin & Ethereum ETF Framework', 
    desc: 'Guidelines for cryptocurrency ETF listings and trading on US exchanges', 
    categories: ['sec', 'crypto'], 
    url: 'https://www.sec.gov/rules/proposed.shtml', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive',
    effectiveDate: '2024-01-10',
  },
  { 
    id: 2, 
    type: 'MiCA', 
    typeColor: 'cyber-green', 
    jurisdiction: 'EU', 
    countryCode: 'EU',
    status: 'active', 
    title: 'Markets in Crypto-Assets Regulation', 
    desc: 'Comprehensive EU framework for crypto asset service providers', 
    categories: ['crypto', 'dlt', 'banking', 'global'], 
    url: 'https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive',
    effectiveDate: '2024-12-30',
  },
  { 
    id: 3, 
    type: 'AI ACT', 
    typeColor: 'cyber-green', 
    jurisdiction: 'EU',
    countryCode: 'EU', 
    status: 'active', 
    title: 'EU AI Act - Risk-Based Framework', 
    desc: 'Comprehensive regulations for AI, AGI, and ASI development and deployment', 
    categories: ['ai', 'global'], 
    url: 'https://artificialintelligenceact.eu/', 
    passLikelihood: 100, 
    xrplImpact: 'neutral', 
    industryImpact: 'mixed',
    effectiveDate: '2024-08-01',
  },
  { 
    id: 4, 
    type: 'OCC', 
    typeColor: 'cyber-green', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'active', 
    title: 'Bank Crypto Custody Guidelines', 
    desc: 'Office of the Comptroller guidelines for banks holding digital assets', 
    categories: ['banking', 'crypto'], 
    url: 'https://www.occ.gov/topics/supervision-and-examination/bank-management/financial-technology/index-financial-technology.html', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 5, 
    type: 'IRS', 
    typeColor: 'cyber-green', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'active', 
    title: 'Digital Asset Reporting (Form 1099-DA)', 
    desc: 'Mandatory reporting for crypto transactions, staking rewards, and DeFi income', 
    categories: ['irs', 'crypto', 'dlt'], 
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/digital-assets', 
    passLikelihood: 100, 
    xrplImpact: 'neutral', 
    industryImpact: 'mixed' 
  },
  { 
    id: 6, 
    type: 'FATF', 
    typeColor: 'cyber-green', 
    jurisdiction: 'GLOBAL', 
    status: 'active', 
    title: 'Travel Rule for Virtual Assets', 
    desc: 'Financial Action Task Force guidelines for crypto transaction reporting', 
    categories: ['crypto', 'banking', 'global'], 
    url: 'https://www.fatf-gafi.org/en/topics/virtual-assets.html', 
    passLikelihood: 100, 
    xrplImpact: 'neutral', 
    industryImpact: 'mixed' 
  },
  { 
    id: 7, 
    type: 'BIS', 
    typeColor: 'cyber-green', 
    jurisdiction: 'GLOBAL', 
    status: 'active', 
    title: 'CBDC Interoperability Standards', 
    desc: 'Bank for International Settlements guidelines for central bank digital currencies', 
    categories: ['banking', 'dlt', 'global'], 
    url: 'https://www.bis.org/topics/cbdc.htm', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 8, 
    type: 'DTCC', 
    typeColor: 'cyber-green', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'active', 
    title: 'T+1 Settlement & DLT Integration', 
    desc: 'Blockchain-based settlement infrastructure for securities clearing', 
    categories: ['dlt', 'sec', 'banking'], 
    url: 'https://www.dtcc.com/news/2024', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 30, 
    type: 'JFSA', 
    typeColor: 'cyber-green', 
    jurisdiction: 'JP',
    countryCode: 'JP', 
    status: 'active', 
    title: 'XRP Classified as Regulated Crypto-Asset', 
    desc: 'JFSA classification enables exchange listings and institutional custody in Japan', 
    categories: ['crypto', 'banking'], 
    url: 'https://www.fsa.go.jp/en/', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 31, 
    type: 'MAS', 
    typeColor: 'cyber-green', 
    jurisdiction: 'SG',
    countryCode: 'SG', 
    status: 'active', 
    title: 'Digital Payment Token Framework', 
    desc: 'MAS licensed framework for crypto services including XRP in Singapore', 
    categories: ['crypto', 'banking'], 
    url: 'https://www.mas.gov.sg/regulation/payments/payment-services-act', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 32, 
    type: 'VARA', 
    typeColor: 'cyber-green', 
    jurisdiction: 'AE',
    countryCode: 'AE', 
    status: 'active', 
    title: 'Virtual Asset Regulatory Framework', 
    desc: 'Dubai VARA comprehensive licensing for crypto exchanges and services', 
    categories: ['crypto', 'banking', 'global'], 
    url: 'https://vara.ae/', 
    passLikelihood: 100, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  
  // PENDING Items
  { 
    id: 9, 
    type: 'EXEC ORDER', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'pending', 
    title: 'Executive Order on Digital Assets', 
    desc: 'Framework for responsible development of digital assets and blockchain technology', 
    categories: ['crypto', 'dlt', 'banking'], 
    url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/', 
    passLikelihood: 85, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 10, 
    type: 'FIT21', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'pending', 
    title: 'Financial Innovation & Technology Act', 
    desc: 'Comprehensive crypto regulatory framework defining SEC vs CFTC jurisdiction', 
    categories: ['crypto', 'sec', 'dlt'], 
    url: 'https://www.congress.gov/bill/118th-congress/house-bill/4763', 
    passLikelihood: 72, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 11, 
    type: 'STABLE', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'pending', 
    title: 'Stablecoin TRUST Act', 
    desc: 'Federal framework for stablecoin issuance and reserve requirements', 
    categories: ['crypto', 'banking'], 
    url: 'https://www.congress.gov/search?q=%7B%22search%22%3A%22stablecoin%22%7D', 
    passLikelihood: 68, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 12, 
    type: 'WEF', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'GLOBAL', 
    status: 'pending', 
    title: 'Global Digital Asset Governance', 
    desc: 'World Economic Forum recommendations for international crypto standards', 
    categories: ['crypto', 'dlt', 'banking', 'global'], 
    url: 'https://www.weforum.org/topics/blockchain-and-digital-assets/', 
    passLikelihood: 55, 
    xrplImpact: 'mixed', 
    industryImpact: 'mixed' 
  },
  { 
    id: 13, 
    type: 'FED', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'pending', 
    title: 'FedNow & Digital Dollar Study', 
    desc: 'Federal Reserve research on instant payments and potential CBDC', 
    categories: ['banking', 'dlt', 'global'], 
    url: 'https://www.federalreserve.gov/paymentsystems/fednow_about.htm', 
    passLikelihood: 40, 
    xrplImpact: 'mixed', 
    industryImpact: 'mixed' 
  },
  { 
    id: 14, 
    type: 'USPTO', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'pending', 
    title: 'AI-Generated Inventions Policy', 
    desc: 'Patent office guidance on AI and AGI as inventors or tools', 
    categories: ['ai'], 
    url: 'https://www.uspto.gov/initiatives/artificial-intelligence', 
    passLikelihood: 78, 
    xrplImpact: 'neutral', 
    industryImpact: 'positive' 
  },
  { 
    id: 33, 
    type: 'FCA', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'GB',
    countryCode: 'GB', 
    status: 'pending', 
    title: 'Crypto Promotion Rules Update', 
    desc: 'UK Financial Conduct Authority revised crypto marketing requirements', 
    categories: ['crypto', 'banking'], 
    url: 'https://www.fca.org.uk/firms/cryptoassets', 
    passLikelihood: 80, 
    xrplImpact: 'neutral', 
    industryImpact: 'mixed' 
  },
  { 
    id: 34, 
    type: 'BAFIN', 
    typeColor: 'cyber-yellow', 
    jurisdiction: 'DE',
    countryCode: 'DE', 
    status: 'pending', 
    title: 'Crypto Custody License Framework', 
    desc: 'German financial authority guidelines for institutional crypto custody', 
    categories: ['crypto', 'banking'], 
    url: 'https://www.bafin.de/EN/Aufsicht/FinTech/VirtualCurrency/virtual_currency_node_en.html', 
    passLikelihood: 85, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  
  // PROPOSED Items
  { 
    id: 15, 
    type: 'FINCEN', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'proposed', 
    title: 'AML/KYC Requirements for DeFi', 
    desc: 'New reporting requirements for decentralized finance protocols', 
    categories: ['dlt', 'banking', 'crypto'], 
    url: 'https://www.fincen.gov/news-room', 
    passLikelihood: 62, 
    xrplImpact: 'negative', 
    industryImpact: 'negative' 
  },
  { 
    id: 16, 
    type: 'CFTC', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'proposed', 
    title: 'Digital Commodity Classification', 
    desc: 'Framework for tokenized commodities and agricultural assets on blockchain', 
    categories: ['crypto', 'dlt'], 
    url: 'https://www.cftc.gov/LawRegulation/index.htm', 
    passLikelihood: 58, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 17, 
    type: 'SEC', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'proposed', 
    title: 'Crypto Exchange Registration Rules', 
    desc: 'Proposed requirements for crypto trading platforms to register as exchanges', 
    categories: ['sec', 'crypto'], 
    url: 'https://www.sec.gov/rules/proposed.shtml', 
    passLikelihood: 45, 
    xrplImpact: 'mixed', 
    industryImpact: 'negative' 
  },
  { 
    id: 18, 
    type: 'TREASURY', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'proposed', 
    title: 'Digital Asset Sanctions Framework', 
    desc: 'OFAC guidance on crypto sanctions compliance and reporting', 
    categories: ['crypto', 'banking', 'global'], 
    url: 'https://home.treasury.gov/policy-issues/financial-sanctions/recent-actions', 
    passLikelihood: 75, 
    xrplImpact: 'neutral', 
    industryImpact: 'mixed' 
  },
  { 
    id: 19, 
    type: 'ECB', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'EU',
    countryCode: 'EU', 
    status: 'proposed', 
    title: 'Digital Euro Framework', 
    desc: 'European Central Bank proposal for retail CBDC implementation', 
    categories: ['banking', 'dlt', 'global'], 
    url: 'https://www.ecb.europa.eu/paym/digital_euro/html/index.en.html', 
    passLikelihood: 70, 
    xrplImpact: 'mixed', 
    industryImpact: 'mixed' 
  },
  { 
    id: 20, 
    type: 'G20', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'GLOBAL', 
    status: 'proposed', 
    title: 'Cross-Border Crypto Tax Framework', 
    desc: 'International coordination on crypto taxation and information sharing', 
    categories: ['irs', 'crypto', 'global'], 
    url: 'https://www.oecd.org/tax/crypto-asset-reporting-framework-and-amendments-to-the-common-reporting-standard.htm', 
    passLikelihood: 65, 
    xrplImpact: 'neutral', 
    industryImpact: 'mixed' 
  },
  { 
    id: 35, 
    type: 'RBI', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'IN',
    countryCode: 'IN', 
    status: 'proposed', 
    title: 'Digital Rupee Integration Framework', 
    desc: 'Reserve Bank of India guidelines for CBDC and crypto coexistence', 
    categories: ['banking', 'dlt', 'crypto'], 
    url: 'https://www.rbi.org.in/', 
    passLikelihood: 45, 
    xrplImpact: 'mixed', 
    industryImpact: 'mixed' 
  },
  { 
    id: 36, 
    type: 'FSC', 
    typeColor: 'cyber-orange', 
    jurisdiction: 'KR',
    countryCode: 'KR', 
    status: 'proposed', 
    title: 'Virtual Asset User Protection Act Updates', 
    desc: 'South Korea enhanced investor protection and exchange requirements', 
    categories: ['crypto', 'banking'], 
    url: 'https://www.fsc.go.kr/eng/', 
    passLikelihood: 78, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  
  // WATCH Items - Patents & IP
  { 
    id: 21, 
    type: 'USPTO', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'watch', 
    title: 'US Patent Office - Blockchain Patents', 
    desc: 'USPTO database for cryptocurrency, DLT, and blockchain technology patents', 
    categories: ['dlt', 'crypto'], 
    url: 'https://www.uspto.gov/patents', 
    passLikelihood: null, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 22, 
    type: 'USPTO', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'watch', 
    title: 'USPTO - AI/ML Patent Search', 
    desc: 'US patents related to artificial intelligence and machine learning inventions', 
    categories: ['ai'], 
    url: 'https://www.uspto.gov/initiatives/artificial-intelligence', 
    passLikelihood: null, 
    xrplImpact: 'neutral', 
    industryImpact: 'positive' 
  },
  { 
    id: 23, 
    type: 'WIPO', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'GLOBAL', 
    status: 'watch', 
    title: 'WIPO Global Patent Database', 
    desc: 'World Intellectual Property Organization - search international blockchain & AI patents', 
    categories: ['dlt', 'crypto', 'ai', 'global'], 
    url: 'https://patentscope.wipo.int/search/en/search.jsf', 
    passLikelihood: null, 
    xrplImpact: 'neutral', 
    industryImpact: 'positive' 
  },
  { 
    id: 24, 
    type: 'EPO', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'EU',
    countryCode: 'EU', 
    status: 'watch', 
    title: 'European Patent Office - DLT Patents', 
    desc: 'EPO Espacenet database for European blockchain and crypto patents', 
    categories: ['dlt', 'crypto', 'global'], 
    url: 'https://worldwide.espacenet.com/', 
    passLikelihood: null, 
    xrplImpact: 'neutral', 
    industryImpact: 'positive' 
  },
  { 
    id: 25, 
    type: 'COPYRIGHT', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'watch', 
    title: 'US Copyright Office - Digital Works', 
    desc: 'Copyright registration for NFTs, digital art, and blockchain-based creative works', 
    categories: ['dlt', 'crypto'], 
    url: 'https://www.copyright.gov/', 
    passLikelihood: null, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 26, 
    type: 'PATENT', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'GLOBAL', 
    status: 'watch', 
    title: 'Ripple Labs Patent Portfolio', 
    desc: 'Key patents related to XRP Ledger technology and cross-border payments', 
    categories: ['dlt', 'crypto', 'global'], 
    url: 'https://patents.google.com/?assignee=Ripple+Labs&oq=Ripple+Labs', 
    passLikelihood: null, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 27, 
    type: 'PATENT', 
    typeColor: 'cyber-purple', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'watch', 
    title: 'Blockchain Patent Tracker', 
    desc: 'Major tech company blockchain patents (IBM, Mastercard, Bank of America)', 
    categories: ['dlt', 'crypto', 'banking'], 
    url: 'https://patents.google.com/?q=blockchain&oq=blockchain', 
    passLikelihood: null, 
    xrplImpact: 'neutral', 
    industryImpact: 'positive' 
  },
  
  // WATCH Items - Legal Cases
  { 
    id: 28, 
    type: 'CASE', 
    typeColor: 'cyber-cyan', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'watch', 
    title: 'SEC vs Coinbase Litigation', 
    desc: 'Landmark case defining crypto securities classification', 
    categories: ['sec', 'crypto'], 
    url: 'https://www.sec.gov/litigation/litreleases.htm', 
    passLikelihood: 55, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
  { 
    id: 29, 
    type: 'CASE', 
    typeColor: 'cyber-cyan', 
    jurisdiction: 'US',
    countryCode: 'US', 
    status: 'watch', 
    title: 'Tornado Cash Sanctions Appeal', 
    desc: 'Constitutional challenge to OFAC crypto sanctions', 
    categories: ['crypto', 'dlt'], 
    url: 'https://www.coincenter.org/', 
    passLikelihood: 45, 
    xrplImpact: 'positive', 
    industryImpact: 'positive' 
  },
];

// ==================== REGULATORY AGENCIES ====================

export const regulatoryAgencies: RegulatoryAgency[] = [
  // US Regulatory
  { id: 'sec', name: 'Securities and Exchange Commission', shortName: 'SEC', jurisdiction: 'US', countryCode: 'US', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&count=40&search_text=crypto', category: 'regulatory', color: 'cyber-orange' },
  { id: 'cftc', name: 'Commodity Futures Trading Commission', shortName: 'CFTC', jurisdiction: 'US', countryCode: 'US', url: 'https://www.cftc.gov/digitalassets/index.htm', category: 'regulatory', color: 'cyber-orange' },
  { id: 'fincen', name: 'Financial Crimes Enforcement Network', shortName: 'FinCEN', jurisdiction: 'US', countryCode: 'US', url: 'https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets', category: 'regulatory', color: 'cyber-orange' },
  { id: 'irs', name: 'Internal Revenue Service', shortName: 'IRS', jurisdiction: 'US', countryCode: 'US', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/virtual-currencies', category: 'tax', color: 'cyber-orange' },
  { id: 'occ', name: 'Office of the Comptroller', shortName: 'OCC', jurisdiction: 'US', countryCode: 'US', url: 'https://www.occ.gov/topics/supervision-and-examination/bank-management/financial-technology/index-financial-technology.html', category: 'regulatory', color: 'cyber-orange' },
  { id: 'fed', name: 'Federal Reserve', shortName: 'FED', jurisdiction: 'US', countryCode: 'US', url: 'https://www.federalreserve.gov/paymentsystems/fednow_about.htm', category: 'regulatory', color: 'cyber-orange' },
  { id: 'congress', name: 'US Congress', shortName: 'Congress', jurisdiction: 'US', countryCode: 'US', url: 'https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22cryptocurrency%22%7D', category: 'legislative', color: 'cyber-orange' },
  
  // EU/International
  { id: 'esma', name: 'European Securities Markets Authority', shortName: 'ESMA', jurisdiction: 'EU', countryCode: 'EU', url: 'https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica', category: 'regulatory', color: 'cyber-cyan' },
  { id: 'ecb', name: 'European Central Bank', shortName: 'ECB', jurisdiction: 'EU', countryCode: 'EU', url: 'https://www.ecb.europa.eu/paym/digital_euro/html/index.en.html', category: 'regulatory', color: 'cyber-cyan' },
  { id: 'bis', name: 'Bank for International Settlements', shortName: 'BIS', jurisdiction: 'GLOBAL', url: 'https://www.bis.org/topics/cbdc.htm', category: 'regulatory', color: 'cyber-purple' },
  { id: 'fatf', name: 'Financial Action Task Force', shortName: 'FATF', jurisdiction: 'GLOBAL', url: 'https://www.fatf-gafi.org/en/topics/virtual-assets.html', category: 'regulatory', color: 'cyber-purple' },
  
  // Regional
  { id: 'fca', name: 'Financial Conduct Authority', shortName: 'FCA', jurisdiction: 'GB', countryCode: 'GB', url: 'https://www.fca.org.uk/firms/cryptoassets', category: 'regulatory', color: 'cyber-blue' },
  { id: 'bafin', name: 'Federal Financial Supervisory Authority', shortName: 'BaFin', jurisdiction: 'DE', countryCode: 'DE', url: 'https://www.bafin.de/EN/Aufsicht/FinTech/VirtualCurrency/virtual_currency_node_en.html', category: 'regulatory', color: 'cyber-blue' },
  { id: 'jfsa', name: 'Japan Financial Services Agency', shortName: 'JFSA', jurisdiction: 'JP', countryCode: 'JP', url: 'https://www.fsa.go.jp/en/', category: 'regulatory', color: 'cyber-green' },
  { id: 'mas', name: 'Monetary Authority of Singapore', shortName: 'MAS', jurisdiction: 'SG', countryCode: 'SG', url: 'https://www.mas.gov.sg/regulation/payments/payment-services-act', category: 'regulatory', color: 'cyber-green' },
  { id: 'vara', name: 'Virtual Assets Regulatory Authority', shortName: 'VARA', jurisdiction: 'AE', countryCode: 'AE', url: 'https://vara.ae/', category: 'regulatory', color: 'cyber-green' },
  
  // Patent Offices
  { id: 'uspto', name: 'US Patent and Trademark Office', shortName: 'USPTO', jurisdiction: 'US', countryCode: 'US', url: 'https://www.uspto.gov/patents', category: 'patent', color: 'cyber-purple' },
  { id: 'copyright', name: 'US Copyright Office', shortName: 'Copyright', jurisdiction: 'US', countryCode: 'US', url: 'https://www.copyright.gov/', category: 'patent', color: 'cyber-purple' },
  { id: 'wipo', name: 'World Intellectual Property Organization', shortName: 'WIPO', jurisdiction: 'GLOBAL', url: 'https://patentscope.wipo.int/search/en/search.jsf', category: 'patent', color: 'cyber-purple' },
  { id: 'epo', name: 'European Patent Office', shortName: 'EPO', jurisdiction: 'EU', countryCode: 'EU', url: 'https://worldwide.espacenet.com/', category: 'patent', color: 'cyber-purple' },
];

// ==================== COUNTRY PROFILES ====================

export const countryRegulatoryProfiles: CountryRegulatoryProfile[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    overallStatus: 'favorable',
    statusLabel: 'Favorable (post-EO 14178)',
    primaryAgency: 'SEC/CFTC',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'research',
    xrplPresence: 'strong',
    keyDevelopments: [
      'XRP ruled non-security in secondary markets',
      'Pro-crypto Executive Order 14178',
      'Spot BTC/ETH ETFs approved',
      'FIT21 advancing through Congress'
    ],
    activeItemIds: [1, 4, 5, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18],
  },
  {
    countryCode: 'JP',
    countryName: 'Japan',
    overallStatus: 'regulated',
    statusLabel: 'Regulated (JFSA)',
    primaryAgency: 'JFSA',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'pilot',
    xrplPresence: 'strong',
    keyDevelopments: [
      'XRP classified as crypto-asset (not security)',
      'SBI Holdings major XRPL partner',
      'Licensed exchange ecosystem',
      'Digital Yen pilot ongoing'
    ],
    activeItemIds: [30],
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    overallStatus: 'favorable',
    statusLabel: 'Favorable (MAS)',
    primaryAgency: 'MAS',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'pilot',
    xrplPresence: 'strong',
    keyDevelopments: [
      'Ripple APAC HQ location',
      'MAS DPT licensing active',
      'Favorable stablecoin framework',
      'Project Ubin CBDC research'
    ],
    activeItemIds: [31],
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    overallStatus: 'favorable',
    statusLabel: 'Very Favorable (VARA)',
    primaryAgency: 'VARA',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'research',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'VARA comprehensive framework',
      'Dubai crypto hub status',
      'Multiple XRPL providers licensed',
      'MENA expansion gateway'
    ],
    activeItemIds: [32],
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    overallStatus: 'developing',
    statusLabel: 'Developing (FCA)',
    primaryAgency: 'FCA',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'research',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'FCA crypto promotions rules',
      'Stablecoin legislation pending',
      'Digital Pound consultation',
      'Post-Brexit framework developing'
    ],
    activeItemIds: [33],
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    overallStatus: 'regulated',
    statusLabel: 'Regulated (MiCA/BaFin)',
    primaryAgency: 'BaFin',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'research',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'MiCA fully implemented',
      'XRPL Foundation presence',
      'Crypto custody licenses',
      'EU regulatory leader'
    ],
    activeItemIds: [2, 3, 34],
  },
  {
    countryCode: 'KR',
    countryName: 'South Korea',
    overallStatus: 'regulated',
    statusLabel: 'Regulated',
    primaryAgency: 'FSC',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'pilot',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'Virtual Asset User Protection Act',
      'Major exchange integrations',
      'Retail adoption high',
      'CBDC pilot active'
    ],
    activeItemIds: [36],
  },
  {
    countryCode: 'IN',
    countryName: 'India',
    overallStatus: 'unclear',
    statusLabel: 'Unclear',
    primaryAgency: 'RBI',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: false,
    cbdcStatus: 'pilot',
    xrplPresence: 'emerging',
    keyDevelopments: [
      '30% crypto tax in effect',
      'Digital Rupee pilot active',
      'Regulatory clarity pending',
      'Remittance corridor potential'
    ],
    activeItemIds: [35],
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    overallStatus: 'developing',
    statusLabel: 'Developing',
    primaryAgency: 'ASIC',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: false,
    cbdcStatus: 'research',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'Token mapping consultation',
      'ASIC guidance evolving',
      'CBDC research project',
      'Pacific corridor potential'
    ],
    activeItemIds: [],
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    overallStatus: 'developing',
    statusLabel: 'Developing',
    primaryAgency: 'CSA/FINTRAC',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: false,
    cbdcStatus: 'research',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'Provincial registration required',
      'Academic research hub',
      'Waterloo validators',
      'CBDC consultation ongoing'
    ],
    activeItemIds: [],
  },
  {
    countryCode: 'CH',
    countryName: 'Switzerland',
    overallStatus: 'favorable',
    statusLabel: 'Favorable (FINMA)',
    primaryAgency: 'FINMA',
    cryptoLegal: true,
    exchangesAllowed: true,
    stablecoinsRegulated: true,
    cbdcStatus: 'research',
    xrplPresence: 'moderate',
    keyDevelopments: [
      'Crypto Valley ecosystem',
      'FINMA progressive stance',
      'DLT Act framework',
      'Banking integration'
    ],
    activeItemIds: [],
  },
];

// ==================== HELPER FUNCTIONS ====================

export function getItemsByStatus(status: RegulatoryStatus): RegulatoryItem[] {
  return regulatoryItems.filter(item => item.status === status);
}

export function getItemsByJurisdiction(jurisdiction: string): RegulatoryItem[] {
  return regulatoryItems.filter(item => 
    item.jurisdiction === jurisdiction || item.countryCode === jurisdiction
  );
}

export function getItemsByCategory(category: RegulatoryCategory): RegulatoryItem[] {
  return regulatoryItems.filter(item => item.categories.includes(category));
}

export function getCountryProfile(countryCode: string): CountryRegulatoryProfile | undefined {
  return countryRegulatoryProfiles.find(p => p.countryCode === countryCode);
}

export function getAgenciesByCountry(countryCode: string): RegulatoryAgency[] {
  return regulatoryAgencies.filter(a => a.countryCode === countryCode);
}

export function getItemsForCountry(countryCode: string): RegulatoryItem[] {
  return regulatoryItems.filter(item => item.countryCode === countryCode);
}

export function getGlobalItems(): RegulatoryItem[] {
  return regulatoryItems.filter(item => item.jurisdiction === 'GLOBAL');
}

export function getImpactColor(impact: ImpactRating): string {
  switch (impact) {
    case 'positive': return 'text-cyber-green';
    case 'negative': return 'text-cyber-red';
    case 'mixed': return 'text-cyber-yellow';
    default: return 'text-cyber-muted';
  }
}

export function getImpactIcon(impact: ImpactRating): string {
  switch (impact) {
    case 'positive': return '▲';
    case 'negative': return '▼';
    case 'mixed': return '◆';
    default: return '●';
  }
}

export function getStatusColor(status: RegulatoryStatus): string {
  switch (status) {
    case 'active': return 'cyber-green';
    case 'pending': return 'cyber-yellow';
    case 'proposed': return 'cyber-orange';
    case 'watch': return 'cyber-purple';
  }
}

export function getPassLikelihoodColor(likelihood: number | null): string {
  if (likelihood === null) return 'bg-cyber-muted';
  if (likelihood >= 75) return 'bg-cyber-green';
  if (likelihood >= 50) return 'bg-cyber-yellow';
  if (likelihood >= 25) return 'bg-cyber-orange';
  return 'bg-cyber-red';
}

// Stats calculation
export function getRegulatoryStats() {
  return {
    active: regulatoryItems.filter(i => i.status === 'active').length,
    pending: regulatoryItems.filter(i => i.status === 'pending').length,
    proposed: regulatoryItems.filter(i => i.status === 'proposed').length,
    watch: regulatoryItems.filter(i => i.status === 'watch').length,
    total: regulatoryItems.length,
    xrplPositive: regulatoryItems.filter(i => i.xrplImpact === 'positive').length,
    countriesWithProfiles: countryRegulatoryProfiles.length,
  };
}
