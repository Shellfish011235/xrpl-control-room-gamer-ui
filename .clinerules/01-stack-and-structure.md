# Stack & structure

## Tech stack
- **React 19** + **TypeScript 5** (strict)
- **Vite 5** (build), **Tailwind CSS** (styling)
- **Zustand** for state (stores in `src/store/`)
- **TanStack Query** for server/cache
- **Framer Motion** for animations
- **React Router DOM 7**
- **Lucide React** for icons

## Key paths
- `src/pages/` – route pages (Home, Network, Character, Terminal, Learn, Micropayments, etc.)
- `src/components/` – shared UI (Navigation, GlobalAgentPanel, micropayments/, carv/, etc.)
- `src/services/` – XRPL, Xaman, CARV, websockets, micropayments
- `src/store/` – Zustand (walletStore, agentPanelStore, profileStore, etc.)
- `src/App.tsx` – routes and lazy-loaded pages

## Naming
- Components: PascalCase. Files match component name.
- Stores: camelCase (e.g. `useWalletStore`, `useAgentPanelStore`).
- Services: camelCase functions; Xaman/XRPL live under `services/` and `services/xaman/`.

## Styling
- Tailwind with custom theme: `cyber-darker`, `cyber-dark`, `cyber-border`, `cyber-text`, `cyber-muted`, `cyber-cyan`, `cyber-glow`, `cyber-green`, `cyber-red`, `cyber-yellow`, `cyber-purple`.
- Use `font-cyber` for headings/labels. Prefer existing utility classes over new arbitrary values.
