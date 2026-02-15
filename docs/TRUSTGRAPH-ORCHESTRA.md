# TrustGraph + XRPL Orchestra Integration

TrustGraph is the **XRPL Graph Context Agent** (Ledger Knowledge Agent) in the XRPL Orchestra. It provides graph-backed, relational context for accounts, trust lines, payments, paths, Permissioned Domains, and anomalies.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  XRPL Orchestra (CrewAI / custom router)                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Anomaly Detection   │  │ Other agents (M&A, Compliance…)   │ │
│  │ Agent               │  │                                   │ │
│  └──────────┬──────────┘  └────────────────┬─────────────────┘ │
│             │ delegate / tool call          │                    │
│             ▼                               ▼                    │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ XRPL Graph Context Agent (TrustGraph wrapper)                 ││
│  │ Tools: get_related_accounts, trace_payment_flow,              ││
│  │        summarize_domain_activity, analyze_cluster              ││
│  └──────────────────────────────┬───────────────────────────────┘│
└──────────────────────────────────┼───────────────────────────────┘
                                    │ REST
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│  TrustGraph API (FastAPI)                                          │
│  /query (NL) | /graph/related_accounts | trace_payment_flow | ...   │
│  /ingest/tx | /ingest/batch                                         │
└──────────────────────────────┬────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────────┐    ┌─────────────┐
│ In-memory     │    │ trustgraph-ingest    │    │ Optional    │
│ graph (NetworkX)   │ XRPL WebSocket       │    │ Neo4j       │
│               │    │ → /ingest/batch      │    │             │
└───────────────┘    └─────────────────────┘    └─────────────┘
```

## 1. Deploy TrustGraph (Docker)

From repo root:

```bash
# TrustGraph API + ingest worker (no Neo4j)
docker-compose -f docker-compose.override.yml up -d trustgraph trustgraph-ingest

# Optional: persistent graph (uncomment neo4j in override and set NEO4J_URI in trustgraph env)
# docker-compose -f docker-compose.override.yml up -d trustgraph trustgraph-ingest neo4j
```

- **TrustGraph API**: http://localhost:8000 (health: http://localhost:8000/health, docs: http://localhost:8000/docs)
- **trustgraph-ingest**: subscribes to XRPL `transactions` stream, batches and POSTs to `http://trustgraph:8000/ingest/batch` so the graph stays current.

Env (optional):

- `XRPL_WS_URL` – default `wss://s1.ripple.com`
- `TRUSTGRAPH_URL` – for ingest container, default `http://trustgraph:8000`
- `INGEST_BATCH_SIZE` – default 50

## 2. Python wrapper agent (ReAct-style tools)

Location: `orchestra-python/`

- **xrpl_graph_context_agent.py**: `TrustGraphClient` + tools `get_related_accounts`, `trace_payment_flow`, `summarize_domain_activity`, `analyze_cluster`. Use from other agents via MCP, REST, or direct calls.
- **crew_config_example.py**: CrewAI-style `crew.add_agent()` example and `ORCHESTRA_AGENT_CONFIG` for the Graph Context Agent.
- **custom_router_example.py**: Custom router that registers the Graph Context Agent and Anomaly Detection; workflow: Anomaly Agent → calls Graph Agent → `analyze_cluster(account)` → gets summary → decides alert.

```bash
cd orchestra-python
pip install -r requirements.txt
export TRUSTGRAPH_URL=http://localhost:8000
python custom_router_example.py   # run example workflow
```

## 3. Register in orchestra / crew

- **CrewAI**: Use `crew_config_example.py` – create an Agent with the TrustGraph tools and add it to the crew; give Anomaly Detection Agent `allow_delegation=True` and a Task that uses the graph agent’s output.
- **Custom router**: Use `custom_router_example.register_agents(router)` – adds `agent_xrpl_graph_context` and `agent_anomaly_detection` and tool callables.

## 4. Example workflow: Anomaly → Graph Context → Alert

1. Anomaly Detection Agent receives “analyze cluster around rHb9CJAWyB4...”.
2. It calls the XRPL Graph Context Agent (TrustGraph) via tool `analyze_cluster(seed_account="rHb9...", radius=2)`.
3. TrustGraph returns cluster summary (nodes, edges, accounts).
4. Anomaly Agent applies heuristics (e.g. size/density) and returns **Alert: Yes/No** and recommendation.

See `custom_router_example.route_anomaly_detection(account)` for the concrete flow.

## 5. Real-time graph updates

- **trustgraph-ingest** subscribes to the XRPL `transactions` stream and POSTs each Payment/TrustSet to TrustGraph’s `/ingest/batch`.
- TrustGraph’s `ingest_tx()` adds nodes/edges so queries reflect recent ledger activity. For production scale, switch the graph store to Neo4j (uncomment in compose and set `NEO4J_URI`).

## API summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Liveness |
| `/query` | POST | NL query (GraphRAG-style; routes to tools) |
| `/graph/related_accounts` | POST | Get related accounts |
| `/graph/trace_payment_flow` | POST | Trace path between two accounts |
| `/graph/summarize_domain_activity` | POST | Domain summary |
| `/graph/analyze_cluster` | POST | Cluster around seed account |
| `/ingest/tx` | POST | Ingest one transaction |
| `/ingest/batch` | POST | Ingest many transactions |
