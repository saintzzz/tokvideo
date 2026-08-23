"""
Proof test for blender/actions.py: run Ba Tu through a sequence of
distinct actions back-to-back, verifying get_pose() produces sane,
visually-distinct, non-crashing poses for each — including the
root-moving ones (sit_down, walk_in) that return a root offset alongside
rotations.

Run:
    blender -b -P blender/test_actions.py
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gp_character import build_character  # noqa: E402
from characters import BA_TU_PARTS, BA_TU_SKIN  # noqa: E402
from actions import get_pose  # noqa: E402
from talking_mouth import jaw_scale  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES_DIR = os.path.join(REPO_ROOT, "blender", "out", "actions_frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

FPS = 24
# One 2-second segment per action, back to back.
SEQUENCE = [
    "idle", "gesture_explain", "stir_pot", "wave", "point", "hug",
    "cough", "laugh", "eat", "drink", "sit_down", "walk_in",
]
SECONDS_PER_ACTION = 2
TOTAL_FRAMES = FPS * SECONDS_PER_ACTION * len(SEQUENCE)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 0
scene.frame_end = TOTAL_FRAMES - 1
scene.view_settings.view_transform = "Standard"

camera_data = bpy.data.cameras.new("Cam")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3.2
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
world.node_tree.nodes["Background"].inputs[0].default_value = (0.96, 0.9, 0.8, 1.0)

ba_tu = build_character("BaTu", BA_TU_PARTS, BA_TU_SKIN, origin=(0, 0, 0), scale=1.0)

for f in range(TOTAL_FRAMES):
    action_index = f // (FPS * SECONDS_PER_ACTION)
    action_name = SEQUENCE[min(action_index, len(SEQUENCE) - 1)]
    t_in_action = (f % (FPS * SECONDS_PER_ACTION)) / FPS

    rotations, root_offset = get_pose(action_name, t_in_action)
    root_location = None
    if root_offset is not None:
        root_location = (root_offset.get("x", 0.0), 0.0, root_offset.get("z", 0.0))

    ba_tu.pose(
        f,
        rotations,
        root_location=root_location,
        scales={"jaw": jaw_scale(f, action_name == "gesture_explain")},
    )

print("ACTIONS_POSED:", TOTAL_FRAMES, "across", len(SEQUENCE), "actions")

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 480
scene.render.resolution_y = 480
scene.render.filepath = os.path.join(FRAMES_DIR, "frame_")
scene.render.image_settings.file_format = "PNG"
# Only render one representative frame per action (mid-segment) instead
# of every frame — this is a pose-sanity check, not a final render, and
# rendering all ~576 frames here would waste time better spent iterating.
bpy.context.scene.frame_start = 0
for i, action_name in enumerate(SEQUENCE):
    mid_frame = i * FPS * SECONDS_PER_ACTION + FPS  # 1s into each 2s segment
    scene.frame_set(mid_frame)
    scene.render.filepath = os.path.join(FRAMES_DIR, f"{i:02d}_{action_name}.png")
    bpy.ops.render.render(write_still=True)

print("ACTIONS_RENDER_DONE:", FRAMES_DIR)
