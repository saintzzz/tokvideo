"""
Feasibility proof-of-concept for the "real 2D animated film" track (2026-08-24,
channel owner asked for Tom & Jerry-caliber animation as a quality bar, not a
literal clone: dynamic backgrounds, real moving imagery, multi-character
slapstick, not the current flat talking-head SVG rig used by the Shorts
pipeline).

Builds ONE simple bouncing/squashing ball, hand-keyframed frame-by-frame as
distinct Grease Pencil drawings (the real "cel animation" workflow: each
frame is its own stroke data, not a tweened rig deformation), fully
headlessly via `blender -b -P poc_bouncing_ball.py` — no GUI, no Studio,
matches the existing free/open-source/no-account/scriptable requirement the
same way Theatre.js did for the SVG track.

Run:
    blender -b -P blender/poc_bouncing_ball.py

Output: blender/out/poc_bouncing_ball.mp4
"""

import math
import os

import bpy

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "blender", "out")
os.makedirs(OUT_DIR, exist_ok=True)

FPS = 24
DURATION_SECONDS = 2
TOTAL_FRAMES = FPS * DURATION_SECONDS

# Start from a totally empty scene — no default cube/camera/light — since
# this runs headless and we want the script to be the sole source of truth.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 0
scene.frame_end = TOTAL_FRAMES - 1

# --- Camera -----------------------------------------------------------
camera_data = bpy.data.cameras.new("PocCamera")
camera_data.type = "ORTHO"
# 6 units wide (auto-fits the larger 640px dimension) comfortably covers
# the ball's full travel path (x: -2.1..2.1) and bounce height
# (z: GROUND_Y=-1.6 .. GROUND_Y+RADIUS+DROP_HEIGHT=+0.8) with margin — the
# first version (ortho_scale=4, visible z range only +-1.125) clipped the
# ball into the bottom-left corner of frame 0.
camera_data.ortho_scale = 6
camera_obj = bpy.data.objects.new("PocCamera", camera_data)
camera_obj.location = (0, -10, 0)
camera_obj.rotation_euler = (math.radians(90), 0, 0)
bpy.context.collection.objects.link(camera_obj)
scene.camera = camera_obj

# --- Light --------------------------------------------------------------
light_data = bpy.data.lights.new("PocSun", type="SUN")
light_data.energy = 3.0
light_obj = bpy.data.objects.new("PocSun", light_data)
light_obj.rotation_euler = (math.radians(45), 0, math.radians(45))
bpy.context.collection.objects.link(light_obj)

# --- World background (flat sky blue, so the ball reads against something
# other than plain black — a stand-in for a real background plate later) --
world = bpy.data.worlds.new("PocWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.55, 0.75, 0.95, 1.0)

# Blender 4.0+ defaults to the AgX view transform, which desaturates/tone-
# maps colors quite a bit (the sky blue above rendered as flat gray in the
# first pass) — Standard gives predictable, WYSIWYG colors, which matters
# more for a character-animation pipeline than filmic contrast.
scene.view_settings.view_transform = "Standard"

# --- Grease Pencil ball ---------------------------------------------------
gp_data = bpy.data.grease_pencils.new("PocBall")
gp_obj = bpy.data.objects.new("PocBall", gp_data)
bpy.context.collection.objects.link(gp_obj)

mat = bpy.data.materials.new("PocBallMat")
bpy.data.materials.create_gpencil_data(mat)
mat.grease_pencil.color = (0.85, 0.2, 0.15, 1.0)
mat.grease_pencil.fill_color = (0.9, 0.35, 0.1, 1.0)
mat.grease_pencil.show_fill = True
mat.grease_pencil.show_stroke = True
# show_fill alone wasn't enough — fill_style defaults to 'NONE', which is
# the actual reason the first render came back as an outline with no fill
# at all (is_fill_visible = show_fill AND fill_style != 'NONE').
mat.grease_pencil.fill_style = "SOLID"
gp_data.materials.append(mat)

layer = gp_data.layers.new("ball_layer")
# Flat/unlit colors — real 2D cel animation reads as flat ink, not
# PBR-shaded 3D geometry; without this the sun light darkens the fill into
# a muddy brown regardless of the color values set below.
layer.use_lights = False

N_POINTS = 16
RADIUS = 0.6
GROUND_Y = -1.6
DROP_HEIGHT = 1.8


def ease_out_bounce(t: float) -> float:
    """A single classic squash-and-stretch bounce arc, 0..1 -> 0..1
    (0 = apex/start, 1 = ground contact), used to drive both the vertical
    position and the squash amount so impact and deformation land on the
    same frame instead of drifting apart."""
    return math.sin(t * math.pi)


for frame_number in range(TOTAL_FRAMES):
    t = frame_number / (TOTAL_FRAMES - 1)

    # Two bounce cycles, second one lower (energy loss) — the minimum
    # "does this actually read as physical" test for a from-scratch rig.
    cycle_t = (t * 2) % 1
    bounce_index = 0 if t < 0.5 else 1
    drop_height = DROP_HEIGHT if bounce_index == 0 else DROP_HEIGHT * 0.5

    height = ease_out_bounce(cycle_t) * drop_height
    center_y = GROUND_Y + RADIUS + height

    # Squash right at ground contact (cycle_t near 0 or 1), stretch at the
    # peak of the fall (cycle_t near 0.5) — real squash-and-stretch, not
    # just a moving circle.
    contact_amount = 1 - min(abs(cycle_t - 0) * 6, abs(cycle_t - 1) * 6, 1)
    stretch_amount = max(0, 1 - abs(cycle_t - 0.5) * 4)

    scale_y = 1.0 - 0.35 * contact_amount + 0.25 * stretch_amount
    scale_x = 1.0 + 0.30 * contact_amount - 0.15 * stretch_amount

    center_x = -1.5 + 3.0 * t  # travels left to right across the frame

    frame = layer.frames.new(frame_number)
    drawing = frame.drawing
    drawing.add_strokes([N_POINTS])
    stroke = drawing.strokes[0]
    stroke.cyclic = True
    stroke.fill_color = (0.9, 0.35, 0.1, 1.0)
    stroke.fill_opacity = 1.0
    # fill_id defaults to 0, which means "not filled" (a 5.2-added,
    # barely-documented per-stroke attribute) — every prior render came
    # back as an unfilled outline until this was set to a non-zero group id.
    stroke.fill_id = 1

    pos_attr = drawing.attributes["position"]
    radius_attr = drawing.attributes.new(name="radius", type="FLOAT", domain="POINT")
    for i in range(N_POINTS):
        ang = 2 * math.pi * i / N_POINTS
        x = math.cos(ang) * RADIUS * scale_x + center_x
        y = math.sin(ang) * RADIUS * scale_y + center_y
        pos_attr.data[i].vector = (x, 0.0, y)
        radius_attr.data[i].value = 0.015

print(f"POC_DRAWINGS_CREATED: {TOTAL_FRAMES}")

# --- Render ---------------------------------------------------------------
# This Blender build has no baked-in FFMPEG output support (PNG/EXR/etc.
# only, per its image_settings.file_format enum) — render a PNG sequence
# here and encode it to mp4 in a separate step using the ffmpeg binary the
# existing Remotion pipeline already bundles
# (node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe), instead of
# requiring a system-wide ffmpeg install.
FRAMES_DIR = os.path.join(OUT_DIR, "frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 640
scene.render.resolution_y = 360
scene.render.filepath = os.path.join(FRAMES_DIR, "frame_")
scene.render.image_settings.file_format = "PNG"

bpy.ops.render.render(animation=True)

print(f"POC_RENDER_DONE: {FRAMES_DIR}")
