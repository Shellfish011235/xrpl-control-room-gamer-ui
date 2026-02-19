# XRPL Control Room Gamer UI – Pages & Tabs Audit

**Purpose:** Per-page, per-tab list of what’s done vs demo/placeholder/stub and what’s left to do.

---

## Route map (quick reference)

| Route | Page | Notes |
|-------|------|--------|
| `/` | **Character** | Home; profile, portfolio, events, NFTs/Memes tabs |
| `/network` | **Network** | Lenses: Validators, ILP, Corridors, Community, Regulation |
| `/underworld` | **Underworld** | Regulations (RegulationsContent) |
| `/memetic-lab` | **MemeticLab** | 7 tabs: Game Theory, Quantum, Cognitive, Memetic, Defense, BCI, Simulator |
| `/terminal` | **Terminal** | Panels: Heatmap, Risk, Alerts, Paper Trading, Ledger Impact, Pathfinding, Strategies |
| `/pay` | **PayPage** → Micropayments | Send; links to agent (Chat/Economy/Streams) |
| `/pay/agents` | AgentEconomy | Tabs: Agents, Pending, Caps, Receipts |
| `/pay/carv` | Redirect → open agent on Pay | — |
| `/learn` | **Learn** | Sections: How to, Agent economy, Overview, Adoption, Web pay, AI agents, OpenClaw |
| `/nfts` | **NFTs** | Tabs: Gallery, Mint, Portfolio, Trade |
| `/bridges` | **Bridges** | Flow list + Routes (no tabs) |
| `/agents` | **Agents** | Agent Hub (no tabs) |
| `/optimizer` | **Optimizer** | Path Optimizer (no tabs) |
| `/amendment/:id` | **AmendmentDetail** | Full-page amendment |

**Global agent panel (FAB):** Tabs = **Chat** | **Economy** | **Streams**.

---

## 1. Character (Home – `/`)

**Tabs:** NFTs | Memes (portfolio section).

**Done:**
- Profile (name, X handle, avatar), wallet connect, strategy status card, theme/NFT preview, community events, portfolio (PortfolioContent from Clinic).

**Demo / placeholder / to do:**
- **PortfolioContent** (from `Clinic.tsx`): RLUSD/ETF/portfolio metrics are **mock data** (rlusdMetrics, etfData, priceHistory, etfFlowHistory, portfolioAllocation, stablecoinComparison). Replace with live APIs or remove “live” claims.
- **Real wallets:** UI filters out `provider === 'demo'` for “real” portfolio; demo wallets can’t send real XRP (expected).
- **Placeholders:** Name/X handle inputs use placeholder text only (fine).

---

## 2. Network (`/network`)

**Lenses (tabs):** Validators | ILP | Corridors | Community | Regulation.

**Done:**
- Live ledger index (WebSocket), live stats (e.g. useLiveNetworkData, useLiveLedgerStream) where wired.
- Connector map, topology, Innovation Radar, Ledger Heartbeat, Reactor Core.
- Regulation lens uses Underworld’s RegulationsContent.

**Demo / placeholder / to do:**
- **Static stats:** “Active Validators” change `+3`, “Total Hubs” `+2`, “Corridors” `+1` are **hardcoded** (not live).
- **Ledger agreement:** “99.5%” and “Same next ledger (24h)” are **static** when liveStats.averageAgreement is 0; otherwise live. Consider labelling when fallback is used.
- **isPlaceholder:** Used for ledger agreement when no live data; UI already grays out placeholders.

---

## 3. Underworld (`/underworld`)

**Content:** Single view – RegulationsContent (risk radar, timeline, alerts, jurisdiction filter).

**Done:**
- Risk metrics from regulatory data, timeline from regulatory items, alerts from real dates (no fake “2 hours ago”).

**Demo / placeholder / to do:**
- Data source is `regulatoryData` + `globeContent` (curated). If you want “live” regulatory feeds, that’s a separate integration.

---

## 4. Memetic Lab (`/memetic-lab`)

**Tabs:** Game Theory | Quantum | Cognitive | Memetic | Defense | BCI | Simulator.

**Done:**
- Rich content per tab (game theory, quantum SVM demo, cognitive security, memetic, BCI, threat simulator, defense protocols).
- LoopJam Sentinel, phase classification, purple-team framing.

**Demo / placeholder / to do:**
- **dataSource: 'demo'** in one place (e.g. simulator/flow) – explicitly demo.
- **Quantum tab:** Uses “sample feature data” and `AIQuantumAnalytics.quantumSVM` – educational/demo; not production ML.
- **Fake/Memetic content:** Scenarios reference “fake identities”, “fake grassroots”, “fake airdrop” etc. for training – intentional.

---

## 5. Terminal (`/terminal`)

**Panels:** Liquidation Heatmap, Risk Dashboard, Alert Builder, Position Liquidation Risk, Paper Trading, Ledger Impact Tool, Ledger Impact Analyzer, Pathfinding Tool, Strategies.

**Done:**
- Kill switch, plan-ready-for-sign (Xaman), live XRP price, alerts, Orchestra integration, strategy agents.

**Demo / placeholder / to do:**
- **PaperTradingPanel** (see below) – simulated trading; market signals are **demo** (generateMarketSignals).
- **Connected wallets:** Filters `provider !== 'demo'` for live signing; demo mode is explicit.

---

## 6. Paper Trading Panel (inside Terminal)

**Tabs:** Trade | Positions | History | Stats | Alerts | Auto | Backtest.

**Done:**
- Trade (market/limit, TWAP/Iceberg placeholders), Positions, History with P&amp;L, Stats, Alerts, Auto trading UI, Backtest UI.

**Demo / placeholder / to do:**
- **Market signals:** “Simulated market conditions for demo” – `generateMarketSignals` is synthetic.
- **Phase 1 labels:** TWAP/Iceberg “Advanced orders” and “Backtest” tab are **Phase 1** (basic implementation).
- **Orchestra / AI suggestion:** “Phase 1: rule-based”.
- **Backtest:** Tab labelled “BACKTEST (Phase 1)”.
- **Live vs sim:** Uses live price feeds when enabled; otherwise sim. Document which mode is default.

---

## 7. Pay & Micropayments (`/pay`)

**View:** Single – Send (payment channels, flow steps, CostComparator). No tabs on page; “Receipts & caps” and “Chat pay” open the **global agent panel**.

**Done:**
- PaymentChannelManager, CostComparator, links to agent (Chat, Economy, Streams).

**Demo / placeholder / to do:**
- No demo labels on this page; agent panel has its own demo handling (see Agent Economy).

---

## 8. Agent Economy (`/pay/agents`)

**Tabs:** Agents | Pending (Requests) | Caps | Receipts.

**Done:**
- Tabs render; receipts/caps/requests UI; agent list.

**Demo / placeholder / to do:**
- **Demo mode message:** “Demo mode: switch to Live in the nav bar, or configure Xaman API key for real signing.” Shown when wallet is demo.
- **Payer address:** Uses `activeWallet?.provider !== 'demo'` for real payer; otherwise null.
- **Tx hash:** Handles `DEMO_` prefix for demo txs. So **signing and receipts are demo when in demo wallet** – expected.

---

## 9. CARV (standalone / agent “Advanced”)

**Tabs (view modes):** Simple | AI Agent | Advanced.

**Done:**
- Simple mode (create PIE, caps, volume), Agent mode (SecureAgentPanel), Advanced (full CARV dashboard).

**Demo / placeholder / to do:**
- Input placeholders (address “rXXXXXXXXX...”, amount “0.00”, note “e.g. Coffee payment”) – fine.
- CARV backend/Orchestra can be stubbed in places (separate C2V audit).

---

## 10. Learn (`/learn`)

**Sections:** How to use | Agent economy | Overview | Adoption | Web pay | AI agents | OpenClaw.

**Done:**
- How-to, agent economy hub, overview, adoption, web pay (CostComparator, StreamVisualizer, AdoptionTracker), AI agents (AIAgentPayments), OpenClaw (OpenClawDashboard).

**Demo / placeholder / to do:**
- **Web monetization:** “Demo of tiny payments flowing. Simulated only.” and `enableDemo={true}` on WebMonetizationDashboard – **explicit demo**.
- Copy explains “demo wallets can’t send real XRP” – good.

---

## 11. NFTs (`/nfts`)

**Tabs:** Gallery | Mint | Portfolio | Trade.

**Done:**
- Gallery (browse by address), Mint (form), Portfolio (owned), Trade (description only).

**Demo / placeholder / to do:**
- **BETA** badge on page.
- **Trade tab:** “Full broker mode coming soon” – sell/buy offers not fully implemented.
- **Burn:** “Burn confirm modal placeholder”; TODO: `buildNFTokenBurnPayload` + `xamanService.requestCustomTransactionSignature` for real burn.
- Input placeholders (address “r...”, Taxon, Issuer) – fine.

---

## 12. Bridges (`/bridges`)

**Content:** Two columns – Live Flows (24h), Routes. No tabs.

**Done:**
- Flow list and routes from `bridgeService`; BETA badge; link to XRPL EVM docs.

**Demo / placeholder / to do:**
- **BETA** badge.
- **bridgeService:** Uses **MOCK_FLOWS** when Axelar API fails or for fallback; routes are **hardcoded** (fetchBridgeRoutes returns static list). “Bridge executor (Xaman flow for XRP → mXRP) and Cytoscape graph **coming in Phase 3**.”
- Footer: “Data: Axelar-style APIs; DefiLlama yields next.” – roadmap.

---

## 13. Agents (`/agents`)

**Content:** Agent Hub (Wake, Heartbeat, Memory). No tabs.

**Done:**
- AgentHub component; link to Memetic Lab.

**Demo / placeholder / to do:**
- **BETA** badge.
- “Autonomous sims only. All actions require user confirm via Xaman.” – clear.

---

## 14. Optimizer (`/optimizer`)

**Content:** Path Optimizer – source/dest/amount, risk tolerance, ranked paths (chart + list). No tabs.

**Done:**
- Uses `optimizerService`: real XRPL path_find (book_offers), AMM quote, bridge routes; ranks by cost/speed/risk. Phase 1 Revenue MVP.

**Demo / placeholder / to do:**
- **PLACEHOLDER_ACCOUNT** used for pathfinding (rN7n7otQDd6FczFgLdlqtyMVrn3e1DjxvK) – replace with user address when in “live” flow or document as example.
- Input placeholder “100” – fine.

---

## 15. Amendment Detail (`/amendment/:amendmentId`)

**Content:** Full-page amendment (from LedgerImpactTool data); countdown, tier, impact, validator support.

**Done:**
- Load by param; fetchAmendmentByName; CountdownTimer; no tabs.

**Demo / placeholder / to do:**
- Data from your amendments/ledger impact stack; no explicit “demo” on this page.

---

## 16. Global Agent Panel (FAB)

**Tabs:** Chat | Economy | Streams.

**Done:**
- Chat: QuickSendStrip + SecureAgentPanel. Economy: receipts, caps, requests. Streams: OpenClaw / AI streams.

**Demo / placeholder / to do:**
- Same as Agent Economy + CARV for signing (demo when wallet is demo). Xaman init can log “demo mode” on failure.

---

## 17. Home.tsx (not in main route)

**Tabs:** Regulations | Governance | Impact (center panel).

**Status:** **Not routed in App** – `/` goes to Character. If Home is used elsewhere (e.g. embed or alternate entry), it has its own tab set and regulatory/governance/impact content; otherwise treat as legacy or future “alternate home”.

---

## Summary: What’s still in demo / placeholder / to do

| Page / Area | Item | Status |
|-------------|------|--------|
| **Character / Clinic** | RLUSD, ETF, portfolio metrics | **Fixed:** Live XRP price; disclaimer “illustrative data”; resource URLs fixed. |
| **Network** | Active Validators +3, Hubs +2, Corridors +1 | **Fixed:** Fallback change labels → “From topology”; ledger agreement → “—” with “Enable LIVE for real %”. |
| **Network** | Ledger agreement when live | Live path unchanged; placeholder styled when fallback. |
| **Paper Trading** | Market signals | **Fixed:** Alerts tab note “Market signals below are simulated for demo.” |
| **Paper Trading** | TWAP / Iceberg / Backtest | **Phase 1** (basic) – unchanged. |
| **Agent Economy** | Signing when demo wallet | **Demo** (explicit message) – unchanged. |
| **Learn** | Web monetization | **Demo** (simulated) – unchanged. |
| **NFTs** | Trade tab – full broker | **Fixed:** “Coming soon” badge + clearer copy. |
| **NFTs** | Burn flow | **Placeholder** + TODO (Xaman burn) – unchanged. |
| **Bridges** | Flows/routes | **Fixed:** Footer text clarifies mock/APIs + Phase 3. |
| **Optimizer** | Pathfinding account | **Placeholder** account – user address when live – unchanged. |
| **Agents / NFTs / Bridges** | BETA badges | **Intentional** – remove when GA. |

---

*Audit date: 2026-02-18. Updated after fixes: Home (Clinic), Network, Paper Trading Alerts, NFTs Trade, Bridges footer.*
