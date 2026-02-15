"""
In-memory graph store for XRPL entities: accounts, trust lines, payments, domains.
In production, swap for Neo4j or similar via NEO4J_URI.
"""
import networkx as nx
from typing import Any, Optional
from datetime import datetime


class GraphStore:
    def __init__(self):
        self.g = nx.MultiDiGraph()
        self._meta = {}

    def add_account(self, account: str, attrs: Optional[dict] = None) -> None:
        self.g.add_node(account, type="account", **(attrs or {}))
        self._meta["last_updated"] = datetime.utcnow().isoformat()

    def add_trust_line(self, account: str, issuer: str, currency: str, limit: str, balance: str = "0") -> None:
        self.g.add_node(account, type="account")
        self.g.add_node(issuer, type="account")
        self.g.add_edge(account, issuer, type="trust", currency=currency, limit=limit, balance=balance)

    def add_payment(self, from_account: str, to_account: str, amount: str, tx_hash: str, ledger_index: int) -> None:
        self.g.add_node(from_account, type="account")
        self.g.add_node(to_account, type="account")
        self.g.add_edge(from_account, to_account, type="payment", amount=amount, tx_hash=tx_hash, ledger_index=ledger_index)

    def add_domain(self, account: str, domain: str) -> None:
        if "domains" not in self._meta:
            self._meta["domains"] = {}
        self._meta["domains"][account] = domain
        self.g.add_node(account, type="account", domain=domain)

    def get_related_accounts(self, account: str, depth: int = 2, edge_types: Optional[list] = None) -> dict:
        if account not in self.g:
            return {"account": account, "related": [], "message": "Account not in graph"}
        edge_types = edge_types or ["trust", "payment"]
        sub = nx.ego_graph(self.g.to_undirected(), account, radius=depth)
        related = []
        for n in sub.nodes():
            if n == account:
                continue
            edges = list(self.g.edges(account, n, keys=True)) + list(self.g.edges(n, account, keys=True))
            for e in edges:
                data = self.g.edges[e]
                if data.get("type") in edge_types:
                    related.append({"account": n, "type": data.get("type"), **{k: v for k, v in data.items() if k != "type"}})
                    break
        return {"account": account, "depth": depth, "related": related[:100]}

    def trace_payment_flow(self, from_account: str, to_account: str, max_hops: int = 5) -> dict:
        try:
            path = nx.shortest_path(self.g, from_account, to_account)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return {"from": from_account, "to": to_account, "path": None, "message": "No path or node missing"}
        if len(path) > max_hops + 1:
            return {"from": from_account, "to": to_account, "path": None, "message": f"Path longer than {max_hops} hops"}
        steps = []
        for i in range(len(path) - 1):
            a, b = path[i], path[i + 1]
            edges = list(self.g.edges(a, b, data=True))
            steps.append({"from": a, "to": b, "edges": [e[2] for e in edges]})
        return {"from": from_account, "to": to_account, "path": path, "steps": steps}

    def summarize_domain_activity(self, domain: str) -> dict:
        accounts = [n for n, d in self.g.nodes(data=True) if d.get("domain") == domain]
        in_deg = sum(self.g.in_degree(n) for n in accounts)
        out_deg = sum(self.g.out_degree(n) for n in accounts)
        return {
            "domain": domain,
            "accounts": len(accounts),
            "total_in_edges": in_deg,
            "total_out_edges": out_deg,
            "sample_accounts": accounts[:20],
        }

    def analyze_cluster(self, seed_account: str, radius: int = 2) -> dict:
        if seed_account not in self.g:
            return {"seed": seed_account, "nodes": 0, "edges": 0, "summary": "Account not in graph", "accounts": []}
        sub = nx.ego_graph(self.g.to_undirected(), seed_account, radius=radius)
        accounts = list(sub.nodes())
        return {
            "seed": seed_account,
            "radius": radius,
            "nodes": sub.number_of_nodes(),
            "edges": sub.number_of_edges(),
            "accounts": accounts,
            "summary": f"Cluster around {seed_account}: {sub.number_of_nodes()} accounts, {sub.number_of_edges()} links.",
        }

    def ingest_tx(self, tx: dict) -> None:
        """Incremental ingest of one transaction (from XRPL ledger/stream)."""
        tx_type = tx.get("TransactionType")
        if tx_type == "Payment":
            amount = tx.get("Amount")
            if isinstance(amount, dict):
                amount = amount.get("value", str(amount.get("value", "")))
            self.add_payment(
                tx.get("Account", ""),
                tx.get("Destination", ""),
                str(amount or "0"),
                tx.get("hash", ""),
                tx.get("ledger_index", 0),
            )
        elif tx_type == "TrustSet":
            limit = tx.get("LimitAmount") or {}
            if isinstance(limit, dict):
                self.add_trust_line(
                    tx.get("Account", ""),
                    limit.get("issuer", ""),
                    limit.get("currency", "XRP"),
                    str(limit.get("value", "0")),
                    "0",
                )
