"""
Example: Custom agent router that includes TrustGraph (XRPL Graph Context Agent).
Anomaly Detection Agent → calls XRPL Graph Context Agent → analyze cluster → gets summary → decides alert.
"""
from __future__ import annotations

import os
from typing import Any, Callable

from xrpl_graph_context_agent import TrustGraphClient, analyze_cluster, get_related_accounts

TRUSTGRAPH_URL = os.environ.get("TRUSTGRAPH_URL", "http://localhost:8000")
client = TrustGraphClient(TRUSTGRAPH_URL)


def route_anomaly_detection(account: str, radius: int = 2) -> dict:
    """
    Workflow: Anomaly Detection Agent calls XRPL Graph Context Agent to analyze cluster,
    then decides whether to alert based on cluster size/activity.
    """
    # Step 1: Call Graph Context Agent (TrustGraph)
    cluster = analyze_cluster(account, radius=radius, client=client)
    if cluster.get("nodes", 0) == 0:
        return {
            "alert": False,
            "reason": "Account not in graph or no cluster",
            "cluster_summary": cluster,
        }

    # Step 2: Simple heuristic (replace with your own logic / ML)
    nodes = cluster.get("nodes", 0)
    edges = cluster.get("edges", 0)
    density = edges / max(nodes * (nodes - 1) / 2, 1)
    # Example: alert if very dense cluster (possible hub) or very large
    alert = nodes > 50 or (nodes > 10 and density > 0.3)

    return {
        "alert": alert,
        "reason": f"Cluster: {nodes} nodes, {edges} edges; density={density:.2f}. {'High connectivity or size.' if alert else 'Within normal range.'}",
        "cluster_summary": cluster,
        "recommendation": "Raise alert for review." if alert else "No action needed.",
    }


def register_agents(router: dict[str, Any]) -> dict[str, Any]:
    """
    Register XRPL Graph Context Agent and Anomaly Detection in a custom router.
    router["agents"] = list of agent configs
    router["tools"] = name -> callable
    """
    router.setdefault("agents", [])
    router.setdefault("tools", {})

    router["agents"].append({
        "id": "agent_xrpl_graph_context",
        "name": "XRPL Graph Context Agent",
        "role": "Ledger Knowledge Agent",
        "endpoint": f"{TRUSTGRAPH_URL}/query",
        "graph_endpoints": {
            "get_related_accounts": f"{TRUSTGRAPH_URL}/graph/related_accounts",
            "trace_payment_flow": f"{TRUSTGRAPH_URL}/graph/trace_payment_flow",
            "summarize_domain_activity": f"{TRUSTGRAPH_URL}/graph/summarize_domain_activity",
            "analyze_cluster": f"{TRUSTGRAPH_URL}/graph/analyze_cluster",
        },
    })

    router["agents"].append({
        "id": "agent_anomaly_detection",
        "name": "Anomaly Detection Agent",
        "role": "Detect anomalous account/transaction patterns",
        "delegates_to": ["agent_xrpl_graph_context"],
        "entrypoint": "route_anomaly_detection",
    })

    router["tools"]["analyze_cluster_around_account"] = lambda account, radius=2: analyze_cluster(account, radius=radius, client=client)
    router["tools"]["get_related_accounts"] = lambda account, depth=2: get_related_accounts(account, depth=depth, client=client)
    router["tools"]["anomaly_check"] = route_anomaly_detection

    return router


# Example usage
if __name__ == "__main__":
    # Simulated: analyze cluster around an account and get alert decision
    result = route_anomaly_detection("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", radius=2)
    print(result)

    router = {}
    register_agents(router)
    print("Registered agents:", [a["name"] for a in router["agents"]])
