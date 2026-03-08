# Interoperability & Hidden Analytics — Implementation

First pass: shared telemetry truth model, interop graph types, 3 hidden analytics layers, mock data, API, panel, graph transform, ConfidenceBadge, AnomalyChip.

---

## 1. Architecture summary

- **Layers:** Application (wallets, merchants, fintech, AI agents) → Routing (ILP, Lightning, IBC, CCIP, Open Payments) → Settlement (XRPL, Bitcoin, stablecoins, bank rails).
- **Shared truth model:** Every node/edge/signal has `observation_class` (observed | derived | inferred | synthetic | unknown), `confidence` (0–100), `provenance`, `freshness`, `health` where applicable. No overclaiming.
- **Interop graph:** `NodeType` (ledger, validator, connector, router, bridge, oracle, wallet_provider, payment_system, protocol_hub), `EdgeType` (settlement, routing, liquidity, bridge, message, trust, probe). Toggleable layers; confidence-driven edge styling.
- **Hidden analytics (3 layers):**
  1. **AI Payment Routing** — Patterns suggesting machine-driven behavior (cadence, burst, timing variance, automation consistency, wallet clusters). Observed vs inferred clearly labeled.
  2. **Liquidity Stress** — Quote latency, failures, variance, concentration, redundancy, retries, settlement delays. Severity and thresholds; derived/inferred.
  3. **Corridor Emergence** — New asset pairs, region patterns, connector pairs, traffic acceleration, new bridges/rails. Emergence score and confidence; inferred.
- **UI:** Reusable ConfidenceBadge, AnomalyChip; graph transform from interop payload → visual props (lineStyle, opacity, glow, thickness); Hidden Analytics panel in Control Room.

---

## 2. Folder tree

```
src/
  types/
    telemetry-truth-model.ts   # (existing) BaseNode, BaseEdge, ObservationClass, DataProvenance, etc.
    telemetry-maps.ts          # (existing + ProtocolHubNode) ValidatorNode, ConnectorNode, PaymentCorridorNode
    telemetry-visual-rules.ts  # (existing) lineStyle, opacity, glow, getConfidenceLabel, shouldShowWarningBadge
    interop-graph.ts           # NEW: NodeType, EdgeType, InteropLayer, InteropNode, InteropEdge, InteropGraphPayload
    index.ts                   # UPDATED: export interop-graph, ProtocolHubNode
  analytics-hidden/
    types.ts                   # NEW: RoutingSignal, LiquidityStressSignal, CorridorEmergenceSignal, HiddenAnalyticsPayload
    mock.ts                    # NEW: MOCK_HIDDEN_ANALYTICS_PAYLOAD, isMockHiddenPayload
    api.ts                     # NEW: fetchHiddenAnalytics()
    index.ts                   # NEW: re-exports
  data/
    interop-graph-mock.ts      # NEW: MOCK_INTEROP_GRAPH_PAYLOAD
  lib/
    interop-graph-transform.ts # NEW: transformInteropGraphToVisual()
  components/
    telemetry/
      ConfidenceBadge.tsx      # NEW: reusable confidence badge
      AnomalyChip.tsx          # NEW: reusable anomaly chip
      index.ts                 # NEW: re-exports
    analytics/
      HiddenAnalyticsPanel.tsx # NEW: panel for 3 hidden layers
      index.ts                 # NEW: re-exports
  pages/
    ControlRoomPage.tsx        # UPDATED: section === 'analytics' → HiddenAnalyticsPanel
  components/
    ControlRoomSidebar.tsx     # UPDATED: section 'analytics', nav "Hidden Analytics"

api/
  analytics/
    hidden.ts                  # NEW: GET /api/analytics/hidden (mock payload)
```

---

## 3. File-by-file purpose

| File | Purpose |
|------|--------|
| **types/interop-graph.ts** | NodeType, EdgeType, InteropLayer; InteropNode extends BaseNode (node_type, layer); InteropEdge extends BaseEdge (edge_type, volume_normalized); InteropGraphPayload. |
| **analytics-hidden/types.ts** | AIPaymentRoutingMetrics, RoutingSignal, AIRoutingAnomalyTag; LiquidityStressMetrics, LiquidityStressSignal, severity + tags; CorridorEmergenceMetrics, CorridorEmergenceSignal; HiddenAnalyticsPayload, HiddenAnalyticsApiResponse. |
| **analytics-hidden/mock.ts** | Mock AI routing, liquidity stress, corridor emergence signals; MOCK_HIDDEN_ANALYTICS_PAYLOAD; isMockHiddenPayload(). |
| **analytics-hidden/api.ts** | fetchHiddenAnalytics({ url, mockOnly }) → GET /api/analytics/hidden. |
| **data/interop-graph-mock.ts** | MOCK_INTEROP_GRAPH_PAYLOAD (nodes: ledger, connector, wallet_provider; edges: routing, settlement). |
| **lib/interop-graph-transform.ts** | transformInteropGraphToVisual(payload) → nodes/edges with lineStyle, opacity, glow, thickness, showWarningBadge, confidenceLabel, observationClassLabel. Uses telemetry-visual-rules. |
| **components/telemetry/ConfidenceBadge.tsx** | Renders observation class + confidence label; optional warning icon; compact mode. |
| **components/telemetry/AnomalyChip.tsx** | Renders severity + message; color by severity (low/medium/high/critical). |
| **components/analytics/HiddenAnalyticsPanel.tsx** | Fetches hidden analytics; sections for AI routing, liquidity stress, corridor emergence; ConfidenceBadge + AnomalyChip; mock disclaimer. |
| **api/analytics/hidden.ts** | GET /api/analytics/hidden returns mock HiddenAnalyticsPayload; from_mock: true. |

---

## 4. Renderer rules (shared)

- **Line style:** solid = observed (and derived); dashed = inferred; dotted = synthetic/probe/unknown. From `lineStyleFromObservationClass(observation_class)`.
- **Opacity:** confidence/100, min 0.3. From `opacityFromConfidence(confidence)`.
- **Glow:** from health (up=1, degraded=0.6, down=0.2, unknown=0.5). From `glowFromHealth(health)`.
- **Thickness:** from payload (volume or importance); do not invent. Use `volume_normalized` or `thickness` on edge.
- **Warning badge:** when freshness is stale/unknown, or confidence < 50, or observation_class is inferred/synthetic/unknown. From `shouldShowWarningBadge(nodeOrEdge)`.

---

## 5. Confidence badge logic

- **Label:** getConfidenceLabel(score, observationClass) → High (≥85), Medium (≥70), Low (≥40), Very low (<40), Synthetic (when observation_class === 'synthetic').
- **Observation class label:** Observed | Derived | Inferred | Probe / synthetic | Unknown.
- **Warning:** Show icon when shouldShowWarningBadge is true (stale/unknown freshness, confidence < 50, or inferred/synthetic/unknown class).
- **Color:** High+observed = cyan; synthetic = orange; inferred/unknown = yellow; else muted.

---

## 6. Anomaly logic

- **Severity:** low | medium | high | critical. Drives chip color (muted, yellow, orange, red).
- **Message:** Short text; optional type for tooltip.
- **Usage:** In payload.anomalies; on signal anomaly_tags (as chips with severity from context).

---

## 7. Sample API routes

- **GET /api/analytics/hidden** — Returns `{ ok, payload: HiddenAnalyticsPayload, from_mock? }`. Payload: ai_routing_signals[], liquidity_stress_signals[], corridor_emergence_signals[], built_at, freshness, contains_synthetic, anomalies[].
- **TODO:** GET /api/interop/graph — Returns InteropGraphPayload (nodes, edges, layers). Currently use MOCK_INTEROP_GRAPH_PAYLOAD + transformInteropGraphToVisual client-side.

---

## 8. Frontend transformation logic

- **Interop graph:** `import { transformInteropGraphToVisual } from '../lib/interop-graph-transform';` then `const visual = transformInteropGraphToVisual(payload);` → use visual.nodes / visual.edges for any graph engine (Cytoscape, Three, SVG). Each node/edge has lineStyle, opacity, glow, thickness, showWarningBadge, confidenceLabel, observationClassLabel.
- **Hidden analytics:** `fetchHiddenAnalytics()` returns payload; pass to HiddenAnalyticsPanel or custom cards. Each signal has observation_class, confidence, provenance, explanation — surface via ConfidenceBadge and tooltips.

---

## 9. Integration steps

1. Paste new files under `src/types`, `src/analytics-hidden`, `src/data`, `src/lib`, `src/components/telemetry`, `src/components/analytics`; add `api/analytics/hidden.ts`.
2. Ensure `src/types/index.ts` exports interop-graph types and ProtocolHubNode.
3. Control Room sidebar already has "Hidden Analytics"; ControlRoomPage renders HiddenAnalyticsPanel when section === 'analytics'.
4. To use interop graph on a map: load MOCK_INTEROP_GRAPH_PAYLOAD (or future API), run transformInteropGraphToVisual(payload), render nodes/edges with returned lineStyle, opacity, glow, thickness; show ConfidenceBadge in tooltips or detail drawer.

---

## 10. What this dashboard must never pretend to know

- **Private routing:** Do not show private end-to-end ILP routes as fully visible. Label as inferred or unknown when topology is from registry/probe only.
- **Settlement vs route:** Do not confuse XRPL (or other) settlement with full route knowledge. Settlement confirms one leg; routing path may be off-ledger and unobserved.
- **Synthetic vs real:** Do not label synthetic/probe traffic as real user traffic. Always set is_synthetic / observation_class: 'synthetic' and show "Probe" or "Synthetic" in UI.
- **Machine-payment certainty:** AI routing signals are inferred from patterns (cadence, timing). Do not state that a wallet or corridor is "confirmed machine-driven"; say "patterns suggest possible automation" and show confidence.
- **Corridor ownership:** Do not invent corridor ownership or institutional attribution without direct evidence. Inferred emergence is not "new corridor launched by X."
- **Protocol links:** Do not treat inferred protocol or connector relationships as confirmed integrations. Use dashed/dotted lines and inferred/synthetic labels.

Implement with skepticism: when in doubt, mark inferred or unknown and surface it in the UI.
