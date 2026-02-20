// Global state for the platform-wide AI agent / secure payment panel.
// Any tab can open the agent via setAgentPanelOpen(true).
// setOpen(true, 'economy') opens to Economy tab; setOpen(true, 'streams') to Streams.
// setPendingSecureAgentPrompt('Send 10 XRP to ') pre-fills the chat input when panel opens (e.g. from Liquidity Crush).

import { create } from 'zustand'

export type AgentPanelTab = 'chat' | 'economy' | 'streams' | 'bender'

interface AgentPanelState {
  open: boolean
  panelTab: AgentPanelTab
  /** Pre-fill Secure Agent chat input when panel opens (e.g. "Send 10 XRP to "). Cleared after consumed. */
  pendingSecureAgentPrompt: string | null
  setOpen: (open: boolean, tab?: AgentPanelTab) => void
  setPanelTab: (tab: AgentPanelTab) => void
  setPendingSecureAgentPrompt: (prompt: string | null) => void
  consumePendingSecureAgentPrompt: () => string | null
  toggle: () => void
}

export const useAgentPanelStore = create<AgentPanelState>()((set, get) => ({
  open: false,
  panelTab: 'chat',
  pendingSecureAgentPrompt: null,
  setOpen: (open, tab) =>
    set((s) => ({
      open,
      panelTab: open && tab != null ? tab : s.panelTab,
    })),
  setPanelTab: (panelTab) => set({ panelTab }),
  setPendingSecureAgentPrompt: (pendingSecureAgentPrompt) => set({ pendingSecureAgentPrompt }),
  consumePendingSecureAgentPrompt: () => {
    const p = get().pendingSecureAgentPrompt
    set({ pendingSecureAgentPrompt: null })
    return p
  },
  toggle: () => set((s) => ({ open: !s.open })),
}))
