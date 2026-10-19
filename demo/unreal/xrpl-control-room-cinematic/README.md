# XRPL Control Room Cinematic Opener

This Unreal project is **presentation-only** collateral for the XRPL Control Room demo. It must not become a runtime dependency of the production web app.

## Purpose

Build a short 16:9 cinematic opener that introduces validator trust, network observability, and explicit visibility boundaries, then hands off visually to the real `/network/topology` screen.

## Prerequisites

- Unreal Engine 5.x
- Python Editor Script Plugin
- Sequencer Scripting
- Movie Render Queue / Movie Render Pipeline
- Optional for agent-driven editor control: Epic `ModelContextProtocol` and `AllToolsets` plugins with the MCP server running

## Rebuild Path

1. Open `XRPLControlRoomCinematic.uproject` in Unreal Editor.
2. Ensure the Python, Sequencer, and Movie Render Pipeline plugins are enabled.
3. If using Claude Code/Epic MCP, also enable `ModelContextProtocol` and `AllToolsets`, then start the MCP server from the editor.
4. Run `Content/Python/build_cinematic.py` through Unreal's Python console or through the MCP-exposed Python/editor tools.
5. Run `Content/Python/validate_cinematic.py` and require `validate_scene()` to return an empty list before rendering.

## Manual / No-MCP Path

MCP is optional. If no MCP connection is available, open Unreal Editor normally and execute the Python scripts from the Unreal Python console. The source files in this directory are the reproducible source of truth; no opaque agent-only session is required.

## Truthfulness Rules

- Do not depict an exact transaction route through validators as fact.
- Do not label opaque/private infrastructure as an institution without evidence.
- Do not imply exact geography unless it is source-backed.
- Observed, inferred, and unknown relationships must remain visually distinct.
- Unknown/private boundaries terminate visibility; they are not invented solid paths.

## Render Target

- 1920×1080
- 30 fps default
- 5–15 seconds total
- Near-black background with cyan/Ripple-blue accents
- Restrained green for trusted/observed status
- Muted amber only for caution/unknown

Rendered binaries belong in `Media/` and should not be committed by default.

## Handoff

The final shot should visually align with the real XRPL Control Room topology view on the preview branch. When a verified 16:9 capture is available, place it at `References/topology-handoff.png` and rebuild the scene so the final camera framing resolves into that composition.
