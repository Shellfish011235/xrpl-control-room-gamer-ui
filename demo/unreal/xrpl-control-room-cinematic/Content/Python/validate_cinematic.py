from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from build_cinematic import (
    GENERATED_ACTOR_PREFIX,
    LEVEL_PATH,
    RENDER_PRESET_PATH,
    SEQUENCE_PATH,
)
from cinematic_spec import OUTPUT_SETTINGS, SHOT_TIMINGS
from topology_manifest import EDGES, NODES

try:
    import unreal  # type: ignore
except ImportError:  # Allows source validation outside Unreal Editor.
    unreal = None  # type: ignore

EXPECTED_WIDTH = 1920
EXPECTED_HEIGHT = 1080
HANDOFF_FILENAME = "topology-handoff.png"


def _require_unreal() -> Any:
    if unreal is None:
        raise RuntimeError("This validator must execute inside Unreal Editor.")
    return unreal


def _asset_exists(path: str) -> bool:
    ue = _require_unreal()
    return bool(ue.EditorAssetLibrary.does_asset_exist(path))


def _generated_actor_labels() -> set[str]:
    ue = _require_unreal()
    actor_subsystem = ue.get_editor_subsystem(ue.EditorActorSubsystem)
    return {
        actor.get_actor_label()
        for actor in actor_subsystem.get_all_level_actors()
        if actor.get_actor_label().startswith(GENERATED_ACTOR_PREFIX)
    }


def _validate_timing(errors: list[str]) -> None:
    shot_items = list(SHOT_TIMINGS.items())
    if len(shot_items) != 5:
        errors.append(f"Expected 5 shots, found {len(shot_items)}")
        return

    previous_end = 0.0
    for index, (name, (start, end)) in enumerate(shot_items):
        if end <= start:
            errors.append(f"Shot {name} has non-positive duration")
        if index == 0 and start != 0.0:
            errors.append("First shot must begin at 0.0 seconds")
        if index > 0 and start != previous_end:
            errors.append(f"Shot {name} does not begin at the previous shot boundary")
        previous_end = end

    total_duration = shot_items[-1][1][1] - shot_items[0][1][0]
    if total_duration < 5.0 or total_duration > 15.0:
        errors.append(f"Cinematic duration {total_duration:.2f}s is outside the 5–15 second contract")


def _validate_render_preset(errors: list[str]) -> None:
    ue = _require_unreal()
    if not _asset_exists(RENDER_PRESET_PATH):
        errors.append(f"Missing render preset: {RENDER_PRESET_PATH}")
        return

    config = ue.EditorAssetLibrary.load_asset(RENDER_PRESET_PATH)
    output = config.find_setting_by_class(ue.MoviePipelineOutputSetting) if config is not None else None
    if output is None:
        errors.append("Render preset is missing MoviePipelineOutputSetting")
        return

    resolution = output.output_resolution
    if resolution.x != EXPECTED_WIDTH or resolution.y != EXPECTED_HEIGHT:
        errors.append(
            f"Render resolution must be {EXPECTED_WIDTH}x{EXPECTED_HEIGHT}; "
            f"found {resolution.x}x{resolution.y}"
        )

    configured_resolution = tuple(OUTPUT_SETTINGS["resolution"])
    if configured_resolution != (EXPECTED_WIDTH, EXPECTED_HEIGHT):
        errors.append("cinematic_spec output resolution no longer matches the presentation contract")


def _validate_generated_actors(errors: list[str]) -> None:
    labels = _generated_actor_labels()
    expected_node_labels = {f"{GENERATED_ACTOR_PREFIX}Node_{node.id}" for node in NODES}
    expected_edge_labels = {
        f"{GENERATED_ACTOR_PREFIX}Edge_{edge.source}_{edge.target}"
        for edge in EDGES
    }
    expected_handoff_label = f"{GENERATED_ACTOR_PREFIX}Handoff"

    missing_nodes = sorted(expected_node_labels - labels)
    missing_edges = sorted(expected_edge_labels - labels)
    if missing_nodes:
        errors.append(f"Missing generated node actors: {', '.join(missing_nodes)}")
    if missing_edges:
        errors.append(f"Missing generated edge actors: {', '.join(missing_edges)}")
    if expected_handoff_label not in labels:
        errors.append(f"Missing generated handoff actor: {expected_handoff_label}")

    if any(edge.evidence not in ("observed", "inferred") for edge in EDGES):
        errors.append("Manifest contains an unsupported edge evidence state")


def _validate_sequence_structure(errors: list[str]) -> None:
    ue = _require_unreal()
    if not _asset_exists(SEQUENCE_PATH):
        return

    sequence = ue.EditorAssetLibrary.load_asset(SEQUENCE_PATH)
    if sequence is None:
        errors.append(f"Unable to load master sequence: {SEQUENCE_PATH}")
        return

    movie_scene = sequence.get_movie_scene()
    master_tracks = list(movie_scene.get_master_tracks())
    has_camera_cut = any(isinstance(track, ue.MovieSceneCameraCutTrack) for track in master_tracks)
    has_shot_track = any(isinstance(track, ue.MovieSceneCinematicShotTrack) for track in master_tracks)

    if not has_camera_cut:
        errors.append("Missing master camera cut track")
    if not has_shot_track:
        errors.append("Missing cinematic shot track")


def _validate_handoff_reference(errors: list[str]) -> None:
    ue = _require_unreal()
    handoff_path = Path(str(ue.Paths.project_dir())) / "References" / HANDOFF_FILENAME
    if not handoff_path.exists():
        errors.append(f"Missing handoff reference: References/{HANDOFF_FILENAME}")


def validate_scene() -> list[str]:
    errors: list[str] = []
    ue = _require_unreal()

    if not _asset_exists(LEVEL_PATH):
        errors.append(f"Missing cinematic level: {LEVEL_PATH}")
    else:
        ue.get_editor_subsystem(ue.LevelEditorSubsystem).load_level(LEVEL_PATH)

    if not _asset_exists(SEQUENCE_PATH):
        errors.append(f"Missing master sequence: {SEQUENCE_PATH}")

    _validate_timing(errors)
    _validate_render_preset(errors)
    _validate_generated_actors(errors)
    _validate_sequence_structure(errors)
    _validate_handoff_reference(errors)
    return errors


if __name__ == "__main__":
    validation_errors = validate_scene()
    if validation_errors:
        for validation_error in validation_errors:
            print(f"[XRPL CINEMATIC] {validation_error}")
        raise RuntimeError(f"Cinematic validation failed with {len(validation_errors)} issue(s)")
    print("[XRPL CINEMATIC] validation passed")
