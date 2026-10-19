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
TEXTURE_ROOT = f"{GENERATED_ROOT}/Textures"
SEQUENCE_ROOT = f"{GENERATED_ROOT}/Sequences"
RENDER_ROOT = f"{GENERATED_ROOT}/Render"
LEVEL_PATH = f"{ASSET_ROOT}/{LEVEL_NAME}"
SEQUENCE_PATH = f"{SEQUENCE_ROOT}/{SEQUENCE_NAME}"
RENDER_PRESET_PATH = f"{RENDER_ROOT}/MRQ_XRPL_ControlRoom_Opener"
GENERATED_ACTOR_PREFIX = "CR_"
HANDOFF_REFERENCE_NAME = "topology-handoff.png"
HANDOFF_TEXTURE_NAME = "topology-handoff"


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


def _handoff_reference_path() -> Path:
    ue = _require_unreal()
    return Path(str(ue.Paths.project_dir())) / "References" / HANDOFF_REFERENCE_NAME


def _import_handoff_texture() -> str | None:
    ue = _require_unreal()
    source_path = _handoff_reference_path()
    if not source_path.exists():
        return None

    _ensure_directory(TEXTURE_ROOT)
    import_data = ue.AutomatedAssetImportData()
    import_data.set_editor_property("destination_path", TEXTURE_ROOT)
    import_data.set_editor_property("filenames", [str(source_path)])
    import_data.set_editor_property("replace_existing", True)
    imported_assets = _asset_tools().import_assets_automated(import_data)
    if not imported_assets:
        raise RuntimeError(f"Unable to import handoff reference: {source_path}")
    return imported_assets[0].get_path_name()


def _configure_handoff_material(material: Any, texture_path: str | None, placeholder_path: str) -> Any:
    ue = _require_unreal()
    if texture_path is None:
        placeholder = ue.EditorAssetLibrary.load_asset(placeholder_path)
        return placeholder

    texture = ue.EditorAssetLibrary.load_asset(texture_path)
    if texture is None:
        raise RuntimeError(f"Imported handoff texture cannot be loaded: {texture_path}")

    editing = ue.MaterialEditingLibrary
    editing.delete_all_material_expressions(material)
    sample = editing.create_material_expression(material, ue.MaterialExpressionTextureSample, -240, 0)
    sample.set_editor_property("texture", texture)
    editing.connect_material_property(sample, "RGB", ue.MaterialProperty.MP_EMISSIVE_COLOR)
    editing.recompile_material(material)
    ue.EditorAssetLibrary.save_loaded_asset(material)
    return material


def _create_handoff_plane(material_paths: dict[str, str]) -> str:
    ue = _require_unreal()
    texture_path = _import_handoff_texture()
    placeholder_path = material_paths["inferred"]
    if texture_path is None:
        placeholder = _load_or_create_asset(
            "M_CR_HandoffPlaceholder",
            MATERIAL_ROOT,
            ue.Material,
            ue.MaterialFactoryNew(),
        )
        _configure_emissive_material(placeholder, "muted")
        handoff_material = placeholder
    else:
        material = _load_or_create_asset("M_CR_Handoff", MATERIAL_ROOT, ue.Material, ue.MaterialFactoryNew())
        handoff_material = _configure_handoff_material(material, texture_path, placeholder_path)

    actor = _spawn_static_mesh("/Engine/BasicShapes/Plane.Plane", "Handoff", (900.0, 0.0, 70.0))
    actor.set_actor_rotation(ue.Rotator(0.0, 90.0, 90.0), False)
    actor.set_actor_scale3d(ue.Vector(7.2, 4.05, 1.0))
    _apply_material(actor, handoff_material)
    return actor.get_path_name()


def _seconds_to_frame(seconds: float) -> int:
    return round(seconds * int(OUTPUT_SETTINGS["fps"]))


def _resolve_actor(actor_path: str) -> Any:
    for actor in _editor_actor_subsystem().get_all_level_actors():
        if actor.get_path_name() == actor_path:
            return actor
    raise RuntimeError(f"Generated actor no longer exists: {actor_path}")


def _add_visibility_keys(sequence: Any, actor: Any, reveal_seconds: float) -> None:
    ue = _require_unreal()
    binding = sequence.add_possessable(actor)
    track = binding.add_track(ue.MovieSceneVisibilityTrack)
    section = track.add_section()
    section.set_range(0, _seconds_to_frame(SHOT_TIMINGS["control_room_handoff"][1]))
    channels = section.get_channels()
    if not channels:
        raise RuntimeError(f"Visibility track for {actor.get_actor_label()} has no scripting channel")
    channel = channels[0]
    channel.add_key(unreal.FrameNumber(0), False)
    channel.add_key(unreal.FrameNumber(_seconds_to_frame(reveal_seconds)), True)


def _add_camera_motion(sequence: Any, camera_binding: Any) -> None:
    ue = _require_unreal()
    track = camera_binding.add_track(ue.MovieScene3DTransformTrack)
    section = track.add_section()
    section.set_range(0, _seconds_to_frame(SHOT_TIMINGS["control_room_handoff"][1]))
    channels = section.get_channels()
    if len(channels) < 6:
        raise RuntimeError("Camera transform track does not expose six transform channels")

    keyframes = (
        (0.0, (-1050.0, -780.0, 520.0), (-11.0, 35.0, 0.0)),
        (SHOT_TIMINGS["visibility_boundary"][0], (-720.0, -470.0, 310.0), (-8.0, 25.0, 0.0)),
        (SHOT_TIMINGS["control_room_handoff"][0], (-470.0, -210.0, 170.0), (-4.0, 13.0, 0.0)),
        (SHOT_TIMINGS["control_room_handoff"][1], (420.0, -20.0, 95.0), (0.0, 2.0, 0.0)),
    )
    for seconds, location, rotation in keyframes:
        frame = ue.FrameNumber(_seconds_to_frame(seconds))
        values = (*location, *rotation)
        for channel, value in zip(channels[:6], values):
            channel.add_key(frame, float(value), interpolation=ue.MovieSceneKeyInterpolation.AUTO)


def _add_camera_cut(sequence: Any, camera_binding: Any) -> None:
    ue = _require_unreal()
    track = sequence.add_master_track(ue.MovieSceneCameraCutTrack)
    section = track.add_section()
    section.set_range(0, _seconds_to_frame(SHOT_TIMINGS["control_room_handoff"][1]))
    section.set_camera_binding_id(sequence.get_binding_id(camera_binding))


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


def _add_camera(master_sequence: Any) -> tuple[Any, str]:
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
    return binding, camera.get_path_name()


def _program_storyboard(master_sequence: Any, actor_paths: dict[str, str], camera_binding: Any) -> None:
    validator_reveal = SHOT_TIMINGS["validators"][0]
    relationship_reveal = SHOT_TIMINGS["relationships"][0]
    boundary_reveal = SHOT_TIMINGS["visibility_boundary"][0]
    handoff_reveal = SHOT_TIMINGS["control_room_handoff"][0]

    for actor_id, actor_path in actor_paths.items():
        actor = _resolve_actor(actor_path)
        if actor_id == "handoff":
            reveal_seconds = handoff_reveal
        elif actor_id == "visibility_boundary":
            reveal_seconds = boundary_reveal
        elif actor_id.startswith("edge:"):
            reveal_seconds = relationship_reveal + (0.45 if "relay_hint" in actor_id else 0.0)
        elif actor_id == "relay_hint":
            reveal_seconds = relationship_reveal + 0.35
        else:
            reveal_seconds = validator_reveal
        _add_visibility_keys(master_sequence, actor, reveal_seconds)

    _add_camera_motion(master_sequence, camera_binding)
    _add_camera_cut(master_sequence, camera_binding)


def create_sequence(actor_paths: dict[str, str]) -> str:
    ue = _require_unreal()
    master = _load_or_create_asset(SEQUENCE_NAME, SEQUENCE_ROOT, ue.LevelSequence, ue.LevelSequenceFactoryNew())
    master.set_display_rate(ue.FrameRate(int(OUTPUT_SETTINGS["fps"]), 1))
    master.set_playback_start(0)
    master.set_playback_end(_seconds_to_frame(SHOT_TIMINGS["control_room_handoff"][1]))

    movie_scene = master.get_movie_scene()
    for track in list(movie_scene.get_master_tracks()):
        movie_scene.remove_master_track(track)

    _create_shot_sequences(master)
    camera_binding, _camera_path = _add_camera(master)
    _program_storyboard(master, actor_paths, camera_binding)
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
    material_paths = create_materials()
    actor_paths["handoff"] = _create_handoff_plane(material_paths)
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
