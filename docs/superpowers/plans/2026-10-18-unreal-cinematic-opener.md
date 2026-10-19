# XRPL Control Room Unreal Cinematic Opener Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reproducible 5–15 second Unreal Engine cinematic opener that visualizes XRPL validator trust and observability boundaries, then hands off visually to the real `/network/topology` Control Room screen.

**Architecture:** Keep the cinematic completely separate from the production React app. Store a small Unreal project plus text-based scene inputs and editor automation under `demo/unreal/xrpl-control-room-cinematic/`; use Unreal Editor/Sequencer for the scene and Movie Render Queue for the MP4. A deterministic Python editor-build script owns actor/material/Sequencer creation so the result can be recreated instead of existing only as opaque editor state.

**Tech Stack:** Unreal Engine 5.x, Unreal Editor Python API, Sequencer, Movie Render Queue, optional Niagara for subtle pulse effects, Claude Code + Epic Unreal MCP when available.

**Spec:** `docs/superpowers/specs/2026-10-18-unreal-cinematic-opener-design.md`

## Global Constraints

- Presentation collateral only; Unreal must not become a runtime dependency of the XRPL Control Room web app.
- Sequence duration must remain between 5 and 15 seconds and target 16:9 playback.
- Palette stays near-black with Ripple/cyan primary accents, restrained green for trusted/observed status, and muted amber only for caution/unknown.
- No depicted exact geographic placement unless source-backed.
- No depicted transaction path through validators as factual routing.
- Opaque/private infrastructure must never be presented as institutional infrastructure without evidence.
- Definite relationships must be source-supported or explicitly presented as abstract/stylized.
- Final frame must visually align with `/network/topology` from `feature/network-topology-transparency`.
- No gameplay systems, navigable 3D product experience, or production-app code changes are part of this project.

## Review Focus

- **Unreal version/API drift:** scene-build script must fail with a clear prerequisite error rather than partially constructing the scene on an unsupported editor version; covered in Task 1 smoke validation.
- **Missing MCP/editor connection:** all source files and setup instructions remain usable manually; covered in Task 1 README validation.
- **Unsupported topology claims:** the scene manifest must distinguish `observed`, `inferred`, and `unknown` and never generate a solid observed edge from an unknown relationship; covered in Task 2 manifest validation.
- **Reduced legibility from excessive effects:** bloom/particle intensity and node counts remain within the fixed visual budget; covered in Task 3 scene assertions/checklist.
- **Handoff mismatch:** final camera framing and captured UI reference must match the live topology page closely enough for a clean cut; covered in Task 5 comparison/render checklist.

---

## File Structure

- `demo/unreal/xrpl-control-room-cinematic/README.md` — setup, plugin prerequisites, rebuild, render, and handoff instructions.
- `demo/unreal/xrpl-control-room-cinematic/XRPLControlRoomCinematic.uproject` — isolated Unreal project descriptor.
- `demo/unreal/xrpl-control-room-cinematic/Config/DefaultEngine.ini` — minimal project/render defaults.
- `demo/unreal/xrpl-control-room-cinematic/Content/Python/build_cinematic.py` — deterministic editor automation entrypoint.
- `demo/unreal/xrpl-control-room-cinematic/Content/Python/cinematic_spec.py` — fixed timing, palette, actor naming, and camera constants.
- `demo/unreal/xrpl-control-room-cinematic/Content/Python/topology_manifest.py` — evidence-aware abstract node/edge manifest.
- `demo/unreal/xrpl-control-room-cinematic/Content/Python/validate_cinematic.py` — editor-side validation of required actors, sequence, timing, and evidence classes.
- `demo/unreal/xrpl-control-room-cinematic/Media/.gitkeep` — render/still destination placeholder; rendered binaries stay out of normal Git unless explicitly requested.
- `demo/unreal/xrpl-control-room-cinematic/References/topology-handoff.png` — captured reference of the real topology UI when an approved screenshot is available.
- `test/unreal_cinematic_manifest.test.ts` — repository-side static guardrails for truthfulness and fixed shot timing.

### Task 1: Isolated Unreal Project + Reproducible Entry Point

**Files:**
- Create: `demo/unreal/xrpl-control-room-cinematic/XRPLControlRoomCinematic.uproject`
- Create: `demo/unreal/xrpl-control-room-cinematic/Config/DefaultEngine.ini`
- Create: `demo/unreal/xrpl-control-room-cinematic/README.md`
- Create: `demo/unreal/xrpl-control-room-cinematic/Content/Python/cinematic_spec.py`
- Test: `test/unreal_cinematic_manifest.test.ts`

**Interfaces:**
- Consumes: design values from the approved spec.
- Produces: `SHOT_TIMINGS`, `PALETTE`, `SEQUENCE_NAME`, `LEVEL_NAME`, and `OUTPUT_SETTINGS` constants imported by later Python tasks.

- [ ] **Step 1: Write the failing repository-side static test**

Add `test/unreal_cinematic_manifest.test.ts` with assertions that the Unreal project directory exists, the README explicitly says Unreal is presentation-only, and `cinematic_spec.py` defines five ordered shots whose total duration is `>= 5.0` and `<= 15.0` seconds.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL because the Unreal project files/spec constants do not yet exist.

- [ ] **Step 3: Create the minimal Unreal project descriptor and cinematic constants**

Create the four files above. `cinematic_spec.py` must expose exactly:

```python
SHOT_TIMINGS: dict[str, tuple[float, float]]
PALETTE: dict[str, tuple[float, float, float, float]]
SEQUENCE_NAME: str
LEVEL_NAME: str
OUTPUT_SETTINGS: dict[str, object]
```

Use five keys in `SHOT_TIMINGS`: `ledger_signal`, `validators`, `relationships`, `visibility_boundary`, `control_room_handoff`. Keep aggregate duration in the approved 5–15 second range and target 1920×1080.

- [ ] **Step 4: Document prerequisites and graceful no-MCP/manual path**

README must list Unreal 5.x, Python Editor Script Plugin, Sequencer/Movie Render Queue, Epic `ModelContextProtocol` + `AllToolsets` when using MCP, and an alternative manual/editor-Python execution path when MCP is unavailable.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the static cinematic project/spec assertions.

- [ ] **Step 6: Commit**

```bash
git add demo/unreal/xrpl-control-room-cinematic test/unreal_cinematic_manifest.test.ts
git commit -m "feat: scaffold Unreal cinematic opener"
```

### Task 2: Evidence-Aware Topology Manifest

**Files:**
- Create: `demo/unreal/xrpl-control-room-cinematic/Content/Python/topology_manifest.py`
- Modify: `test/unreal_cinematic_manifest.test.ts`

**Interfaces:**
- Consumes: palette/evidence vocabulary from `cinematic_spec.py`.
- Produces: `TopologyNode`, `TopologyEdge`, `NODES`, `EDGES`; `TopologyEdge.evidence` is one of `observed | inferred | unknown`.

- [ ] **Step 1: Extend the failing test with truthfulness assertions**

Assert that the manifest contains all three evidence labels, contains no edge with `evidence == "unknown"` rendered as a definite relationship, and does not contain terms such as `institution`, `bank`, or `private route` in unsupported node/operator labels.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL because `topology_manifest.py` does not exist.

- [ ] **Step 3: Implement the abstract topology manifest**

Define:

```python
@dataclass(frozen=True)
class TopologyNode:
    id: str
    role: str
    trust: str
    visibility: str

@dataclass(frozen=True)
class TopologyEdge:
    source: str
    target: str
    evidence: str
```

Use intentionally abstract validator IDs and layout roles. Unknown/private boundaries are represented as boundary nodes or omissions, not fabricated solid paths.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add demo/unreal/xrpl-control-room-cinematic/Content/Python/topology_manifest.py test/unreal_cinematic_manifest.test.ts
git commit -m "feat: add evidence-aware cinematic topology manifest"
```

### Task 3: Deterministic Scene Builder

**Files:**
- Create: `demo/unreal/xrpl-control-room-cinematic/Content/Python/build_cinematic.py`
- Create: `demo/unreal/xrpl-control-room-cinematic/Content/Python/validate_cinematic.py`
- Modify: `README.md`

**Interfaces:**
- Consumes: `SHOT_TIMINGS`, `PALETTE`, `LEVEL_NAME`, `SEQUENCE_NAME`, `NODES`, `EDGES`.
- Produces: one cinematic level, generated node/edge actors/material instances, one CineCameraActor, one Level Sequence, optional restrained Niagara pulse system, and saved assets with deterministic names.

- [ ] **Step 1: Add a failing editor validation contract**

`validate_cinematic.py` must expose `validate_scene() -> list[str]`, returning an empty list only when the required level sequence, camera, five shot markers/sections, node actors, evidence-class materials, and handoff plane exist. Add repository static assertions that both `build_cinematic.py` and `validate_cinematic.py` expose their expected entrypoints.

- [ ] **Step 2: Run repository test to verify it fails**

Run: `npm test`
Expected: FAIL until both Python files/entrypoints exist.

- [ ] **Step 3: Implement `build_scene() -> None`**

Use Unreal Editor Python APIs to create/reuse assets by deterministic names. The function must be idempotent: rerunning updates/rebuilds its named cinematic assets rather than multiplying actors.

Scene limits:
- near-black world/background;
- abstract sparse globe/grid or arc scaffold;
- restrained emissive node spheres;
- observed edge material = solid cyan;
- inferred edge material = subdued/dashed treatment if present;
- unknown = boundary halo/termination, never a fabricated connecting line;
- no more effects than necessary for the five-shot storyboard.

- [ ] **Step 4: Implement `validate_scene() -> list[str]`**

Return human-readable errors for missing prerequisite assets, missing sequence/camera, wrong total sequence duration, absent evidence treatments, or absent handoff plane.

- [ ] **Step 5: Run repository static tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Run inside Unreal when an editor-capable environment is connected**

Execute `build_cinematic.py`, then `validate_cinematic.py` through Epic MCP or Unreal's Python console.
Expected: `validate_scene()` returns `[]` and the Output Log has no Python exceptions.

- [ ] **Step 7: Commit**

```bash
git add demo/unreal/xrpl-control-room-cinematic/Content/Python README.md test/unreal_cinematic_manifest.test.ts
git commit -m "feat: build reproducible Unreal cinematic scene"
```

### Task 4: Sequencer Storyboard + Camera Motion

**Files:**
- Modify: `demo/unreal/xrpl-control-room-cinematic/Content/Python/build_cinematic.py`
- Modify: `demo/unreal/xrpl-control-room-cinematic/Content/Python/validate_cinematic.py`

**Interfaces:**
- Consumes: scene actors/assets from Task 3.
- Produces: Sequencer tracks/keys implementing all five named shots with the exact timing constants from Task 1.

- [ ] **Step 1: Add failing validation assertions for all five shot ranges**

`validate_scene()` must report errors when any named shot timing differs from `SHOT_TIMINGS`, camera cuts are absent, or the final handoff shot is not last.

- [ ] **Step 2: Run editor validation to verify RED**

Run in Unreal: `validate_scene()`
Expected: errors naming missing shot/camera timing.

- [ ] **Step 3: Implement Sequencer tracks**

Program the sequence in this order:
1. ledger signal reveal;
2. validator reveal;
3. observed relationship reveal;
4. push toward visibility boundary + optional `OBSERVED / INFERRED / UNKNOWN` text;
5. camera acceleration into the UI handoff plane.

Camera movement must be deliberate, with no free-flying loops or game-like orbiting.

- [ ] **Step 4: Run editor validation**

Expected: `validate_scene()` returns `[]` for shot/timing/camera rules.

- [ ] **Step 5: Review effects budget manually**

Confirm no saturated rainbow colors, excessive bloom, noisy city lights, or particles that obscure node/edge hierarchy.

- [ ] **Step 6: Commit**

```bash
git add demo/unreal/xrpl-control-room-cinematic/Content/Python
git commit -m "feat: animate Unreal cinematic storyboard"
```

### Task 5: Real Control Room Handoff Reference

**Files:**
- Create when available: `demo/unreal/xrpl-control-room-cinematic/References/topology-handoff.png`
- Modify: `build_cinematic.py`
- Modify: `README.md`

**Interfaces:**
- Consumes: approved visual state of `/network/topology` from the preview deployment.
- Produces: final compositor/handoff plane that aligns with the real web UI composition.

- [ ] **Step 1: Capture the approved topology frame**

Use the preview branch `/network/topology` at 1920×1080 or equivalent 16:9 viewport after the web preview is confirmed healthy. Do not use a mockup if a real app capture is available.

- [ ] **Step 2: Add the captured frame to the Unreal handoff material**

Update `build_scene()` to create/update a UI handoff plane/material that uses `References/topology-handoff.png`.

- [ ] **Step 3: Match final framing**

Adjust the final CineCamera transform so the last Unreal frame closely matches the web screenshot framing and the presenter can cut directly to the live app without a large composition jump.

- [ ] **Step 4: Verify handoff manually**

Play the cinematic then immediately show the live `/network/topology` page at the same presentation aspect ratio. Expected: orientation, dominant cyan geometry, and central visual mass feel continuous; no fake data appears in the cinematic frame.

- [ ] **Step 5: Commit source/reference changes**

```bash
git add demo/unreal/xrpl-control-room-cinematic/References demo/unreal/xrpl-control-room-cinematic/Content/Python/build_cinematic.py demo/unreal/xrpl-control-room-cinematic/README.md
git commit -m "feat: align cinematic handoff with topology UI"
```

### Task 6: Render + Final Verification

**Files:**
- Create: `demo/unreal/xrpl-control-room-cinematic/Media/.gitkeep`
- Modify: `README.md`
- Render locally: `demo/unreal/xrpl-control-room-cinematic/Media/xrpl-control-room-opener.mp4` (do not commit by default)
- Optional local render: `demo/unreal/xrpl-control-room-cinematic/Media/xrpl-control-room-opener-still.png`

**Interfaces:**
- Consumes: validated Level Sequence and handoff reference.
- Produces: presentation-ready 1920×1080 MP4 and optional still.

- [ ] **Step 1: Configure Movie Render Queue**

Render the final Level Sequence at 1920×1080, 30 fps unless presentation requirements dictate 60 fps, using a standard H.264/MP4-compatible output path or image sequence followed by local encoding.

- [ ] **Step 2: Run `validate_scene()` immediately before render**

Expected: `[]`.

- [ ] **Step 3: Render the opener**

Expected runtime: 5–15 seconds; no dropped/missing shot; final frame holds long enough for a clean live-demo cut.

- [ ] **Step 4: Review truthfulness and presentation checklist**

Confirm:
- no exact transaction route is presented as fact;
- no unknown/private node is labeled institutional;
- observed/inferred/unknown treatments are visually distinct;
- no unsupported geography is implied;
- final handoff matches the actual topology UI;
- video plays locally without network dependency.

- [ ] **Step 5: Run repo regression checks**

Run:
```bash
npm test
npm run type-check
npm run build
```
Expected: all pass; Unreal collateral has not broken the web app.

- [ ] **Step 6: Commit documentation/source only**

```bash
git add demo/unreal/xrpl-control-room-cinematic/README.md demo/unreal/xrpl-control-room-cinematic/Media/.gitkeep
git commit -m "docs: finalize Unreal cinematic render workflow"
```

Keep rendered MP4/still outside normal Git unless explicitly approved for repository storage.
