# Global Payment Infrastructure Map — First Pass (Reference)

Exact file paths, what each file does, existing-file edits, and TODO notes for real data.

---

## 1. Exact file paths

### New files (create these)

| Path | Purpose |
|------|--------|
| `src/types/payment-infrastructure.ts` | Node/edge types and layout types |
| `src/data/globalPaymentInfrastructureData.ts` | Mock nodes and edges + data loader |
| `src/data/globalPaymentInfrastructureTransform.ts` | Graph layout (positions + opacity) |
| `src/components/network/GlobalPaymentInfrastructureMap.tsx` | Map SVG component |
| `src/components/network/PaymentInfrastructureSidebar.tsx` | Sidebar detail panel (metrics + badges) |
| `src/components/network/PaymentInfrastructureLegend.tsx` | Left-sidebar legend |
| `src/content-packs/v1/globalPaymentInfrastructure/brief.json` | Brief for new lens |
| `src/content-packs/v1/globalPaymentInfrastructure/guided-steps.json` | Guided steps for new lens |
| `docs/GLOBAL-PAYMENT-INFRASTRUCTURE-MAP-TRUTH.md` | Truth / overclaim rules |

### Existing files (edit only as below)

| Path | Edits |
|------|--------|
| `src/types/globe.ts` | Add `'globalPaymentInfrastructure'` to `GlobeLens` |
| `src/data/globeContent.ts` | Import new brief/guided-steps; add lens to briefsByLens, guidedStepsByLens, lensMetadata |
| `src/store/globeStore.ts` | Add `'globalPaymentInfrastructure'` to `validLenses` |
| `src/components/network/index.ts` | Export `GlobalPaymentInfrastructureMap`, `PaymentInfrastructureSidebar`, `PaymentInfrastructureLegend` |
| `src/pages/Network.tsx` | Imports, lens tab, state, center map conditional, left legend, right sidebar conditional |

### Reused (no changes)

| Path | Use |
|------|-----|
| `src/types/telemetry-truth-model.ts` | `ObservationClass` etc. |
| `src/types/telemetry-visual-rules.ts` | `lineStyleFromObservationClass`, `opacityFromConfidence`, `getObservationClassLabel` |
| `src/components/telemetry/ConfidenceBadge.tsx` | Confidence + observation class in sidebar |

---

## 2. Sidebar metrics (same behavior as other network maps)

When a node is selected, the sidebar shows:

- **Node name** — title
- **Node type** — e.g. Settlement rail, Interoperability gateway
- **Region** — e.g. Global, United States
- **Status** — active / pilot / announced / deprecated (badge)
- **Monthly transactions** — value or "—"
- **Monthly value (USD)** — value or "—"
- **Connected networks** — list or "—"
- **Fiat currencies** — list or "—"
- **Crypto assets** — list or "—"
- **Stablecoins** — list or "—"
- **CBDCs** — list or "—"
- **Confidence** — via `ConfidenceBadge` (score + label)
- **Observation class** — explicit badge: Observed / Inferred / Probe / synthetic / Unknown
- **Provenance** — text when present
- **Badges** — Status, Observation class, and **Mock** when `isMock`

Styling matches existing Network right-sidebar panels: `cyber-panel`, `border-cyber-glow/25`, `rounded-2xl`, `text-[10px]` section headers, `uppercase tracking-wider`, `bg-cyber-darker/50` for metric boxes.

---

## 3. Existing file edits (where to paste)

### `src/types/globe.ts`

**Find:**  
`export type GlobeLens = ... | 'regulation';`

**Replace with:**  
`export type GlobeLens = ... | 'regulation' | 'globalPaymentInfrastructure';`

---

### `src/data/globeContent.ts`

**Add imports (with other brief imports):**  
`import globalPaymentInfrastructureBrief from '../content-packs/v1/globalPaymentInfrastructure/brief.json';`

**Add import (with other guided-steps):**  
`import globalPaymentInfrastructureGuidedSteps from '../content-packs/v1/globalPaymentInfrastructure/guided-steps.json';`

**In `briefsByLens` add:**  
`globalPaymentInfrastructure: globalPaymentInfrastructureBrief as LensBrief,`

**In `guidedStepsByLens` add:**  
`globalPaymentInfrastructure: globalPaymentInfrastructureGuidedSteps as GuidedStepsData,`

**In `lensMetadata` add:**  
```ts
globalPaymentInfrastructure: {
  label: 'Global Payment Infrastructure',
  description: 'Routing hubs, settlement rails, and connected assets worldwide',
  icon: 'route',
  color: '#14b8a6',
},
```

---

### `src/store/globeStore.ts`

**Find:**  
`const validLenses: GlobeLens[] = ['validators', 'ilp', 'corridors', 'community', 'regulation'];`

**Replace with:**  
`const validLenses: GlobeLens[] = ['validators', 'ilp', 'corridors', 'community', 'regulation', 'globalPaymentInfrastructure'];`

---

### `src/components/network/index.ts`

**Replace contents with:**  
```ts
export { UnifiedNetworkTopology } from './UnifiedNetworkTopology';
export { GlobalPaymentInfrastructureMap } from './GlobalPaymentInfrastructureMap';
export { PaymentInfrastructureSidebar } from './PaymentInfrastructureSidebar';
export { PaymentInfrastructureLegend } from './PaymentInfrastructureLegend';
```

---

### `src/pages/Network.tsx`

1. **Imports:** Add `Building2` to lucide imports; add:
   - `GlobalPaymentInfrastructureMap`, `PaymentInfrastructureSidebar`, `PaymentInfrastructureLegend` from `'../components/network'`
   - `type { PaymentInfraNodeLayout }` from `'../types/payment-infrastructure'`

2. **lensIcons:** Add  
   `globalPaymentInfrastructure: <Building2 size={14} />,`

3. **lensOrder:** Append `'globalPaymentInfrastructure'` to the array.

4. **State:** Add  
   `const [selectedPaymentNode, setSelectedPaymentNode] = useState<PaymentInfraNodeLayout | null>(null);`  
   and  
   `useEffect(() => { if (activeLens !== 'globalPaymentInfrastructure') setSelectedPaymentNode(null); }, [activeLens]);`

5. **Center map:** When `activeLens === 'globalPaymentInfrastructure'` render  
   `<GlobalPaymentInfrastructureMap onSelectNode={setSelectedPaymentNode} selectedNodeId={selectedPaymentNode?.id ?? null} />`  
   else keep `WorldGlobe`. Update the hint text below for the new lens.

6. **Left sidebar:** When `activeLens === 'globalPaymentInfrastructure'` render  
   `<PaymentInfrastructureLegend />` inside the left panel.

7. **Right sidebar:** When `activeLens === 'globalPaymentInfrastructure' && selectedPaymentNode` render  
   `<PaymentInfrastructureSidebar node={selectedPaymentNode} onClose={() => setSelectedPaymentNode(null)} />`.  
   Wrap the existing `selectionContext` block with  
   `activeLens !== 'globalPaymentInfrastructure' && selectionContext && (...)`.

---

## 4. Full code for new files

All new files are already in the repo with full implementation. Summary:

- **payment-infrastructure.ts** — `PaymentInfraNodeType`, `PaymentInfraEdgeType`, `PaymentInfraNode`, `PaymentInfraEdge`, `PaymentInfraNodeLayout`, `PaymentInfraEdgeLayout`.
- **globalPaymentInfrastructureData.ts** — `globalPaymentInfraNodes`, `globalPaymentInfraEdges`, `getGlobalPaymentInfrastructureData()`, `MOCK_DISCLAIMER`; nodes/edges have `observationClass`, `confidence`, `isMock`; mock/inferred clearly labeled.
- **globalPaymentInfrastructureTransform.ts** — `transformPaymentInfrastructureGraph(nodes, edges)` → `{ nodes, edges, viewBox }`; ring layout by type; edge opacity from confidence.
- **GlobalPaymentInfrastructureMap.tsx** — SVG map, edge line style by observation class, node click → `onSelectNode`, colors by node type.
- **PaymentInfrastructureSidebar.tsx** — All metrics above; Status + Observation class + Mock badges; ConfidenceBadge; provenance; same styling as other Network panels.
- **PaymentInfrastructureLegend.tsx** — Node type colors, edge certainty (solid/dashed/dotted), mock disclaimer.
- **brief.json** / **guided-steps.json** — Minimal content for the new lens.

---

## 5. TODO notes for real data integration

1. **Replace mock loader**  
   In `src/data/globalPaymentInfrastructureData.ts`, replace or wrap `getGlobalPaymentInfrastructureData()` with a call to your API, e.g.  
   `const res = await fetch('/api/network/global-payment-infrastructure');`  
   then map the response to `PaymentInfraNode[]` and `PaymentInfraEdge[]`. Keep the same shape (id, name, type, region, status, monthlyTransactions, monthlyValueUsd, connectedNetworks, supportedFiatCurrencies, supportedCryptoAssets, supportedStablecoins, supportedCBDCs, confidence, observationClass, provenance, isMock).

2. **API route (optional)**  
   Add e.g. `src/pages/api/network/global-payment-infrastructure.ts` (or your backend route) that returns `{ nodes, edges, disclaimer }`. The map and transform stay the same; only the data source changes.

3. **Loading / error state**  
   The map currently uses sync mock data. When switching to async: in `Network.tsx` or in the map component, use `useState`/`useEffect` or TanStack Query, and show a loading state while `!data` and an error state if the request fails.

4. **Pagination / filters**  
   If the real dataset is large, extend the payload with optional `filters` or `cursor` and have the map/loader accept them; the component API can stay `onSelectNode` / `selectedNodeId`.

5. **Provenance / source IDs**  
   For real data, set `provenance` and optionally a structured `source_ids` or `observed_at` to match `DataProvenance` in `telemetry-truth-model` if you want to show source and timestamp in the sidebar later.

---

## 6. Design constraints satisfied

- Uses existing Network tab patterns (lens tabs, left legend, center map, right detail).
- Mock data clearly labeled (`isMock`, `observationClass`; legend disclaimer).
- Same design language (cyber-panel, cyber-glow, text-cyber-muted, etc.).
- No refactor of unrelated app parts.
- Easy to extend: swap `getGlobalPaymentInfrastructureData()` for an API call; types and components unchanged.
