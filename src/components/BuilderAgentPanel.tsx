/**
 * OpenClaw Builder Agent Panel – OODA workflow inside the dashboard.
 * Modes: UI Triage (declutter, hierarchy, nav), XRPL Data Wiring (read-only), Module Factory (widget stubs).
 * Outputs: analysis, codeSuggestions, uiUpdates, and PATCH blocks you can paste into Cursor.
 */

import React, { useMemo, useState } from 'react';
import { getDefaultOrchestrator } from '../agents/Orchestrator';
import type { AgentType } from '../agents/Orchestrator';

export type BuilderAgentMode = 'ui-triage' | 'xrpl-wiring' | 'module-factory';

const MODE_TO_AGENT_TYPE: Record<BuilderAgentMode, AgentType> = {
  'ui-triage': 'ui-enhance',
  'xrpl-wiring': 'ledger',
  'module-factory': 'ui-enhance',
};

export interface BuilderAgentPanelProps {
  account?: string;
  currentRoute?: string;
  selectedModuleId?: string;
  onApplyUiUpdate?: (uiUpdates: Record<string, unknown>) => void;
}

export default function BuilderAgentPanel(props: BuilderAgentPanelProps) {
  const [mode, setMode] = useState<BuilderAgentMode>('ui-triage');
  const [task, setTask] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Array<{ role: 'you' | 'agent'; text: string }>>([]);

  const context = useMemo(
    () => ({
      account: props.account ?? null,
      route: props.currentRoute ?? null,
      selectedModuleId: props.selectedModuleId ?? null,
      intent: mode,
      guardrails: {
        noPrivateKeys: true,
        noAutoSigning: true,
        readOnlyFirst: true,
        preferSmallPatches: true,
      },
    }),
    [props.account, props.currentRoute, props.selectedModuleId, mode]
  );

  async function run() {
    const prompt = task.trim();
    if (!prompt || busy) return;

    setLog((l) => [...l, { role: 'you', text: prompt }]);
    setTask('');
    setBusy(true);

    try {
      const orchestrator = getDefaultOrchestrator();
      const agentType = MODE_TO_AGENT_TYPE[mode];
      const builderTask = `
You are my OpenClaw Builder Agent for xrpl-control-room-gamer-ui.
Return valid JSON with:
1) "analysis" (short summary; you may include PATCH blocks in the analysis as: PATCH <path> <<< ... >>>).
2) "codeSuggestions" as a bullet list (array of strings).
3) "uiUpdates" JSON for what to change next.

Rules: small patches only (1–3 files), no secrets in client code, read-only XRPL first; any action feature must produce unsigned tx drafts + user signing.

Context: ${JSON.stringify(context)}
Task: ${prompt}
      `.trim();

      const response = await orchestrator.invokeAgent(builderTask, { account: props.account ?? '', ...context }, agentType);

      const agentText = [
        response.analysis,
        response.codeSuggestions?.length
          ? '\nCode suggestions:\n' + response.codeSuggestions.map((s) => ` • ${s}`).join('\n')
          : '',
        Object.keys(response.uiUpdates ?? {}).length
          ? '\nuiUpdates: ' + JSON.stringify(response.uiUpdates, null, 2)
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      setLog((l) => [...l, { role: 'agent', text: agentText }]);

      if (response.uiUpdates && Object.keys(response.uiUpdates).length > 0 && props.onApplyUiUpdate) {
        props.onApplyUiUpdate(response.uiUpdates);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setLog((l) => [...l, { role: 'agent', text: `Error: ${errMsg}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-dark/80 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-cyber text-sm font-bold uppercase tracking-wider text-cyber-glow">
          OpenClaw Builder Agent
        </h3>
        <span className="text-xs text-cyber-muted">{busy ? 'Working…' : 'Ready'}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as BuilderAgentMode)}
          className="rounded-lg border border-cyber-border bg-cyber-darker px-3 py-2 text-sm text-cyber-text focus:border-cyber-glow focus:outline-none"
        >
          <option value="ui-triage">UI Triage</option>
          <option value="xrpl-wiring">XRPL Wiring</option>
          <option value="module-factory">Module Factory</option>
        </select>

        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? run() : null)}
          placeholder="e.g. Simplify the dashboard header, add a Wallet Snapshot card, generate Ledger Pulse module…"
          className="min-w-[200px] flex-1 rounded-lg border border-cyber-border bg-cyber-darker px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/70 focus:border-cyber-glow focus:outline-none"
        />

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-lg border border-cyber-border bg-cyber-glow/20 px-4 py-2 font-cyber text-sm text-cyber-glow transition hover:bg-cyber-glow/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-cyber-border bg-cyber-darker/80 p-3">
        {log.length === 0 ? (
          <p className="text-xs text-cyber-muted">
            Ask: &quot;Audit the dashboard and propose a new hierarchy&quot;, &quot;Add a Wallet Snapshot card (read-only XRPL)&quot;, &quot;Generate a Ledger Pulse module stub&quot;…
          </p>
        ) : (
          log.map((m, i) => (
            <div key={i} className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyber-muted">
                {m.role}
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-cyber-text">
                {m.text}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
