# ILP Intelligence Layer — Stage 1 & 2 Implementation

First pass: metadata/ecosystem panel + routing intelligence metrics. Modular; does not replace existing ILP map or app structure.

---

## 1. Folder tree (added / touched)

```
src/
  ilp-intel/                    # NEW — ILP Intelligence module
    types.ts                    # Stage 1 + 2 types (KnownConnector, RafikiNode, OpenPaymentsProviderNode, QuoteLatencyMetric, RouteHealthMetric, etc.)
    mock.ts                     # Mock payload (clearly labeled; source_ids: ['mock'], anomalies mention "mock")
    api.ts                      # fetchILPIntel({ url, mockOnly })
    index.ts                    # Re-exports
  components/
    ilp/
      ILPIntelligencePanel.tsx  # NEW — Panel: connectors, Rafiki, Open Payments, quote latency, route health, confidence badges, observed/inferred labels
      index.ts                  # UPDATED — Export ILPIntelligencePanel
  types/
    telemetry-truth-model.ts    # EXISTING — BaseNode, ObservationClass, DataProvenance, etc.
    telemetry-visual-rules.ts   # EXISTING — getConfidenceLabel, getObservationClassLabel, shouldShowWarningBadge
  pages/
    ControlRoomPage.tsx         # UPDATED — section === 'ilp' → <ILPIntelligencePanel />
  components/
    ControlRoomSidebar.tsx      # UPDATED — ControlRoomSection 'ilp', nav item "ILP / Open Payments"

api/
  ilp/
    intel.ts                    # NEW — GET /api/ilp/intel (returns mock payload; from_mock: true)
```

---

## 2. Where to paste each file

- **New files:** Create `src/ilp-intel/` and add `types.ts`, `mock.ts`, `api.ts`, `index.ts`. Create `src/components/ilp/ILPIntelligencePanel.tsx`. Create `api/ilp/intel.ts`.
- **Existing files:** Edit `src/components/ilp/index.ts` (add export), `src/components/ControlRoomSidebar.tsx` (add section + nav), `src/pages/ControlRoomPage.tsx` (import panel + render when section === 'ilp').

---

## 3. Minimal dependencies

No new npm dependencies. Uses existing:

- `react`, `framer-motion`, `lucide-react`
- Shared types from `src/types/telemetry-truth-model.ts` and `src/types/telemetry-visual-rules.ts`

---

## 4. TODOs for real data integration

- **API route `api/ilp/intel.ts`:** Replace inline mock with call to backend service or DB that aggregates:
  - Connector registry / connector APIs → `connectors`, `connector_liveness`
  - Rafiki / Open Payments metadata → `rafiki_nodes`, `open_payments_providers`
  - Quote probes and route probes → `quote_latency`, `route_health` (set `is_synthetic: true` and `observation_class: 'synthetic'`)
- **Frontend `fetchILPIntel`:** When backend is ready, remove or reduce `mockOnly` fallback; optionally add `VITE_ILP_INTEL_URL` for API base.
- **Normalization:** When ingesting real connector/quote data, normalize to `ObservationClass` and `DataProvenance` (see `src/services/ilp/mapping/normalize.ts` and confidence scoring in `src/services/ilp/mapping/confidence.ts`).
- **Probe labeling:** Any probe-derived metric must have `is_synthetic: true` and `observation_class: 'synthetic'` so the UI never presents it as observed production data.
