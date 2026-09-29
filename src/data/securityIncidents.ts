export type IncidentCategory =
  | 'private-key-compromise'
  | 'supply-chain'
  | 'social-engineering'
  | 'bridge'
  | 'smart-contract'
  | 'access-control'
  | 'other'

export type AttributionConfidence = 'confirmed' | 'attributed' | 'suspected' | 'unknown'
export type AddressConfidence = 'confirmed' | 'high' | 'medium' | 'unverified'

export interface IncidentAddress {
  chain: string
  address: string
  role: 'attacker' | 'recipient' | 'laundering' | 'recovery' | 'unknown'
  confidence: AddressConfidence
  sourceUrl: string
}

export interface IncidentSource {
  title: string
  url: string
  sourceType: 'law-enforcement' | 'project' | 'government' | 'security-research'
}

export interface SecurityIncident {  id: string
  name: string
  date: string
  affectedChains: string[]
  affectedProjects: string[]
  category: IncidentCategory
  amountUsd: number
  assets: string[]
  summary: string
  attackVector: string
  rootCause: string
  attribution: {
    actor?: string
    confidence: AttributionConfidence
    basis: string
  }
  addresses: IncidentAddress[]
  fundsRecoveredUsd?: number
  status: 'active' | 'contained' | 'recovered' | 'closed' | 'unknown'
  sources: IncidentSource[]
}

export const securityIncidents: SecurityIncident[] = [
  {
    id: 'bybit-2025',
    name: 'Bybit Safe Wallet incident',
    date: '2025-02-21',
    affectedChains: ['Ethereum'],
    affectedProjects: ['Bybit', 'Safe{Wallet}'],    category: 'supply-chain',
    amountUsd: 1_500_000_000,
    assets: ['ETH', 'stETH', 'cmETH', 'mETH'],
    summary: 'A targeted compromise of the signing workflow for one Bybit Ethereum cold wallet led to the theft of approximately $1.5 billion in virtual assets.',
    attackVector: 'Compromised Safe developer credentials and malicious front-end behavior deceived multisig signers into approving a transaction that changed wallet logic.',
    rootCause: 'Third-party signing infrastructure compromise rather than a compromise of Bybit core infrastructure, according to the published forensic findings.',
    attribution: {
      actor: 'DPRK TraderTraitor / Lazarus Group',
      confidence: 'confirmed',
      basis: 'The FBI publicly attributed the theft to the DPRK and identified the activity as TraderTraitor.',
    },
    addresses: [
      {
        chain: 'Ethereum',
        address: '0x51E9d833Ecae4E8D9D8Be17300AEE6D3398C135D',
        role: 'laundering',
        confidence: 'confirmed',
        sourceUrl: 'https://www.fbi.gov/investigate/cyber/alerts/2025/north-korea-responsible-for-1-5-billion-bybit-hack',
      },
      {
        chain: 'Ethereum',
        address: '0x96244D83DC15d36847C35209bBDc5bdDE9bEc3D8',
        role: 'laundering',
        confidence: 'confirmed',
        sourceUrl: 'https://www.fbi.gov/investigate/cyber/alerts/2025/north-korea-responsible-for-1-5-billion-bybit-hack',
      },      {
        chain: 'Ethereum',
        address: '0x83c7678492D623fb98834F0fbcb2E7b7f5Af8950',
        role: 'laundering',
        confidence: 'confirmed',
        sourceUrl: 'https://www.fbi.gov/investigate/cyber/alerts/2025/north-korea-responsible-for-1-5-billion-bybit-hack',
      },
    ],
    status: 'contained',
    sources: [
      {
        title: 'FBI: North Korea Responsible for $1.5 Billion Bybit Hack',
        url: 'https://www.fbi.gov/investigate/cyber/alerts/2025/north-korea-responsible-for-1-5-billion-bybit-hack',
        sourceType: 'law-enforcement',
      },
      {
        title: 'Bybit: Safe Wallet incident forensic update',
        url: 'https://www.bybit.com/en/press/post/bybit-confirms-security-integrity-amid-safe-wallet-incident-no-compromise-in-infrastructure-blt9986889e919da8d2',
        sourceType: 'project',
      },
    ],
  },
  {
    id: 'ronin-2022',
    name: 'Ronin Bridge / Axie Infinity theft',
    date: '2022-03-23',
    affectedChains: ['Ronin', 'Ethereum'],
    affectedProjects: ['Ronin Network', 'Sky Mavis', 'Axie Infinity'],
    category: 'private-key-compromise',
    amountUsd: 620_000_000,    assets: ['ETH', 'USDC'],
    summary: 'Attackers stole roughly $620 million in virtual assets from the Ronin bridge.',
    attackVector: 'The incident involved compromise of validator authority used to approve bridge withdrawals.',
    rootCause: 'Compromised validator keys and an insufficiently resilient approval threshold allowed unauthorized withdrawals.',
    attribution: {
      actor: 'Lazarus Group / APT38',
      confidence: 'confirmed',
      basis: 'The FBI attributed the theft to DPRK-linked Lazarus Group and APT38.',
    },
    addresses: [
      {
        chain: 'Ethereum',
        address: '0x098B716B8Aaf21512996dC57EB0615e2383E2f96',
        role: 'attacker',
        confidence: 'confirmed',
        sourceUrl: 'https://ofac.treasury.gov/recent-actions/20220414',
      },
      {
        chain: 'Ethereum',
        address: '0xa0e1c89Ef1a489c9C7dE96311eD5Ce5D32c20E4B',
        role: 'laundering',
        confidence: 'confirmed',
        sourceUrl: 'https://ofac.treasury.gov/recent-actions/20220422',
      },
    ],
    status: 'closed',
    sources: [      {
        title: 'FBI attribution of Ronin theft to DPRK',
        url: 'https://www.fbi.gov/news/press-releases/fbi-statement-on-attribution-of-malicious-cyber-activity-posed-by-the-democratic-peoples-republic-of-korea',
        sourceType: 'law-enforcement',
      },
      {
        title: 'OFAC Lazarus Group address update',
        url: 'https://ofac.treasury.gov/recent-actions/20220422',
        sourceType: 'government',
      },
    ],
  },
  {
    id: 'harmony-horizon-2022',
    name: 'Harmony Horizon Bridge theft',
    date: '2022-06-23',
    affectedChains: ['Harmony', 'Ethereum', 'BNB Smart Chain'],
    affectedProjects: ['Harmony Horizon Bridge'],
    category: 'private-key-compromise',
    amountUsd: 100_000_000,
    assets: ['ETH', 'USDC', 'USDT', 'BNB', 'bridged assets'],
    summary: 'The Horizon bridge lost about $100 million after attackers gained control of bridge signing authority.',
    attackVector: 'The attacker compromised at least two of four bridge validator private keys and moved bridged assets to attacker-controlled accounts.',
    rootCause: 'Harmony reported a coordinated intrusion involving phishing/malware, internal infrastructure access, and compromise of validator signing keys.',
    attribution: {
      actor: 'Lazarus Group / APT38',
      confidence: 'confirmed',      basis: 'The FBI confirmed DPRK-linked Lazarus Group was responsible for the theft.',
    },
    addresses: [
      {
        chain: 'Ethereum',
        address: '0x0d043128146654C7683Fbf30ac98D7B2285DeD00',
        role: 'attacker',
        confidence: 'high',
        sourceUrl: 'https://talk.harmony.one/t/summary-of-the-horizon-bridge-incident/20990',
      },
      {
        chain: 'Bitcoin',
        address: 'bc1q2ar35d9ayrv0plzywlaxs8y7s8h5zkvn6fe4mj',
        role: 'laundering',
        confidence: 'confirmed',
        sourceUrl: 'https://www.fbi.gov/news/press-releases/fbi-confirms-lazarus-group-cyber-actors-responsible-for-harmonys-horizon-bridge-currency-theft',
      },
    ],
    status: 'closed',
    sources: [
      {
        title: 'FBI attribution and laundering-address update',
        url: 'https://www.fbi.gov/news/press-releases/fbi-confirms-lazarus-group-cyber-actors-responsible-for-harmonys-horizon-bridge-currency-theft',
        sourceType: 'law-enforcement',
      },
      {
        title: 'Harmony incident summary',
        url: 'https://talk.harmony.one/t/summary-of-the-horizon-bridge-incident/20990',
        sourceType: 'project',
      },
    ],
  },  {
    id: 'dmm-bitcoin-2024',
    name: 'DMM Bitcoin theft',
    date: '2024-05-31',
    affectedChains: ['Bitcoin'],
    affectedProjects: ['DMM Bitcoin', 'Ginco'],
    category: 'social-engineering',
    amountUsd: 308_000_000,
    assets: ['BTC'],
    summary: 'Approximately 4,502.9 BTC, valued at about $308 million at the time, was stolen from DMM Bitcoin.',
    attackVector: 'A threat actor posing as a recruiter sent malicious Python code to a wallet-software employee, later using stolen session information to manipulate a legitimate transaction request.',
    rootCause: 'Targeted social engineering and compromise of an employee with access to wallet-management infrastructure.',
    attribution: {
      actor: 'DPRK TraderTraitor',
      confidence: 'confirmed',
      basis: 'The FBI, DoD Cyber Crime Center, and Japan National Police Agency jointly attributed the theft to DPRK TraderTraitor activity.',
    },
    addresses: [],
    status: 'closed',
    sources: [
      {
        title: 'FBI, DC3 and NPA attribution of DMM Bitcoin theft',
        url: 'https://www.fbi.gov/news/press-releases/fbi-dc3-and-npa-identification-of-north-korean-cyber-actors-tracked-as-tradertraitor-responsible-for-theft-of-308-million-from-bitcoindmmcom',
        sourceType: 'law-enforcement',
      },
    ],
  },
]

export const incidentCategories: Record<IncidentCategory, string> = {
  'private-key-compromise': 'Private key compromise',
  'supply-chain': 'Supply chain / signing UI',
  'social-engineering': 'Social engineering',
  bridge: 'Bridge exploit',
  'smart-contract': 'Smart contract',
  'access-control': 'Access control',
  other: 'Other',
}
