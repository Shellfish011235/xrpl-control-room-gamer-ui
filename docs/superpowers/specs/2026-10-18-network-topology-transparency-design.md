# XRPL Network Topology / Validator Transparency — Design

Date: 2026-10-18
Branch: `feature/network-topology-transparency`
Status: Design approved in conversation; written-spec review pending

## Purpose

Add a dedicated XRPL consensus-topology view to Control Room without redesigning or destabilizing the existing dashboard. The feature should answer a simple question first — **how observable is the infrastructure that secures XRPL?** — and reveal investigator-grade detail only on demand.

The feature must distinguish evidence from inference. Unknown or private infrastructure is a visibility boundary, not evidence of a hidden institution.

## Success criteria

1. Existing Control Room layout, card dimensions, spacing, responsive behavior, and main-page load path remain materially unchanged.
2. A small entry point from the existing Network/validator experience opens a dedicated topology route.
3. The topology view shows validator trust/list context, observable network relationships, endpoint visibility, operator/infrastructure attribution when supported, governance signals, and explicit unknown/private boundaries.
4. Every topology fact has an evidence state: `observed`, `inferred`, or `unknown`.
5. Detail is progressive: the graph stays low-noise; selecting a validator opens a detail panel.
6. Heavy graph code/data is lazy-loaded and does not burden the main landing experience.
7. The feature can be reviewed on a Vercel preview deployment before production. Main/production remains untouched until explicit approval.
8. Rollback is trivial: close/discard the feature branch or preview before merge; after merge, revert the feature commit(s) if necessary.

## Existing architecture constraints

- React + TypeScript + Vite.
- `react-router-dom` routes are centralized in `src/App.tsx` and page modules are lazy-loaded.
- The existing `/network` page already contains validator/network/ILP/payment-infrastructure lenses and is large; do not add the full topology implementation inline there.
- Cytoscape and `cytoscape-cola` are already dependencies, so the first implementation should reuse them rather than add a new graph library.
- Existing cyber/dark visual language, motion conventions, and data-accuracy patterns should be reused.

## Approaches considered

### A. Dedicated topology route — selected

Add `/network/topology` as a lazy-loaded page. Add only a compact `Explore Topology` entry point to the existing validator/network UI. The topology page owns its graph, filters, summary metrics, evidence legend, and detail drawer.

**Why selected:** strongest isolation, lowest regression risk, easiest preview/rollback, preserves current dashboard aesthetics, and allows graph complexity to grow without crowding `/network`.

### B. Embed topology graph directly into `/network`

Put the full graph beneath or beside the current validator lens.

**Rejected:** the existing Network page is already dense and large. This approach risks the exact layout/overflow/mobile problems the user wants to avoid.

### C. Replace the existing validator visualization with topology

Fold current validator UX into a new topology-first design.

**Rejected for v1:** unnecessarily destructive and hard to roll back visually. It can be reconsidered later only if the dedicated view proves better in practice.

## Information architecture

### Existing Network page

Keep existing visual structure. Add a small affordance in the validator area:

- `Explore Topology →`
- Optional compact status such as `Topology visibility: —` only when a defensible live metric exists.

Do not add a large graph, new dashboard row, or extra persistent card to the existing grid in v1.

### New route: `/network/topology`

Top-level sections:

1. **Header / context**
   - `XRPL Consensus Topology`
   - short explanation of observed vs inferred vs unknown
   - back link to Network

2. **Summary strip**
   - trusted validators represented in current dataset
   - attributable operators
   - private/opaque endpoints
   - explainable topology-transparency/visibility score

3. **Topology canvas**
   - validator nodes
   - observable peer/sentry/relay relationships
   - trust/list membership context
   - visibility-boundary nodes/edges
   - low-noise labels by default

4. **Filters / legend**
   - list membership
   - evidence state
   - endpoint visibility
   - operator/infrastructure attribution availability
   - Negative UNL state when available

5. **Validator detail drawer**
   - validator key / identity
   - known operator/domain
   - validator-list membership
   - agreement / uptime or availability data when available
   - Negative UNL state when available
   - amendment voting when available
   - endpoint visibility
   - observable ASN/provider/hosting fields only when supported
   - evidence/source classification per field

## Data model

Create a topology-specific normalized model rather than coupling the UI directly to one API response.

```ts
type EvidenceState = 'observed' | 'inferred' | 'unknown'
type EndpointVisibility = 'public' | 'private' | 'partial' | 'unknown'

type TopologyNodeKind =
  | 'validator'
  | 'peer'
  | 'sentry'
  | 'operator'
  | 'visibility-boundary'

type TopologyNode = {
  id: string
  kind: TopologyNodeKind
  label: string
  validatorPublicKey?: string
  operator?: string
  domain?: string
  endpointVisibility: EndpointVisibility
  evidence: EvidenceState
  sources: TopologySource[]
  trust?: {
    ripple?: boolean | null
    xrplf?: boolean | null
    other?: string[]
  }
  infrastructure?: {
    asn?: string
    provider?: string
    region?: string
  }
  consensus?: {
    agreement?: number
    active?: boolean
    negativeUnl?: boolean
  }
  amendmentVotes?: Record<string, boolean | null>
}

type TopologyEdge = {
  id: string
  source: string
  target: string
  relation: 'peer' | 'sentry' | 'trust' | 'operator' | 'visibility-boundary'
  evidence: EvidenceState
  sources: TopologySource[]
}

type TopologySource = {
  label: string
  url?: string
  asOf?: string
}
```

The UI must not promote an inferred relationship to observed merely because it is visually connected.

## Data flow

### v1

Use a topology adapter that combines data already available to the application with explicitly sourced topology records. The page consumes only the normalized model above.

```text
existing XRPL network/validator data
        +
validator-list / metadata sources
        +
peer/topology evidence when available
        ↓
TopologyDataAdapter
        ↓
normalized nodes + edges + source metadata
        ↓
summary metrics / filters / Cytoscape graph / detail drawer
```

If a source is unavailable, the page degrades to `unknown`. It must never synthesize institutional attribution.

### Future source expansion

The adapter boundary should allow later ingestion of:

- validator-list publisher data
- peer-crawler observations
- historical Negative UNL events
- amendment voting history
- independently sourced operator/domain records
- ASN/provider lookups for publicly observable endpoints

These are source expansions, not requirements to block the first UI release.

## Transparency / visibility score

The score is an **observability metric**, not a decentralization score and not a trust score.

For each validator in scope, award explainable points for supported fields, for example:

- operator attribution known
- trust/list membership known
- endpoint visibility state known
- at least one observable topology relationship or explicit private boundary
- infrastructure attribution known when the endpoint is public
- consensus status available

The page must expose the score recipe in an info tooltip or expandable explanation. Unknown fields lower observability but must not be presented as misconduct or centralization.

## Visual design

- Reuse Control Room dark/Ripple-blue/cyber visual tokens.
- Keep default graph sparse and readable.
- Use visual treatment to distinguish:
  - observed relationships: solid
  - inferred relationships: dashed
  - visibility boundaries / unknown: muted or haloed boundary treatment
- Do not expose long keys, ASN metadata, votes, and source lists directly on graph nodes.
- Open detail in a responsive side drawer on desktop and bottom/full-width drawer on small screens.
- Avoid horizontal page overflow; the graph canvas owns pan/zoom internally.
- Keep the graph usable at common mobile widths; summary strip may stack.
- No redesign of Navigation, global shell, Operating Model sidebar, or existing Network layout.

## Component boundaries

Proposed focused units:

- `src/pages/NetworkTopologyPage.tsx` — page composition only
- `src/components/network-topology/TopologyCanvas.tsx` — Cytoscape lifecycle/rendering
- `src/components/network-topology/TopologySummary.tsx` — visibility metrics
- `src/components/network-topology/TopologyFilters.tsx` — local filtering controls
- `src/components/network-topology/ValidatorDetailDrawer.tsx` — selected-node detail
- `src/components/network-topology/TopologyLegend.tsx` — evidence semantics
- `src/components/network-topology/index.ts` — public exports
- `src/services/topology/topologyDataAdapter.ts` — normalize source data
- `src/services/topology/topologyVisibility.ts` — deterministic metric calculation
- `src/types/networkTopology.ts` — contracts

Keep source adapters and score logic out of React rendering components so they can be unit tested without a browser.

## Error handling and truthfulness

- Source failure: preserve page shell and show source-specific unavailable state.
- Partial data: render known data and classify missing fields as unknown.
- Graph failure: show a compact fallback list/table of validators rather than crash the route.
- Zero evidence: render the validator identity with an explicit `Topology unknown` state.
- Never infer a company/institution from an opaque endpoint alone.
- Every externally sourced record should retain source/as-of metadata where practical.

## Performance

- Lazy-load `NetworkTopologyPage` at the route level.
- Keep Cytoscape initialization inside the topology route.
- Memoize normalized graph elements and filters.
- Avoid polling faster than existing network sources justify.
- Do not add a global data loop for topology in v1.

## Testing and verification

Before preview deployment:

1. Unit tests for visibility-score calculation and topology normalization.
2. Tests that unknown fields remain unknown and inferred data is not promoted to observed.
3. Route-level test or equivalent static assertion that `/network/topology` is wired.
4. Existing test suite passes.
5. `npm run type-check` passes.
6. `npm run lint` passes or no new lint failures are introduced if the branch begins with known failures.
7. `npm run build` passes.
8. Manual desktop/mobile visual check of:
   - existing `/network` page unchanged except compact entry point
   - topology page has no page-level horizontal overflow
   - drawer behavior
   - loading/empty/error states

## Rollout and rollback

### Preview first

1. Work only on `feature/network-topology-transparency`.
2. Push verified commits to that branch.
3. Create/use a Vercel preview deployment for the branch.
4. User reviews aesthetics and behavior.
5. Do **not** merge or promote to production without explicit approval.

### If user dislikes it before production

- Leave `main` untouched.
- Delete/close the preview and discard the branch if desired.

### If rollback is needed after a later production merge

- Revert the topology feature commit/merge commit.
- Redeploy the prior production state.

## Non-goals for v1

- Claiming discovery of a hidden institutional network.
- Active probing/scanning of private infrastructure.
- ILP routing attribution.
- Flare topology.
- Replacing the existing global/network/validator experience.
- Adding a second graph library.
- Reworking global navigation or dashboard spacing.
- Creating a definitive decentralization score.

## Acceptance statement

The first release is successful if a user can open a dedicated XRPL topology view, understand which validator/network facts are observed versus inferred versus unknown, inspect evidence and visibility boundaries, and return to the existing Network experience without any material aesthetic or performance regression.