"""
Natural-language query endpoint (GraphRAG-style). In production, wire to an LLM that uses graph tools.
"""
import re
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()

# XRPL account pattern (r + base58)
XRPL_ACCOUNT_RE = re.compile(r"\br([1-9A-HJ-NP-Za-km-z]{24,34})\b")


class QueryInput(BaseModel):
    question: str
    context_accounts: list[str] = []


def _extract_accounts(text: str) -> list[str]:
    return XRPL_ACCOUNT_RE.findall(text)


@router.post("")
async def nl_query(request: Request, body: QueryInput):
    graph = request.app.state.graph
    q = body.question.lower()
    ctx = body.context_accounts or _extract_accounts(body.question)
    # Simple keyword routing; replace with LLM + tool use in production
    if "cluster" in q or "around" in q:
        for part in ctx or _extract_accounts(q):
            acc = part.strip() if part.startswith("r") else ("r" + part)
            if len(acc) >= 25:
                out = graph.analyze_cluster(acc, radius=2)
                return {"query": body.question, "result": out, "tool_used": "analyze_cluster"}
    if "related" in q or "neighbor" in q:
        for part in ctx or _extract_accounts(q):
            acc = part.strip() if part.startswith("r") else ("r" + part)
            if len(acc) >= 25:
                out = graph.get_related_accounts(acc, depth=2)
                return {"query": body.question, "result": out, "tool_used": "get_related_accounts"}
    if "trace" in q or "flow" in q or "path" in q:
        if len(ctx) >= 2:
            out = graph.trace_payment_flow(ctx[0], ctx[1], max_hops=5)
            return {"query": body.question, "result": out, "tool_used": "trace_payment_flow"}
    if "domain" in q:
        for part in q.split():
            if "." in part and not part.startswith("r"):
                out = graph.summarize_domain_activity(part.strip())
                return {"query": body.question, "result": out, "tool_used": "summarize_domain_activity"}
    return {"query": body.question, "result": {"message": "Specify account(s) or use context_accounts for graph queries."}}
