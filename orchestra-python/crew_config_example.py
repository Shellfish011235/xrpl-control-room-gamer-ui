"""
Example: Register TrustGraph as "XRPL Graph Context Agent" in a CrewAI-style crew.
Other agents (e.g. Anomaly Detection) can delegate to this agent via tasks/tools.
Run: pip install crewai crewai-tools  (optional); then use this as reference.
"""
from __future__ import annotations

import os
from typing import Optional

# TrustGraph wrapper (same package or relative import)
from xrpl_graph_context_agent import TrustGraphClient, TRUSTGRAPH_TOOLS, analyze_cluster, get_related_accounts

TRUSTGRAPH_URL = os.environ.get("TRUSTGRAPH_URL", "http://localhost:8000")

# ---------- CrewAI-style registration (pseudo-code; adapt to your CrewAI version) ----------
#
# from crewai import Agent, Task, Crew
# from crewai_tools import tool
#
# # 1) Wrap TrustGraph calls as CrewAI tools
# @tool("Get related XRPL accounts")
# def tool_get_related_accounts(account: str, depth: int = 2) -> str:
#     out = get_related_accounts(account, depth=depth, client=TrustGraphClient(TRUSTGRAPH_URL))
#     return str(out)
#
# @tool("Analyze cluster around XRPL account")
# def tool_analyze_cluster(seed_account: str, radius: int = 2) -> str:
#     out = analyze_cluster(seed_account, radius=radius, client=TrustGraphClient(TRUSTGRAPH_URL))
#     return str(out)
#
# # 2) Create the Ledger Knowledge Agent
# xrpl_graph_agent = Agent(
#     role="XRPL Graph Context Agent",
#     goal="Provide grounded, relational context and GraphRAG-powered answers for XRPL queries (accounts, trust lines, payments, paths, domains, anomalies).",
#     backstory="You are the ledger knowledge specialist. Other agents ask you for graph context.",
#     tools=[tool_get_related_accounts, tool_analyze_cluster],
#     allow_delegation=False,
# )
#
# # 3) Anomaly Detection Agent that can call the graph
# anomaly_agent = Agent(
#     role="Anomaly Detection Agent",
#     goal="Detect anomalous account or transaction patterns on XRPL and alert.",
#     backstory="You use the XRPL Graph Context Agent to analyze clusters and flows.",
#     tools=[],  # or give it tools that call graph agent via task
#     allow_delegation=True,  # so it can delegate to xrpl_graph_agent
# )
#
# # 4) Task: analyze cluster and decide alert
# task_analyze = Task(
#     description="Analyze the graph cluster around account rHb9CJAWyB4... and summarize; decide if we should raise an alert.",
#     agent=xrpl_graph_agent,
#     expected_output="Structured summary and recommendation (alert / no alert).",
# )
# task_decide = Task(
#     description="Using the cluster summary, decide: alert or no alert. Justify briefly.",
#     agent=anomaly_agent,
#     context=[task_analyze],
#     expected_output="Alert: Yes/No. Reason: ...",
# )
#
# crew = Crew(agents=[xrpl_graph_agent, anomaly_agent], tasks=[task_analyze, task_decide])
# result = crew.kickoff()

# ---------- Export config for custom router (no CrewAI dependency) ----------

ORCHESTRA_AGENT_CONFIG = {
    "xrpl_graph_context_agent": {
        "id": "agent_xrpl_graph_context",
        "name": "XRPL Graph Context Agent",
        "role": "Ledger Knowledge Agent",
        "goal": "Provide grounded, relational context and GraphRAG-powered answers for XRPL-specific queries (accounts, trust lines, payments, paths, Permissioned Domains, anomalies, compliance tracing).",
        "capabilities": [
            "get_related_accounts",
            "trace_payment_flow",
            "summarize_domain_activity",
            "analyze_cluster",
        ],
        "base_url": TRUSTGRAPH_URL,
        "tools": TRUSTGRAPH_TOOLS,
    },
}
