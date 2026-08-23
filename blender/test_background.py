"""
Proof test: a static location background (nha_ba_tu) composited with a
posed character in front of it — confirms depth ordering (background
behind, at negative Y; character at y=0 draws on top) and that the flat
Emission-shaded background reads correctly under the same camera/render
settings as every character test so far.

Run:
    blender -b -P blender/test_background.py
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gp_character import build_character  # noqa: E402
from characters import BA_TU_PARTS, BA_TU_SKIN  # noqa: E402
from backgrounds import build_location  # noqa: E402
from actions import get_pose  # noqa: E402
from talking_mouth import jaw_scale  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "blender", "out")
os.makedirs(OUT_DIR, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.view_settings.view_transform = "Standard"

camera_data = bpy.data.cameras.new("Cam")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 5
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

build_location("nha_ba_tu")

ba_tu = build_character("BaTu", BA_TU_PARTS, BA_TU_SKIN, origin=(-1.0, 0, 0), scale=1.0)
rotations, _ = get_pose("stir_pot", 1.0)
ba_tu.pose(0, rotations, scales={"jaw": jaw_scale(0, True)})

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.frame_set(0)
scene.render.filepath = os.path.join(OUT_DIR, "test_background.png")
scene.render.image_settings.file_format = "PNG"
bpy.ops.render.render(write_still=True)
print("BACKGROUND_TEST_DONE:", scene.render.filepath)
