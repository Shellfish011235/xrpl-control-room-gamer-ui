/**
 * Agent economy hub: use on XRPL now (mainnet) + chains/bridges that support fewer signs.
 * Uses topology data from corridorData.
 */

import React from 'react';
import { Zap, ExternalLink, MessageSquare, Receipt } from 'lucide-react';
import { useAgentPanelStore } from '../store/agentPanelStore';
import {
  getChainsSupportingAgentEconomy,
  getBridgesToChain,
  type XRPLConnectedChain,
  type CrossChainBridge,
} from '../data/corridorData';

function BridgeLinks({ bridges }: { bridges: CrossChainBridge[] }) {
  if (bridges.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {bridges.map((b, i) => (
        <span key={b.id} className="inline-flex items-center gap-0.5">
          {i > 0 && <span className="text-cyber-muted">|</span>}
          <a
            href={b.website || b.docsUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-cyber-cyan hover:underline inline-flex items-center gap-0.5"
          >
            {b.name}
            <ExternalLink size={10} />
          </a>
        </span>
      ))}
    </span>
  );
}

export function AgentEconomyHub({ compact = false }: { compact?: boolean }) {
  const setOpen = useAgentPanelStore((s) => s.setOpen);
  const chains = getChainsSupportingAgentEconomy();

  if (compact) {
    return (
      <div className="rounded-xl border border-cyber-border bg-cyber-darker/80 p-4 space-y-3">
        <p className="text-[10px] text-cyber-muted uppercase tracking-wider font-cyber">Use on XRPL now</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true, 'chat')}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs hover:bg-cyber-cyan/30"
          >
            <MessageSquare size={12} />
            Chat / Quick send
          </button>
          <button
            type="button"
            onClick={() => setOpen(true, 'economy')}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30"
          >
            <Receipt size={12} />
            Track
          </button>
          <button
            type="button"
            onClick={() => setOpen(true, 'streams')}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow text-xs hover:bg-cyber-yellow/30"
          >
            <Zap size={12} />
            Streams
          </button>
        </div>
        <p className="text-[10px] text-cyber-muted mt-2">Fewer signs: Xahau, Flare, EVM, Coreum → bridge from Network</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="cyber-panel p-4 border-cyber-cyan/30 bg-cyber-cyan/5">
        <h2 className="font-cyber text-cyber-cyan text-lg mb-2">Use on XRPL now</h2>
        <p className="text-sm text-cyber-text mb-4">
          On mainnet today you can send XRP, stream payments, create channels, and track spending. Open the payment agent and use Chat, Track, and Streams. Each payment needs one sign until Batch (XLS-56) or until you use a chain below.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true, 'chat')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-sm hover:bg-cyber-cyan/30"
          >
            <MessageSquare size={16} />
            Chat / Quick send
          </button>
          <button
            type="button"
            onClick={() => setOpen(true, 'economy')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-sm hover:bg-cyber-green/30"
          >
            <Receipt size={16} />
            Track (receipts & limits)
          </button>
          <button
            type="button"
            onClick={() => setOpen(true, 'streams')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow text-sm hover:bg-cyber-yellow/30"
          >
            <Zap size={16} />
            Streams & channels
          </button>
        </div>
      </div>

      <div className="cyber-panel p-4 border-cyber-purple/30 bg-cyber-purple/5">
        <h2 className="font-cyber text-cyber-purple text-lg mb-2">Chains that support fewer signs</h2>
        <p className="text-sm text-cyber-text mb-4">
          These chains (from our network topology) support one-sign-many-actions: Hooks (Xahau), Smart Accounts (Flare), EVM (XRPL EVM Sidechain), or smart contracts (Coreum, Root, Evernode). Bridge from XRPL, then run your agent economy there.
        </p>
        <ul className="space-y-3">
          {chains.map((chain: XRPLConnectedChain) => {
            const bridges = getBridgesToChain(chain.id);
            return (
              <li key={chain.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                <div className="flex items-center gap-2">
                  <span className="font-cyber text-cyber-text">{chain.name}</span>
                  <span className="text-[10px] text-cyber-muted">({chain.symbol})</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {chain.website && (
                    <a
                      href={chain.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-cyan hover:underline inline-flex items-center gap-0.5"
                    >
                      Site <ExternalLink size={10} />
                    </a>
                  )}
                  {chain.docsUrl && (
                    <a
                      href={chain.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-cyan hover:underline inline-flex items-center gap-0.5"
                    >
                      Docs <ExternalLink size={10} />
                    </a>
                  )}
                  {bridges.length > 0 && (
                    <span className="text-cyber-muted">
                      Bridge: <BridgeLinks bridges={bridges} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-cyber-muted mt-3">
          See Network page for full topology. Details: <code className="text-cyber-cyan">docs/AGENT-ECONOMY-UNTIL-BATCH.md</code>
        </p>
      </div>

      <div className="cyber-panel p-4 border-cyber-glow/30 bg-cyber-darker">
        <h3 className="font-cyber text-cyber-glow text-sm mb-2">Quick links: bridge from XRPL</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://xahau.network"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs hover:bg-cyber-cyan/30"
          >
            Xahau (Burn2Mint) <ExternalLink size={12} />
          </a>
          <a
            href="https://flare.network/fassets"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple text-xs hover:bg-cyber-purple/30"
          >
            Flare FAssets <ExternalLink size={12} />
          </a>
          <a
            href="https://bridge.xrplevm.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30"
          >
            XRPL EVM Bridge <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default AgentEconomyHub;
