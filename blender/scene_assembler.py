"""
Scene assembler: reads one episode JSON (src/animated-film/episodes/
*.json) and drives the character rig + backgrounds through every beat.

Two modes:
  - `render_preview(episode_path)`: ONE representative frame per beat —
    a fast storyboard/contact-sheet check across every beat's location,
    characters, action, and speaker, without waiting for a full render.
    This is what should be used to sanity-check a freshly-written episode
    script before ever committing to a full render.
  - `render_full(episode_path, beat_durations)`: every frame, beat
    durations taken from the real generated audio file lengths — the
    actual production render. NOT built yet (needs an audio-duration
    prober); render_preview is the priority since it's what validates
    the assembler logic itself is correct before spending render time.

Character positioning is simple left-right layout by appearance order in
`characters_present` (2-3 people max fits comfortably) — no blocking/
staging intelligence yet, just enough to prove the pipeline end-to-end.
"""

import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gp_character import build_character  # noqa: E402
from characters import (  # noqa: E402
    BA_TU_PARTS, BA_TU_SKIN,
    MAI_PARTS, MAI_SKIN,
    CO_SAU_PARTS, CO_SAU_SKIN,
    CHU_BAY_PARTS, CHU_BAY_SKIN,
    BE_TOM_PARTS, BE_TOM_SKIN,
)
from backgrounds import build_location, BUILDERS, PROP_ANCHORS  # noqa: E402
from actions import get_pose  # noqa: E402
from talking_mouth import jaw_scale  # noqa: E402
from audio_utils import get_duration_seconds  # noqa: E402

FPS = 24

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Character registry — only Ba Tu and Mai exist so far (see
# blender/characters.py's module docstring for why more aren't built
# blind). Extend this dict as more named characters are drawn.
CHARACTER_REGISTRY = {
    "ba_tu": (BA_TU_PARTS, BA_TU_SKIN, 1.0),
    "mai": (MAI_PARTS, MAI_SKIN, 0.85),
    "co_sau": (CO_SAU_PARTS, CO_SAU_SKIN, 0.98),
    "chu_bay": (CHU_BAY_PARTS, CHU_BAY_SKIN, 1.0),
    "be_tom": (BE_TOM_PARTS, BE_TOM_SKIN, 0.55),
}

# Left-to-right slot x-offsets for however many characters share a beat.
SLOT_X = {
    1: [0.0],
    2: [-1.0, 1.0],
    3: [-1.6, 0.0, 1.6],
    4: [-2.2, -0.7, 0.7, 2.2],
    5: [-2.3, -1.15, 0.0, 1.15, 2.3],
}


def _setup_scene(resolution=(960, 540)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.view_settings.view_transform = "Standard"

    camera_data = bpy.data.cameras.new("Cam")
    camera_data.type = "ORTHO"
    # Wide enough for a 5-person group beat (SLOT_X[5]) without clipping
    # anyone at the frame edge — a real production would vary this per
    # shot (close-up vs. wide), fixed here for now.
    camera_data.ortho_scale = 6.5
    cam = bpy.data.objects.new("Cam", camera_data)
    cam.location = (0, -10, 1.2)
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    light_data = bpy.data.lights.new("Sun", type="SUN")
    light_data.energy = 2.0
    light = bpy.data.objects.new("Sun", light_data)
    bpy.context.collection.objects.link(light)

    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.05, 1.0)

    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.image_settings.file_format = "PNG"
    # Default is 64. This scene has no soft shadows/GI/reflections to
    # denoise (flat Emission backgrounds, layer.use_lights=False on every
    # character) — samples only refine hard-edge anti-aliasing here, which
    # fully converges far below the default. Confirmed via a direct 64-
    # vs-8 side-by-side (still frame AND a 48-frame motion clip, checked
    # for temporal flicker too) with the channel owner before lowering
    # this — pixel-identical, ~2.8x faster.
    scene.eevee.taa_render_samples = 8
    return scene


def _build_all_locations(location_names):
    """Builds every location once, keyed by name, so beats can just
    toggle visibility instead of rebuilding geometry per beat (rebuilding
    a GP object per beat across ~90 beats would be needlessly slow and
    would leak orphan data-blocks)."""
    location_objs = {}
    for loc in location_names:
        if loc in BUILDERS:
            location_objs[loc] = build_location(loc)
        else:
            location_objs[loc] = []
    return location_objs


def _positions_for_beat(location, action, present, speaker):
    """Returns (x_positions, character_names) for this beat. If the
    (location, action) pair has a prop anchor (see backgrounds.PROP_
    ANCHORS), the acting character (the speaker — the schema has no
    separate "actor" field, and in practice the one performing a prop-
    tied action is the one talking about it) is placed AT the prop;
    everyone else present gets the normal slot layout, shifted clear of
    the anchor so they don't stack on top of it. Otherwise, everyone
    just gets the generic left-right slot layout."""
    anchor_x = PROP_ANCHORS.get((location, action))
    if anchor_x is None or speaker not in present:
        slots = SLOT_X.get(len(present), SLOT_X[min(len(present), 5)]) if present else []
        return slots, present

    others = [c for c in present if c != speaker]
    other_slots = SLOT_X.get(len(others), SLOT_X[min(len(others), 5)]) if others else []
    # Push everyone else to the right of the anchor, spaced out from there
    # rather than centered on the room — they're gathered around whoever
    # is at the stove/counter, not standing independently of them.
    shifted = [anchor_x + 1.1 + i * 0.9 for i in range(len(others))]
    return [anchor_x] + shifted, [speaker] + others


def _set_active_location(location_objs, active_name):
    for name, objs in location_objs.items():
        visible = name == active_name
        for obj in objs:
            obj.hide_render = not visible


def render_preview(episode_path, out_dir=None):
    with open(episode_path, "r", encoding="utf-8") as f:
        episode = json.load(f)

    slug = os.path.splitext(os.path.basename(episode_path))[0]
    if out_dir is None:
        out_dir = os.path.join(REPO_ROOT, "blender", "out", f"preview_{slug}")
    os.makedirs(out_dir, exist_ok=True)

    beats = episode["beats"]
    locations_used = sorted({b["location"] for b in beats})
    unknown_locations = [loc for loc in locations_used if loc not in BUILDERS]
    if unknown_locations:
        print(f"WARNING: no background builder for locations: {unknown_locations}")

    scene = _setup_scene()
    location_objs = _build_all_locations(locations_used)

    characters_used = sorted({c for b in beats for c in b["characters_present"]})
    unknown_characters = [c for c in characters_used if c not in CHARACTER_REGISTRY]
    if unknown_characters:
        print(f"WARNING: no character definition for: {unknown_characters} (skipped in this preview)")

    built_characters = {}
    for name in characters_used:
        if name not in CHARACTER_REGISTRY:
            continue
        parts, skin, scale = CHARACTER_REGISTRY[name]
        built_characters[name] = build_character(name, parts, skin, scale=scale)

    rendered = 0
    skipped = 0
    for i, beat in enumerate(beats):
        present = [c for c in beat["characters_present"] if c in built_characters]
        if not present:
            skipped += 1
            continue

        _set_active_location(location_objs, beat["location"])

        for slot_x, char_name in zip(
            *_positions_for_beat(beat["location"], beat["action"], present, beat["speaker"])
        ):
            char = built_characters[char_name]
            rotations, root_offset = get_pose(beat["action"], 1.0)
            # Combine the left/right slot with any action-driven root
            # offset (walk_in/walk_out/sit_down/stand_up) via ONE direct
            # assignment — see gp_character.py's pose() comment on why
            # this must be a direct set, not routed through pose()'s
            # keyframed root_location param.
            offset_x = root_offset.get("x", 0.0) if root_offset else 0.0
            offset_z = root_offset.get("z", 0.0) if root_offset else 0.0
            char.arm_obj.location = (slot_x + offset_x, 0, offset_z)
            is_speaking = char_name == beat["speaker"]
            char.pose(
                i,
                rotations,
                scales={"jaw": jaw_scale(i, is_speaking)},
            )
            # Hide characters not present in THIS beat's location — every
            # built character object stays in the scene the whole time
            # (rebuilding per beat would be slow), so absent ones must be
            # explicitly hidden or they'd show up floating in every shot.
            for obj in char.gp_objs:
                obj.hide_render = False
        for name, char in built_characters.items():
            if name not in present:
                for obj in char.gp_objs:
                    obj.hide_render = True

        scene.frame_set(i)
        scene.render.filepath = os.path.join(out_dir, f"{i:03d}_{beat['speaker']}_{beat['action']}.png")
        bpy.ops.render.render(write_still=True)
        rendered += 1

    print(f"PREVIEW_DONE: {rendered} beats rendered, {skipped} skipped (no known character present), -> {out_dir}")
    return out_dir


# A safe fallback words-per-second rate (natural Vietnamese speech,
# matches the ~130-150 wpm target the episode-writer prompt uses) for the
# rare beat whose audio file is missing/unprobeable — better than
# crashing an otherwise-unattended full render over one bad file.
FALLBACK_WORDS_PER_SECOND = 2.3


def render_full(episode_path, out_dir=None, beat_limit=None, start_beat=0):
    """Renders EVERY FRAME (not just one per beat), timed to each beat's
    REAL generated audio duration — the actual production render. Frames
    are numbered continuously across the whole episode
    (frame_000000.png, frame_000001.png, ...) so they can be encoded
    straight into one video and muxed against the concatenated audio.

    `beat_limit`/`start_beat` let a caller render just a slice (e.g. the
    first 3 beats) to verify timing/correctness before committing to a
    render spanning the whole ~20-minute episode, which takes hours.
    """
    with open(episode_path, "r", encoding="utf-8") as f:
        episode = json.load(f)

    slug = os.path.splitext(os.path.basename(episode_path))[0]
    if out_dir is None:
        out_dir = os.path.join(REPO_ROOT, "blender", "out", f"full_{slug}")
    os.makedirs(out_dir, exist_ok=True)

    audio_dir = os.path.join(REPO_ROOT, "public", "audio", "animated-film", slug)

    beats = episode["beats"]
    end_beat = len(beats) if beat_limit is None else min(len(beats), start_beat + beat_limit)
    beat_slice = list(enumerate(beats))[start_beat:end_beat]

    locations_used = sorted({b["location"] for _, b in beat_slice})
    characters_used = sorted({c for _, b in beat_slice for c in b["characters_present"]})

    scene = _setup_scene()
    location_objs = _build_all_locations(locations_used)
    built_characters = {}
    for name in characters_used:
        if name not in CHARACTER_REGISTRY:
            continue
        parts, skin, char_scale = CHARACTER_REGISTRY[name]
        built_characters[name] = build_character(name, parts, skin, scale=char_scale)

    frame_cursor = 0
    beat_frame_counts = []

    for beat_index, beat in beat_slice:
        audio_path = os.path.join(audio_dir, f"beat-{beat_index}.mp3")
        duration = get_duration_seconds(audio_path)
        if duration is None:
            word_count = len(beat["text"].split())
            duration = max(0.6, word_count / FALLBACK_WORDS_PER_SECOND)
            print(f"WARNING: beat {beat_index} audio missing/unreadable, estimating {duration:.2f}s from word count")

        n_frames = max(1, round(duration * FPS))
        beat_frame_counts.append(n_frames)

        present = [c for c in beat["characters_present"] if c in built_characters]
        _set_active_location(location_objs, beat["location"])
        for name, char in built_characters.items():
            for obj in char.gp_objs:
                obj.hide_render = name not in present

        slots, ordered_present = _positions_for_beat(
            beat["location"], beat["action"], present, beat["speaker"]
        )

        for f_local in range(n_frames):
            t = f_local / FPS
            for slot_x, char_name in zip(slots, ordered_present):
                char = built_characters[char_name]
                rotations, root_offset = get_pose(beat["action"], t)
                offset_x = root_offset.get("x", 0.0) if root_offset else 0.0
                offset_z = root_offset.get("z", 0.0) if root_offset else 0.0
                char.arm_obj.location = (slot_x + offset_x, 0, offset_z)
                is_speaking = char_name == beat["speaker"]
                char.pose(
                    frame_cursor,
                    rotations,
                    scales={"jaw": jaw_scale(frame_cursor, is_speaking)},
                )

            scene.frame_set(frame_cursor)
            scene.render.filepath = os.path.join(out_dir, f"frame_{frame_cursor:06d}.png")
            bpy.ops.render.render(write_still=True)
            frame_cursor += 1

        print(f"beat {beat_index}/{len(beats)-1}: {duration:.2f}s ({n_frames} frames), total so far {frame_cursor}")

    print(f"FULL_RENDER_DONE: {frame_cursor} frames across {len(beat_slice)} beats -> {out_dir}")
    return out_dir, frame_cursor


if __name__ == "__main__":
    # Usage: blender -b -P blender/scene_assembler.py -- <episode.json>
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not argv:
        print("Usage: blender -b -P blender/scene_assembler.py -- <episode.json>")
    else:
        render_preview(argv[0])
