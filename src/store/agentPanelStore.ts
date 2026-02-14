// Global state for the platform-wide AI agent / secure payment panel.
// Any tab can open the agent via setAgentPanelOpen(true).
// setOpen(true, 'economy') opens to Economy tab; setOpen(true, 'streams') to Streams.

import { create } from 'zustand'

export type AgentPanelTab = 'chat' | 'economy' | 'streams'

interface AgentPanelState {
  open: boolean
  panelTab: AgentPanelTab
  setOpen: (open: boolean, tab?: AgentPanelTab) => void
  setPanelTab: (tab: AgentPanelTab) => void
  toggle: () => void
}

export const useAgentPanelStore = create<AgentPanelState>()((set) => ({
  open: false,
  panelTab: 'chat',
  setOpen: (open, tab) =>
    set((s) => ({
      open,
      panelTab: open && tab != null ? tab : s.panelTab,
    })),
  setPanelTab: (panelTab) => set({ panelTab }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
