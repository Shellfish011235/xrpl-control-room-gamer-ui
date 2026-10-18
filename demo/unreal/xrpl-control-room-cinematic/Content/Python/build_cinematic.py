from __future__ import annotations

import math
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from cinematic_spec import LEVEL_NAME, OUTPUT_SETTINGS, PALETTE, SEQUENCE_NAME, SHOT_TIMINGS
from topology_manifest import EDGES, NODES, TopologyEdge, TopologyNode

try:
    import unreal  # type: ignore
except ImportError:  # Allows source validation outside Unreal Editor.
    unreal = None  # type: ignore

ASSET_ROOT = "/Game/XRPLControlRoomCinematic"
GENERATED_ROOT = f"{ASSET_ROOT}/Generated"
MATERIAL_ROOT = f"{GENERATED_ROOT}/Materials"
SEQUENCE_ROOT = f"{GENERATED_ROOT}/Sequences"
RENDER_ROOT = f"{GENERATED_ROOT}/Render"
LEVEL_PATH = f"{ASSET_ROOT}/{LEVEL_NAME}"
SEQUENCE_PATH = f"{SEQUENCE_ROOT}/{SEQUENCE_NAME}"
RENDER_PRESET_PATH = f"{RENDER_ROOT}/MRQ_XRPL_ControlRoom_Opener"
GENERATED_ACTOR_PREFIX = "CR_"


def _require_unreal() -> Any:
    if unreal is None:
        raise RuntimeError("This build script must execute inside Unreal Editor.")
    return unreal


def _asset_tools() -> Any:
    ue = _require_unreal()
    return ue.AssetToolsHelpers.get_asset_tools()


def _editor_actor_subsystem() -> Any:
    ue = _require_unreal()
    return ue.get_editor_subsystem(ue.EditorActorSubsystem)


def _level_editor_subsystem() -> Any:
    ue = _require_unreal()
    return ue.get_editor_subsystem(ue.LevelEditorSubsystem)


def _ensure_directory(path: str) -> None:
    ue = _require_unreal()
    if not ue.EditorAssetLibrary.does_directory_exist(path):
        ue.EditorAssetLibrary.make_directory(path)


def _load_or_create_asset(name: str, package_path: str, asset_class: Any, factory: Any) -> Any:
    ue = _require_unreal()
    asset_path = f"{package_path}/{name}"
    existing = ue.EditorAssetLibrary.load_asset(asset_path)
    if existing is not None:
        return existing
    _ensure_directory(package_path)
    return _asset_tools().create_asset(name, package_path, asset_class, factory)


def _material_color(key: str) -> Any:
    ue = _require_unreal()
    red, green, blue, alpha = PALETTE[key]
    return ue.LinearColor(red, green, blue, alpha)


def _configure_emissive_material(material: Any, palette_key: str) -> None:
    ue = _require_unreal()
    editing = ue.MaterialEditingLibrary
    editing.delete_all_material_expressions(material)
    expression = editing.create_material_expression(material, ue.MaterialExpressionConstant3Vector, -220, 0)
    expression.set_editor_property("constant", _material_color(palette_key))
    editing.connect_material_property(expression, "", ue.MaterialProperty.MP_EMISSIVE_COLOR)
    editing.recompile_material(material)
    ue.EditorAssetLibrary.save_loaded_asset(material)


def create_materials() -> dict[str, str]:
    ue = _require_unreal()
    material_keys = {
        "observed": "cyan",
        "trusted": "trusted",
        "inferred": "muted",
        "unknown": "unknown",
    }
    paths: dict[str, str] = {}
    for evidence, palette_key in material_keys.items():
        name = f"M_CR_{evidence.title()}"
        material = _load_or_create_asset(name, MATERIAL_ROOT, ue.Material, ue.MaterialFactoryNew())
        _configure_emissive_material(material, palette_key)
        paths[evidence] = f"{MATERIAL_ROOT}/{name}"
    return paths


def _destroy_generated_actors() -> None:
    actor_subsystem = _editor_actor_subsystem()
    for actor in actor_subsystem.get_all_level_actors():
        label = actor.get_actor_label()
        if label.startswith(GENERATED_ACTOR_PREFIX):
            actor_subsystem.destroy_actor(actor)


def create_level() -> str:
    ue = _require_unreal()
    level_subsystem = _level_editor_subsystem()
    if ue.EditorAssetLibrary.does_asset_exist(LEVEL_PATH):
        level_subsystem.load_level(LEVEL_PATH)
    else:
        _ensure_directory(ASSET_ROOT)
        if not level_subsystem.new_level(LEVEL_PATH):
            raise RuntimeError(f"Unable to create level {LEVEL_PATH}")
    _destroy_generated_actors()
    ue.EditorAssetLibrary.save_directory(ASSET_ROOT, only_if_is_dirty=False, recursive=True)
    return LEVEL_PATH


def _material_for_node(node: TopologyNode, material_paths: dict[str, str]) -> Any:
    ue = _require_unreal()
    key = "trusted" if node.trusted else node.evidence
    return ue.EditorAssetLibrary.load_asset(material_paths[key])


def _spawn_static_mesh(mesh_path: str, label: str, location: tuple[float, float, float]) -> Any:
    ue = _require_unreal()
    mesh = ue.EditorAssetLibrary.load_asset(mesh_path)
    if mesh is None:
        raise RuntimeError(f"Required engine mesh unavailable: {mesh_path}")
    actor = _editor_actor_subsystem().spawn_actor_from_object(mesh, ue.Vector(*location), ue.Rotator())
    if actor is None:
        raise RuntimeError(f"Unable to spawn {label}")
    actor.set_actor_label(f"{GENERATED_ACTOR_PREFIX}{label}")
    return actor


def _apply_material(actor: Any, material: Any) -> None:
    component = actor.get_component_by_class(_require_unreal().StaticMeshComponent)
    if component is not None and material is not None:
        component.set_material(0, material)


def _spawn_edge_actor(edge: TopologyEdge, nodes_by_id: dict[str, TopologyNode], material_paths: dict[str, str]) -> Any:
    ue = _require_unreal()
    source = nodes_by_id[edge.source]
    target = nodes_by_id[edge.target]
    midpoint = tuple((a + b) / 2.0 for a, b in zip(source.position, target.position))
    actor = _spawn_static_mesh("/Engine/BasicShapes/Cylinder.Cylinder", f"Edge_{edge.source}_{edge.target}", midpoint)

    dx = target.position[0] - source.position[0]
    dy = target.position[1] - source.position[1]
    dz = target.position[2] - source.position[2]
    distance = math.sqrt(dx * dx + dy * dy + dz * dz)
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt(dx * dx + dy * dy)
    pitch = math.degrees(math.atan2(dz, horizontal))
    actor.set_actor_rotation(ue.Rotator(pitch, yaw, 0.0), False)
    actor.set_actor_scale3d(ue.Vector(0.018, 0.018, max(distance / 100.0, 0.02)))
    _apply_material(actor, ue.EditorAssetLibrary.load_asset(material_paths[edge.evidence]))
    return actor


def spawn_network(nodes: tuple[TopologyNode, ...], edges: tuple[TopologyEdge, ...]) -> dict[str, str]:
    ue = _require_unreal()
    material_paths = create_materials()
    nodes_by_id = {node.id: node for node in nodes}
    actor_paths: dict[str, str] = {}

    for edge in edges:
        if edge.evidence not in ("observed", "inferred"):
            raise ValueError(f"Unsupported edge evidence: {edge.evidence}")
        if edge.source not in nodes_by_id or edge.target not in nodes_by_id:
            raise ValueError(f"Edge references an unknown node: {edge.source}->{edge.target}")

    for node in nodes:
        actor = _spawn_static_mesh("/Engine/BasicShapes/Sphere.Sphere", f"Node_{node.id}", node.position)
        scale = 0.28 if node.trusted else 0.22
        if node.visibility_boundary:
            scale = 0.34
        actor.set_actor_scale3d(ue.Vector(scale, scale, scale))
        _apply_material(actor, _material_for_node(node, material_paths))
        actor_paths[node.id] = actor.get_path_name()

    for edge in edges:
        actor = _spawn_edge_actor(edge, nodes_by_id, material_paths)
        actor_paths[f"edge:{edge.source}:{edge.target}"] = actor.get_path_name()

    ue.EditorAssetLibrary.save_directory(ASSET_ROOT, only_if_is_dirty=False, recursive=True)
    return actor_paths


def _seconds_to_frame(seconds: float) -> int:
    return round(seconds * int(OUTPUT_SETTINGS["fps"]))


def _create_shot_sequences(master_sequence: Any) -> None:
    ue = _require_unreal()
    shot_track = master_sequence.add_master_track(ue.MovieSceneCinematicShotTrack)
    for shot_name, (start_seconds, end_seconds) in SHOT_TIMINGS.items():
        asset_name = f"LS_CR_{shot_name}"
        shot = _load_or_create_asset(asset_name, SEQUENCE_ROOT, ue.LevelSequence, ue.LevelSequenceFactoryNew())
        shot.set_display_rate(ue.FrameRate(int(OUTPUT_SETTINGS["fps"]), 1))
        start_frame = _seconds_to_frame(start_seconds)
        end_frame = _seconds_to_frame(end_seconds)
        shot.set_playback_start(0)
        shot.set_playback_end(end_frame - start_frame)
        section = shot_track.add_section()
        section.set_sequence(shot)
        section.set_range(start_frame, end_frame)


def _add_camera(master_sequence: Any) -> str:
    ue = _require_unreal()
    camera = _editor_actor_subsystem().spawn_actor_from_class(
        ue.CineCameraActor,
        ue.Vector(-1050.0, -780.0, 520.0),
        ue.Rotator(-11.0, 35.0, 0.0),
    )
    if camera is None:
        raise RuntimeError("Unable to create cinematic camera")
    camera.set_actor_label(f"{GENERATED_ACTOR_PREFIX}Camera")
    binding = master_sequence.add_possessable(camera)
    transform_track = binding.add_track(ue.MovieScene3DTransformTrack)
    section = transform_track.add_section()
    section.set_range(0, _seconds_to_frame(SHOT_TIMINGS["control_room_handoff"][1]))
    return camera.get_path_name()


def create_sequence(actor_paths: dict[str, str]) -> str:
    ue = _require_unreal()
    _ = actor_paths  # Bindings are resolved from generated actors inside the editor.
    master = _load_or_create_asset(SEQUENCE_NAME, SEQUENCE_ROOT, ue.LevelSequence, ue.LevelSequenceFactoryNew())
    master.set_display_rate(ue.FrameRate(int(OUTPUT_SETTINGS["fps"]), 1))
    master.set_playback_start(0)
    master.set_playback_end(_seconds_to_frame(SHOT_TIMINGS["control_room_handoff"][1]))

    movie_scene = master.get_movie_scene()
    for track in list(movie_scene.get_master_tracks()):
        movie_scene.remove_master_track(track)

    _create_shot_sequences(master)
    _add_camera(master)
    ue.EditorAssetLibrary.save_loaded_asset(master)
    return SEQUENCE_PATH


def configure_render(sequence_path: str) -> str:
    ue = _require_unreal()
    _ = sequence_path
    config = _load_or_create_asset(
        "MRQ_XRPL_ControlRoom_Opener",
        RENDER_ROOT,
        ue.MoviePipelinePrimaryConfig,
        ue.MoviePipelinePrimaryConfigFactory(),
    )
    output = config.find_or_add_setting_by_class(ue.MoviePipelineOutputSetting)
    output.output_resolution = ue.IntPoint(*OUTPUT_SETTINGS["resolution"])
    output.output_frame_rate = ue.FrameRate(int(OUTPUT_SETTINGS["fps"]), 1)
    output.file_name_format = str(OUTPUT_SETTINGS["output_basename"])
    ue.EditorAssetLibrary.save_loaded_asset(config)
    return RENDER_PRESET_PATH


def build_all() -> dict[str, str]:
    create_level()
    actor_paths = spawn_network(NODES, EDGES)
    sequence_path = create_sequence(actor_paths)
    render_path = configure_render(sequence_path)
    return {
        "level": LEVEL_PATH,
        "sequence": sequence_path,
        "render_preset": render_path,
        **actor_paths,
    }


if __name__ == "__main__":
    build_all()
