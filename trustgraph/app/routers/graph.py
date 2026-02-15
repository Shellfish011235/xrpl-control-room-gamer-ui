"""
Structured graph tools for other agents: get_related_accounts, trace_payment_flow, summarize_domain_activity, analyze_cluster.
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RelatedInput(BaseModel):
    account: str
    depth: int = 2
    edge_types: Optional[list[str]] = None


class TraceInput(BaseModel):
    from_account: str
    to_account: str
    max_hops: int = 5


class DomainInput(BaseModel):
    domain: str


class ClusterInput(BaseModel):
    seed_account: str
    radius: int = 2


@router.post("/related_accounts")
async def get_related_accounts(request: Request, body: RelatedInput):
    out = request.app.state.graph.get_related_accounts(body.account, depth=body.depth, edge_types=body.edge_types)
    return out


@router.post("/trace_payment_flow")
async def trace_payment_flow(request: Request, body: TraceInput):
    out = request.app.state.graph.trace_payment_flow(body.from_account, body.to_account, max_hops=body.max_hops)
    return out


@router.post("/summarize_domain_activity")
async def summarize_domain_activity(request: Request, body: DomainInput):
    out = request.app.state.graph.summarize_domain_activity(body.domain)
    return out


@router.post("/analyze_cluster")
async def analyze_cluster(request: Request, body: ClusterInput):
    out = request.app.state.graph.analyze_cluster(body.seed_account, radius=body.radius)
    return out
