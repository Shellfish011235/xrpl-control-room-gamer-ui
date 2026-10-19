from dataclasses import dataclass
from typing import Literal

EvidenceState = Literal["observed", "inferred", "unknown"]
EdgeEvidenceState = Literal["observed", "inferred"]


@dataclass(frozen=True)
class TopologyNode:
    id: str
    label: str
    position: tuple[float, float, float]
    evidence: EvidenceState
    trusted: bool = False
    visibility_boundary: bool = False


@dataclass(frozen=True)
class TopologyEdge:
    source: str
    target: str
    evidence: EdgeEvidenceState


# Positions are intentionally abstract presentation coordinates, not geography.
NODES: tuple[TopologyNode, ...] = (
    TopologyNode("validator_a", "Validator A", (-360.0, -80.0, 20.0), "observed", trusted=True),
    TopologyNode("validator_b", "Validator B", (-120.0, 120.0, 80.0), "observed", trusted=True),
    TopologyNode("validator_c", "Validator C", (140.0, -40.0, 20.0), "observed"),
    TopologyNode("relay_hint", "Relationship Hint", (330.0, 140.0, -20.0), "inferred"),
    TopologyNode(
        "visibility_boundary",
        "Visibility Boundary",
        (520.0, 20.0, 0.0),
        "unknown",
        visibility_boundary=True,
    ),
)

EDGES: tuple[TopologyEdge, ...] = (
    TopologyEdge("validator_a", "validator_b", "observed"),
    TopologyEdge("validator_b", "validator_c", "observed"),
    TopologyEdge("validator_c", "relay_hint", "inferred"),
)

EVIDENCE_LABELS: tuple[EvidenceState, ...] = ("observed", "inferred", "unknown")
