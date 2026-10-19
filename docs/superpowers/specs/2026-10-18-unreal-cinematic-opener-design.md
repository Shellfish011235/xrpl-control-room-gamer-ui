# XRPL Control Room Unreal Cinematic Opener — Design

**Date:** 2026-10-18
**Branch:** `feature/network-topology-transparency`
**Status:** creative direction approved in chat; written-spec review pending

## Purpose
Create a short cinematic opener for the XRPL Control Room hackathon/demo presentation. The asset should introduce the product story visually, then hand off cleanly to the real web app. It is presentation collateral only and must not become a runtime dependency of the production dashboard.

## Success Criteria
1. 5–15 second cinematic sequence, designed primarily for 16:9 presentation playback.
2. Visual language matches XRPL Control Room: dark, Ripple-blue/cyan, restrained cyberpunk, low-noise.
3. Sequence communicates validator trust, topology visibility, and explicit observability boundaries without implying unsupported routing facts.
4. Final shot transitions visually into the real Control Room UI so the live demo feels continuous.
5. No fake geographic transaction-path claim.
6. No production web dependency on Unreal Engine.
7. Render can be exported as MP4 and played locally or embedded in presentation media.

## Storyboard

### Shot 1 — Darkness / Ledger Signal
- Nearly black environment.
- Thin cyan pulse forms a sparse globe/grid silhouette.
- No busy city-light texture.
- Duration: ~1.0–1.5 s.

### Shot 2 — Validators Appear
- Validator nodes emerge as restrained cyan points.
- Trusted-list context appears as a small subset with a green/cyan ring treatment.
- Nodes remain abstract; no implication that every physical location is known.
- Duration: ~1.5–2.0 s.

### Shot 3 — Observable Relationships
- Supported relationships illuminate progressively.
- Observed edges: solid, bright but thin.
- Inferred edges: dashed/subdued if used at all.
- Unknown/private boundaries: fade into soft dark halos rather than being connected with invented lines.
- Duration: ~2.0–3.0 s.

### Shot 4 — Visibility Boundary
- Camera pushes toward one network cluster.
- Some nodes/edges remain clearly visible while others terminate at an explicit visibility boundary.
- Brief text treatment may appear: `OBSERVED / INFERRED / UNKNOWN`.
- Duration: ~1.5–2.0 s.

### Shot 5 — Control Room Handoff
- Camera accelerates through the network cluster.
- Network geometry resolves into the layout framing of the actual XRPL Control Room topology screen.
- End on a frame composition that visually matches the live web app so presenter can cut directly to the real demo.
- Duration: ~1.5–2.5 s.

## Visual System
- Palette: near-black background, Ripple/cyan primary accents, restrained green for trusted/observed status, muted amber only for caution/unknown if needed.
- Avoid saturated rainbow node colors.
- Emissive materials should be soft, not bloom-heavy.
- Camera motion should be deliberate and cinematic, not game-like.
- No free-flying camera loops or excessive parallax.
- Motion should reinforce hierarchy: reveal → focus → handoff.

## Truthfulness Rules
- Do not depict a transaction moving through a specific validator path as fact.
- Do not imply opaque/private infrastructure is institutional infrastructure.
- Do not present geographic placement as exact unless source-backed.
- Any relationship shown as definite must correspond to supported topology evidence or be explicitly abstract/stylized.

## Unreal Architecture
Create a small, isolated Unreal project or demo level with:
- one cinematic level
- Sequencer timeline for all camera and reveal timing
- Niagara only for subtle pulses/particles if useful
- simple emissive materials for nodes/edges
- procedural or scripted network layout where practical
- a final compositing plane or UI-matched frame for handoff

No gameplay systems are required.

## Deliverables
- Unreal project/level source
- Sequencer timeline
- rendered MP4 (16:9, presentation-ready)
- optional still frame for slide/deck use
- README with render instructions and shot timing

## Integration With Existing Work
- Keep this asset separate from the web app runtime.
- It may live under a demo/media directory or a separate Unreal project repository.
- The final handoff frame should visually match `/network/topology` from the preview branch.
- Changes to the web app are out of scope unless needed solely to capture the handoff frame.

## Current Constraint
The connected Windows Desktop Commander device is currently offline, and there is no Unreal Engine tool/plugin connected in this ChatGPT session. Therefore the scene cannot be instantiated or rendered inside Unreal until an Unreal-capable environment is connected. The design and implementation plan can be completed now; editor execution must wait for an available Unreal environment.

## Non-Goals
- Rebuild XRPL Control Room in Unreal.
- Replace Cytoscape/GSAP in the web app.
- Create a navigable 3D product experience.
- Add unsupported topology relationships for visual drama.
- Turn the cinematic into a production application dependency.
