"""
Reusable articulated 2D character rig for Blender Grease Pencil (bpy),
built on a REAL Armature — the professional 2D-rigging technique: draw
each body part once, bind its points to a vertex group named after the
bone that should move it, add a GREASE_PENCIL_ARMATURE modifier pointing
at the armature, then animate by keyframing bone pose rotations.

This is a deliberate upgrade from poc_bouncing_ball.py's technique
(rewriting every stroke point's position by hand each frame) — that's
fine for one rigid prop, far too limited for a full character that needs
natural elbow/knee bends, arm gestures, walking, etc. across a ~20 minute
film. This module is the reusable "tool" for that (same spirit as
src/theatre-rig.ts on the SVG track): define a skeleton once, then pose
any character built on it with a plain Python dict of bone rotations per
frame instead of hand-authoring geometry.

Usage sketch:
    char = build_character("Grandma", parts=GRANDMA_PARTS, origin=(0,0,0))
    char.pose(frame=10, {"upperarm_L": 25, "forearm_L": -40, "head": 5})
"""

import math

import bpy

# ---------------------------------------------------------------------
# Skeleton definition — a simple, general-purpose humanoid chain, offsets
# in local character space (x = left/right, z = up), one unit ~= one
# "head height" for easy reasoning. Mirrored L/R bones share the same
# offsets mirrored on x. Every bone rotates around its head joint on the
# Y axis (the only rotation axis that matters for a flat 2D character
# facing the camera along -Y).
# ---------------------------------------------------------------------
BONE_SPEC = {
    "hips": {"head": (0, 0, 0.9), "tail": (0, 0, 1.05), "parent": None},
    "spine": {"head": (0, 0, 1.05), "tail": (0, 0, 1.35), "parent": "hips"},
    "neck": {"head": (0, 0, 1.35), "tail": (0, 0, 1.45), "parent": "spine"},
    "head": {"head": (0, 0, 1.45), "tail": (0, 0, 1.75), "parent": "neck"},
    "shoulder_L": {"head": (0, 0, 1.32), "tail": (0.18, 0, 1.28), "parent": "spine"},
    "upperarm_L": {"head": (0.18, 0, 1.28), "tail": (0.3, 0, 1.02), "parent": "shoulder_L"},
    "forearm_L": {"head": (0.3, 0, 1.02), "tail": (0.38, 0, 0.8), "parent": "upperarm_L"},
    "hand_L": {"head": (0.38, 0, 0.8), "tail": (0.43, 0, 0.72), "parent": "forearm_L"},
    "shoulder_R": {"head": (0, 0, 1.32), "tail": (-0.18, 0, 1.28), "parent": "spine"},
    "upperarm_R": {"head": (-0.18, 0, 1.28), "tail": (-0.3, 0, 1.02), "parent": "shoulder_R"},
    "forearm_R": {"head": (-0.3, 0, 1.02), "tail": (-0.38, 0, 0.8), "parent": "upperarm_R"},
    "hand_R": {"head": (-0.38, 0, 0.8), "tail": (-0.43, 0, 0.72), "parent": "forearm_R"},
    "thigh_L": {"head": (0.09, 0, 0.9), "tail": (0.1, 0, 0.48), "parent": "hips"},
    "shin_L": {"head": (0.1, 0, 0.48), "tail": (0.11, 0, 0.05), "parent": "thigh_L"},
    "foot_L": {"head": (0.11, 0, 0.05), "tail": (0.11, 0.12, 0.0), "parent": "shin_L"},
    "thigh_R": {"head": (-0.09, 0, 0.9), "tail": (-0.1, 0, 0.48), "parent": "hips"},
    "shin_R": {"head": (-0.1, 0, 0.48), "tail": (-0.11, 0, 0.05), "parent": "thigh_R"},
    "foot_R": {"head": (-0.11, 0, 0.05), "tail": (-0.11, 0.12, 0.0), "parent": "shin_R"},
}


def build_armature(name, origin=(0.0, 0.0, 0.0), scale=1.0):
    """Creates the shared skeleton and returns the armature object."""
    arm_data = bpy.data.armatures.new(f"{name}_Armature")
    arm_obj = bpy.data.objects.new(f"{name}_Armature", arm_data)
    arm_obj.location = origin
    arm_obj.scale = (scale, scale, scale)
    bpy.context.collection.objects.link(arm_obj)

    prev_active = bpy.context.view_layer.objects.active
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")
    edit_bones = arm_data.edit_bones
    for bone_name, spec in BONE_SPEC.items():
        eb = edit_bones.new(bone_name)
        eb.head = spec["head"]
        eb.tail = spec["tail"]
    for bone_name, spec in BONE_SPEC.items():
        if spec["parent"]:
            edit_bones[bone_name].parent = edit_bones[spec["parent"]]
            edit_bones[bone_name].use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.objects.active = prev_active

    return arm_obj


def _add_filled_stroke(drawing, points, radius=0.02):
    """points: list of (x, y, z) tuples forming a closed polygon.

    Always writes material_index=0 — this is only ever called on a GP
    object that has EXACTLY ONE material (see the per-color object split
    in build_character below). Confirmed empirically (2026-08-24) that
    Blender 5.2's EEVEE-Next Grease Pencil draw engine only renders
    material slot 0's fill color for every stroke in an object, no matter
    what each stroke's real `material_index` is set to (verified via a
    minimal 3-stroke/3-material/3-color test — all three rendered as
    material 0's color). Per-stroke `fill_color` has the same problem, so
    neither Python-level property is a usable workaround; one material
    per GP object is the only combination confirmed to render correctly.
    """
    n = len(points)
    drawing.add_strokes([n])
    stroke = drawing.strokes[-1]
    stroke.cyclic = True
    stroke.fill_opacity = 1.0
    stroke.fill_id = 1
    stroke.material_index = 0
    pos_attr = drawing.attributes["position"]
    radius_attr = drawing.attributes.get("radius") or drawing.attributes.new(
        name="radius", type="FLOAT", domain="POINT"
    )
    start = len(pos_attr.data) - n
    for i, p in enumerate(points):
        pos_attr.data[start + i].vector = p
        radius_attr.data[start + i].value = radius
    return stroke, list(range(start, start + n))


def _oval_points(cx, cz, rx, rz, n=12, cy=0.0):
    return [
        (
            cx + math.cos(2 * math.pi * i / n) * rx,
            cy,
            cz + math.sin(2 * math.pi * i / n) * rz,
        )
        for i in range(n)
    ]


class Character:
    def __init__(self, name, gp_objs, arm_obj):
        self.name = name
        self.gp_objs = gp_objs  # one GP object per distinct fill color
        self.gp_obj = gp_objs[0] if gp_objs else None  # back-compat convenience
        self.arm_obj = arm_obj

    def pose(self, frame, rotations_deg, root_location=None, root_rotation_deg=0.0):
        """Keyframe this character's bone rotations (degrees, Y axis) at
        `frame`. `rotations_deg` is a dict of {bone_name: degrees}; bones
        not mentioned hold their previous keyframed value (standard
        Blender keyframe behavior), so callers only need to specify what
        changed for this pose. `root_location`/`root_rotation_deg` move
        the whole character (walking, standing up, etc.) via the armature
        object's own transform, independent of the internal bone chain.
        """
        pbones = self.arm_obj.pose.bones
        for bone_name, degrees in rotations_deg.items():
            pbone = pbones[bone_name]
            pbone.rotation_mode = "XYZ"
            pbone.rotation_euler = (0, math.radians(degrees), 0)
            pbone.keyframe_insert(data_path="rotation_euler", frame=frame)

        if root_location is not None:
            self.arm_obj.location = root_location
            self.arm_obj.keyframe_insert(data_path="location", frame=frame)
        self.arm_obj.rotation_euler = (0, math.radians(root_rotation_deg), 0)
        self.arm_obj.keyframe_insert(data_path="rotation_euler", frame=frame)


def _make_single_color_material(name, color):
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    mat.grease_pencil.show_fill = True
    mat.grease_pencil.show_stroke = True
    mat.grease_pencil.fill_style = "SOLID"
    mat.grease_pencil.fill_color = color
    mat.grease_pencil.color = tuple(c * 0.6 for c in color[:3]) + (1.0,)
    return mat


def build_character(name, parts, skin_color, origin=(0.0, 0.0, 0.0), scale=1.0):
    """`parts` is a dict of {bone_name: [shape, ...]} where each shape is
    either a plain point list (uses `skin_color`) or a
    {"points": [...], "color": (r,g,b,a), "radius": float} dict. Multiple
    parts may target the same bone (e.g. an eye and eyebrow both riding
    on "head").

    Builds ONE Grease Pencil object PER DISTINCT COLOR (see
    _add_filled_stroke's docstring for why — multi-material objects
    render wrong in this Blender build), each bound to a shared Armature
    via per-part vertex groups matching bone names, and returns a posable
    Character wrapping all of them.
    """
    arm_obj = build_armature(name, origin=origin, scale=scale)

    # Group every shape by its resolved color first, so each color gets
    # exactly one GP object with exactly one material.
    by_color = {}
    for bone_name, shapes in parts.items():
        for shape in shapes:
            fill_color = shape.get("color", skin_color) if isinstance(shape, dict) else skin_color
            points = shape["points"] if isinstance(shape, dict) else shape
            radius = shape.get("radius", 0.015) if isinstance(shape, dict) else 0.015
            key = tuple(round(c, 4) for c in fill_color)
            by_color.setdefault(key, []).append((bone_name, points, radius))

    gp_objs = []
    for color_index, (color, entries) in enumerate(by_color.items()):
        gp_data = bpy.data.grease_pencils.new(f"{name}_GP_{color_index}")
        gp_obj = bpy.data.objects.new(f"{name}_GP_{color_index}", gp_data)
        gp_obj.location = origin
        gp_obj.scale = (scale, scale, scale)
        bpy.context.collection.objects.link(gp_obj)
        gp_data.materials.append(
            _make_single_color_material(f"{name}_Mat_{color_index}", color)
        )

        layer = gp_data.layers.new(f"{name}_part_{color_index}")
        layer.use_lights = False
        frame0 = layer.frames.new(0)
        drawing = frame0.drawing

        for bone_name, points, radius in entries:
            vg = gp_obj.vertex_groups.get(bone_name) or gp_obj.vertex_groups.new(
                name=bone_name
            )
            stroke, indices = _add_filled_stroke(drawing, points, radius)
            drawing.vertex_group_assign(
                vgroup_name=bone_name, indices_ptr=indices, weight=1.0
            )

        mod = gp_obj.modifiers.new(name="Armature", type="GREASE_PENCIL_ARMATURE")
        mod.object = arm_obj
        mod.use_vertex_groups = True
        gp_objs.append(gp_obj)

    return Character(name, gp_objs, arm_obj)
