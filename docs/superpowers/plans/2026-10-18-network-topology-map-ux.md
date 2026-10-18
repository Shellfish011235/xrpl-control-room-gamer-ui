# Network Topology + Map UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rollback-safe XRPL validator topology view and replace drag-heavy embedded maps with stable, fixed intelligence canvases.

**Architecture:** Keep `/network` visually stable, make its embedded geography non-draggable by default, and add a lazy `/network/topology` route. The topology route consumes normalized live validator data, renders a stable Cytoscape relationship-first canvas, and labels missing topology as unknown instead of inventing links. Live ledger activity remains real-time but synthetic geographic transaction locations are removed.

**Tech Stack:** React 19, TypeScript 5.9, Vite, react-simple-maps, Cytoscape, Tailwind, node:test.

**Spec:** `docs/superpowers/specs/2026-10-18-network-topology-transparency-design.md`

## Global Constraints

- Work only on `feature/network-topology-transparency`; do not modify production/main.
- Embedded maps do not freely pan or zoom by default.
- `/network/topology` is lazy-loaded and does not redesign the existing dashboard shell.
- Evidence states are `observed`, `inferred`, or `unknown`.
- Unknown/private infrastructure is not evidence of an institution.
- Do not display synthetic geographic transaction paths as observed live movement.
- Reuse existing Cytoscape dependency; add no graph library.
- Preview deployment only until explicit production approval.

## Review Focus

- Pointer/wheel gestures over embedded maps must not move the map.
- Lens changes and selections must not leave the map off-center.
- Empty or failed live validator data must render an honest fallback, not crash.
- Topology must not fabricate peer edges when the source only supplies validators/nodes.
- Live ledger activity must remain real while geographic origin/path stays explicitly unknown.

---

### Task 1: Truthful live activity semantics

**Files:**
- Modify: `src/hooks/useLiveLedgerStream.ts`
- Modify: `src/components/globe/WorldGlobe.tsx`
- Modify: `src/pages/Network.tsx`

**Interfaces:**
- Produces: live transaction type/count events without synthetic coordinates.
- Consumes: existing public XRPL WebSocket transaction stream.

- [ ] Write/update tests or type assertions that live pulses no longer require geographic coordinates.
- [ ] Remove rotating fake-city coordinates from the live stream hook.
- [ ] Remove geographic transaction pulse plotting from `WorldGlobe`.
- [ ] Keep live connection/TPS semantics available to the Network UI.
- [ ] Verify type-check/build.

### Task 2: Fixed embedded map interaction

**Files:**
- Modify: `src/components/globe/WorldGlobe.tsx`
- Modify: `src/pages/Network.tsx`

**Interfaces:**
- Produces: stable embedded map with gestures filtered out by default and explicit reset/selection behavior.

- [ ] Add a testable interaction rule: `filterZoomEvent` returns false in embedded mode.
- [ ] Remove the unlock-to-drag control path and disabled zoom buttons from the embedded map.
- [ ] Keep canonical reset behavior and selection interactions.
- [ ] Update helper copy to say the map is fixed and selectable, not draggable.
- [ ] Verify desktop/mobile layout does not add horizontal overflow.

### Task 3: Validator topology data + stable graph

**Files:**
- Create: `src/types/networkTopology.ts`
- Create: `src/services/topology/topologyDataAdapter.ts`
- Create: `src/services/topology/topologyVisibility.ts`
- Create: `src/components/network-topology/TopologyCanvas.tsx`
- Create: `src/components/network-topology/TopologySummary.tsx`
- Create: `src/components/network-topology/ValidatorDetailDrawer.tsx`
- Create: `src/components/network-topology/index.ts`
- Create: `test/topologyVisibility.test.ts`
- Create: `test/topologyDataAdapter.test.ts`

**Interfaces:**
- Consumes: `LiveValidatorMarker[]` and `LiveNodeMarker[]` from `useLiveNetworkData`.
- Produces: normalized topology nodes/edges plus explainable visibility metrics.

- [ ] Write failing pure-function tests for normalization and visibility scoring.
- [ ] Implement normalized evidence-aware model.
- [ ] Build stable non-draggable Cytoscape canvas; no fabricated peer edges.
- [ ] Add summary and detail components.
- [ ] Verify tests/type-check/build.

### Task 4: Route, entry point, and preview

**Files:**
- Create: `src/pages/NetworkTopologyPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Network.tsx`

**Interfaces:**
- Produces: `/network/topology` lazy route and compact `Explore Topology` entry point.

- [ ] Wire lazy route in `App.tsx`.
- [ ] Add compact topology entry point without changing existing grid dimensions.
- [ ] Render loading/error/empty states honestly.
- [ ] Run available verification; use Vercel preview build as remote compile gate if local device is unavailable.
- [ ] Push branch and create/open Vercel preview; do not promote to production.
