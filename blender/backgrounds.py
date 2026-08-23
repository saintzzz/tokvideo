"""
Static location backgrounds for "Nha Ba Tu" episodes. Built from plain
mesh planes with an Emission-shader material instead of Grease Pencil —
backgrounds don't need strokes/fill/armature deform, and Emission gives
the same flat, unlit-by-scene-lights look already established for
characters (layer.use_lights = False) without touching any of the GP-
specific quirks documented in gp_character.py. One less place to hit a
GPv3 bug for a beat that just needs a wall and a window behind the actors.

Each build_* function returns nothing useful (the objects are just linked
into the scene) — call it once per render, same pattern as build_character.
Depth (world Y) is used to layer background elements behind characters:
characters sit at y=0 (see gp_character.py), background pieces sit at
increasingly POSITIVE y the further back they are meant to read.

Sign convention, confirmed the hard way (2026-08-24): every camera in
this codebase sits at y=-10 looking toward +Y (see gp_character.py's test
scripts). Distance from camera = object_y - (-10) = object_y + 10 — so a
MORE NEGATIVE y is CLOSER to the camera, not farther. An earlier version
of this module used negative y for "farther back" (the opposite of
correct) and the result was background elements silently occluding each
other in the wrong order (a wall closer to the camera than the counter
it was supposed to sit behind, hiding it completely) — confirmed via an
isolated wall+counter render before this fix. Positive y, increasing
with distance, matches the actual camera setup everywhere else.
"""

import bpy


def flat_quad(name, center, size, color, y=2.0):
    """A single flat-colored rectangle, unlit (Emission), facing the
    camera. `center`/`size` are (x, z) tuples in world units; `y` places
    it at a specific depth behind the y=0 character plane (positive =
    farther from camera, see module docstring)."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    cx, cz = center
    sx, sz = size
    verts = [
        (cx - sx / 2, y, cz - sz / 2),
        (cx + sx / 2, y, cz - sz / 2),
        (cx + sx / 2, y, cz + sz / 2),
        (cx - sx / 2, y, cz + sz / 2),
    ]
    faces = [(0, 1, 2, 3)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    mat = bpy.data.materials.new(f"{name}_mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    output = nodes.new("ShaderNodeOutputMaterial")
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    obj.data.materials.append(mat)

    return obj


# --- Nha Ba Tu (kitchen/living area) --------------------------------------
def build_nha_ba_tu():
    wall = (0.92, 0.85, 0.72, 1.0)
    floor = (0.55, 0.42, 0.32, 1.0)
    window_frame = (0.4, 0.28, 0.18, 1.0)
    window_glass = (0.55, 0.72, 0.82, 1.0)
    counter = (0.35, 0.25, 0.18, 1.0)
    counter_top = (0.45, 0.33, 0.24, 1.0)
    pot = (0.25, 0.25, 0.27, 1.0)

    objs = [
        flat_quad("bg_wall", (0, 2.0), (12, 6), wall, y=3.0),
        flat_quad("bg_floor", (0, -0.6), (12, 1.6), floor, y=2.9),
        flat_quad("bg_window_frame", (1.6, 2.3), (1.3, 1.3), window_frame, y=2.8),
        flat_quad("bg_window_glass", (1.6, 2.3), (1.1, 1.1), window_glass, y=2.75),
        flat_quad("bg_counter", (-1.7, -0.15), (1.6, 0.9), counter, y=2.4),
        flat_quad("bg_counter_top", (-1.7, 0.32), (1.7, 0.08), counter_top, y=2.35),
        flat_quad("bg_pot", (-1.7, 0.5), (0.35, 0.22), pot, y=2.3),
    ]
    return objs


# --- Ngo xom (neighborhood alley) -----------------------------------------
def build_ngo_xom():
    sky = (0.75, 0.85, 0.88, 1.0)
    path = (0.6, 0.56, 0.5, 1.0)
    house_l = (0.78, 0.55, 0.42, 1.0)
    house_r = (0.68, 0.62, 0.5, 1.0)
    roof = (0.45, 0.3, 0.24, 1.0)

    objs = [
        flat_quad("bg_sky", (0, 2.5), (14, 5), sky, y=3.5),
        flat_quad("bg_path", (0, -1.0), (14, 2.0), path, y=3.0),
        flat_quad("bg_house_l", (-3.5, 1.2), (2.5, 3.0), house_l, y=2.9),
        flat_quad("bg_house_l_roof", (-3.5, 2.9), (2.9, 0.5), roof, y=2.85),
        flat_quad("bg_house_r", (3.5, 1.0), (2.5, 2.6), house_r, y=2.9),
        flat_quad("bg_house_r_roof", (3.5, 2.5), (2.9, 0.5), roof, y=2.85),
    ]
    return objs


# --- Quan Co Sau (small food stall) ---------------------------------------
def build_quan_co_sau():
    sky = (0.78, 0.87, 0.9, 1.0)
    ground = (0.58, 0.53, 0.46, 1.0)
    awning = (0.75, 0.35, 0.32, 1.0)
    awning_stripe = (0.92, 0.88, 0.8, 1.0)
    stall = (0.5, 0.38, 0.28, 1.0)
    stall_top = (0.6, 0.46, 0.34, 1.0)
    pan = (0.3, 0.3, 0.32, 1.0)

    objs = [
        flat_quad("bg_sky2", (0, 2.6), (14, 5), sky, y=3.5),
        flat_quad("bg_ground2", (0, -1.0), (14, 2.0), ground, y=3.0),
        flat_quad("bg_awning", (0, 2.6), (5.5, 0.7), awning, y=2.9),
        flat_quad("bg_awning_stripe", (0, 2.4), (5.5, 0.15), awning_stripe, y=2.85),
        flat_quad("bg_stall", (0, 0.1), (4.5, 1.3), stall, y=2.4),
        flat_quad("bg_stall_top", (0, 0.8), (4.7, 0.1), stall_top, y=2.35),
        flat_quad("bg_pan", (0.8, 0.95), (0.5, 0.15), pan, y=2.3),
    ]
    return objs


BUILDERS = {
    "nha_ba_tu": build_nha_ba_tu,
    "ngo_xom": build_ngo_xom,
    "quan_co_sau": build_quan_co_sau,
}


def build_location(location_name):
    builder = BUILDERS.get(location_name)
    if builder is None:
        return []
    return builder()
