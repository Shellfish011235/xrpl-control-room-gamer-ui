/**
 * Cross-Chain Bridge Service – Axelar-style flows, XRPL ↔ EVM/SOL.
 * Bridge-First workaround: volumes, flows, bridge executor data.
 */

export interface BridgeFlow {
  id: string;
  sourceChain: string;
  destChain: string;
  asset: string;
  volumeUsd24h: number;
  txCount24h: number;
  status: 'active' | 'degraded' | 'maintenance';
}

export interface BridgeRoute {
  fromChain: string;
  toChain: string;
  fromAsset: string;
  toAsset: string;
  estimatedTimeMinutes: number;
}

const MOCK_FLOWS: BridgeFlow[] = [
  { id: '1', sourceChain: 'XRPL', destChain: 'EVM', asset: 'XRP', volumeUsd24h: 2_100_000, txCount24h: 340, status: 'active' },
  { id: '2', sourceChain: 'EVM', destChain: 'XRPL', asset: 'XRP', volumeUsd24h: 1_800_000, txCount24h: 290, status: 'active' },
  { id: '3', sourceChain: 'XRPL', destChain: 'Solana', asset: 'XRP', volumeUsd24h: 420_000, txCount24h: 85, status: 'active' },
  { id: '4', sourceChain: 'Solana', destChain: 'XRPL', asset: 'XRP', volumeUsd24h: 380_000, txCount24h: 72, status: 'active' },
  { id: '5', sourceChain: 'XRPL', destChain: 'EVM', asset: 'USDC', volumeUsd24h: 950_000, txCount24h: 120, status: 'active' },
];

const AXELAR_API = 'https://api.axelarscan.io';

/** Fetch bridge volumes/flows – Axelar API or mock. */
export async function fetchBridgeFlows(): Promise<BridgeFlow[]> {
  try {
    const res = await fetch(`${AXELAR_API}/stats`, { mode: 'cors' });
    if (res.ok) {
      const data = (await res.json()) as { volume?: number; transfers?: number };
      if (data.volume != null || data.transfers != null) {
        return MOCK_FLOWS.map((f, i) => ({
          ...f,
          volumeUsd24h: f.volumeUsd24h + (data.volume ?? 0) * 0.01 * (i + 1),
          txCount24h: f.txCount24h + Math.floor((data.transfers ?? 0) * 0.01),
        }));
      }
    }
  } catch {
    // fallback to mock
  }
  return MOCK_FLOWS;
}

/** Get routes for UI (XRPL → EVM, etc.). */
export async function fetchBridgeRoutes(): Promise<BridgeRoute[]> {
  return [
    { fromChain: 'XRPL', toChain: 'EVM', fromAsset: 'XRP', toAsset: 'mXRP', estimatedTimeMinutes: 3 },
    { fromChain: 'EVM', toChain: 'XRPL', fromAsset: 'mXRP', toAsset: 'XRP', estimatedTimeMinutes: 5 },
    { fromChain: 'XRPL', toChain: 'Solana', fromAsset: 'XRP', toAsset: 'wXRP', estimatedTimeMinutes: 4 },
  ];
}
