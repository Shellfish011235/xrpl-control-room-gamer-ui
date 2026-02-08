// Live XRPL Micropayment Data Service
// Fetches real payment channel and micropayment data from XRPL mainnet
// "Show don't tell - real data beats marketing slides"

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface LivePaymentChannel {
  channelId: string;
  account: string;
  destination: string;
  amount: string;           // Total channel capacity in drops
  balance: string;          // Current balance in drops
  settleDelay: number;
  publicKey: string;
  expiration?: number;
  cancelAfter?: number;
  sourceTag?: number;
  destinationTag?: number;
}

export interface XRPLMicropaymentStats {
  // Payment Channels
  totalChannels: number;
  activeChannels: number;
  totalChannelCapacity: number;  // XRP
  totalChannelBalance: number;   // XRP
  avgChannelSize: number;        // XRP
  
  // Recent Activity
  recentChannelCreates: number;  // Last 24h
  recentChannelClaims: number;   // Last 24h
  recentChannelCloses: number;   // Last 24h
  
  // Network Stats
  avgTxFee: number;              // XRP
  currentLedger: number;
  tps: number;
  
  lastUpdated: number;
}

export interface AdoptionProject {
  name: string;
  category: 'wallet' | 'exchange' | 'payment' | 'gaming' | 'content' | 'defi' | 'infrastructure';
  description: string;
  useCase: string;
  website?: string;
  status: 'live' | 'beta' | 'development' | 'announced' | 'sunset';
  micropaymentFeatures: string[];
  logo?: string;
}

// =============================================================================
// KNOWN XRPL MICROPAYMENT ADOPTERS
// =============================================================================

export const ADOPTION_PROJECTS: AdoptionProject[] = [
  {
    name: 'Coil',
    category: 'content',
    description: 'Web Monetization platform using ILP. Coil sunset most products in Feb 2023; ILP work continued by Interledger Foundation.',
    useCase: 'Stream micropayments to content creators while browsing',
    website: 'https://coil.com',
    status: 'sunset',
    micropaymentFeatures: ['ILP streaming', 'Web Monetization API', 'Browser extension'],
  },
  {
    name: 'Uphold',
    category: 'wallet',
    description: 'Multi-asset wallet with ILP support',
    useCase: 'ILP payment pointer provider for Web Monetization',
    website: 'https://uphold.com',
    status: 'live',
    micropaymentFeatures: ['ILP wallet', 'Payment pointers', 'Cross-currency'],
  },
  {
    name: 'GateHub',
    category: 'wallet',
    description: 'XRPL wallet and gateway',
    useCase: 'ILP payment pointer provider',
    website: 'https://gatehub.net',
    status: 'live',
    micropaymentFeatures: ['ILP wallet', 'Payment pointers', 'XRPL native'],
  },
  {
    name: 'Ripple ODL',
    category: 'payment',
    description: 'On-Demand Liquidity for cross-border payments',
    useCase: 'Instant settlement for remittances',
    website: 'https://ripple.com/solutions/crypto-liquidity',
    status: 'live',
    micropaymentFeatures: ['XRP bridge currency', 'Instant settlement', '3-5s finality'],
  },
  {
    name: 'XUMM/Xaman',
    category: 'wallet',
    description: 'Self-custodial XRPL wallet',
    useCase: 'Payment requests, xApps ecosystem',
    website: 'https://xumm.app',
    status: 'live',
    micropaymentFeatures: ['Payment requests', 'QR payments', 'xApps'],
  },
  {
    name: 'Cinnamon',
    category: 'content',
    description: 'Video platform with Web Monetization',
    useCase: 'Pay-per-view video streaming',
    website: 'https://cinnamon.video',
    status: 'live',
    micropaymentFeatures: ['Per-second billing', 'ILP streaming', 'No ads'],
  },
  {
    name: 'Puma Browser',
    category: 'infrastructure',
    description: 'Privacy browser with Web Monetization',
    useCase: 'Built-in micropayment support',
    website: 'https://pumabrowser.com',
    status: 'live',
    micropaymentFeatures: ['Native Web Monetization', 'Privacy-focused'],
  },
  {
    name: 'Rafiki',
    category: 'infrastructure',
    description: 'Open-source ILP connector',
    useCase: 'Build ILP-enabled payment systems',
    website: 'https://github.com/interledger/rafiki',
    status: 'live',
    micropaymentFeatures: ['ILP connector', 'Open Payments API', 'Self-hosted'],
  },
  {
    name: 'Interledger Foundation',
    category: 'infrastructure',
    description: 'Steward of ILP protocol',
    useCase: 'Protocol development and grants',
    website: 'https://interledger.org',
    status: 'live',
    micropaymentFeatures: ['ILP protocol', 'Grant program', 'Standards'],
  },
  {
    name: 'Fynbos',
    category: 'wallet',
    description: 'Open Payments enabled wallet',
    useCase: 'ILP/Open Payments wallet infrastructure',
    website: 'https://fynbos.dev',
    status: 'beta',
    micropaymentFeatures: ['Open Payments', 'ILP native', 'API-first'],
  },
];

// =============================================================================
// MARKETING TALKING POINTS
// =============================================================================

export const MARKETING_POINTS = {
  headlines: [
    "XRPL: Where fees are smaller than the payments",
    "100,000+ transactions per second. $0.00003 per transaction.",
    "The only network where AI agents can afford to pay for every API call",
    "Web Monetization runs on Interledger. Interledger runs on XRPL.",
    "Payment channels: 2 transactions, unlimited micropayments",
  ],
  
  comparisons: [
    {
      scenario: "$0.01 payment",
      xrpl: "$0.00003 fee (0.3%)",
      ethereum: "$2.50 fee (25,000%)",
      winner: "XRPL is 83,000x cheaper",
    },
    {
      scenario: "$0.001 payment",
      xrpl: "$0.00003 fee (3%)",
      ethereum: "$2.50 fee (250,000%)",
      winner: "XRPL is 833,000x cheaper",
    },
    {
      scenario: "1000 payments/minute",
      xrpl: "$0.03/min in fees",
      ethereum: "$2,500/min in fees",
      winner: "XRPL saves $2,497/minute",
    },
    {
      scenario: "AI agent making 1M API calls/day",
      xrpl: "$30/day in fees",
      ethereum: "$2,500,000/day in fees",
      winner: "XRPL makes AI micropayments viable",
    },
  ],
  
  useCases: [
    {
      name: "Content Streaming",
      problem: "Creators get 30-50% after platform cuts",
      solution: "Direct ILP streaming, 100% to creator minus tiny network fee",
    },
    {
      name: "API Monetization",
      problem: "Subscription tiers don't match actual usage",
      solution: "Pay exactly for what you use, per-call billing",
    },
    {
      name: "AI Agent Economy",
      problem: "Agents can't transact - fees exceed payment value",
      solution: "XRPL fees low enough for agent-to-agent micropayments",
    },
    {
      name: "Gaming",
      problem: "Minimum purchase amounts, can't monetize small actions",
      solution: "Sub-cent transactions for any in-game action",
    },
    {
      name: "IoT",
      problem: "Sensor data too cheap to monetize individually",
      solution: "Payment channels aggregate millions of micro-payments",
    },
  ],
  
  objectionHandlers: [
    {
      objection: "Lightning Network already does micropayments",
      response: "Lightning requires channel liquidity management and routing. XRPL payment channels are simpler - direct sender-receiver, no routing nodes. Plus XRPL has native multi-currency support via ILP.",
    },
    {
      objection: "Why not just use Solana?",
      response: "Solana fees are $0.00025 vs XRPL's $0.00003 - 8x more expensive. At scale, that matters. Plus XRPL has been running since 2012 with zero downtime, while Solana has had multiple outages.",
    },
    {
      objection: "Isn't XRP centralized?",
      response: "XRPL has 150+ validators globally. Ripple runs ~4% of them. The UNL (consensus list) is decentralized and can be customized by any node operator. More decentralized than most L2s.",
    },
    {
      objection: "No one uses it",
      response: "Ripple's ODL processes billions in volume. Web Monetization (built on ILP/XRPL) is a W3C standard. The infrastructure is proven - adoption is the opportunity.",
    },
  ],
};

// =============================================================================
// LIVE DATA STORE
// =============================================================================

interface LiveDataState {
  stats: XRPLMicropaymentStats | null;
  channels: LivePaymentChannel[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  fetchChannels: (account?: string) => Promise<void>;
}

export const useLiveXRPLData = create<LiveDataState>((set, get) => ({
  stats: null,
  channels: [],
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch from XRPL mainnet
      const response = await fetch('https://s1.ripple.com:51234/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'server_info',
          params: [{}],
        }),
      });

      const data = await response.json();
      const serverInfo = data.result?.info;

      if (serverInfo) {
        // Also get fee info
        const feeResponse = await fetch('https://s1.ripple.com:51234/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'fee',
            params: [{}],
          }),
        });
        const feeData = await feeResponse.json();
        const fee = feeData.result?.drops?.base_fee || '10';

        const stats: XRPLMicropaymentStats = {
          totalChannels: 0, // Would need indexer for this
          activeChannels: 0,
          totalChannelCapacity: 0,
          totalChannelBalance: 0,
          avgChannelSize: 0,
          recentChannelCreates: 0,
          recentChannelClaims: 0,
          recentChannelCloses: 0,
          avgTxFee: parseInt(fee) / 1_000_000,
          currentLedger: serverInfo.validated_ledger?.seq || 0,
          tps: serverInfo.load_factor ? 1500 / serverInfo.load_factor : 1500,
          lastUpdated: Date.now(),
        };

        set({ stats, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch XRPL data',
        isLoading: false 
      });
    }
  },

  fetchChannels: async (account?: string) => {
    if (!account) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('https://s1.ripple.com:51234/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_channels',
          params: [{
            account,
            ledger_index: 'validated',
          }],
        }),
      });

      const data = await response.json();
      const channels = data.result?.channels || [];

      set({ 
        channels: channels.map((ch: any) => ({
          channelId: ch.channel_id,
          account: ch.account,
          destination: ch.destination_account,
          amount: ch.amount,
          balance: ch.balance,
          settleDelay: ch.settle_delay,
          publicKey: ch.public_key,
          expiration: ch.expiration,
          cancelAfter: ch.cancel_after,
        })),
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch channels',
        isLoading: false 
      });
    }
  },
}));

// =============================================================================
// DEVELOPER QUICK START CODE
// =============================================================================

export const DEVELOPER_QUICKSTART = {
  paymentChannel: {
    title: "Open a Payment Channel",
    language: "javascript",
    code: `const xrpl = require('xrpl');

// Connect to XRPL
const client = new xrpl.Client('wss://s1.ripple.com');
await client.connect();

// Create payment channel
const tx = {
  TransactionType: 'PaymentChannelCreate',
  Account: senderAddress,
  Destination: receiverAddress,
  Amount: xrpl.xrpToDrops('10'), // 10 XRP channel
  SettleDelay: 86400, // 24 hours
  PublicKey: senderPublicKey,
};

const result = await client.submitAndWait(tx, { wallet });
console.log('Channel created:', result.result.hash);`,
  },
  
  signClaim: {
    title: "Sign Off-Chain Claim (FREE, INSTANT)",
    language: "javascript",
    code: `const xrpl = require('xrpl');

// Sign a claim for micropayment (no on-chain tx needed!)
function signClaim(channelId, amount, privateKey) {
  const claimData = xrpl.encodeForSigningClaim({
    channel: channelId,
    amount: xrpl.xrpToDrops(amount),
  });
  
  return xrpl.sign(claimData, privateKey);
}

// Send 1000 micropayments (all FREE, all INSTANT)
for (let i = 0; i < 1000; i++) {
  const claim = signClaim(channelId, (i + 1) * 0.001, privateKey);
  // Send claim to receiver via any transport (HTTP, WebSocket, etc.)
  await sendToReceiver(claim);
}`,
  },
  
  webMonetization: {
    title: "Add Web Monetization to Your Site",
    language: "html",
    code: `<!-- Add this to your <head> -->
<link rel="monetization" href="$wallet.example.com/your-payment-pointer">

<!-- That's it! Browsers with Web Monetization will now stream payments -->

<!-- Check if user is paying -->
<script>
if (document.monetization) {
  document.monetization.addEventListener('monetizationprogress', (e) => {
    console.log('Received', e.detail.amount, e.detail.assetCode);
    // Unlock premium content, remove ads, etc.
  });
}
</script>`,
  },
  
  ilpStream: {
    title: "ILP Streaming Payment (via Rafiki)",
    language: "javascript",
    code: `import { createAuthenticatedClient } from '@interledger/open-payments';

// Create Open Payments client
const client = await createAuthenticatedClient({
  walletAddressUrl: 'https://wallet.example.com/alice',
  privateKey: privateKeyPath,
  keyId: keyId,
});

// Create outgoing payment (streams automatically)
const payment = await client.outgoingPayment.create({
  walletAddress: 'https://wallet.example.com/alice',
  quoteId: quote.id,
});

// Payment streams in real-time until complete
console.log('Streaming payment:', payment.id);`,
  },
};

// =============================================================================
// EXPORT PITCH DECK DATA
// =============================================================================

export function generatePitchData() {
  return {
    title: "XRPL/ILP: The Micropayment Network",
    subtitle: "The only network where fees are smaller than payments",
    
    keyStats: [
      { label: "Transaction Fee", value: "$0.00003", comparison: "83,000x cheaper than Ethereum" },
      { label: "Finality", value: "3-5 seconds", comparison: "vs 10 min BTC, 12s ETH" },
      { label: "Payment Channel TPS", value: "100,000+", comparison: "Off-chain, instant" },
      { label: "Min Viable Payment", value: "$0.0001", comparison: "vs $1+ on most chains" },
      { label: "Uptime", value: "100%", comparison: "Since 2012, zero downtime" },
    ],
    
    adoptionHighlights: ADOPTION_PROJECTS.filter(p => p.status === 'live').length + " live projects",
    
    marketOpportunity: [
      "Web Monetization is W3C standard - browser-native payments",
      "AI agents need micropayments - only viable on XRPL",
      "Creator economy wants direct payments - ILP enables this",
      "IoT data monetization requires sub-cent transactions",
    ],
    
    callToAction: "Build on XRPL. The infrastructure is ready. The fees are unbeatable. The adoption opportunity is now.",
  };
}
