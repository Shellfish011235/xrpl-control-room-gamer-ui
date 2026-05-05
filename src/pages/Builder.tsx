/**
 * Builder page – OpenClaw Builder Agent panel for UI triage, XRPL wiring, module factory.
 * Accessible via Tools → Builder.
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import BuilderAgentPanel from '../components/BuilderAgentPanel';
import { Wrench, ChevronDown, ChevronUp, Copy } from 'lucide-react';

const CURSOR_PROMPT = `You are working in repo xrpl-control-room-gamer-ui.
Task: [one specific improvement].
Return: 1) short analysis 2) PATCH blocks with file paths 3) explain how to verify.
Rules: small patches only (1–3 files), no secrets in client code, read-only XRPL first; any action must produce unsigned tx drafts + user signing.`;

export default function Builder() {
  const location = useLocation();
  const { wallets, activeWalletId } = useWalletStore();
  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : wallets[0];
  const activeAccount = activeWallet?.address ?? undefined;
  const [showCursorPrompt, setShowCursorPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCursorPrompt = () => {
    navigator.clipboard.writeText(CURSOR_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-cyber-border pb-2">
        <Wrench className="text-cyber-glow" size={22} />
        <h1 className="font-cyber text-lg font-bold uppercase tracking-wider text-cyber-text">
          Builder Agent
        </h1>
      </div>
      <p className="text-sm text-cyber-muted">
        OODA: Observe (repo + task) → Orient (UI Triage / XRPL Wiring / Module Factory / Sign in Xaman) → Decide (patch format or payment draft) → Act (paste patch → run → validate, or approve in Xaman).
      </p>
      <div className="rounded-lg border border-cyber-border bg-cyber-darker/50 p-2">
        <button
          type="button"
          onClick={() => setShowCursorPrompt(!showCursorPrompt)}
          className="flex w-full items-center justify-between text-left text-xs text-cyber-muted hover:text-cyber-glow"
        >
          <span>Copy prompt for Cursor (paste when asking Cursor to implement)</span>
          {showCursorPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showCursorPrompt && (
          <div className="mt-2 flex gap-2">
            <pre className="flex-1 whitespace-pre-wrap rounded border border-cyber-border bg-cyber-dark p-2 font-mono text-[10px] text-cyber-text">
              {CURSOR_PROMPT}
            </pre>
            <button
              type="button"
              onClick={copyCursorPrompt}
              className="flex h-fit items-center gap-1 rounded border border-cyber-border bg-cyber-glow/20 px-2 py-1 text-xs text-cyber-glow hover:bg-cyber-glow/30"
            >
              <Copy size={12} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
      <BuilderAgentPanel
        account={activeAccount}
        currentRoute={location.pathname}
        selectedModuleId={null}
        onApplyUiUpdate={(uiUpdates) => {
          console.log('[BuilderAgent] uiUpdates from agent:', uiUpdates);
          // Caller can apply uiUpdates to state/store or show a preview modal
        }}
      />
    </div>
  );
}
