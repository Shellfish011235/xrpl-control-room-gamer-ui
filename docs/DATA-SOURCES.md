# Data Sources — Network Maps, ILP & Payment Corridors

Single reference for where the dashboard gets data for the **Network** page: World Globe, ILP topology, and payment corridors.

**For verification links and proof that numbers are not speculative, see [SOURCES-AND-PROOF.md](./SOURCES-AND-PROOF.md).**

---

## 1. Network maps (World Globe)

The globe uses **content packs** and a **sources registry**. Brief items (headlines/summaries) reference source IDs that resolve to the list below.

### Content pack locations
| Data | Path | Purpose |
|------|------|--------|
| Validators brief | `src/content-packs/v1/validators/brief.json` | Validator lens headlines |
| ILP brief | `src/content-packs/v1/ilp/brief.json` | ILP lens headlines |
| Corridors brief | `src/content-packs/v1/corridors/brief.json` | Payment corridor lens headlines |
| Community brief | `src/content-packs/v1/community/brief.json` | Community/projects lens |
| Regulation brief | `src/content-packs/v1/regulation/brief.json` | Regulation lens |
| Hubs & corridors (globe) | `src/content-packs/v1/hubs/data.json` | Hub/corridor geometry and labels |
| **Sources registry** | `src/content-packs/v1/meta/sources.json` | All cited sources (id, title, publisher, url) |
| Claims | `src/content-packs/v1/meta/claims.json` | Jurisdiction/regulatory claims |
| Build info | `src/content-packs/v1/meta/build-info.json` | Pack versioning |

### Sources registry (sources.json) — used by globe briefs

| ID | Title | Publisher | URL |
|----|--------|-----------|-----|
| src-xrplf-validators | XRPL Foundation Validator Registry | XRPL Foundation | https://xrplf.org/validators |
| src-xrpl-academic | Academic Validator Network | XRPL Foundation | https://xrpl.org/validators.html |
| src-sbi-validators | SBI Holdings Blockchain Infrastructure | SBI Holdings | https://www.sbigroup.co.jp/english/ |
| src-community-stats | XRPL Community Statistics | XRPL Foundation | https://xrpl.org/stats.html |
| src-xrpl-metrics | XRPL Network Metrics | XRPScan | https://xrpscan.com/metrics |
| src-ripple-insights | Ripple Insights Blog | Ripple | https://ripple.com/insights |
| src-bis-remittances | BIS Remittance Statistics | Bank for International Settlements | https://www.bis.org/statistics/ |
| src-ripple-eu | Ripple Europe Updates | Ripple | https://ripple.com/insights |
| src-bsp-data | Bangko Sentral ng Pilipinas Statistics | BSP | https://www.bsp.gov.ph/ |
| src-coil-webmon | Web Monetization Community | Interledger Foundation | https://webmonetization.org |
| src-mas-cbdc | MAS Digital Currency Initiatives | Monetary Authority of Singapore | https://www.mas.gov.sg/ |
| src-whitehouse-eo14178 | Executive Order 14178 | White House | https://www.whitehouse.gov/presidential-actions/ |
| src-esma-mica | MiCA Implementation Guidance | ESMA | https://www.esma.europa.eu/ |
| src-jfsa-guidance | JFSA Crypto-Asset Guidance | Japan Financial Services Agency | https://www.fsa.go.jp/en/ |
| src-mas-dpt | MAS Digital Payment Token Framework | MAS | https://www.mas.gov.sg/ |
| src-vara-licenses | VARA Licensed Entities | Dubai VARA | https://vara.ae/ |
| src-fca-consultation | FCA Crypto Consultation Papers | UK FCA | https://www.fca.org.uk/ |
| src-genius-act | GENIUS Act Implementation | US Treasury | https://home.treasury.gov/ |
| src-xrplcommons-grants | XRPL Commons Grant Program | XRPL Commons | https://xrpl-commons.org/grants |
| src-xrpl-events | XRPL Community Events | XRPL Foundation | https://xrpl.org/events |
| src-xrpl-eu-meetups | XRPL European Meetups | XRPL Community | https://meetup.com/xrpl |
| src-xrpl-standards | XRPL Standards Repository | XRPL Foundation | https://github.com/XRPLF/XRPL-Standards |
| src-reddit-stats | Reddit Community Statistics | Reddit | https://reddit.com/r/XRP |
| src-xrpl-bootcamp | XRPL Developer Bootcamp | XRPL Foundation | https://xrpl.org/bootcamp |
| src-xrpl-labs | XRPL Labs Updates | XRPL Labs | https://xrpl-labs.com |
| src-sologenic-stats | Sologenic DEX Statistics | Sologenic | https://sologenic.org |
| src-xrplevm-stats | XRPL EVM Sidechain Statistics | XRPL EVM | https://xrplevm.org |
| src-hooks-testnet | Hooks Amendment Testnet | XRPL Labs | https://hooks-testnet.xrpl-labs.com |
| src-ripple-rlusd | RLUSD Information | Ripple | https://ripple.com/rlusd |
| src-xrpl-nft-stats | XRPL NFT Market Statistics | XRPScan | https://xrpscan.com/nft |

---

## 2. ILP (Interledger Protocol) topology & data

### 2a. ILP topology (connector map, ledger graph)

**Location:** `src/services/ilp/topology.ts`

- **Ledgers:** Curated list in code (`INITIAL_LEDGERS`). No external API. Includes XRPL, XRPL EVM Sidechain, Ethereum, Bitcoin, Lightning Network, Solana, Polygon, SWIFT, Fedwire, Ripple ODL (and any others added in that file). Metadata (websites, explorers) points to official project sites.
- **Connectors / corridors:** Derived in the same service from connector definitions; corridors are generated between ledgers. Logic is in `topology.ts` (e.g. corridor generation, route calculation).

**Source:** Hand-curated for “accurate topology – only real bridges and connections” (per file comment). Not sourced from a live API.

### 2b. ILP ecosystem (repos, protocols, use cases)

**Location:** `src/data/ilpData.ts`

- **Repositories:** GitHub repos (e.g. `interledger/rafiki`, `interledgerjs/ilp-connector`, `interledger4j/ilpv4-connector`, `interledger/rfcs`, `interledger/open-payments`). Descriptions and metadata from those repos / Interledger docs.
- **Protocol specs:** Interledger RFCs and official spec URLs (e.g. https://interledger.org/rfcs, https://rafiki.dev, https://openpayments.guide).
- **ILP corridors (ilpData):** Curated list in `ilpData.ts` (e.g. `ILPCorridor`), separate from the topology service’s internal corridors.

**Sources:** Interledger Foundation / Interledger GitHub orgs and linked documentation.

### 2c. Globe ILP brief

**Location:** `src/content-packs/v1/ilp/brief.json`

- Headlines and summaries reference `sourceIds` that resolve in `sources.json` (e.g. src-ripple-insights, src-bis-remittances, src-bsp-data, src-coil-webmon, src-mas-cbdc, src-ripple-eu).

---

## 3. Payment corridors (ODL, volumes, bridges, chains)

**Location:** `src/data/corridorData.ts`

Exports: `paymentCorridors`, `odlPartners`, `crossChainBridges`, `xrplConnectedChains`. Each corridor/bridge/chain can have `dataSource` and `dataAsOf`.

### Payment corridors (remittance / B2B)

| dataSource | dataAsOf | Used for |
|------------|----------|----------|
| World Bank / Banxico | Feb 2026 | Mexico-related corridors |
| World Bank / BSP | Feb 2026 | Philippines (BSP) corridors |
| World Bank / Banxico / partner estimates | Feb 2026 | MX-related |
| Ripple / partner estimates | Feb 2026 | ODL corridors |
| World Bank / SBV / partner estimates | Feb 2026 | Vietnam (SBV) |
| World Bank / BI / partner estimates | Feb 2026 | Indonesia (BI) |
| World Bank / BSP / partner estimates | Feb 2026 | Philippines |
| Partner estimates / trade data | Feb 2026 | General corridors |
| World Bank / RBI / partner estimates | Feb 2026 | India (RBI) |
| World Bank / SBP / partner estimates | Feb 2026 | Pakistan (SBP) |
| World Bank / Bangladesh Bank / partner estimates | Feb 2026 | Bangladesh |
| ECB / BoE / partner estimates | Feb 2026 | EU-UK |

**Institutions:** World Bank, Banxico, BSP (Philippines), SBV (Vietnam), BI (Indonesia), RBI (India), SBP (Pakistan), Bangladesh Bank, ECB, BoE, Ripple, partner estimates.

### Cross-chain bridges & XRPL-connected chains

| dataSource | dataAsOf | Used for |
|------------|----------|----------|
| DefiLlama / chain | Feb 2026 | TVL/chain data |
| DefiLlama | Feb 2026, Feb 7 2026 | Bridge/chain stats |
| Chain explorer | Feb 2026 | Chain metadata |

**External source:** DefiLlama (e.g. https://defillama.com) and chain explorers for volume/TVL/explorer links.

### Globe corridors brief

**Location:** `src/content-packs/v1/corridors/brief.json`

- `globalSummary` states: “Remittance volumes are total market (World Bank/Banxico/BSP); ODL share is a subset with no public corridor-level breakdown.”
- Items use `sourceIds` from `sources.json` (e.g. src-ripple-insights, src-bis-remittances, src-bsp-data, src-ripple-eu, src-mas-cbdc, src-vara-licenses).

---

## 4. Unified network topology (full graph)

**Location:** `src/data/unifiedTopology.ts`

- **Inputs:**  
  - **Ledgers & ILP corridors:** From ILP store (fed by `src/services/ilp/topology.ts`).  
  - **Validators / ODL / bridges / chains:** From `corridorData.ts` (`getHubs` from globeContent, `paymentCorridors`, `odlPartners`, `crossChainBridges`, `xrplConnectedChains`).
- **Logic:** Builds one graph (nodes + edges) from those sources. No extra external APIs; it only aggregates the above.

---

## 5. Quick reference

| Feature | Primary data file(s) | External / cited sources |
|--------|------------------------|---------------------------|
| World Globe lenses | `content-packs/v1/*` + `globeContent.ts` | `sources.json` (XRPLF, XRPScan, Ripple, BIS, BSP, MAS, regulators, etc.) |
| ILP connector map (ledgers, corridors) | `services/ilp/topology.ts` | Hand-curated; ledger metadata links to official sites |
| ILP repos & protocols | `data/ilpData.ts` | Interledger GitHub, Interledger Foundation docs |
| Payment corridors (ODL, volumes) | `data/corridorData.ts` | World Bank, central banks (Banxico, BSP, SBV, BI, RBI, SBP, Bangladesh Bank), ECB/BoE, Ripple/partner estimates |
| Bridges & chains (TVL, volume) | `data/corridorData.ts` | DefiLlama, chain explorers |
| Unified topology graph | `data/unifiedTopology.ts` | Aggregates ILP topology + corridorData + globe hubs (no new external API) |

---

*Last consolidated: Feb 2026. For per-field citations in the UI, see `dataSource` / `dataAsOf` on corridor and bridge objects, and `sourceIds` in content-pack briefs resolved via `sources.json`.*
