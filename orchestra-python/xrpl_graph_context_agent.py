"""
XRPL Graph Context Agent (TrustGraph wrapper) – Ledger Knowledge Agent for XRPL Orchestra.
Connects to TrustGraph API, exposes ReAct-style tools for other agents (MCP, REST, or direct calls).
"""
from __future__ import annotations

import httpx
from typing import Any, Optional
from pydantic import BaseModel, Field


TRUSTGRAPH_BASE_URL = "http://localhost:8000"  # override via env in production


# ---------- Tool input schemas (ReAct / MCP compatible) ----------

class GetRelatedAccountsInput(BaseModel):
    """Input for get_related_accounts."""
    account: str = Field(description="XRPL account address (e.g. rHb9CJAWyB4...)")
    depth: int = Field(default=2, description="Graph traversal depth (1-3)")
    edge_types: Optional[list[str]] = Field(default=None, description="Filter: trust, payment, or both")


class TracePaymentFlowInput(BaseModel):
    """Input for trace_payment_flow."""
    from_account: str = Field(description="Sender XRPL address")
    to_account: str = Field(description="Destination XRPL address")
    max_hops: int = Field(default=5, description="Max path length")


class SummarizeDomainActivityInput(BaseModel):
    """Input for summarize_domain_activity."""
    domain: str = Field(description="Permissioned domain (e.g. example.com)")


class AnalyzeClusterInput(BaseModel):
    """Input for analyze_cluster."""
    seed_account: str = Field(description="Seed account (e.g. rHb9CJAWyB4...)")
    radius: int = Field(default=2, description="Neighborhood radius (1-3)")


# ---------- TrustGraph client (calls API) ----------

class TrustGraphClient:
    def __init__(self, base_url: str = TRUSTGRAPH_BASE_URL, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _post(self, path: str, json: dict) -> dict:
        with httpx.Client(timeout=self.timeout) as client:
            r = client.post(f"{self.base_url}{path}", json=json)
            r.raise_for_status()
            return r.json()

    def get_related_accounts(self, account: str, depth: int = 2, edge_types: Optional[list[str]] = None) -> dict:
        return self._post("/graph/related_accounts", {
            "account": account,
            "depth": depth,
            "edge_types": edge_types,
        })

    def trace_payment_flow(self, from_account: str, to_account: str, max_hops: int = 5) -> dict:
        return self._post("/graph/trace_payment_flow", {
            "from_account": from_account,
            "to_account": to_account,
            "max_hops": max_hops,
        })

    def summarize_domain_activity(self, domain: str) -> dict:
        return self._post("/graph/summarize_domain_activity", {"domain": domain})

    def analyze_cluster(self, seed_account: str, radius: int = 2) -> dict:
        return self._post("/graph/analyze_cluster", {
            "seed_account": seed_account,
            "radius": radius,
        })

    def nl_query(self, question: str, context_accounts: Optional[list[str]] = None) -> dict:
        return self._post("/query", {
            "question": question,
            "context_accounts": context_accounts or [],
        })


# ---------- ReAct-style tool definitions (for CrewAI / LangChain / custom router) ----------

def get_related_accounts(account: str, depth: int = 2, edge_types: Optional[list[str]] = None, client: Optional[TrustGraphClient] = None) -> dict:
    """Get accounts related to the given XRPL account via trust lines and payments."""
    c = client or TrustGraphClient()
    return c.get_related_accounts(account, depth=depth, edge_types=edge_types)


def trace_payment_flow(from_account: str, to_account: str, max_hops: int = 5, client: Optional[TrustGraphClient] = None) -> dict:
    """Trace a payment path between two XRPL accounts."""
    c = client or TrustGraphClient()
    return c.trace_payment_flow(from_account, to_account, max_hops=max_hops)


def summarize_domain_activity(domain: str, client: Optional[TrustGraphClient] = None) -> dict:
    """Summarize activity for a Permissioned Domain (accounts, edges)."""
    c = client or TrustGraphClient()
    return c.summarize_domain_activity(domain)


def analyze_cluster(seed_account: str, radius: int = 2, client: Optional[TrustGraphClient] = None) -> dict:
    """Analyze the graph cluster around an account (anomaly detection, context)."""
    c = client or TrustGraphClient()
    return c.analyze_cluster(seed_account, radius=radius)


# Tool list for registration (name, description, input schema)
TRUSTGRAPH_TOOLS = [
    {
        "name": "get_related_accounts",
        "description": "Get XRPL accounts related to the given account via trust lines and payments. Use for context or neighbor analysis.",
        "input_schema": GetRelatedAccountsInput.model_json_schema(),
        "fn": get_related_accounts,
    },
    {
        "name": "trace_payment_flow",
        "description": "Trace payment path between two XRPL accounts. Use for compliance or flow analysis.",
        "input_schema": TracePaymentFlowInput.model_json_schema(),
        "fn": trace_payment_flow,
    },
    {
        "name": "summarize_domain_activity",
        "description": "Summarize activity for a Permissioned Domain (accounts, link counts).",
        "input_schema": SummarizeDomainActivityInput.model_json_schema(),
        "fn": summarize_domain_activity,
    },
    {
        "name": "analyze_cluster",
        "description": "Analyze graph cluster around an account. Use for anomaly detection or ledger context.",
        "input_schema": AnalyzeClusterInput.model_json_schema(),
        "fn": analyze_cluster,
    },
]
