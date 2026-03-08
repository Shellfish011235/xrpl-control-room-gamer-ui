# ILP Mapping — Design & Implementation Spec

**Project:** XRPL Control Room Gamer UI  
**Owner:** shellfish011235  
**Purpose:** Accurate ILP data ingestion, normalization, and visualization without overclaiming visibility.

---

## SECTION 1 — TRUTH MODEL

What can actually be known vs what cannot be known with certainty in ILP mapping.

| Class | Definition | Examples | Confidence range | UI treatment |
|-------|-------------|----------|------------------|--------------|
| **Observed** | Fact attested by a primary source (ledger tx, connector API response, quote response). | XRPL settlement tx hash; connector quote amount and expiry; ledger balance. | 85–100 | Solid lines/nodes; no “estimated” badge; tooltip can say “Observed”. |
| **Derived** | Computed from observed data (aggregates, rates, health from probes). | 24h volume from payment table; route success rate; probe liveness. | 70–89 | Slightly muted; optional “Derived” badge; explain in tooltip. |
| **Inferred** | Inferred from partial or indirect signals (pathfinding result, registry, correlation). | Route existence from a single quote; corridor from connector registry. | 40–69 | Dashed or dotted; “Inferred” badge; tooltip must explain source. |
| **Unknown / Not observable** | No signal or only placeholder. | Private connector routes; off-ledger hops; unlisted corridors. | 0–39 | Greyed out or hidden by default; “Uncertain” badge; do not draw as fact. |

- **Exact definition (observed):** Data that comes from a direct API, ledger, or log with no inference step.  
- **Exact definition (derived):** Data produced by a deterministic computation over observed data.  
- **Exact definition (inferred):** Data that requires an assumption or correlation (e.g. “this quote implies this route exists”).  
- **Exact definition (unknown):** No data or only synthetic/demo data for that entity.

---

## SECTION 2 — DATA SOURCES

| Source | Reliability | Public accessibility | Latency | Completeness | Privacy / limitations |
|--------|-------------|----------------------|---------|--------------|------------------------|
| XRPL ledger (transactions) | High | Public | Seconds | Only XRPL leg | No ILP packet visibility; settlement only. |
| Connector public APIs (Rafiki, etc.) | High | If exposed | Sub-second | Per-connector | Many connectors not public. |
| Open Payments / Rafiki GraphQL | High | When deployed | Low | Wallet/account scope | Not global ILP topology. |
| SPSP endpoints | Medium | Per server | Low | Per receiver | No route/corridor view. |
| Connector logs | High | Private | Real-time | Full | Requires operator cooperation. |
| Packet logs | High | Private | Real-time | Full | Same. |
| Quote responses | High | When API exists | Real-time | Per-request | Single-hop or multi-hop depending on API. |
| Rate tables | Medium | Sometimes public | Varies | Per-connector | Stale risk. |
| Health checks (self-run probes) | Medium | N/A | On schedule | Probe coverage only | Synthetic; must be labeled. |
| Testnet / sandbox | Medium | Public | Low | Test only | Not production; label clearly. |
| Metadata registries (e.g. connector lists) | Low–Medium | Public | Batch | Partial | Often outdated; treat as inferred. |
| Internal telemetry | High | Internal | Real-time | Depends | Only for your own nodes. |

Use: ledger APIs + connector/quote APIs where available; probes for health; registries for hints; never treat inferred as observed.

---

## SECTION 3 — ACCURATE ENTITY MODEL

Canonical entities and fields (see `src/services/ilp/mapping/canonical.ts` for TypeScript).

- **Connector:** id, name, from_ledger_id, to_ledger_id, asset_pairs[], liquidity_status, liquidity_depth_usd?, settlement_mechanism, operator?, fee_bps?, min/max_amount?, uptime_percent?, last_active_at?, provenance (required). PK: id.
- **Route:** id, from_ledger_id, to_ledger_id, from_asset, to_asset, hop_connector_ids[], total_fee_bps, total_latency_ms, liquidity_available_usd?, expires_at?, provenance. PK: id.
- **Corridor:** id, connector_id, from/to_ledger_id, from/to_asset, status, volume_24h_usd?, tx_count_24h?, avg_settlement_time_ms?, success_rate?, bidirectional, provenance. PK: id.
- **Asset:** id, symbol, ledger_id, asset_type, issuer?, provenance. PK: id.
- **Ledger:** id, name, symbol?, type, native_asset_id, finality_seconds?, provenance. PK: id.
- **PaymentAttempt:** id, source/dest_ledger_id, source/dest_asset, amount, route_id?, status, quote_id?, settlement_id?, started_at, settled_at?, failure_reason?, provenance. PK: id.
- **Quote:** id, payment_attempt_id, connector_id, amount_in, amount_out, exchange_rate?, fee_bps, expires_at, created_at, provenance. PK: id.
- **SettlementEvent:** id, payment_attempt_id, ledger_id, tx_hash?, amount, asset, settled_at, provenance, xrpl_confirmed? (bool). PK: id.
- **LiquidityEdge:** id, connector_id, from/to_asset, amount_usd, observed_at, provenance. PK: id.
- **NodeHealth:** id, node_type, node_id, status, latency_ms?, last_check_at, consecutive_failures, provenance. PK: id.
- **PacketFlow:** id, payment_attempt_id, hop_index, connector_id, direction, packet_type, observed_at, provenance. PK: id.
- **ProbeResult:** id, probe_type, target_connector_id?, target_route_id?, success, latency_ms?, error_code?, executed_at, is_synthetic: true, provenance. PK: id.
- **Confidence:** Handled inside provenance (data_class + confidence 0–100) and by confidence engine (score, label, explanation).

Example JSON (connector):

```json
{
  "id": "rafiki-xrpl-eth",
  "name": "Rafiki XRPL↔ETH",
  "from_ledger_id": "xrpl",
  "to_ledger_id": "eth",
  "asset_pairs": [{"from_asset": "XRP", "to_asset": "ETH", "rate": 0.0002, "spread_bps": 30}],
  "liquidity_status": "live",
  "liquidity_depth_usd": 150000,
  "settlement_mechanism": "api",
  "operator": "Rafiki",
  "provenance": {
    "class": "observed",
    "confidence": 88,
    "source_ids": ["connector_api"],
    "observed_at": "2025-03-08T12:00:00Z",
    "explanation": "Connector API + ledger confirmations"
  }
}
```

---

## SECTION 4 — GRAPH MODEL

- **Nodes:** Ledger, Connector (optional; can show only ledgers and edges).
- **Edges:** Directed or bidirectional; one edge per corridor (or per route hop if multi-hop view).
- **Directional flow:** source_id → target_id; direction: forward | backward | bidirectional.
- **Multi-hop:** Route hop_connector_ids define sequence; each hop can be an edge (connector or ledger ↔ connector).
- **Confidence-weighted route lines:** Edge confidence 0–100 drives line style (e.g. dashed below 70).
- **Edge thickness:** By volume (normalized 0–1).
- **Edge glow:** By health/activity (1 − failure_heat).
- **Failure heat overlay:** Optional failure_heat 0–1 per edge.
- **Corridor aggregation:** One edge per corridor; optional merge of multiple connectors same ledger pair.

**Storage:** PostgreSQL for entities and events; time-series (TimescaleDB) for payments/quotes/settlements/probes; graph DB (e.g. Neo4j) only if you need heavy graph queries (pathfinding, centrality). For MVP, SQL + in-memory graph build is enough.

**Uncertain edges:** Store confidence and data_class; render with dashed/dim and “Inferred” badge.

**Dynamic topology:** Ingest events (connector up/down, new corridor); rebuild graph snapshot on schedule or on event; cache payload for UI with TTL.

---

## SECTION 5 — PIPELINE ARCHITECTURE

1. **Collection:** Connector APIs, ledger APIs, probe jobs, registries → raw events.
2. **Normalization:** Apply field rules (connector name, asset symbol, timestamps, IDs).
3. **Deduplication:** By id + observed_at; merge provenance for same route from multiple sources.
4. **Enrichment:** Join with ledgers/assets; compute liquidity aggregates.
5. **Correlation:** Link quote → payment → settlement; attach xrpl_confirmed where ledger tx exists.
6. **Storage:** PostgreSQL (schema in `docs/ilp-mapping-schema.sql`); optional TimescaleDB for time-series.
7. **Caching:** Graph payload in Redis with 60–300s TTL; invalidate on anomaly or topology change.
8. **Frontend delivery:** GET /api/ilp/graph returns normalized graph; UI uses fetchILPGraph + toGraphPayload if building from store.

**Stack options:** Node.js/TypeScript for API and workers; Python workers for heavy analytics if needed; PostgreSQL + TimescaleDB; Redis for cache; Kafka/NATS/RabbitMQ for event bus; Neo4j only if graph-first queries are required.

---

## SECTION 6 — NORMALIZATION RULES

- **Connector names:** Map aliases (e.g. rafiki-testnet, rafiki-mainnet) to canonical name via `normalizeConnectorName`.
- **Asset symbols:** Uppercase; ledger-scope for colliding symbols (e.g. USD.ledger_id) via `normalizeAssetSymbol`.
- **Exchange rates:** Store with timestamp and source; do not merge across time without decay.
- **Payment ID vs settlement ID:** Prefer payment_attempt_id for payment; settlement carries settlement_id; use `pickPaymentId` for heterogeneous objects.
- **Same route, multiple sources:** Merge source_ids; take max confidence; keep data_class “observed” only if any source is observed.
- **Partial route visibility:** Set data_class to inferred when hop count &lt; expected.
- **Duplicate probes:** Dedupe by (probe_type, target_connector_id, time_bucket) via `probeDedupeKey`.
- **Clock skew:** Clamp observed_at to server_now ± 300s via `clampTimestamp`.
- **Missing timestamps:** Use fallback and set was_missing; mark provenance as derived where appropriate.

---

## SECTION 7 — CONFIDENCE ENGINE

Inputs: source_quality (0–1), freshness_seconds, corroborating_sources, is_direct_observation, connector_uptime_percent, route_success_count, quote_settlement_agreement, telemetry_completeness (0–1).

Formula (see `confidence.ts`): Base score from data_class (observed 90, derived 75, inferred 55, unknown 20); multiply by freshness decay (half-life 1h); add bonuses for corroboration, direct observation, uptime, success count, quote–settlement agreement, completeness. Clamp 0–100.

Output: score (0–100), label (High / Medium / Low / Very low), explanation string for UI tooltip.

---

## SECTION 8 — API DESIGN

| Endpoint | Purpose | Method | Query params | Response | Pagination | Caching |
|----------|----------|--------|--------------|----------|------------|---------|
| /api/ilp/graph | Graph for map | GET | cache=no | ILPGraphApiResponse | N/A | 60s |
| /api/ilp/connectors | List connectors | GET | ledger_id, status | { connectors[] } | limit, cursor | 120s |
| /api/ilp/routes | List routes | GET | from_ledger, to_ledger | { routes[] } | limit, cursor | 60s |
| /api/ilp/corridors | List corridors | GET | connector_id | { corridors[] } | limit, cursor | 120s |
| /api/ilp/payments/live | Recent payments | GET | since, status | { payments[] } | limit | 30s |
| /api/ilp/health | Connector/route health | GET | node_id | { health[] } | N/A | 30s |
| /api/ilp/anomalies | Active anomalies | GET | severity, since | { anomalies[] } | limit | 15s |
| /api/ilp/probes | Probe results | GET | since, synthetic_only | { probes[] } | limit | 60s |
| /api/ilp/confidence | Confidence for entity | GET | entity_type, entity_id | { score, label, explanation } | N/A | 60s |

---

## SECTION 9 — FRONTEND MAPPING LOGIC

- **Globe/network map:** Render nodes (ledgers, optionally connectors); edges from graph payload; thickness by volume, glow by health; confidence-weighted style (solid vs dashed).
- **Tooltips:** Show data_class, confidence label, explanation; for edges show from_asset, to_asset, volume_24h_usd, corridor/connector id.
- **Right-side details panel:** Selected node/edge full metadata; provenance; related payments or routes; anomalies if any.
- **Real-time vs cached:** Graph and health can be 60s cached; payments/live and anomalies 15–30s; probes can be cached 60s.
- **Confidence badges:** Every node and edge shows badge (High/Medium/Low/Very low) and “Observed” / “Inferred” / “Derived” where relevant.
- **Observed vs inferred distinction:** Solid vs dashed/dotted; different color or opacity; never present inferred as fact.

---

## SECTION 10 — PROBE SYSTEM

- **Quote probes:** Request quote for small amount; measure time-to-quote and success.
- **Liveness:** HTTP/HTTPS or connector health endpoint; record latency and success.
- **Low-value test payments:** Minimal amount along a route; measure time-to-settlement and success.
- **Metrics:** time-to-quote, time-to-settlement, packet success rate; route degradation when success rate drops or latency spikes.

**Pollution avoidance:** All probe results have `is_synthetic: true`; exclude from production volume/analytics or segment clearly; in UI show “Probe” or “Synthetic” and filter by default.

---

## SECTION 11 — XRPL CORRELATION LAYER

- **What XRPL can confirm:** Settlement transactions on XRPL (tx hash, amount, account, timestamp). Not routing, not ILP packet flow.
- **What XRPL cannot confirm:** Off-ledger hops; connector identity; full path; liquidity on other ledgers.
- **Linking:** Match settlement_event.ledger_id = xrpl and settlement_event.tx_hash to ledger; set xrpl_confirmed = true only when tx is found on-ledger.
- **Overclaiming:** Do not label a route “XRPL-confirmed” unless the XRPL leg is confirmed; label “XRPL settlement confirmed” for that leg only.
- **Tagging:** In UI, tag “XRPL-confirmed” only on settlement events that have xrpl_confirmed true.

---

## SECTION 12 — ERROR AND ANOMALY MODEL

| Anomaly | Trigger | Severity | Likely cause | Frontend |
|---------|---------|----------|---------------|----------|
| connector_unreachable | Health check fail N times | high | Down or network | Red node; alert |
| quote_mismatch | Quote amount ≠ subsequent settlement | medium | Rate change or bug | Warning on payment |
| settlement_delay | Settlement &gt; threshold after quote | medium | Congestion, liquidity | Yellow edge/pulse |
| route_flap | Route appears/disappears repeatedly | medium | Instability | Dashed + badge |
| repeated_hop_failure | Same hop fails in multiple payments | high | Connector or corridor issue | Red edge |
| corridor_degradation | Success rate or latency drop | medium | Liquidity or load | Orange glow |
| stale_liquidity_estimate | No liquidity update &gt; T | low | Stale data | “Stale” badge |
| packet_rejection_spike | Reject rate spike | high | Policy or capacity | Alert |
| suspicious_route_concentration | Too much flow through one connector | low | Risk signal | Info badge |
| telemetry_blackout | No events from source for T | high | Outage or API change | Grey + alert |

---

## SECTION 13 — IMPLEMENTATION PHASES

- **Phase 1 (MVP):** Canonical types; graph payload; mock data; toGraphPayload; GET /api/ilp/graph (mock); confidence function; frontend consumes graph and shows observed vs inferred. Defer: DB, real probes, XRPL correlation.
- **Phase 2 (Reliable telemetry):** PostgreSQL schema; ingestion workers for connectors/ledgers; normalization and dedup; real /api/ilp/graph from DB; optional Redis cache. Defer: full anomaly engine.
- **Phase 3 (Confidence scoring):** Confidence engine in pipeline; store confidence per entity; API returns confidence; UI badges and tooltips. Defer: predictive.
- **Phase 4 (Predictive route intelligence):** Anomaly detection; degradation signals; optional ML for route recommendation. Production-grade where data is observed.
- **Phase 5 (AI agent economic analytics):** Use graph + payments for agent route visibility and economic insights; keep data_class and confidence in all outputs.

**Demo-only / fakeable:** Mock graph; synthetic probes; registry-based “inferred” corridors. **Production-grade:** Observed connector/ledger data; XRPL-confirmed settlements; probe-labeled synthetic data.

---

## SECTION 14 — CODE OUTPUT

- **PostgreSQL schema:** `docs/ilp-mapping-schema.sql`
- **TypeScript interfaces:** `src/services/ilp/mapping/canonical.ts`, `graphPayload.ts`
- **Sample ingestion worker:** Normalization in `normalize.ts`; worker would call normalizers then insert into DB (not duplicated here).
- **Sample normalization function:** `normalizeConnectorName`, `normalizeAssetSymbol`, `clampTimestamp`, `ensureTimestamp`, `pickPaymentId`, `routeVisibilityClass`, `probeDedupeKey` in `normalize.ts`
- **Confidence scoring function:** `computeConfidence`, `dataClassFromSource` in `confidence.ts`
- **Sample /api/ilp/graph endpoint:** `api/ilp/graph.ts` (GET; returns mock or DB-built payload)
- **Sample JSON responses:** See mock in `mockGraphData.ts` and inline payload in `api/ilp/graph.ts`
- **Frontend graph payload format:** `ILPGraphPayload` in `graphPayload.ts`; transform in `toGraphPayload.ts`; fetch via `fetchILPGraph` in `fetchGraph.ts`

---

## SECTION 15 — HARD TRUTH CHECK: Where This Dashboard Would Be Lying If Implemented Badly

- **Pretending private connector routes are fully visible:** Drawing solid lines for connectors we only inferred from registries or a single quote. Fix: data_class and confidence; dashed lines and “Inferred” for non-observed.
- **Confusing settlement with routing:** Showing “payment succeeded” on XRPL as if the whole ILP path is confirmed. Fix: Only the XRPL leg is confirmed; label “XRPL settlement confirmed” and keep route confidence separate.
- **Overstating XRPL observability:** XRPL shows settlement txs, not ILP packets or multi-hop paths. Fix: Use xrpl_confirmed only on settlement events; do not claim “ILP route verified” from XRPL alone.
- **Drawing routes without confidence labels:** Every edge and node must expose confidence and data_class so users know what is observed vs inferred.
- **Mixing synthetic and real traffic:** Probes must be labeled is_synthetic; exclude from volume/success metrics or segment clearly; do not show probe payments as “live payments” without a filter.
- **Assuming every connector relationship is public:** Many corridors are private. Fix: Show only what we have evidence for; grey or hide unknown; do not fill gaps with guesses without marking inferred.

Implement with skepticism: when in doubt, mark inferred or unknown and surface it in the UI.
