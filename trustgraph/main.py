"""
TrustGraph API – XRPL Graph Context / Ledger Knowledge Agent backend.
GraphRAG-style queries: accounts, trust lines, payments, paths, domains, anomalies.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
import os

from app.graph_store import GraphStore
from app.routers import query, graph, ingest


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.graph = GraphStore()
    yield
    # optional: persist on shutdown
    if hasattr(app.state.graph, "close"):
        app.state.graph.close()


app = FastAPI(title="TrustGraph", description="XRPL Graph Context Agent API", version="0.1.0", lifespan=lifespan)

app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(graph.router, prefix="/graph", tags=["graph"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "trustgraph"}


@app.get("/")
def root():
    return {"service": "TrustGraph", "docs": "/docs", "health": "/health"}
