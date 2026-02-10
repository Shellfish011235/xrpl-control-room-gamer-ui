// Unified Network Topology
// Aggregates nodes and edges from all Network tabs: Validators, ILP, Corridors, Bridges & Chains

import { getHubs } from './globeContent';
import {
  paymentCorridors,
  odlPartners,
  crossChainBridges,
  xrplConnectedChains,
} from './corridorData';
import type { Ledger } from '../services/ilp/types';
import type { Corridor } from '../services/ilp/types';

export type UnifiedNodeType = 'ledger' | 'validator_hub' | 'odl_partner' | 'chain' | 'corridor_region';
export type UnifiedEdgeType = 'ilp' | 'validates' | 'odl' | 'bridge' | 'corridor' | 'partner_corridor';

export interface UnifiedNode {
  id: string;
  label: string;
  shortLabel?: string;
  type: UnifiedNodeType;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface UnifiedEdge {
  from: string;
  to: string;
  type: UnifiedEdgeType;
  label?: string;
  data?: Record<string, unknown>;
}

// Map chain IDs from corridorData/bridges to ledger IDs in ILP topology
const CHAIN_TO_LEDGER: Record<string, string> = {
  'xrpl': 'xrpl',
  'xrpl-evm-sidechain': 'xrpl_evm',
  'xrpl_evm': 'xrpl_evm',
  'ethereum': 'ethereum',
  'bitcoin': 'bitcoin',
  'polygon': 'polygon',
  'bnb-chain': 'bsc',
  'bsc': 'bsc',
};

function normalizeChainId(chainId: string): string {
  return CHAIN_TO_LEDGER[chainId] ?? chainId.replace(/-/g, '_');
}

export interface UnifiedTopologyOptions {
  ledgers: Ledger[];
  corridors: Corridor[];
  includeValidators?: boolean;
  includeODL?: boolean;
  includeBridgesChains?: boolean;
  /** Layout in topology coords (e.g. -100..100); component will scale to viewBox */
  center?: { x: number; y: number };
}

const DEFAULT_CENTER = { x: 0, y: 0 };

/**
 * Build a single graph of nodes and edges from all network data sources.
 * Ledgers and ILP corridors come from the ILP store; hubs, ODL partners, bridges and chains from static data.
 */
export function getUnifiedTopology(options: UnifiedTopologyOptions): {
  nodes: UnifiedNode[];
  edges: UnifiedEdge[];
} {
  const {
    ledgers,
    corridors,
    includeValidators = true,
    includeODL = true,
    includeBridgesChains = true,
    center = DEFAULT_CENTER,
  } = options;

  const nodes: UnifiedNode[] = [];
  const edges: UnifiedEdge[] = [];
  const ledgerIds = new Set(ledgers.map((l) => l.id));

  // ---- Ledgers (from ILP topology) ----
  ledgers.forEach((l) => {
    const pos = l.position ?? { x: 0, y: 0 };
    nodes.push({
      id: l.id,
      label: l.name,
      shortLabel: l.symbol,
      type: 'ledger',
      position: { x: center.x + pos.x, y: center.y + (pos.y ?? 0) },
      data: { ledger: l },
    });
  });

  // ---- ILP corridors (connector edges between ledgers) ----
  corridors.forEach((c) => {
    edges.push({
      from: c.from_ledger,
      to: c.to_ledger,
      type: 'ilp',
      label: c.id,
      data: { corridor: c },
    });
  });

  // ---- Validator hubs (ring around center) ----
  if (includeValidators) {
    const hubs = getHubs();
    const radius = 72;
    hubs.forEach((hub, i) => {
      const angle = (i / Math.max(1, hubs.length)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: hub.id,
        label: hub.name,
        shortLabel: hub.city,
        type: 'validator_hub',
        position: {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        },
        data: { hub, validators: hub.validators },
      });
      edges.push({ from: hub.id, to: 'xrpl', type: 'validates' });
    });
  }

  // ---- ODL partners (ring outside hubs) ----
  if (includeODL) {
    const partners = odlPartners.filter((p) => p.status === 'active' || p.status === 'pilot');
    const radius = 88;
    partners.forEach((partner, i) => {
      const angle = (i / Math.max(1, partners.length)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: `partner-${partner.id}`,
        label: partner.name,
        shortLabel: partner.name,
        type: 'odl_partner',
        position: {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        },
        data: { partner, corridors: partner.corridors },
      });
      edges.push({ from: `partner-${partner.id}`, to: 'xrpl', type: 'odl' });
      // Optional: edges to payment corridors (as virtual nodes or just metadata)
      partner.corridors.slice(0, 3).forEach((corrId) => {
        const corr = paymentCorridors.find((c) => c.id === corrId);
        if (corr && (corr.volume === 'high' || corr.volume === 'medium')) {
          edges.push({
            from: `partner-${partner.id}`,
            to: `corridor-${corrId}`,
            type: 'partner_corridor',
            label: corr.name,
            data: { corridorId: corrId },
          });
        }
      });
    });

    // Corridor “region” nodes (one per payment corridor for high/medium volume so graph doesn’t explode)
    const corridorNodesAdded = new Set<string>();
    paymentCorridors
      .filter((c) => c.volume === 'high' || c.volume === 'medium')
      .slice(0, 12)
      .forEach((c) => {
        if (corridorNodesAdded.has(c.id)) return;
        corridorNodesAdded.add(c.id);
        const idx = corridorNodesAdded.size - 1;
        const angle = (idx / 12) * Math.PI * 2 - Math.PI / 2;
        const radius = 58;
        nodes.push({
          id: `corridor-${c.id}`,
          label: c.name,
          shortLabel: `${c.from.countryCode}→${c.to.countryCode}`,
          type: 'corridor_region',
          position: {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
          },
          data: { corridor: c },
        });
        edges.push({ from: `corridor-${c.id}`, to: 'xrpl', type: 'corridor' });
      });
  }

  // ---- Chains not already in ledgers (ring inside ledgers) ----
  if (includeBridgesChains) {
    const chainIdsInLedgers = new Set(ledgerIds);
    const extraChains = xrplConnectedChains.filter(
      (ch) => !chainIdsInLedgers.has(ch.id) && !chainIdsInLedgers.has(normalizeChainId(ch.id))
    );
    const radius = 52;
    extraChains.slice(0, 10).forEach((chain, i) => {
      const nid = `chain-${chain.id}`;
      const angle = (i / Math.max(1, Math.min(10, extraChains.length))) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: nid,
        label: chain.name,
        shortLabel: chain.symbol,
        type: 'chain',
        position: {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        },
        data: { chain },
      });
      edges.push({ from: nid, to: 'xrpl', type: 'bridge' });
    });

    // Bridge edges between ledgers/chains (from crossChainBridges)
    const nodeIds = new Set(nodes.map((n) => n.id));
    const resolveNodeId = (chainKey: string): string | null => {
      const normalized = normalizeChainId(chainKey);
      if (ledgerIds.has(normalized)) return normalized;
      if (chainKey.toLowerCase().includes('xrpl') && !chainKey.includes('evm')) return 'xrpl';
      if (chainKey.toLowerCase().includes('xrpl-evm') || chainKey === 'xrpl_evm') return 'xrpl_evm';
      const chainId = chainKey.replace(/-/g, '_');
      return nodeIds.has(`chain-${chainKey}`) ? `chain-${chainKey}` : nodeIds.has(`chain-${chainId}`) ? `chain-${chainId}` : null;
    };

    crossChainBridges.filter((b) => b.status === 'mainnet').forEach((bridge) => {
      const chainList = bridge.chains.filter((c) => !c.includes('+'));
      const resolved = chainList.map(resolveNodeId).filter((id): id is string => id != null);
      const unique = [...new Set(resolved)];
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const fromId = unique[i];
          const toId = unique[j];
          if (fromId === toId) continue;
          const exists = edges.some((e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
          if (!exists) {
            edges.push({ from: fromId, to: toId, type: 'bridge', label: bridge.name, data: { bridge } });
          }
        }
      }
    });
  }

  return { nodes, edges };
}
