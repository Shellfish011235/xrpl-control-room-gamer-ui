// OpenClaw Dashboard
// This project does not collect any platform fees or royalties. Payments go to recipients and optional skill creators only.

import React from 'react';
import {
  Bot, Zap, ExternalLink, Layers, Code
} from 'lucide-react';
import { useAgentPanelStore } from '../../store/agentPanelStore';

export function OpenClawDashboard() {
  const setAgentOpen = useAgentPanelStore((s) => s.setOpen);

  return (
    <div className="bg-cyber-darker rounded-xl border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-cyber-border bg-gradient-to-r from-green-500/15 to-cyber-cyan/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/90 shrink-0">
            <Bot size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-cyber text-cyber-text text-sm tracking-wide">XRPL CONTROL ROOM</h2>
            <p className="text-[10px] font-medium mt-0.5 text-cyber-green">
              No platform fees · payments to recipients &amp; optional skill creators only
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-darker/50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-cyber uppercase tracking-wider text-cyber-muted">
              OpenClaw split
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/20 text-center">
              <p className="text-[9px] text-cyber-muted uppercase mb-0.5">Recipient</p>
              <p className="text-lg font-cyber text-cyber-green">98–100%</p>
              <p className="text-[9px] text-cyber-muted">Service / skill</p>
            </div>
            <div className="p-4 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 text-center">
              <p className="text-[9px] text-cyber-muted uppercase mb-0.5">Creator</p>
              <p className="text-lg font-cyber text-cyber-cyan">0–2%</p>
              <p className="text-[9px] text-cyber-muted">Optional</p>
            </div>
          </div>
          <p className="text-[10px] text-cyber-muted mt-3 text-center">
            This project does not collect any fees or royalties.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAgentOpen(true, 'chat')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-green/40 bg-cyber-green/10 text-xs text-cyber-green hover:bg-cyber-green/20 transition-colors"
          >
            <Zap size={12} /> Secure Payment Agent
          </button>
          <a href="https://github.com/Shellfish011235/xrpl-control-room-gamer-ui" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-border bg-cyber-darker/50 text-xs text-cyber-text hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 transition-colors">
            <Code size={12} /> GitHub
          </a>
          <a href="https://www.npmjs.com/package/openclaw-xrpl-plugin" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-border bg-cyber-darker/50 text-xs text-cyber-text hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 transition-colors">
            <Layers size={12} /> npm
          </a>
          <a href="https://xrpl.org/docs" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-border bg-cyber-darker/50 text-xs text-cyber-text hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 transition-colors">
            <ExternalLink size={12} /> Docs
          </a>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-cyber-border bg-cyber-darker/50 text-center space-y-1">
        <p className="text-[10px] font-medium text-cyber-muted">
          No platform fees or royalties. Payments go directly to recipients and optional skill creators.
        </p>
        <p className="text-[9px] text-cyber-muted">
          We do not transmit money or hold your funds. You sign in your own wallet. Not legal or financial advice.
        </p>
      </div>
    </div>
  );
}

export default OpenClawDashboard;
