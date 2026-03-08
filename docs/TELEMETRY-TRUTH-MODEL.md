# Shared Telemetry Truth Model — Validator, Connector, Payment Corridor Maps

One graded certainty intelligence system for the Control Room. All three maps use the same observation classes, confidence, and visual language so we never overclaim what we know.

---

## 1. What each map treats as observed / derived / inferred / synthetic / unknown

### Validator Map

| Class | What it is | Examples |
|-------|------------|----------|
| **Observed** | Direct from ledger, UNL registry, or official validator telemetry. | UNL membership; ledger close participation; declared domain; agreement from published feed. |
| **Derived** | Computed from observed data. | Agreement 24h average; proposal rate; uptime % over a window. |
| **Inferred** | Not on UNL or not directly attested. | Validator relationship from co-validation patterns; “influence” from graph centrality; estimated location from IP/heuristic. |
| **Synthetic** | Test/probe/demo. | Testnet validators; synthetic health probes. |
| **Unknown / stale** | No recent signal or no source. | Validator with no telemetry for > T; relationship with no UNL confirmation. |

### Connector (ILP) Map

| Class | What it is | Examples |
|-------|------------|----------|
| **Observed** | Direct from connector API, ledger, or quote response. | Connector quote; ledger settlement tx; connector health endpoint. |
| **Derived** | Computed from observed. | Route success rate; liquidity aggregate; latency percentiles. |
| **Inferred** | Partial or indirect. | Route existence from a single quote; corridor from registry; connector relationship not directly observed. |
| **Synthetic** | Probe or demo. | Quote probes; test payments; demo corridors; simulated routes. |
| **Unknown / stale** | No signal. | Private connector with no public API; stale liquidity estimate. |

### Payment Corridor Map

| Class | What it is | Examples |
|-------|------------|----------|
| **Observed** | On-ledger evidence only. | XRPL transfers; DEX path activity; token pair usage; trust line / LP state; ledger-confirmed amounts; account-to-account activity visible on XRPL. |
| **Derived** | Aggregates from on-ledger. | Corridor volume over time; route popularity; settlement frequency bands; asset pair heat maps; corridor utilization ranking. |
| **Inferred** | Off-ledger or assumed. | Off-ledger institutional usage; hidden enterprise routing; payment intent behind settlement; corridor ownership not disclosed; connector-mediated path assumptions; “this settlement probably came from ILP/Open Payments”. |
| **Synthetic** | Probe or demo. | Health probes; demo corridors; simulated routing; test micro-payments; synthetic AI agent flows. |
| **Unknown / stale** | No or old data. | Stale volume estimate; corridor with no recent on-ledger activity. |

---

## 2. Shared canonical map entity model (summary)

- **BaseNode:** id, label, subtitle, observation_class, confidence, provenance, health, freshness, geo_confidence?, coordinates?, anomaly_ids?, size?, glow?, opacity?, metadata.
- **BaseEdge:** id, source_id, target_id, observation_class, confidence, provenance, health, freshness, direction, thickness, glow, opacity?, anomaly_ids?, metadata.
- **ConfidenceScore:** 0–100.
- **DataProvenance:** observation_class, confidence, source_ids, observed_at, explanation?.
- **HealthState:** up | degraded | down | unknown.
- **GeoConfidence:** confirmed | estimated | unknown.
- **ObservationClass:** observed | derived | inferred | synthetic | unknown.
- **FreshnessState:** live | recent | stale | unknown.

Extended by map:

- **ValidatorNode / ValidatorEdge:** unl_confirmed, agreement_24h, inferred_influence, geo_confidence, amendment_votes, participation; relationship_type unl_link | inferred_link.
- **ConnectorNode / ConnectorEdge:** ledger ids, liquidity_status, relationship_type connector_hop | corridor_route | probe_route; is_synthetic_probe.
- **PaymentCorridorNode / PaymentCorridorEdge:** on_ledger_visible, observed_volume_24h, estimated_volume_24h / estimated_importance; relationship_type settlement_flow | inferred_flow | probe_route; xrpl_confirmed.

---

## 3. Visual language (shared)

- **Solid** = observed (and derived where appropriate).
- **Dashed** = inferred.
- **Dotted** = synthetic / probe or unknown.
- **Glow** = health (and optionally activity).
- **Thickness** = volume or importance (from payload only; do not invent).
- **Opacity** = confidence (e.g. confidence/100, min 0.3).
- **Warning badge** = stale or weak evidence (stale/unknown freshness, confidence &lt; 50, or inferred/synthetic/unknown observation class).

---

## 4. Honest wording (payment corridors)

Prefer:

- “Observed XRPL settlement corridor”
- “Probable corridor cluster”
- “Inferred payment relationship”
- “Probe-confirmed route health”
- “XRPL-confirmed, upstream routing unknown”

Avoid:

- “Payment route from A to B” (without stating observed vs inferred)
- “Confirmed flow” when only settlement is confirmed, not full path

---

## 5. What each map must never pretend to know

### Validator Map

- **Must not** label a validator as “UNL” unless `unl_confirmed === true`.
- **Must not** show inferred influence as “observed uptime” or “agreement”.
- **Must not** show estimated location as “confirmed location”.
- **Must not** present inferred validator links as “UNL relationship”.
- **Must not** treat vote/participation as observed when source is inference or stale.

### Connector (ILP) Map

- **Must not** show probe-only routes as confirmed live routes.
- **Must not** label connector health as “observed” when it is only from synthetic probes.
- **Must not** draw inferred corridors as solid “observed” corridors.
- **Must not** claim full path visibility when only one hop or settlement leg is observed.

### Payment Corridor Map

- **Must not** label inferred flows as “XRPL-confirmed” or “observed settlement”.
- **Must not** show estimated volume as “observed volume”.
- **Must not** present off-ledger or enterprise flow as on-ledger unless there is on-ledger evidence.
- **Must not** claim “payment route A→B” when we only have “XRPL settlement on one leg; upstream routing unknown”.

---

## 6. Anomaly states (by map)

**Validator:** validator_drift, validator_downtime, vote_divergence, stale_telemetry, inferred_only (no UNL confirmation).

**Connector:** connector_unreachable, quote_mismatch, settlement_delay, route_flap, repeated_hop_failure, corridor_degradation, stale_liquidity, telemetry_blackout.

**Payment corridor:** corridor_degradation, settlement_delay, concentration_risk, low_liquidity_stress, stale_estimate.

---

## 7. Implementation references

- **Shared base types:** `src/types/telemetry-truth-model.ts`
- **Map-specific types:** `src/types/telemetry-maps.ts`
- **Visual rules, badge, tooltip, overclaiming rules:** `src/types/telemetry-visual-rules.ts`
- **Sample payloads:** `src/data/telemetry-map-samples.ts`
- **One-graph-engine renderer:** `src/lib/telemetry-renderer.ts` (`payloadToVisualProps`, `nodeToVisualProps`, `edgeToVisualProps`)
