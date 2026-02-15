"""
Incremental graph ingest: accept XRPL transactions (from WebSocket or batch job) and update the graph.
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Any, Optional

router = APIRouter()


class IngestTx(BaseModel):
    hash: Optional[str] = None
    ledger_index: Optional[int] = None
    Account: Optional[str] = None
    Destination: Optional[str] = None
    Amount: Optional[Any] = None
    TransactionType: str
    LimitAmount: Optional[dict] = None


class IngestBatch(BaseModel):
    transactions: list[dict]


@router.post("/tx")
async def ingest_one(request: Request, body: IngestTx):
    tx = body.model_dump()
    tx["hash"] = tx.get("hash") or ""
    tx["ledger_index"] = tx.get("ledger_index") or 0
    request.app.state.graph.ingest_tx(tx)
    return {"ok": True, "hash": tx.get("hash")}


@router.post("/batch")
async def ingest_batch(request: Request, body: IngestBatch):
    graph = request.app.state.graph
    for tx in body.transactions:
        graph.ingest_tx(tx)
    return {"ok": True, "count": len(body.transactions)}
