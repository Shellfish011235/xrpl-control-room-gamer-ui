SHOT_TIMINGS: dict[str, tuple[float, float]] = {
    "ledger_signal": (0.0, 1.2),
    "validators": (1.2, 2.8),
    "relationships": (2.8, 5.2),
    "visibility_boundary": (5.2, 7.0),
    "control_room_handoff": (7.0, 9.0),
}

PALETTE: dict[str, tuple[float, float, float, float]] = {
    "background": (0.01, 0.02, 0.04, 1.0),
    "cyan": (0.0, 0.72, 1.0, 1.0),
    "trusted": (0.22, 0.95, 0.63, 1.0),
    "unknown": (0.95, 0.62, 0.18, 1.0),
    "muted": (0.19, 0.28, 0.38, 1.0),
}

SEQUENCE_NAME: str = "LS_XRPL_ControlRoom_Opener"
LEVEL_NAME: str = "L_XRPL_ControlRoom_Opener"
OUTPUT_SETTINGS: dict[str, object] = {
    "resolution": (1920, 1080),
    "fps": 30,
    "output_basename": "xrpl-control-room-opener",
}
