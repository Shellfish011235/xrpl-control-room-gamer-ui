# App audit: necessary vs overwhelming

Quick pass on what’s essential for a “grandma-friendly” gamer UI vs what can be trimmed or moved.

## Done this pass

- **Pay tab removed from nav** — Payment entry is the **Agent** (FAB + nav). Send (channels) still at `/pay`, linked from Home.
- **Educational content moved to Learn** — Overview, adoption, web pay, AI agents, OpenClaw live at **Learn** (`/learn`). Pay page is **Send only**.
- **Learn in nav** — One place for “how things work”; no education mixed into Pay.
- **Tab renames** — Underworld → Regulations, Clinic → Portfolio, Character → Profile, Memetic Lab → Trending, Sector Radar → Radar.

## By area

| Area | Necessary for core loop | Can trim or hide |
|------|--------------------------|-------------------|
| **Home** | Profile, wallet, 3–4 main actions (Map, Markets, Send, Learn) | Big card grid (Network, Regulations, Profile, Portfolio) → could become one “Explore” or stay as shortcuts. Regulations / Governance / Impact center tabs → dense; consider one “Intel” tab or move to Underworld. |
| **Nav** | Home, Radar, Terminal, Network, Learn, Agent (button) | Underworld, Memetic Lab, Character, Clinic → could group under “More” to reduce items. |
| **Pay (Send)** | Payment channels (send XRP), links to Agent + Learn | Already reduced to Send only. |
| **Agent panel** | Chat (quick send + secure pay), Economy (receipts, caps), Streams (demo + OpenClaw) | All three tabs are focused; no further cut needed here. |
| **Learn** | Overview, Adoption, Web pay, AI agents, OpenClaw | Optional: shorten copy or collapse sections for “quick read” mode. |
| **Network** | Map / topology, lenses | Innovation Radar (GitHub, watchlist) under Community lens is optional for power users. |
| **Radar** | Reactor + Data view | Already simplified; keep as-is. |
| **Terminal** | Live data, tables | Consider hiding advanced columns behind “Show more”. |
| **Underworld** | Regulatory intel | Could be the single home for regulations (move Home’s regulation content here). |
| **Memetic Lab** | Meme tokens / culture | Nice-to-have; could live under “More”. |
| **Character** | Profile, NFTs, achievements | Keep; core to “gamer” identity. |
| **Clinic** | Health metrics, RLUSD, ETF | Keep or fold into Character as “Portfolio health”. |

## Next steps (optional)

1. **Home**: One hero + 3–4 actions (Send, Map, Learn, Profile); put the rest behind “Explore” or fewer cards.
2. **Nav**: Group Regulations, Trending, Profile, Portfolio under **More** (dropdown or single “More” page with 4 tiles).
3. **Terminal / Network**: Add “simple” vs “advanced” toggle or hide extra columns by default.
4. **Regulations**: Make it the single place for all regulatory/governance content; thin out Home center panel.
