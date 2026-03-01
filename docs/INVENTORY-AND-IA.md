# App inventory & information architecture

## Current state (inventory)

### Main navigation (header)
| Label    | Route   | What it loads |
|----------|---------|----------------|
| Home     | `/`     | **Character** (profile + portfolio toggle, NFTs/Memes, Ledger Impact, nav cards) |
| Network  | `/network` | Topology, validators, ILP |
| Terminal | `/terminal` | Strategy/orchestra, activity |
| Tools    | `/tools/*` | Tab bar: Ledger Impact, Optimizer, **Control Room**, MVP Wallet, DEX Order, NFT Arena, Bridges, Agents |
| Learn    | `/learn` | How-to, Agent economy, Overview, Adoption, Web pay, AI agents, Streams |
| Regulations | `/underworld` | Regulatory intel |
| Trending | `/memetic-lab` | Memetic Lab |

**Not in main nav**
- **Pay** (`/pay`) – Send, payment channels, streams. Only reachable via Agent FAB, or links from Learn / Agent Economy.
- **Portfolio** (ETFs, RLUSD, health) – Inside Profile: click "Portfolio" card on `/` (easy to miss).
- **Wallet** – Two places: Tools → MVP Wallet, and Tools → Control Room (sidebar: Wallet, Trade, Offers).

### Routes (consolidated)
| Route | Renders | Notes |
|-------|---------|--------|
| `/` | Character | Nav calls it "Home"; contains Profile + Portfolio sections |
| `/character`, `/clinic` | Redirect → `/` | |
| `/network`, `/world`, `/ilp-map`, `/radar`, `/innovation` | Network or redirect | |
| `/terminal` | Terminal | |
| `/pay` | Micropayments (Send) | **Not in nav** |
| `/pay/agents` | AgentEconomy (bounties, receipts) | Via Agent drawer or link |
| `/pay/carv` | Redirect → open Agent chat + `/pay` | |
| `/learn` | Learn | |
| `/tools` | Tools layout; index → `/tools/optimizer` | 8 sub-tabs |
| `/tools/control-room` | ControlRoomPage | Connect wallet, Send/DEX/Offers/Agents/Settings |
| `/tools/wallet` | MvpWalletPage | |
| `/tools/dex-order` | DexOrderPage | |
| `/tools/nfts` | NFTs | Gallery, Mint, Portfolio (from wallets), Trade |
| `/tools/ledger-impact`, `/tools/optimizer`, `/tools/bridges`, `/tools/agents`, `/tools/builder` | Respective pages | |
| `/underworld` | Underworld | |
| `/memetic-lab` | MemeticLab | |
| `/wallet`, `/mvp-wallet` | MvpWalletPage or redirect | |
| `/optimizer`, `/nfts`, `/bridges`, `/agents` | Redirect → `/tools/*` | |
| `/amendment/:id`, `/governance-guide` | AmendmentDetail, GovernanceGuide | |

### Where key features live
| Feature | Location | Discoverable? |
|---------|----------|----------------|
| **Send XRP / payment channels** | Pay page + Control Room (Tools) + Agent (Chat) | Pay not in nav; scattered |
| **Receipts & caps** | Agent drawer → Track tab | Only via FAB |
| **Streams** | Agent drawer → Streams tab | Only via FAB |
| **ETFs list (XRPC, XRP, etc.)** | Profile (`/`) → Portfolio section | Buried (toggle) |
| **RLUSD, portfolio health** | Profile → Portfolio section | Same |
| **NFTs** | Tools → NFT Arena; also Profile (NFTs/Memes block) | Two places |
| **Wallet connect / balances** | Profile left panel; Control Room; Agent | Multiple |
| **DEX / place order** | Tools → DEX Order; Control Room → Trade | Two places |
| **Control Room** | Tools → Control Room tab | Product name is a sub-tab |
| **Agent economy / bounties** | Agent drawer; /pay/agents | No nav item |

### Unused / duplicate
- **Home.tsx** – Not used in routes. `/` renders **Character**.
- **Clinic** – Redirects to `/`. Content lives as **Portfolio** inside Character.
- Many redirect routes (`/character`, `/clinic`, `/stream`, `/micropayments`, `/carv`, `/optimizer`, `/nfts`, etc.) – keep for bookmarks/links but add clarity in IA.

---

## Proposed information architecture

### Principles
1. **One obvious place** for each intent: Send, Portfolio (ETFs/RLUSD), Wallet, Learn.
2. **Pay** in main nav – primary action (send, streams, receipts).
3. **Profile** = you (identity, wallet, portfolio). **Portfolio** = one click from Profile (or direct link).
4. **Control Room** – either top-level (brand) or clearly “Ops” under Tools.
5. **Fewer top-level items** – group “Power user” tools.

### Proposed main nav (order)
| Order | Label      | Route   | Rationale |
|-------|------------|---------|-----------|
| 1     | Profile    | `/`     | You first; rename from "Home" so Portfolio is expected here |
| 2     | Pay        | `/pay`  | Send, streams, receipts – primary action, now visible |
| 3     | Control Room | `/tools/control-room` | Brand + main ops; direct link from nav (or keep under Tools with clearer label) |
| 4     | Tools      | `/tools` | Ledger Impact, Optimizer, Wallet, DEX, NFTs, Bridges, Agents (Control Room linked from nav or first tab) |
| 5     | Network    | `/network` | |
| 6     | Learn      | `/learn` | |
| 7     | Regulations| `/underworld` | |
| 8     | Trending   | `/memetic-lab` | |

### Proposed changes (implementation)
1. **Nav**
   - Rename **Home** → **Profile** (or keep "Home" and add tooltip "Profile & Portfolio").
   - Add **Pay** to main nav (icon + label "Pay").
   - Add **Portfolio** as sub-item or link: e.g. "Profile" dropdown with "Profile" and "Portfolio", or a direct link to `/?section=portfolio` (or `/portfolio` → redirect with state).
2. **Profile landing**
   - Default to Profile section; add clear "Portfolio" card/button (ETFs, RLUSD, health) so it’s one click.
   - Optional: route `/portfolio` → Character with `section=portfolio` for sharing/bookmark.
3. **Control Room**
   - Option A: Add "Control Room" to main nav linking to `/tools/control-room` (no Tools wrapper).
   - Option B: Keep under Tools but make it the first tab or default when opening Tools.
4. **Tools**
   - Keep single Tools entry; ensure tab order matches usage (e.g. Control Room, Wallet, DEX, NFTs, …).
5. **Pay**
   - Single entry in nav → `/pay`. Agent FAB still opens drawer (Chat, Track, Streams) from anywhere.
6. **Cleanup**
   - Consider removing or repurposing **Home.tsx** if it stays unused (or make `/` use Home and move Profile to `/profile` – larger refactor).

---

## Summary
- **Pay** added to nav for discoverability.
- **Profile** (and **Portfolio**) named clearly; optional direct link to Portfolio.
- **Control Room** more prominent (nav or first in Tools).
- **Single “Tools”** hub with ordered tabs.
- **Inventory** above is the source of truth for what lives where; this doc can be updated as we implement.

---

## Implemented (current)
- **Nav**: Renamed Home → **Profile**; added **Pay** and **Control Room** as top-level items. Order: Profile, Pay, Control Room, Tools, Network, Terminal, Learn, Regulations, Trending. Tools tab is not highlighted when on Control Room (Control Room has its own highlight).
- **Portfolio**: Route `/portfolio` redirects to `/` with `state.section = 'portfolio'` so Profile opens the Portfolio section (ETFs, RLUSD, health). Character page syncs section from `location.state.section`.
- **Profile page**: Added “ETFs & RLUSD →” link next to Profile/Portfolio toggle that goes to `/portfolio` for one-click access to the ETF list and portfolio content.
