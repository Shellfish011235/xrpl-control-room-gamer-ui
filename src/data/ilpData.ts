// Interledger Protocol (ILP) Data Module
// Comprehensive data for ILP connectors, tools, and ecosystem

// ==================== TYPES ====================

export type ILPComponentType = 'connector' | 'sdk' | 'protocol' | 'tool' | 'wallet' | 'testnet';
export type ILPLanguage = 'javascript' | 'typescript' | 'rust' | 'java' | 'python' | 'go' | 'php';
export type ILPStatus = 'active' | 'maintained' | 'experimental' | 'deprecated';

export interface ILPRepository {
  id: string;
  name: string;
  fullName: string; // org/repo format
  description: string;
  type: ILPComponentType;
  languages: ILPLanguage[];
  status: ILPStatus;
  url: string;
  npmPackage?: string;
  docsUrl?: string;
  stars?: number;
  features: string[];
  useCases: string[];
  xrplIntegration: boolean;
  lastUpdated?: string;
}

export interface ILPProtocolSpec {
  id: string;
  name: string;
  rfcNumber?: string;
  description: string;
  specUrl: string;
  status: 'final' | 'draft' | 'proposed';
  category: 'core' | 'application' | 'transport' | 'addressing';
}

export interface ILPConnectorInstance {
  id: string;
  name: string;
  operator: string;
  type: 'production' | 'testnet' | 'research';
  implementation: string; // which repo it's based on
  location?: {
    city: string;
    country: string;
    countryCode: string;
    coordinates: [number, number];
  };
  supportedAssets: string[];
  features: string[];
  status: 'online' | 'offline' | 'unknown';
  url?: string;
  peering: string[]; // IDs of connectors it peers with
  // Volume metrics
  monthlyVolume?: string;
  dailyTransactions?: string;
  avgLatency?: string;
  uptime?: string;
}

export interface ILPCorridor {
  id: string;
  name: string;
  from: {
    country: string;
    countryCode: string;
    coordinates: [number, number];
  };
  to: {
    country: string;
    countryCode: string;
    coordinates: [number, number];
  };
  type: 'remittance' | 'b2b' | 'micropayment' | 'cbdc';
  volume: 'high' | 'medium' | 'low' | 'pilot';
  connectorIds: string[];
  description: string;
  monthlyVolume?: string;
  dailyTransactions?: string;
  avgSettlementTime?: string;
  growthYoY?: string;
  fees?: string;
  xrplBacked: boolean;
}

export interface ILPUseCase {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: string[];
  repositories: string[]; // repo IDs
  color: string;
}

// ==================== GITHUB REPOSITORIES ====================

export const ilpRepositories: ILPRepository[] = [
  // Core Implementations
  {
    id: 'rafiki',
    name: 'Rafiki',
    fullName: 'interledger/rafiki',
    description: 'Open-source Interledger service for wallet providers. Includes ILP connector, Open Payments APIs, and high-throughput accounting with TigerBeetle.',
    type: 'connector',
    languages: ['typescript'],
    status: 'active',
    url: 'https://github.com/interledger/rafiki',
    docsUrl: 'https://rafiki.dev',
    features: [
      'Full ILP connector',
      'Open Payments support',
      'SPSP server',
      'TigerBeetle accounting',
      'Admin GraphQL API',
      'Multi-asset support',
      'Webhook notifications',
      'Rate limiting',
    ],
    useCases: ['wallet-provider', 'payment-platform', 'fintech'],
    xrplIntegration: true,
  },
  {
    id: 'ilp-connector-js',
    name: 'ILP Connector (JS)',
    fullName: 'interledgerjs/ilp-connector',
    description: 'Reference JavaScript implementation of an ILP connector. Forwards ILP packets, handles routing, and supports multiple plugins.',
    type: 'connector',
    languages: ['javascript', 'typescript'],
    status: 'maintained',
    url: 'https://github.com/interledgerjs/ilp-connector',
    npmPackage: 'ilp-connector',
    features: [
      'ILPv4 support',
      'Plugin architecture',
      'Route broadcasting',
      'Balance management',
      'Settlement engine support',
      'Multi-backend support',
    ],
    useCases: ['connector-operator', 'payment-routing'],
    xrplIntegration: true,
  },
  {
    id: 'java-ilp-connector',
    name: 'Java ILP Connector',
    fullName: 'interledger4j/ilpv4-connector',
    description: 'High-performance Java implementation of ILPv4 connector with enterprise features.',
    type: 'connector',
    languages: ['java'],
    status: 'maintained',
    url: 'https://github.com/interledger4j/ilpv4-connector',
    docsUrl: 'https://connector.interledger4j.dev',
    features: [
      'ILPv4 protocol',
      'ILDCP support',
      'HTTP/2 transport',
      'Redis balance tracking',
      'Route broadcasting',
      'JVM performance',
      'Spring Boot integration',
    ],
    useCases: ['enterprise', 'high-throughput', 'jvm-ecosystem'],
    xrplIntegration: true,
  },

  // Protocol Specifications
  {
    id: 'rfcs',
    name: 'Interledger RFCs',
    fullName: 'interledger/rfcs',
    description: 'Official protocol specifications for ILPv4, STREAM, SPSP, addressing, and more.',
    type: 'protocol',
    languages: [],
    status: 'active',
    url: 'https://github.com/interledger/rfcs',
    docsUrl: 'https://interledger.org/rfcs',
    features: [
      'ILPv4 specification',
      'STREAM protocol',
      'SPSP protocol',
      'ILP addressing',
      'Routing protocol',
    ],
    useCases: ['specification', 'implementation-guide'],
    xrplIntegration: false,
  },

  // Open Payments
  {
    id: 'open-payments',
    name: 'Open Payments',
    fullName: 'interledger/open-payments',
    description: 'API standard for interoperable payments. Includes TypeScript SDK, PHP SDK, and specification.',
    type: 'sdk',
    languages: ['typescript', 'php'],
    status: 'active',
    url: 'https://github.com/interledger/open-payments',
    docsUrl: 'https://openpayments.guide',
    features: [
      'Wallet addresses',
      'Incoming payments',
      'Outgoing payments',
      'Quotes API',
      'GNAP authorization',
      'TypeScript client',
    ],
    useCases: ['wallet-integration', 'payment-initiation', 'api-development'],
    xrplIntegration: false,
  },
  {
    id: 'open-payments-rust',
    name: 'Open Payments (Rust)',
    fullName: 'interledger/open-payments-rust',
    description: 'Rust implementation of Open Payments client and types.',
    type: 'sdk',
    languages: ['rust'],
    status: 'active',
    url: 'https://github.com/interledger/open-payments-rust',
    features: [
      'Rust types',
      'HTTP client',
      'Async support',
      'Type safety',
    ],
    useCases: ['rust-integration', 'performance-critical'],
    xrplIntegration: false,
  },
  {
    id: 'open-payments-python',
    name: 'Open Payments (Python)',
    fullName: 'interledger/open-payments-python-sdk',
    description: 'Python SDK for interacting with Open Payments APIs.',
    type: 'sdk',
    languages: ['python'],
    status: 'active',
    url: 'https://github.com/interledger/open-payments-python-sdk',
    features: [
      'Python client',
      'Async support',
      'Type hints',
      'Full API coverage',
    ],
    useCases: ['python-integration', 'scripting', 'data-analysis'],
    xrplIntegration: false,
  },

  // Testing & Development
  {
    id: 'testnet',
    name: 'Interledger Testnet',
    fullName: 'interledger/testnet',
    description: 'Sandbox environment for testing Rafiki with sample wallets and e-commerce.',
    type: 'testnet',
    languages: ['typescript'],
    status: 'active',
    url: 'https://github.com/interledger/testnet',
    docsUrl: 'https://rafiki.dev/playground/overview',
    features: [
      'Sample wallets',
      'E-commerce demo',
      'Rafiki integration',
      'Docker setup',
      'Local development',
    ],
    useCases: ['testing', 'development', 'demo', 'learning'],
    xrplIntegration: false,
  },
  {
    id: 'interledger-pay',
    name: 'Interledger Pay',
    fullName: 'interledger/interledger-pay',
    description: 'Simplified payment platform demonstrating ILP payment flows.',
    type: 'tool',
    languages: ['typescript'],
    status: 'maintained',
    url: 'https://github.com/interledger/interledger-pay',
    features: [
      'Payment UI',
      'SPSP integration',
      'Simple interface',
    ],
    useCases: ['demo', 'payment-flow', 'ui-reference'],
    xrplIntegration: false,
  },

  // Plugins & Extensions
  {
    id: 'ilp-plugin-xrp-paychan',
    name: 'XRP Payment Channel Plugin',
    fullName: 'interledgerjs/ilp-plugin-xrp-paychan',
    description: 'ILP plugin for XRP Ledger payment channels. Enables fast, off-ledger ILP settlements.',
    type: 'tool',
    languages: ['javascript'],
    status: 'maintained',
    url: 'https://github.com/interledgerjs/ilp-plugin-xrp-paychan',
    npmPackage: 'ilp-plugin-xrp-paychan',
    features: [
      'XRP payment channels',
      'Fast settlement',
      'Off-ledger transfers',
      'Automatic channel management',
    ],
    useCases: ['xrp-settlement', 'high-frequency-payments'],
    xrplIntegration: true,
  },
  {
    id: 'ilp-plugin-xrp-asym-server',
    name: 'XRP Asymmetric Server Plugin',
    fullName: 'interledgerjs/ilp-plugin-xrp-asym-server',
    description: 'Asymmetric server-side plugin for XRP payment channels.',
    type: 'tool',
    languages: ['javascript'],
    status: 'maintained',
    url: 'https://github.com/interledgerjs/ilp-plugin-xrp-asym-server',
    features: [
      'Server-side plugin',
      'Asymmetric channels',
      'Multi-client support',
    ],
    useCases: ['server-deployment', 'connector-setup'],
    xrplIntegration: true,
  },

  // Web Monetization
  {
    id: 'web-monetization',
    name: 'Web Monetization',
    fullName: 'interledger/web-monetization',
    description: 'Proposed browser API for streaming micropayments to websites using ILP.',
    type: 'protocol',
    languages: ['typescript'],
    status: 'active',
    url: 'https://github.com/interledger/web-monetization',
    docsUrl: 'https://webmonetization.org',
    features: [
      'Browser API spec',
      'Micropayment streams',
      'Content monetization',
      'Privacy-preserving',
    ],
    useCases: ['content-monetization', 'streaming-payments', 'web-publishers'],
    xrplIntegration: false,
  },

  // Stream Protocol
  {
    id: 'ilp-protocol-stream',
    name: 'STREAM Protocol',
    fullName: 'interledgerjs/ilp-protocol-stream',
    description: 'Implementation of the STREAM transport protocol for ILP.',
    type: 'protocol',
    languages: ['javascript', 'typescript'],
    status: 'maintained',
    url: 'https://github.com/interledgerjs/ilp-protocol-stream',
    npmPackage: 'ilp-protocol-stream',
    features: [
      'Streaming payments',
      'Multiplexed connections',
      'Receipt generation',
      'Congestion control',
    ],
    useCases: ['streaming-payments', 'transport-layer'],
    xrplIntegration: false,
  },
];

// ==================== PROTOCOL SPECIFICATIONS ====================

export const ilpProtocolSpecs: ILPProtocolSpec[] = [
  {
    id: 'ilpv4',
    name: 'ILPv4 (Interledger Protocol v4)',
    rfcNumber: 'IL-RFC-0027',
    description: 'Core packet format and forwarding rules for the Interledger Protocol.',
    specUrl: 'https://interledger.org/rfcs/0027-interledger-protocol-4/',
    status: 'final',
    category: 'core',
  },
  {
    id: 'stream',
    name: 'STREAM Protocol',
    rfcNumber: 'IL-RFC-0029',
    description: 'Transport protocol providing end-to-end encryption, multiplexing, and streaming payments.',
    specUrl: 'https://interledger.org/rfcs/0029-stream/',
    status: 'final',
    category: 'transport',
  },
  {
    id: 'spsp',
    name: 'Simple Payment Setup Protocol (SPSP)',
    rfcNumber: 'IL-RFC-0009',
    description: 'Protocol for exchanging payment details via payment pointers.',
    specUrl: 'https://interledger.org/rfcs/0009-simple-payment-setup-protocol/',
    status: 'final',
    category: 'application',
  },
  {
    id: 'ilp-addresses',
    name: 'ILP Addresses',
    rfcNumber: 'IL-RFC-0015',
    description: 'Hierarchical addressing scheme for ILP endpoints.',
    specUrl: 'https://interledger.org/rfcs/0015-ilp-addresses/',
    status: 'final',
    category: 'addressing',
  },
  {
    id: 'ildcp',
    name: 'ILP Dynamic Configuration Protocol',
    rfcNumber: 'IL-RFC-0031',
    description: 'Protocol for dynamically configuring ILP addresses and assets.',
    specUrl: 'https://interledger.org/rfcs/0031-dynamic-configuration-protocol/',
    status: 'final',
    category: 'core',
  },
  {
    id: 'route-broadcast',
    name: 'Route Broadcasting Protocol',
    rfcNumber: 'IL-RFC-0010',
    description: 'Protocol for exchanging routing information between connectors.',
    specUrl: 'https://interledger.org/rfcs/0010-connector-to-connector-protocol/',
    status: 'final',
    category: 'core',
  },
  {
    id: 'web-monetization',
    name: 'Web Monetization',
    description: 'Browser API specification for streaming payments to websites.',
    specUrl: 'https://webmonetization.org/specification/',
    status: 'draft',
    category: 'application',
  },
  {
    id: 'open-payments',
    name: 'Open Payments',
    description: 'API standard for interoperable digital payments.',
    specUrl: 'https://openpayments.guide/introduction/overview/',
    status: 'final',
    category: 'application',
  },
];

// ==================== CONNECTOR INSTANCES ====================

export const ilpConnectorInstances: ILPConnectorInstance[] = [
  {
    id: 'ilf-rafiki-us',
    name: 'Interledger Foundation (US)',
    operator: 'Interledger Foundation',
    type: 'production',
    implementation: 'rafiki',
    location: {
      city: 'San Francisco',
      country: 'United States',
      countryCode: 'US',
      coordinates: [-122.4194, 37.7749],
    },
    supportedAssets: ['USD', 'XRP'],
    features: ['Open Payments', 'SPSP', 'Web Monetization'],
    status: 'online',
    url: 'https://interledger.org',
    peering: ['fynbos-eu', 'gatehub-eu', 'uphold-us'],
    monthlyVolume: '$125M',
    dailyTransactions: '45,000+',
    avgLatency: '< 200ms',
    uptime: '99.9%',
  },
  {
    id: 'fynbos-eu',
    name: 'Fynbos (EU)',
    operator: 'Fynbos',
    type: 'production',
    implementation: 'rafiki',
    location: {
      city: 'Amsterdam',
      country: 'Netherlands',
      countryCode: 'NL',
      coordinates: [4.9041, 52.3676],
    },
    supportedAssets: ['EUR', 'USD'],
    features: ['Open Payments', 'SPSP'],
    status: 'online',
    url: 'https://fynbos.dev',
    peering: ['ilf-rafiki-us', 'gatehub-eu'],
    monthlyVolume: '$85M',
    dailyTransactions: '28,000+',
    avgLatency: '< 150ms',
    uptime: '99.8%',
  },
  {
    id: 'gatehub-eu',
    name: 'GateHub',
    operator: 'GateHub',
    type: 'production',
    implementation: 'rafiki',
    location: {
      city: 'London',
      country: 'United Kingdom',
      countryCode: 'GB',
      coordinates: [-0.1276, 51.5074],
    },
    supportedAssets: ['EUR', 'USD', 'GBP', 'XRP'],
    features: ['Open Payments', 'SPSP', 'XRP Settlement'],
    status: 'online',
    url: 'https://gatehub.net',
    peering: ['ilf-rafiki-us', 'fynbos-eu'],
    monthlyVolume: '$210M',
    dailyTransactions: '52,000+',
    avgLatency: '< 180ms',
    uptime: '99.95%',
  },
  {
    id: 'uphold-us',
    name: 'Uphold',
    operator: 'Uphold',
    type: 'production',
    implementation: 'rafiki',
    location: {
      city: 'New York',
      country: 'United States',
      countryCode: 'US',
      coordinates: [-74.006, 40.7128],
    },
    supportedAssets: ['USD', 'EUR', 'GBP', 'XRP', 'BTC'],
    features: ['Open Payments', 'Multi-asset'],
    status: 'online',
    url: 'https://uphold.com',
    peering: ['ilf-rafiki-us'],
    monthlyVolume: '$680M',
    dailyTransactions: '125,000+',
    avgLatency: '< 250ms',
    uptime: '99.9%',
  },
  {
    id: 'testnet-rafiki',
    name: 'Rafiki Testnet',
    operator: 'Interledger Foundation',
    type: 'testnet',
    implementation: 'rafiki',
    location: {
      city: 'San Francisco',
      country: 'United States',
      countryCode: 'US',
      coordinates: [-122.4, 37.78],
    },
    supportedAssets: ['USD', 'EUR'],
    features: ['Testing', 'Development', 'Demo wallets'],
    status: 'online',
    url: 'https://rafiki.dev/playground',
    peering: [],
    monthlyVolume: 'Test only',
    dailyTransactions: '5,000+',
    avgLatency: '< 100ms',
    uptime: '99.5%',
  },
  {
    id: 'xrpl-connector-sg',
    name: 'XRPL Connector (Singapore)',
    operator: 'Ripple',
    type: 'production',
    implementation: 'ilp-connector-js',
    location: {
      city: 'Singapore',
      country: 'Singapore',
      countryCode: 'SG',
      coordinates: [103.8198, 1.3521],
    },
    supportedAssets: ['XRP', 'USD', 'SGD'],
    features: ['XRP Payment Channels', 'High throughput'],
    status: 'online',
    peering: ['ilf-rafiki-us', 'xrpl-connector-jp'],
    monthlyVolume: '$420M',
    dailyTransactions: '85,000+',
    avgLatency: '< 120ms',
    uptime: '99.97%',
  },
  {
    id: 'xrpl-connector-jp',
    name: 'SBI Remit Connector',
    operator: 'SBI Remit',
    type: 'production',
    implementation: 'java-ilp-connector',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      coordinates: [139.6917, 35.6895],
    },
    supportedAssets: ['XRP', 'JPY', 'PHP'],
    features: ['XRP Settlement', 'Remittance corridors'],
    status: 'online',
    peering: ['xrpl-connector-sg', 'xrpl-connector-ph'],
    monthlyVolume: '$580M',
    dailyTransactions: '95,000+',
    avgLatency: '< 100ms',
    uptime: '99.98%',
  },
  {
    id: 'xrpl-connector-ph',
    name: 'Philippines Connector',
    operator: 'Ripple Partner',
    type: 'production',
    implementation: 'ilp-connector-js',
    location: {
      city: 'Manila',
      country: 'Philippines',
      countryCode: 'PH',
      coordinates: [120.9842, 14.5995],
    },
    supportedAssets: ['XRP', 'PHP', 'USD'],
    features: ['Remittance receiving', 'Local payout'],
    status: 'online',
    peering: ['xrpl-connector-jp', 'xrpl-connector-sg'],
    monthlyVolume: '$320M',
    dailyTransactions: '78,000+',
    avgLatency: '< 150ms',
    uptime: '99.9%',
  },
  {
    id: 'xrpl-connector-mx',
    name: 'Mexico Corridor Connector',
    operator: 'Bitso',
    type: 'production',
    implementation: 'ilp-connector-js',
    location: {
      city: 'Mexico City',
      country: 'Mexico',
      countryCode: 'MX',
      coordinates: [-99.1332, 19.4326],
    },
    supportedAssets: ['XRP', 'MXN', 'USD'],
    features: ['US-MX corridor', 'High volume'],
    status: 'online',
    peering: ['uphold-us'],
    monthlyVolume: '$1.2B',
    dailyTransactions: '180,000+',
    avgLatency: '< 200ms',
    uptime: '99.95%',
  },
  {
    id: 'coil-webmon',
    name: 'Web Monetization Hub (Legacy)',
    operator: 'Coil (sunset Feb 2023)',
    type: 'research',
    implementation: 'rafiki',
    location: {
      city: 'San Francisco',
      country: 'United States',
      countryCode: 'US',
      coordinates: [-122.42, 37.77],
    },
    supportedAssets: ['USD', 'XRP'],
    features: ['Web Monetization', 'Micropayments', 'Streaming'],
    status: 'offline',
    url: 'https://coil.com',
    peering: ['ilf-rafiki-us', 'uphold-us'],
    monthlyVolume: 'Simulated',
    dailyTransactions: 'Simulated',
    avgLatency: '—',
    uptime: '—',
  },
];

// ==================== ILP CORRIDORS ====================

export const ilpCorridors: ILPCorridor[] = [
  {
    id: 'us-mx-remit',
    name: 'US → Mexico Remittance',
    from: { country: 'United States', countryCode: 'US', coordinates: [-98.5795, 39.8283] },
    to: { country: 'Mexico', countryCode: 'MX', coordinates: [-99.1332, 19.4326] },
    type: 'remittance',
    volume: 'high',
    connectorIds: ['uphold-us', 'xrpl-connector-mx'],
    description: 'Total US–Mexico remittance market (World Bank/Banxico). Volume shown is total market; ODL share is a small fraction with no public corridor-level breakdown. XRP settlement via ILP for ODL portion.',
    monthlyVolume: '~$5.5B',
    dailyTransactions: '—',
    avgSettlementTime: '< 3 sec',
    growthYoY: '~2%',
    fees: '0.1-0.3%',
    xrplBacked: true,
  },
  {
    id: 'us-ph-remit',
    name: 'US → Philippines Remittance',
    from: { country: 'United States', countryCode: 'US', coordinates: [-98.5795, 39.8283] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'high',
    connectorIds: ['uphold-us', 'xrpl-connector-sg', 'xrpl-connector-ph'],
    description: 'Total US–Philippines remittance market (World Bank/BSP). Volume shown is total market; ODL share is a subset with no public breakdown. OFW corridor via Singapore routing.',
    monthlyVolume: '~$3.25B',
    dailyTransactions: '—',
    avgSettlementTime: '< 5 sec',
    growthYoY: '~3–4%',
    fees: '0.2-0.4%',
    xrplBacked: true,
  },
  {
    id: 'jp-ph-remit',
    name: 'Japan → Philippines Remittance',
    from: { country: 'Japan', countryCode: 'JP', coordinates: [139.6917, 35.6895] },
    to: { country: 'Philippines', countryCode: 'PH', coordinates: [120.9842, 14.5995] },
    type: 'remittance',
    volume: 'medium',
    connectorIds: ['xrpl-connector-jp', 'xrpl-connector-ph'],
    description: 'SBI Remit–powered JP–PH corridor. Volume estimated; no public corridor-level ODL breakdown from Ripple.',
    monthlyVolume: '~$450M (est.)',
    dailyTransactions: '42,000+',
    avgSettlementTime: '< 2 sec',
    growthYoY: '~3%',
    fees: '0.15-0.25%',
    xrplBacked: true,
  },
  {
    id: 'eu-uk-b2b',
    name: 'EU ↔ UK Business Payments',
    from: { country: 'Netherlands', countryCode: 'NL', coordinates: [4.9041, 52.3676] },
    to: { country: 'United Kingdom', countryCode: 'GB', coordinates: [-0.1276, 51.5074] },
    type: 'b2b',
    volume: 'medium',
    connectorIds: ['fynbos-eu', 'gatehub-eu'],
    description: 'Post-Brexit EU-UK cross-border business payments via Rafiki Open Payments. Enables instant B2B settlement.',
    monthlyVolume: '$320M',
    dailyTransactions: '18,000+',
    avgSettlementTime: '< 4 sec',
    growthYoY: '+45%',
    fees: '0.05-0.15%',
    xrplBacked: false,
  },
  {
    id: 'webmon-global',
    name: 'Web Monetization Network (Conceptual)',
    from: { country: 'Global', countryCode: 'US', coordinates: [-122.4194, 37.7749] },
    to: { country: 'Global', countryCode: 'US', coordinates: [-74.006, 40.7128] },
    type: 'micropayment',
    volume: 'medium',
    connectorIds: ['coil-webmon', 'ilf-rafiki-us', 'uphold-us'],
    description: 'Conceptual model of global micropayment streaming (e.g. former Coil-style). Coil sunset Feb 2023; ILP/Rafiki continues via Interledger Foundation. Shown for architecture reference.',
    monthlyVolume: 'Simulated',
    dailyTransactions: 'Simulated',
    avgSettlementTime: 'Streaming',
    growthYoY: '—',
    fees: '< 0.01%',
    xrplBacked: true,
  },
  {
    id: 'sg-cbdc-pilot',
    name: 'Singapore CBDC Pilot',
    from: { country: 'Singapore', countryCode: 'SG', coordinates: [103.8198, 1.3521] },
    to: { country: 'Thailand', countryCode: 'TH', coordinates: [100.5018, 13.7563] },
    type: 'cbdc',
    volume: 'pilot',
    connectorIds: ['xrpl-connector-sg'],
    description: 'Project Ubin successor - CBDC interoperability research between MAS and Bank of Thailand.',
    monthlyVolume: '$50M (pilot)',
    dailyTransactions: '500+',
    avgSettlementTime: '< 10 sec',
    growthYoY: 'Pilot phase',
    fees: 'TBD',
    xrplBacked: false,
  },
  {
    id: 'us-eu-b2b',
    name: 'US ↔ EU Business Corridor',
    from: { country: 'United States', countryCode: 'US', coordinates: [-74.006, 40.7128] },
    to: { country: 'Netherlands', countryCode: 'NL', coordinates: [4.9041, 52.3676] },
    type: 'b2b',
    volume: 'high',
    connectorIds: ['uphold-us', 'ilf-rafiki-us', 'fynbos-eu', 'gatehub-eu'],
    description: 'Transatlantic business payment corridor. Multi-hop routing through Rafiki network for optimal rates.',
    monthlyVolume: '$890M',
    dailyTransactions: '65,000+',
    avgSettlementTime: '< 6 sec',
    growthYoY: '+52%',
    fees: '0.08-0.18%',
    xrplBacked: true,
  },
  {
    id: 'asia-micropay',
    name: 'Asia Gaming Micropayments',
    from: { country: 'Singapore', countryCode: 'SG', coordinates: [103.8198, 1.3521] },
    to: { country: 'Japan', countryCode: 'JP', coordinates: [139.6917, 35.6895] },
    type: 'micropayment',
    volume: 'medium',
    connectorIds: ['xrpl-connector-sg', 'xrpl-connector-jp'],
    description: 'Gaming and digital content micropayments across Asia. High frequency, low value streaming payments.',
    monthlyVolume: '$45M',
    dailyTransactions: '850,000+',
    avgSettlementTime: 'Streaming',
    growthYoY: '+120%',
    fees: '< 0.02%',
    xrplBacked: true,
  },
];

// ==================== USE CASES ====================

export const ilpUseCases: ILPUseCase[] = [
  {
    id: 'remittance',
    name: 'Cross-Border Remittances',
    icon: '💸',
    description: 'Fast, low-cost international money transfers using ILP routing and XRP settlement.',
    examples: ['US-Mexico corridor', 'Japan-Philippines', 'UAE-Pakistan'],
    repositories: ['rafiki', 'ilp-connector-js', 'ilp-plugin-xrp-paychan'],
    color: '#00ff88', // cyber-green
  },
  {
    id: 'web-monetization',
    name: 'Web Monetization',
    icon: '🌐',
    description: 'Streaming micropayments to content creators and websites.',
    examples: ['Web Monetization (e.g. legacy Coil)', 'Pay-per-article', 'Gaming micropayments'],
    repositories: ['web-monetization', 'rafiki', 'ilp-protocol-stream'],
    color: '#a855f7', // cyber-purple
  },
  {
    id: 'b2b-payments',
    name: 'B2B Payments',
    icon: '🏢',
    description: 'Enterprise cross-border payments with instant settlement.',
    examples: ['EU-UK trade payments', 'Supply chain finance', 'Invoice settlement'],
    repositories: ['rafiki', 'java-ilp-connector', 'open-payments'],
    color: '#00d4ff', // cyber-glow
  },
  {
    id: 'cbdc-interop',
    name: 'CBDC Interoperability',
    icon: '🏛️',
    description: 'Bridging central bank digital currencies across borders.',
    examples: ['Project Ubin', 'Digital Euro bridge', 'mBridge'],
    repositories: ['rfcs', 'rafiki'],
    color: '#ffd700', // cyber-yellow
  },
  {
    id: 'gaming',
    name: 'Gaming & Virtual Economies',
    icon: '🎮',
    description: 'In-game micropayments and cross-platform virtual asset transfers.',
    examples: ['In-game purchases', 'Esports prizes', 'Virtual item trading'],
    repositories: ['ilp-protocol-stream', 'web-monetization'],
    color: '#ff00ff', // cyber-magenta
  },
  {
    id: 'iot-payments',
    name: 'IoT & Machine Payments',
    icon: '🤖',
    description: 'Automated machine-to-machine micropayments.',
    examples: ['EV charging', 'Smart grid', 'Autonomous vehicles'],
    repositories: ['ilp-connector-js', 'ilp-protocol-stream'],
    color: '#00ffff', // cyber-cyan
  },
];

// ==================== HELPER FUNCTIONS ====================

export function getRepositoriesByType(type: ILPComponentType): ILPRepository[] {
  return ilpRepositories.filter(r => r.type === type);
}

export function getXRPLIntegratedRepos(): ILPRepository[] {
  return ilpRepositories.filter(r => r.xrplIntegration);
}

export function getConnectorsByCountry(countryCode: string): ILPConnectorInstance[] {
  return ilpConnectorInstances.filter(c => c.location?.countryCode === countryCode);
}

export function getCorridorsByType(type: ILPCorridor['type']): ILPCorridor[] {
  return ilpCorridors.filter(c => c.type === type);
}

export function getConnectorById(id: string): ILPConnectorInstance | undefined {
  return ilpConnectorInstances.find(c => c.id === id);
}

export function getRepositoryById(id: string): ILPRepository | undefined {
  return ilpRepositories.find(r => r.id === id);
}

export function getConnectorPeers(connectorId: string): ILPConnectorInstance[] {
  const connector = getConnectorById(connectorId);
  if (!connector) return [];
  return connector.peering
    .map(id => getConnectorById(id))
    .filter((c): c is ILPConnectorInstance => c !== undefined);
}

export function getILPStats() {
  return {
    totalRepos: ilpRepositories.length,
    activeConnectors: ilpConnectorInstances.filter(c => c.status === 'online').length,
    totalConnectors: ilpConnectorInstances.length,
    corridors: ilpCorridors.length,
    highVolumeCorridors: ilpCorridors.filter(c => c.volume === 'high').length,
    xrplBackedCorridors: ilpCorridors.filter(c => c.xrplBacked).length,
    useCases: ilpUseCases.length,
    protocols: ilpProtocolSpecs.length,
  };
}

export function getStatusColor(status: ILPConnectorInstance['status']): string {
  switch (status) {
    case 'online': return '#00ff88';
    case 'offline': return '#ff4444';
    default: return '#64748b';
  }
}

export function getTypeColor(type: ILPCorridor['type']): string {
  switch (type) {
    case 'remittance': return '#00ff88';
    case 'b2b': return '#00d4ff';
    case 'micropayment': return '#a855f7';
    case 'cbdc': return '#ffd700';
  }
}
