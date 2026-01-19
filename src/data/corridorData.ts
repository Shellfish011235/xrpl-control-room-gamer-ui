// Payment Corridors, Bridges & Cross-Chain Data Module
// Comprehensive data for XRPL payment corridors, bridges, EVM sidechains, and cross-chain infrastructure

// ==================== TYPES ====================

export type CorridorType = 'remittance' | 'b2b' | 'retail' | 'institutional' | 'defi';
export type CorridorVolume = 'high' | 'medium' | 'low' | 'emerging';
export type BridgeType = 'native' | 'wrapped' | 'lock-mint' | 'liquidity-pool' | 'atomic-swap';
export type ChainType = 'evm-sidechain' | 'layer1' | 'layer2' | 'appchain';
export type ProjectStatus = 'mainnet' | 'testnet' | 'devnet' | 'announced' | 'deprecated';

export interface PaymentCorridor {
  id: string;
  name: string;
  from: {
    country: string;
    countryCode: string;
    city?: string;
    coordinates: [number, number];
  };
  to: {
    country: string;
    countryCode: string;
    city?: string;
    coordinates: [number, number];
  };
  type: CorridorType;
  volume: CorridorVolume;
  monthlyVolume?: string;
  partners: string[]; // Partner IDs
  description: string;
  xrpSettlement: boolean;
  odlEnabled: boolean;
  launchDate?: string;
  growthYoY?: string;
}

export interface ODLPartner {
  id: string;
  name: string;
  type: 'exchange' | 'payment-provider' | 'bank' | 'fintech' | 'mto'; // Money Transfer Operator
  headquarters: {
    country: string;
    countryCode: string;
    city: string;
    coordinates: [number, number];
  };
  corridors: string[]; // Corridor IDs
  services: string[];
  website?: string;
  xrpIntegration: 'full' | 'partial' | 'pilot';
  status: 'active' | 'pilot' | 'announced';
  description: string;
}

export interface CrossChainBridge {
  id: string;
  name: string;
  type: BridgeType;
  chains: string[]; // Chain IDs it connects
  supportedAssets: string[];
  githubUrl?: string;
  docsUrl?: string;
  website?: string;
  status: ProjectStatus;
  tvl?: string; // Total Value Locked
  description: string;
  features: string[];
  securityModel: string;
}

export interface XRPLConnectedChain {
  id: string;
  name: string;
  symbol: string;
  type: ChainType;
  consensus: string;
  evmCompatible: boolean;
  xrpBridge: boolean;
  mainnetLaunch?: string;
  githubOrg?: string;
  githubRepos: GitHubRepo[];
  website?: string;
  docsUrl?: string;
  explorerUrl?: string;
  description: string;
  features: string[];
  useCases: string[];
  tvl?: string;
  status: ProjectStatus;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  url: string;
  description: string;
  language?: string;
  stars?: number;
  purpose: string;
}

// ==================== ODL PARTNERS ====================

export const odlPartners: ODLPartner[] = [
  {
    id: 'sbi-remit',
    name: 'SBI Remit',
    type: 'mto',
    headquarters: {
      country: 'Japan',
      countryCode: 'JP',
      city: 'Tokyo',
      coordinates: [139.6917, 35.6895],
    },
    corridors: ['jp-ph', 'jp-vn', 'jp-id'],
    services: ['Remittance', 'Cross-border payments'],
    website: 'https://www.remit.co.jp/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Major Japanese remittance provider with deep XRP/ODL integration for Asian corridors.',
  },
  {
    id: 'bitso',
    name: 'Bitso',
    type: 'exchange',
    headquarters: {
      country: 'Mexico',
      countryCode: 'MX',
      city: 'Mexico City',
      coordinates: [-99.1332, 19.4326],
    },
    corridors: ['us-mx', 'us-latam'],
    services: ['Exchange', 'ODL liquidity', 'Retail trading'],
    website: 'https://bitso.com/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Leading Latin American crypto exchange providing ODL liquidity for US-Mexico corridor.',
  },
  {
    id: 'tranglo',
    name: 'Tranglo',
    type: 'payment-provider',
    headquarters: {
      country: 'Malaysia',
      countryCode: 'MY',
      city: 'Kuala Lumpur',
      coordinates: [101.6869, 3.139],
    },
    corridors: ['sg-my', 'sg-ph', 'sg-id', 'sg-th'],
    services: ['Cross-border payments', 'B2B payments', 'Remittance'],
    website: 'https://www.tranglo.com/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Southeast Asian payment hub with extensive ODL coverage across ASEAN markets.',
  },
  {
    id: 'coins-ph',
    name: 'Coins.ph',
    type: 'fintech',
    headquarters: {
      country: 'Philippines',
      countryCode: 'PH',
      city: 'Manila',
      coordinates: [120.9842, 14.5995],
    },
    corridors: ['us-ph', 'jp-ph', 'sg-ph', 'ae-ph'],
    services: ['Mobile wallet', 'Remittance receiving', 'Bill payments'],
    website: 'https://coins.ph/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Leading Philippine mobile wallet enabling instant XRP remittance receipt.',
  },
  {
    id: 'nium',
    name: 'Nium',
    type: 'fintech',
    headquarters: {
      country: 'Singapore',
      countryCode: 'SG',
      city: 'Singapore',
      coordinates: [103.8198, 1.3521],
    },
    corridors: ['sg-in', 'sg-ph', 'eu-apac'],
    services: ['B2B payments', 'Card issuing', 'Banking-as-a-service'],
    website: 'https://www.nium.com/',
    xrpIntegration: 'partial',
    status: 'active',
    description: 'Global fintech infrastructure company with selective ODL integration.',
  },
  {
    id: 'novatti',
    name: 'Novatti',
    type: 'payment-provider',
    headquarters: {
      country: 'Australia',
      countryCode: 'AU',
      city: 'Melbourne',
      coordinates: [144.9631, -37.8136],
    },
    corridors: ['au-ph', 'au-asia'],
    services: ['Payment processing', 'Remittance', 'Banking technology'],
    website: 'https://www.novatti.com/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Australian payment technology provider with ODL-powered Asian corridors.',
  },
  {
    id: 'lulu-exchange',
    name: 'Lulu Exchange',
    type: 'mto',
    headquarters: {
      country: 'United Arab Emirates',
      countryCode: 'AE',
      city: 'Abu Dhabi',
      coordinates: [54.3773, 24.4539],
    },
    corridors: ['ae-pk', 'ae-in', 'ae-ph', 'ae-bd'],
    services: ['Remittance', 'Foreign exchange'],
    website: 'https://www.luluexchange.com/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'UAE-based exchange with XRP settlement for South Asian corridors.',
  },
  {
    id: 'pyypl',
    name: 'pyypl',
    type: 'fintech',
    headquarters: {
      country: 'United Arab Emirates',
      countryCode: 'AE',
      city: 'Dubai',
      coordinates: [55.2708, 25.2048],
    },
    corridors: ['ae-mena', 'ae-africa'],
    services: ['Digital wallet', 'Cross-border payments'],
    website: 'https://www.pyypl.com/',
    xrpIntegration: 'partial',
    status: 'active',
    description: 'Digital financial services platform with MENA & African reach.',
  },
  {
    id: 'azimo',
    name: 'Azimo (Papaya Global)',
    type: 'mto',
    headquarters: {
      country: 'Netherlands',
      countryCode: 'NL',
      city: 'Amsterdam',
      coordinates: [4.9041, 52.3676],
    },
    corridors: ['eu-ph', 'eu-asia', 'eu-africa'],
    services: ['Digital remittance', 'Mobile money'],
    website: 'https://azimo.com/',
    xrpIntegration: 'partial',
    status: 'active',
    description: 'European digital remittance service with global payout network.',
  },
  {
    id: 'sentbe',
    name: 'SentBe',
    type: 'fintech',
    headquarters: {
      country: 'South Korea',
      countryCode: 'KR',
      city: 'Seoul',
      coordinates: [126.978, 37.5665],
    },
    corridors: ['kr-ph', 'kr-vn', 'kr-asia'],
    services: ['Mobile remittance', 'B2B payments'],
    website: 'https://www.sentbe.com/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Korean fintech startup with ODL-powered Southeast Asian remittances.',
  },
  {
    id: 'flash-fx',
    name: 'Flash FX',
    type: 'payment-provider',
    headquarters: {
      country: 'Australia',
      countryCode: 'AU',
      city: 'Brisbane',
      coordinates: [153.0251, -27.4698],
    },
    corridors: ['au-eu', 'au-us', 'au-asia'],
    services: ['B2B payments', 'FX', 'Treasury'],
    website: 'https://www.flashfx.com.au/',
    xrpIntegration: 'full',
    status: 'active',
    description: 'Australian B2B payment specialist with global ODL corridors.',
  },
];

// ==================== PAYMENT CORRIDORS ====================

export const paymentCorridors: PaymentCorridor[] = [
  // Americas
  {
    id: 'us-mx',
    name: 'US → Mexico',
    from: { country: 'United States', countryCode: 'US', city: 'Multiple', coordinates: [-98.5795, 39.8283] },
    to: { country: 'Mexico', countryCode: 'MX', city: 'Multiple', coordinates: [-99.1332, 19.4326] },
    type: 'remittance',
    volume: 'high',
    monthlyVolume: '$2.1B',
    partners: ['bitso'],
    description: 'Largest XRP-facilitated remittance corridor globally. High-frequency, low-value transfers.',
    xrpSettlement: true,
    odlEnabled: true,
    launchDate: '2019-10',
    growthYoY: '+28%',
  },
  {
    id: 'us-ph',
    name: 'US → Philippines',
    from: { country: 'United States', countryCode: 'US', coordinates: [-98.5795, 39.8283] },
    to: { country: 'Philippines', countryCode: 'PH', city: 'Manila', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'high',
    monthlyVolume: '$1.8B',
    partners: ['coins-ph'],
    description: 'Major OFW (Overseas Filipino Workers) remittance corridor with instant settlement.',
    xrpSettlement: true,
    odlEnabled: true,
    launchDate: '2020-02',
    growthYoY: '+34%',
  },
  {
    id: 'us-latam',
    name: 'US → Latin America',
    from: { country: 'United States', countryCode: 'US', coordinates: [-98.5795, 39.8283] },
    to: { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', coordinates: [-46.6333, -23.5505] },
    type: 'remittance',
    volume: 'medium',
    partners: ['bitso'],
    description: 'Expanding corridor serving Central and South American markets.',
    xrpSettlement: true,
    odlEnabled: true,
    growthYoY: '+42%',
  },
  
  // Asia Pacific
  {
    id: 'jp-ph',
    name: 'Japan → Philippines',
    from: { country: 'Japan', countryCode: 'JP', city: 'Tokyo', coordinates: [139.6917, 35.6895] },
    to: { country: 'Philippines', countryCode: 'PH', city: 'Manila', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'high',
    monthlyVolume: '$450M',
    partners: ['sbi-remit', 'coins-ph'],
    description: 'SBI Remit-powered corridor for Japanese workers sending to Philippines.',
    xrpSettlement: true,
    odlEnabled: true,
    launchDate: '2021-03',
    growthYoY: '+22%',
  },
  {
    id: 'jp-vn',
    name: 'Japan → Vietnam',
    from: { country: 'Japan', countryCode: 'JP', city: 'Tokyo', coordinates: [139.6917, 35.6895] },
    to: { country: 'Vietnam', countryCode: 'VN', city: 'Ho Chi Minh City', coordinates: [106.6297, 10.8231] },
    type: 'remittance',
    volume: 'medium',
    partners: ['sbi-remit'],
    description: 'Growing corridor for Vietnamese workers in Japan.',
    xrpSettlement: true,
    odlEnabled: true,
    growthYoY: '+38%',
  },
  {
    id: 'jp-id',
    name: 'Japan → Indonesia',
    from: { country: 'Japan', countryCode: 'JP', city: 'Tokyo', coordinates: [139.6917, 35.6895] },
    to: { country: 'Indonesia', countryCode: 'ID', city: 'Jakarta', coordinates: [106.8456, -6.2088] },
    type: 'remittance',
    volume: 'medium',
    partners: ['sbi-remit'],
    description: 'Expanding Japanese-Indonesian remittance route.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'sg-ph',
    name: 'Singapore → Philippines',
    from: { country: 'Singapore', countryCode: 'SG', coordinates: [103.8198, 1.3521] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'medium',
    partners: ['tranglo', 'coins-ph', 'nium'],
    description: 'ASEAN remittance corridor via Tranglo network.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'sg-my',
    name: 'Singapore ↔ Malaysia',
    from: { country: 'Singapore', countryCode: 'SG', coordinates: [103.8198, 1.3521] },
    to: { country: 'Malaysia', countryCode: 'MY', city: 'Kuala Lumpur', coordinates: [101.6869, 3.139] },
    type: 'b2b',
    volume: 'medium',
    partners: ['tranglo'],
    description: 'High-frequency business payments between Singapore and Malaysia.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'sg-in',
    name: 'Singapore → India',
    from: { country: 'Singapore', countryCode: 'SG', coordinates: [103.8198, 1.3521] },
    to: { country: 'India', countryCode: 'IN', city: 'Mumbai', coordinates: [72.8777, 19.076] },
    type: 'remittance',
    volume: 'medium',
    partners: ['nium', 'tranglo'],
    description: 'Tech sector and worker remittances to India.',
    xrpSettlement: true,
    odlEnabled: true,
    growthYoY: '+45%',
  },
  {
    id: 'au-ph',
    name: 'Australia → Philippines',
    from: { country: 'Australia', countryCode: 'AU', city: 'Sydney', coordinates: [151.2093, -33.8688] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'medium',
    partners: ['novatti', 'coins-ph'],
    description: 'Filipino diaspora remittances from Australia.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'kr-ph',
    name: 'South Korea → Philippines',
    from: { country: 'South Korea', countryCode: 'KR', city: 'Seoul', coordinates: [126.978, 37.5665] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'medium',
    partners: ['sentbe', 'coins-ph'],
    description: 'Korean worker and tourist remittances to Philippines.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  
  // Middle East
  {
    id: 'ae-pk',
    name: 'UAE → Pakistan',
    from: { country: 'UAE', countryCode: 'AE', city: 'Dubai', coordinates: [55.2708, 25.2048] },
    to: { country: 'Pakistan', countryCode: 'PK', city: 'Karachi', coordinates: [67.0011, 24.8607] },
    type: 'remittance',
    volume: 'high',
    partners: ['lulu-exchange'],
    description: 'Major Gulf worker remittance corridor to Pakistan.',
    xrpSettlement: true,
    odlEnabled: true,
    growthYoY: '+31%',
  },
  {
    id: 'ae-in',
    name: 'UAE → India',
    from: { country: 'UAE', countryCode: 'AE', city: 'Dubai', coordinates: [55.2708, 25.2048] },
    to: { country: 'India', countryCode: 'IN', city: 'Mumbai', coordinates: [72.8777, 19.076] },
    type: 'remittance',
    volume: 'high',
    partners: ['lulu-exchange'],
    description: 'Massive Indian diaspora remittance corridor from Gulf.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'ae-ph',
    name: 'UAE → Philippines',
    from: { country: 'UAE', countryCode: 'AE', city: 'Dubai', coordinates: [55.2708, 25.2048] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'medium',
    partners: ['lulu-exchange', 'coins-ph'],
    description: 'OFW remittances from UAE to Philippines.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'ae-bd',
    name: 'UAE → Bangladesh',
    from: { country: 'UAE', countryCode: 'AE', coordinates: [55.2708, 25.2048] },
    to: { country: 'Bangladesh', countryCode: 'BD', city: 'Dhaka', coordinates: [90.4125, 23.8103] },
    type: 'remittance',
    volume: 'medium',
    partners: ['lulu-exchange'],
    description: 'Bangladeshi worker remittances from Gulf region.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  
  // Europe
  {
    id: 'eu-uk',
    name: 'EU ↔ UK',
    from: { country: 'EU', countryCode: 'EU', city: 'Frankfurt', coordinates: [8.6821, 50.1109] },
    to: { country: 'UK', countryCode: 'GB', city: 'London', coordinates: [-0.1276, 51.5074] },
    type: 'b2b',
    volume: 'medium',
    partners: ['azimo'],
    description: 'Post-Brexit cross-channel business and personal payments.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'eu-ph',
    name: 'Europe → Philippines',
    from: { country: 'EU', countryCode: 'EU', coordinates: [4.9041, 52.3676] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'medium',
    partners: ['azimo', 'coins-ph'],
    description: 'European diaspora remittances to Philippines.',
    xrpSettlement: true,
    odlEnabled: true,
  },
  {
    id: 'au-eu',
    name: 'Australia ↔ Europe',
    from: { country: 'Australia', countryCode: 'AU', coordinates: [151.2093, -33.8688] },
    to: { country: 'EU', countryCode: 'EU', coordinates: [8.6821, 50.1109] },
    type: 'b2b',
    volume: 'low',
    partners: ['flash-fx'],
    description: 'Business payments between Australia and Europe.',
    xrpSettlement: true,
    odlEnabled: true,
  },
];

// ==================== XRPL-CONNECTED CHAINS ====================

export const xrplConnectedChains: XRPLConnectedChain[] = [
  {
    id: 'xrpl-evm-sidechain',
    name: 'XRPL EVM Sidechain',
    symbol: 'XRP',
    type: 'evm-sidechain',
    consensus: 'Proof of Authority (Clique)',
    evmCompatible: true,
    xrpBridge: true,
    mainnetLaunch: '2024-Q2',
    githubOrg: 'Peersyst',
    githubRepos: [
      {
        name: 'xrpl-evm-sidechain',
        fullName: 'Peersyst/xrpl-evm-sidechain',
        url: 'https://github.com/Peersyst/xrpl-evm-sidechain',
        description: 'Official XRPL EVM Sidechain implementation - EVM-compatible blockchain connected to XRP Ledger.',
        language: 'Go',
        purpose: 'Core sidechain node software',
      },
      {
        name: 'xrpl-evm-bridge',
        fullName: 'Peersyst/xrpl-evm-bridge',
        url: 'https://github.com/Peersyst/xrpl-evm-bridge',
        description: 'Bridge contracts and relayer for XRP transfers between XRPL and EVM Sidechain.',
        language: 'Solidity',
        purpose: 'Bridge infrastructure',
      },
    ],
    website: 'https://xrplevm.org',
    docsUrl: 'https://docs.xrplevm.org',
    explorerUrl: 'https://explorer.xrplevm.org',
    description: 'Official EVM-compatible sidechain for XRPL, enabling Solidity smart contracts with XRP as native gas token.',
    features: [
      'Full EVM compatibility',
      'XRP as native gas token',
      'Native XRPL bridge',
      'Solidity smart contracts',
      'Low transaction fees',
      'Fast finality',
    ],
    useCases: ['DeFi', 'NFTs', 'Gaming', 'dApps'],
    status: 'mainnet',
  },
  {
    id: 'root-network',
    name: 'The Root Network',
    symbol: 'ROOT',
    type: 'layer1',
    consensus: 'Nominated Proof of Stake',
    evmCompatible: true,
    xrpBridge: true,
    mainnetLaunch: '2023-03',
    githubOrg: 'futureversecom',
    githubRepos: [
      {
        name: 'trn-node',
        fullName: 'futureversecom/trn-node',
        url: 'https://github.com/futureversecom/trn-node',
        description: 'The Root Network node implementation - Substrate-based blockchain for metaverse applications.',
        language: 'Rust',
        purpose: 'Core node software',
      },
      {
        name: 'trn-seed',
        fullName: 'futureversecom/trn-seed',
        url: 'https://github.com/futureversecom/trn-seed',
        description: 'SDK and tools for building on The Root Network.',
        language: 'TypeScript',
        purpose: 'Developer SDK',
      },
    ],
    website: 'https://www.therootnetwork.com',
    docsUrl: 'https://docs.therootnetwork.com',
    explorerUrl: 'https://explorer.rootnet.live',
    description: 'Gaming and metaverse-focused blockchain with XRP integration via Futureverse.',
    features: [
      'XRP bridge',
      'NFT infrastructure',
      'Gaming primitives',
      'Multi-token gas',
      'Substrate-based',
      'EVM compatibility',
    ],
    useCases: ['Gaming', 'Metaverse', 'NFTs', 'Digital collectibles'],
    status: 'mainnet',
  },
  {
    id: 'flare-network',
    name: 'Flare Network',
    symbol: 'FLR',
    type: 'layer1',
    consensus: 'Federated Byzantine Agreement',
    evmCompatible: true,
    xrpBridge: true,
    mainnetLaunch: '2023-01',
    githubOrg: 'flare-foundation',
    githubRepos: [
      {
        name: 'flare',
        fullName: 'flare-foundation/flare',
        url: 'https://github.com/flare-foundation/flare',
        description: 'Flare Network node - EVM blockchain with native data oracle.',
        language: 'Go',
        purpose: 'Core node software',
      },
      {
        name: 'FAssets',
        fullName: 'flare-foundation/fassets',
        url: 'https://github.com/flare-foundation/fassets',
        description: 'FAssets protocol for trustless bridging of non-smart contract tokens like XRP.',
        language: 'Solidity',
        purpose: 'XRP bridging protocol',
      },
      {
        name: 'FTSO',
        fullName: 'flare-foundation/ftso',
        url: 'https://github.com/flare-foundation/ftso',
        description: 'Flare Time Series Oracle - decentralized price feeds.',
        language: 'Solidity',
        purpose: 'Oracle infrastructure',
      },
    ],
    website: 'https://flare.network',
    docsUrl: 'https://docs.flare.network',
    explorerUrl: 'https://flare-explorer.flare.network',
    description: 'EVM-compatible L1 with native oracle (FTSO) and FAssets for trustless XRP bridging.',
    features: [
      'FAssets (trustless XRP bridge)',
      'FTSO price oracle',
      'State Connector',
      'LayerCake cross-chain',
      'EVM compatible',
      'Data protocols',
    ],
    useCases: ['DeFi', 'Oracles', 'Cross-chain', 'Data availability'],
    tvl: '$150M',
    status: 'mainnet',
  },
  {
    id: 'songbird',
    name: 'Songbird',
    symbol: 'SGB',
    type: 'layer1',
    consensus: 'Federated Byzantine Agreement',
    evmCompatible: true,
    xrpBridge: false,
    mainnetLaunch: '2021-09',
    githubOrg: 'flare-foundation',
    githubRepos: [
      {
        name: 'songbird',
        fullName: 'flare-foundation/songbird',
        url: 'https://github.com/flare-foundation/songbird',
        description: 'Songbird canary network for Flare - testing ground for new features.',
        language: 'Go',
        purpose: 'Canary network node',
      },
    ],
    website: 'https://songbird.network',
    explorerUrl: 'https://songbird-explorer.flare.network',
    description: 'Flare\'s canary network for testing new features before Flare mainnet deployment.',
    features: [
      'Test environment',
      'FTSO testing',
      'EVM compatible',
      'Governance testing',
    ],
    useCases: ['Testing', 'Development', 'Governance'],
    status: 'mainnet',
  },
  {
    id: 'coreum',
    name: 'Coreum',
    symbol: 'CORE',
    type: 'layer1',
    consensus: 'Bonded Proof of Stake (Tendermint)',
    evmCompatible: false,
    xrpBridge: true,
    mainnetLaunch: '2023-03',
    githubOrg: 'CoreumFoundation',
    githubRepos: [
      {
        name: 'coreum',
        fullName: 'CoreumFoundation/coreum',
        url: 'https://github.com/CoreumFoundation/coreum',
        description: 'Coreum blockchain node - enterprise-grade layer-1 with smart tokens.',
        language: 'Go',
        purpose: 'Core node software',
      },
      {
        name: 'coreumbridge-xrpl',
        fullName: 'CoreumFoundation/coreumbridge-xrpl',
        url: 'https://github.com/CoreumFoundation/coreumbridge-xrpl',
        description: 'XRPL-Coreum bridge for cross-chain token transfers.',
        language: 'Go',
        purpose: 'XRPL bridge',
      },
      {
        name: 'coreum-wasm-sdk',
        fullName: 'CoreumFoundation/coreum-wasm-sdk',
        url: 'https://github.com/CoreumFoundation/coreum-wasm-sdk',
        description: 'CosmWasm SDK for building smart contracts on Coreum.',
        language: 'Rust',
        purpose: 'Smart contract SDK',
      },
    ],
    website: 'https://www.coreum.com',
    docsUrl: 'https://docs.coreum.dev',
    explorerUrl: 'https://explorer.coreum.com',
    description: 'Enterprise-grade L1 blockchain with native XRPL bridge and smart tokens.',
    features: [
      'Native XRPL bridge',
      'Smart tokens',
      'IBC compatible',
      'Enterprise features',
      'CosmWasm contracts',
      'Low latency',
    ],
    useCases: ['Enterprise', 'Tokenization', 'Cross-chain', 'CBDCs'],
    tvl: '$50M',
    status: 'mainnet',
  },
  {
    id: 'xahau',
    name: 'Xahau',
    symbol: 'XAH',
    type: 'layer1',
    consensus: 'XRPL Consensus',
    evmCompatible: false,
    xrpBridge: true,
    mainnetLaunch: '2023-10',
    githubOrg: 'Xahau',
    githubRepos: [
      {
        name: 'xahaud',
        fullName: 'Xahau/xahaud',
        url: 'https://github.com/Xahau/xahaud',
        description: 'Xahau network daemon - XRPL fork with Hooks smart contracts.',
        language: 'C++',
        purpose: 'Core node software',
      },
      {
        name: 'hooks-toolkit-ts',
        fullName: 'Xahau/hooks-toolkit-ts',
        url: 'https://github.com/Xahau/hooks-toolkit-ts',
        description: 'TypeScript toolkit for developing Hooks on Xahau.',
        language: 'TypeScript',
        purpose: 'Developer toolkit',
      },
    ],
    website: 'https://xahau.network',
    docsUrl: 'https://docs.xahau.network',
    explorerUrl: 'https://explorer.xahau.network',
    description: 'XRPL-based network with Hooks (smart contracts) enabled by default.',
    features: [
      'Hooks smart contracts',
      'XRPL compatible',
      'Burn2Mint bridge',
      'Native governance',
      'High performance',
    ],
    useCases: ['Smart contracts', 'DeFi', 'Automated transactions'],
    status: 'mainnet',
  },
];

// ==================== CROSS-CHAIN BRIDGES ====================

export const crossChainBridges: CrossChainBridge[] = [
  {
    id: 'xrpl-evm-bridge',
    name: 'XRPL EVM Bridge',
    type: 'lock-mint',
    chains: ['xrpl', 'xrpl-evm-sidechain'],
    supportedAssets: ['XRP'],
    githubUrl: 'https://github.com/Peersyst/xrpl-evm-bridge',
    docsUrl: 'https://docs.xrplevm.org/bridge',
    website: 'https://bridge.xrplevm.org',
    status: 'mainnet',
    description: 'Official bridge between XRP Ledger and XRPL EVM Sidechain.',
    features: ['Native XRP bridging', 'Fast finality', 'Low fees', 'Trustless'],
    securityModel: 'Federated validators with multi-sig',
  },
  {
    id: 'flare-fassets',
    name: 'Flare FAssets',
    type: 'lock-mint',
    chains: ['xrpl', 'flare-network'],
    supportedAssets: ['XRP', 'BTC', 'DOGE', 'LTC'],
    githubUrl: 'https://github.com/flare-foundation/fassets',
    docsUrl: 'https://docs.flare.network/tech/fassets/',
    website: 'https://flare.network/fassets',
    status: 'mainnet',
    tvl: '$25M',
    description: 'Trustless bridging protocol bringing XRP and other non-smart contract tokens to Flare.',
    features: ['Trustless minting', 'Over-collateralized', 'Liquidation mechanism', 'Decentralized agents'],
    securityModel: 'Over-collateralization with agent system',
  },
  {
    id: 'coreum-xrpl-bridge',
    name: 'Coreum-XRPL Bridge',
    type: 'lock-mint',
    chains: ['xrpl', 'coreum'],
    supportedAssets: ['XRP', 'CORE', 'XRPL tokens'],
    githubUrl: 'https://github.com/CoreumFoundation/coreumbridge-xrpl',
    docsUrl: 'https://docs.coreum.dev/docs/xrpl-bridge',
    website: 'https://www.coreum.com/bridge',
    status: 'mainnet',
    description: 'Bi-directional bridge between XRPL and Coreum for native and issued tokens.',
    features: ['Multi-asset support', 'IBC routing', 'Relayer network', 'Token registry'],
    securityModel: 'Decentralized relayer network',
  },
  {
    id: 'root-xrp-bridge',
    name: 'Root Network XRP Bridge',
    type: 'lock-mint',
    chains: ['xrpl', 'root-network'],
    supportedAssets: ['XRP'],
    githubUrl: 'https://github.com/futureversecom/trn-node',
    website: 'https://www.therootnetwork.com',
    status: 'mainnet',
    description: 'Native XRP bridge to The Root Network for gaming and metaverse applications.',
    features: ['Gaming optimized', 'Fast bridging', 'NFT support'],
    securityModel: 'Validator bridge committee',
  },
  {
    id: 'xahau-burn2mint',
    name: 'Xahau Burn2Mint',
    type: 'atomic-swap',
    chains: ['xrpl', 'xahau'],
    supportedAssets: ['XRP'],
    githubUrl: 'https://github.com/Xahau/xahaud',
    docsUrl: 'https://docs.xahau.network/features/burn2mint',
    status: 'mainnet',
    description: 'Unique burn-and-mint mechanism for trustless XRP bridging to Xahau.',
    features: ['Trustless', 'Atomic', 'No custodian', 'Irreversible burns'],
    securityModel: 'Cryptographic proof of burn',
  },
  {
    id: 'multichain-xrp',
    name: 'Multichain (Archived)',
    type: 'lock-mint',
    chains: ['xrpl', 'ethereum', 'bsc', 'polygon'],
    supportedAssets: ['XRP'],
    status: 'deprecated',
    description: 'Previously supported XRP bridging to multiple EVM chains. Now deprecated.',
    features: ['Multi-chain', 'Wrapped tokens'],
    securityModel: 'MPC network (deprecated)',
  },
  {
    id: 'wanchain-xrp',
    name: 'Wanchain XRP Bridge',
    type: 'lock-mint',
    chains: ['xrpl', 'wanchain', 'ethereum'],
    supportedAssets: ['XRP'],
    githubUrl: 'https://github.com/wanchain/wanchain-crosschain-contracts',
    website: 'https://www.wanchain.org',
    status: 'mainnet',
    description: 'Cross-chain bridge supporting XRP via Wanchain infrastructure.',
    features: ['Secure MPC', 'Multiple chains', 'Decentralized'],
    securityModel: 'Storeman node network with MPC',
  },
];

// ==================== HELPER FUNCTIONS ====================

export function getCorridorsByCountry(countryCode: string): PaymentCorridor[] {
  return paymentCorridors.filter(
    c => c.from.countryCode === countryCode || c.to.countryCode === countryCode
  );
}

export function getPartnersByCountry(countryCode: string): ODLPartner[] {
  return odlPartners.filter(p => p.headquarters.countryCode === countryCode);
}

export function getPartnerById(id: string): ODLPartner | undefined {
  return odlPartners.find(p => p.id === id);
}

export function getCorridorById(id: string): PaymentCorridor | undefined {
  return paymentCorridors.find(c => c.id === id);
}

export function getChainById(id: string): XRPLConnectedChain | undefined {
  return xrplConnectedChains.find(c => c.id === id);
}

export function getBridgeById(id: string): CrossChainBridge | undefined {
  return crossChainBridges.find(b => b.id === id);
}

export function getCorridorsByVolume(volume: CorridorVolume): PaymentCorridor[] {
  return paymentCorridors.filter(c => c.volume === volume);
}

export function getActiveChains(): XRPLConnectedChain[] {
  return xrplConnectedChains.filter(c => c.status === 'mainnet');
}

export function getActiveBridges(): CrossChainBridge[] {
  return crossChainBridges.filter(b => b.status === 'mainnet');
}

export function getAllGitHubRepos(): GitHubRepo[] {
  return xrplConnectedChains.flatMap(c => c.githubRepos);
}

export function getCorridorStats() {
  const totalVolume = paymentCorridors
    .filter(c => c.monthlyVolume)
    .reduce((sum, c) => {
      const vol = parseFloat(c.monthlyVolume!.replace(/[$B,]/g, ''));
      return sum + (c.monthlyVolume!.includes('B') ? vol * 1000 : vol);
    }, 0);
  
  return {
    totalCorridors: paymentCorridors.length,
    highVolumeCorridors: paymentCorridors.filter(c => c.volume === 'high').length,
    odlEnabled: paymentCorridors.filter(c => c.odlEnabled).length,
    xrpSettlement: paymentCorridors.filter(c => c.xrpSettlement).length,
    totalPartners: odlPartners.length,
    activePartners: odlPartners.filter(p => p.status === 'active').length,
    connectedChains: xrplConnectedChains.filter(c => c.status === 'mainnet').length,
    activeBridges: crossChainBridges.filter(b => b.status === 'mainnet').length,
    estimatedMonthlyVolume: `$${(totalVolume / 1000).toFixed(1)}B+`,
  };
}

export function getVolumeColor(volume: CorridorVolume): string {
  switch (volume) {
    case 'high': return '#00ff88';
    case 'medium': return '#00d4ff';
    case 'low': return '#ffd700';
    case 'emerging': return '#a855f7';
  }
}

export function getTypeColor(type: CorridorType): string {
  switch (type) {
    case 'remittance': return '#00ff88';
    case 'b2b': return '#00d4ff';
    case 'retail': return '#ffd700';
    case 'institutional': return '#a855f7';
    case 'defi': return '#ff00ff';
  }
}

export function getChainStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'mainnet': return '#00ff88';
    case 'testnet': return '#00d4ff';
    case 'devnet': return '#ffd700';
    case 'announced': return '#a855f7';
    case 'deprecated': return '#64748b';
  }
}
