"""
Proof test: two independently-positioned, independently-posed characters
(Ba Tu and Mai) sharing one scene — the minimum bar for any real episode
shot, since almost every scene in series-bible.json involves 2+ people
talking. Confirms characters.py's shared parts + gp_character's per-
character armature/object isolation both hold up with more than one
character on screen at once (nothing in the rig is accidentally global).

Run:
    blender -b -P blender/test_two_characters.py
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gp_character import build_character  # noqa: E402
from characters import BA_TU_PARTS, BA_TU_SKIN, MAI_PARTS, MAI_SKIN  # noqa: E402
from talking_mouth import jaw_scale  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES_DIR = os.path.join(REPO_ROOT, "blender", "out", "two_char_frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

FPS = 24
TOTAL_FRAMES = FPS * 3

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 0
scene.frame_end = TOTAL_FRAMES - 1
scene.view_settings.view_transform = "Standard"

camera_data = bpy.data.cameras.new("Cam")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 4.5
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

ba_tu = build_character("BaTu", BA_TU_PARTS, BA_TU_SKIN, origin=(-0.7, 0, 0), scale=1.0)
mai = build_character("Mai", MAI_PARTS, MAI_SKIN, origin=(0.9, 0, 0), scale=0.85)

for f in range(TOTAL_FRAMES):
    t = f / FPS
    # Ba Tu speaks for the first half, Mai for the second — proves the
    # jaw-scale talking animation is independent per character and
    # correctly silent when a character isn't the one speaking (a beat
    # where one person listens with a closed mouth while the other talks
    # is the overwhelmingly common case across ep-01's 90 beats).
    ba_tu_speaking = t < 1.5
    mai_speaking = t >= 1.5

    ba_tu.pose(f, {
        "spine": math.sin(t * 2.0) * 1.2,
        "head": 8 + math.sin(t * 1.5) * 4,
        "upperarm_L": 6, "forearm_L": -8,
        "upperarm_R": -18 + math.sin(t * 3) * 6, "forearm_R": 30,
    }, scales={"jaw": jaw_scale(f, ba_tu_speaking)})
    mai.pose(f, {
        "spine": math.sin(t * 2.3 + 1) * 1.4,
        "head": -10 + math.sin(t * 1.8) * 5,
        "upperarm_L": 10, "forearm_L": -20,
        "upperarm_R": -8, "forearm_R": 6,
    }, scales={"jaw": jaw_scale(f, mai_speaking)})

print("TWO_CHAR_POSED:", TOTAL_FRAMES)

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 854
scene.render.resolution_y = 480
scene.render.filepath = os.path.join(FRAMES_DIR, "frame_")
scene.render.image_settings.file_format = "PNG"
bpy.ops.render.render(animation=True)
print("TWO_CHAR_RENDER_DONE:", FRAMES_DIR)
