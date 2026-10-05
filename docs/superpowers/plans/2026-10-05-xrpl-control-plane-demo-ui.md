# XRPL Control Plane Demo UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal hackathon demo surface in XRPL Control Room that makes the control-plane decision understandable in under one minute.

**Architecture:** The UI is presentation only. It displays objective, ledger dependencies, authorization, route result, final decision, and receipt provenance returned by the control-plane API/fixture adapter. It does not own policy or transaction authority.

**Tech Stack:** React 19, TypeScript 5.9, Vite 5, existing Control Room cyber UI components.

**Spec:** Shellfish `docs/superpowers/specs/2026-10-05-ripple-swell-xrpl-control-plane-design.md`

## Global Constraints
- No transaction signing/submission UI in the judged panel.
- Preserve explicit `ALLOW_PLAN`, `DENY`, `SIMULATION_ONLY` labels.
- Show source/provenance and feature-state timestamp.
- CLI remains fallback if UI slips.

## Review Focus
- Missing data must render unknown, not success.
- Deny/simulation states must be visually distinct from allow.
- Receipt hash/provenance must remain visible.
- UI must work with deterministic fixtures if live endpoint is unavailable.
- Existing Control Room routes must not regress.

---

### Task 1: Demo Data Contract
**Files:**
- Create: `src/controlPlane/types.ts`
- Create: `test/control-plane-demo.test.ts`

- [ ] Write failing type/fixture tests for all three decisions and required receipt fields.
- [ ] Add minimal typed contract matching Shellfish output.
- [ ] Run `npm test`.
- [ ] Commit: `feat: define control-plane demo contract`.

### Task 2: Control Plane Panel
**Files:**
- Create: `src/components/control-room/XrplControlPlanePanel.tsx`
- Test: `test/control-plane-demo.test.ts`

- [ ] Write failing render/data-transform tests for objective, dependencies, authorization, route, decision, and receipt hash.
- [ ] Implement a single-screen panel using existing styles/components.
- [ ] Verify tests pass.
- [ ] Commit: `feat: add XRPL control-plane demo panel`.

### Task 3: Route Integration
**Files:**
- Modify: `src/pages/ControlRoomPage.tsx`
- Modify: `src/App.tsx` only if a dedicated route is required.

- [ ] Add the panel to an existing Control Room route if possible; create no new route unless necessary.
- [ ] Verify `npm run type-check && npm test && npm run build`.
- [ ] Commit: `feat: surface control-plane demo in Control Room`.

### Task 4: Judge Demo Fixtures
**Files:**
- Create: `src/controlPlane/demoFixtures.ts`
- Modify: `src/components/control-room/XrplControlPlanePanel.tsx`

- [ ] Add exactly four selectable scenarios: allow, unauthorized destination, unavailable dependency, replay/tamper.
- [ ] Ensure each scenario states whether data is live or fixture-backed.
- [ ] Verify build/tests.
- [ ] Commit: `feat: add Swell control-plane demo scenarios`.
