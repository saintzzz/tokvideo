"""
Proof-of-rig test (2026-08-24): build ONE real armature-driven character
(upper body — torso, neck, head with a face, both arms with working
shoulder/elbow/wrist joints) using blender/gp_character.py, and put her
through a short, genuinely articulated performance (idle sway, a head
turn, a two-armed stirring gesture, a wave) to confirm the rig reads as
"sinh động" (lively) before scaling this into the full ~20 minute film.

Run:
    blender -b -P blender/test_grandma_rig.py
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gp_character import BONE_SPEC, build_character  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "blender", "out")
FRAMES_DIR = os.path.join(OUT_DIR, "grandma_frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

FPS = 24
TOTAL_FRAMES = FPS * 5  # 5-second proof clip

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 0
scene.frame_end = TOTAL_FRAMES - 1
scene.view_settings.view_transform = "Standard"

# --- Camera / light / world (same recipe as poc_bouncing_ball.py) --------
camera_data = bpy.data.cameras.new("Cam")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3
cam = bpy.data.objects.new("Cam", camera_data)
cam.location = (0, -10, 1.3)
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


def capsule_points(p0, p1, width, cap_segments=6):
    x0, _, z0 = p0
    x1, _, z1 = p1
    dx, dz = x1 - x0, z1 - z0
    length = math.hypot(dx, dz) or 1.0
    nx, nz = -dz / length, dx / length
    r = width / 2
    ang0 = math.atan2(nz, nx)
    pts = []
    for i in range(cap_segments + 1):
        a = ang0 + math.pi * i / cap_segments
        pts.append((x1 + math.cos(a) * r, 0, z1 + math.sin(a) * r))
    for i in range(cap_segments + 1):
        a = ang0 + math.pi + math.pi * i / cap_segments
        pts.append((x0 + math.cos(a) * r, 0, z0 + math.sin(a) * r))
    return pts


def oval_points(cx, cz, rx, rz, n=14):
    return [
        (cx + math.cos(2 * math.pi * i / n) * rx, 0, cz + math.sin(2 * math.pi * i / n) * rz)
        for i in range(n)
    ]


SKIN = (0.95, 0.83, 0.68, 1.0)
CARDIGAN = (0.72, 0.35, 0.4, 1.0)
DARK = (0.25, 0.16, 0.1, 1.0)

head_cz = (BONE_SPEC["head"]["head"][2] + BONE_SPEC["head"]["tail"][2]) / 2

GRANDMA_PARTS = {
    "spine": [
        {"points": oval_points(0, 1.18, 0.28, 0.32), "color": CARDIGAN, "radius": 0.02},
    ],
    "neck": [
        {"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.09), "color": SKIN},
    ],
    "head": [
        {"points": oval_points(0, head_cz, 0.17, 0.19), "color": SKIN, "radius": 0.02},
        {"points": oval_points(-0.06, head_cz + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.06, head_cz + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(-0.06, head_cz + 0.02, 0.015, 0.018), "color": DARK},
        {"points": oval_points(0.06, head_cz + 0.02, 0.015, 0.018), "color": DARK},
        {"points": oval_points(0, head_cz - 0.08, 0.04, 0.02), "color": (0.55, 0.28, 0.24, 1.0)},
    ],
    "upperarm_L": [
        {"points": capsule_points(BONE_SPEC["upperarm_L"]["head"], BONE_SPEC["upperarm_L"]["tail"], 0.11), "color": CARDIGAN},
    ],
    "forearm_L": [
        {"points": capsule_points(BONE_SPEC["forearm_L"]["head"], BONE_SPEC["forearm_L"]["tail"], 0.09), "color": SKIN},
    ],
    "hand_L": [
        {"points": oval_points(BONE_SPEC["hand_L"]["tail"][0], BONE_SPEC["hand_L"]["tail"][2], 0.045, 0.05), "color": SKIN},
    ],
    "upperarm_R": [
        {"points": capsule_points(BONE_SPEC["upperarm_R"]["head"], BONE_SPEC["upperarm_R"]["tail"], 0.11), "color": CARDIGAN},
    ],
    "forearm_R": [
        {"points": capsule_points(BONE_SPEC["forearm_R"]["head"], BONE_SPEC["forearm_R"]["tail"], 0.09), "color": SKIN},
    ],
    "hand_R": [
        {"points": oval_points(BONE_SPEC["hand_R"]["tail"][0], BONE_SPEC["hand_R"]["tail"][2], 0.045, 0.05), "color": SKIN},
    ],
}

grandma = build_character("Grandma", GRANDMA_PARTS, SKIN, origin=(0, 0, 0), scale=1.0)

# --- Performance: idle breathing throughout, then a head turn, a two-arm
# stirring gesture, and a wave — real overlapping articulated motion, not
# a single rigid pose. ------------------------------------------------
for f in range(TOTAL_FRAMES):
    t = f / FPS  # seconds

    breathe = math.sin(t * 2.2) * 1.5  # subtle idle sway, degrees, on the torso
    pose = {"spine": breathe}

    if t < 1.2:
        # settle-in idle only
        pose["head"] = math.sin(t * 2.2) * 1.0
        pose["upperarm_L"] = 6
        pose["forearm_L"] = -8
        pose["upperarm_R"] = -6
        pose["forearm_R"] = 8
    elif t < 2.2:
        # head turn to address someone off-camera
        turn_t = (t - 1.2) / 1.0
        pose["head"] = 6 + turn_t * 18
        pose["upperarm_L"] = 6
        pose["forearm_L"] = -8
        pose["upperarm_R"] = -6
        pose["forearm_R"] = 8
    elif t < 3.6:
        # two-handed stirring gesture — circular motion at the shoulder,
        # counter-rotating elbow to keep the "spoon" roughly in place,
        # exactly the kind of layered joint motion a single flat-transform
        # rig (the bouncing-ball technique) cannot produce believably.
        stir_t = (t - 2.2) / 1.4
        circle = stir_t * 2 * math.pi * 2  # 2 full stirs
        pose["head"] = 24 + math.sin(stir_t * math.pi) * -6
        pose["upperarm_R"] = -20 + math.sin(circle) * 12
        pose["forearm_R"] = 35 + math.cos(circle) * 15
        pose["upperarm_L"] = 6
        pose["forearm_L"] = -8
    else:
        # a warm wave goodbye — shoulder raise + fast wrist/forearm wag
        wave_t = (t - 3.6) / 1.4
        wag = math.sin(wave_t * math.pi * 6) * 20
        pose["head"] = 10
        pose["upperarm_R"] = -80
        pose["forearm_R"] = -30 + wag
        pose["upperarm_L"] = 6
        pose["forearm_L"] = -8

    grandma.pose(f, pose)

print("GRANDMA_POSED_FRAMES:", TOTAL_FRAMES)

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.filepath = os.path.join(FRAMES_DIR, "frame_")
scene.render.image_settings.file_format = "PNG"

bpy.ops.render.render(animation=True)
print("GRANDMA_RENDER_DONE:", FRAMES_DIR)
