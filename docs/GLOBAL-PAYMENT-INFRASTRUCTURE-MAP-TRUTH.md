# What this map must never pretend to know

The **Global Payment Infrastructure** map in the Network tab is a topology visualization of routing hubs, settlement rails, and connected assets. To avoid overclaiming and to keep the dashboard honest, the following rules are enforced in data and UI.

## Never imply or display as fact

1. **Payment hub relationships are not all directly observed.**  
   Many links (e.g. Mojaloop ↔ Project Nexus, or “potential” corridors) are **inferred** or **mock**. The map must label them with observation class (observed / derived / inferred / synthetic / unknown) and use line style (solid / dashed / dotted) and opacity (confidence) so users can see certainty at a glance.

2. **Project Nexus does not run on XRPL.**  
   Project Nexus is a BIS/central bank interoperability concept. The map must never imply that Nexus is an XRPL product or that it “runs on” or “uses” XRPL. Descriptions and tooltips must state clearly that it is an infrastructure concept with no implied XRPL integration.

3. **Mojaloop does not require XRP.**  
   Mojaloop is an open-source interoperability layer for payment switches. The map and copy must never imply that Mojaloop requires XRP or any specific crypto asset.

4. **Settlement rails ≠ routing hubs.**  
   Do not conflate:
   - **Settlement rails** (e.g. XRPL, FedNow, Bitcoin) with  
   - **Routing / interoperability hubs** (e.g. SWIFT, Mojaloop, national switches).  
   Node types and legends must keep these distinct.

5. **Private flows are not confirmed public knowledge.**  
   Do not show private or proprietary payment flows as if they were confirmed public data. If a relationship is inferred from press, announcements, or indirect sources, it must be labeled **inferred** or **mock** and never as **observed** unless there is a clear primary source.

6. **Mock and observed data must not be mixed without labels.**  
   Every node and edge has `observationClass` and, where applicable, `isMock`. The UI must:
   - Show confidence/observation badges on selection.
   - Use solid/dashed/dotted lines and opacity by observation class and confidence.
   - Display a clear disclaimer that mock and inferred data are present and should not be treated as authoritative.

## Implementation

- **Types:** `observationClass` and `confidence` (and optional `provenance`, `isMock`) are required on all nodes and edges.
- **Visual rules:** Reuse `telemetry-visual-rules` (solid = observed, dashed = inferred, dotted = synthetic/mock; opacity = confidence).
- **Copy:** Descriptions for Project Nexus, Mojaloop, and similar nodes explicitly state “no implied XRPL integration” or “does not require XRP” where relevant.

This file is the single source of “hard truth” for the Global Payment Infrastructure map. When adding or changing data or UI, keep this list in mind and do not introduce claims that violate it.
