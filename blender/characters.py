"""
Shared character-part definitions for the "Nha Ba Tu" animated-film
series, built on blender/gp_character.py's armature rig. Each entry is a
`parts` dict ready to pass to `build_character(name, PARTS, skin_color,
origin=..., scale=...)`.

Only Ba Tu and Mai are defined so far (the two characters in episode 1) —
more are added here as production reaches episodes that need them, rather
than building all 9 named characters blind before any of them are used in
a real render.
"""

import math

from gp_character import BONE_SPEC


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


_HEAD_CZ = (BONE_SPEC["head"]["head"][2] + BONE_SPEC["head"]["tail"][2]) / 2


def _limb_parts(skin, sleeve):
    """Both arms (shoulder-elbow-wrist), the part every character needs —
    shared helper so Ba Tu/Mai/future characters don't repeat this."""
    return {
        "upperarm_L": [{"points": capsule_points(BONE_SPEC["upperarm_L"]["head"], BONE_SPEC["upperarm_L"]["tail"], 0.11), "color": sleeve}],
        "forearm_L": [{"points": capsule_points(BONE_SPEC["forearm_L"]["head"], BONE_SPEC["forearm_L"]["tail"], 0.09), "color": skin}],
        "hand_L": [{"points": oval_points(BONE_SPEC["hand_L"]["tail"][0], BONE_SPEC["hand_L"]["tail"][2], 0.045, 0.05), "color": skin}],
        "upperarm_R": [{"points": capsule_points(BONE_SPEC["upperarm_R"]["head"], BONE_SPEC["upperarm_R"]["tail"], 0.11), "color": sleeve}],
        "forearm_R": [{"points": capsule_points(BONE_SPEC["forearm_R"]["head"], BONE_SPEC["forearm_R"]["tail"], 0.09), "color": skin}],
        "hand_R": [{"points": oval_points(BONE_SPEC["hand_R"]["tail"][0], BONE_SPEC["hand_R"]["tail"][2], 0.045, 0.05), "color": skin}],
    }


# --- Ba Tu (grandmother) --------------------------------------------------
BA_TU_SKIN = (0.95, 0.83, 0.68, 1.0)
BA_TU_CARDIGAN = (0.72, 0.35, 0.4, 1.0)
BA_TU_DARK = (0.25, 0.16, 0.1, 1.0)

BA_TU_PARTS = {
    "spine": [{"points": oval_points(0, 1.18, 0.28, 0.32), "color": BA_TU_CARDIGAN, "radius": 0.02}],
    "neck": [{"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.09), "color": BA_TU_SKIN}],
    "head": [
        {"points": oval_points(0, _HEAD_CZ, 0.17, 0.19), "color": BA_TU_SKIN, "radius": 0.02},
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.015, 0.018), "color": BA_TU_DARK},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.015, 0.018), "color": BA_TU_DARK},
        {"points": oval_points(0, _HEAD_CZ - 0.08, 0.04, 0.02), "color": (0.55, 0.28, 0.24, 1.0)},
        # grey hair bun, sits above the head silhouette
        {"points": oval_points(0, _HEAD_CZ + 0.22, 0.09, 0.08), "color": (0.82, 0.8, 0.78, 1.0)},
    ],
}
BA_TU_PARTS.update(_limb_parts(BA_TU_SKIN, BA_TU_CARDIGAN))


# --- Mai (granddaughter, nursing student) ---------------------------------
MAI_SKIN = (0.93, 0.8, 0.65, 1.0)
MAI_TOP = (0.35, 0.55, 0.62, 1.0)  # soft teal casual top
MAI_HAIR = (0.15, 0.1, 0.08, 1.0)
MAI_DARK = (0.2, 0.13, 0.09, 1.0)

MAI_PARTS = {
    "spine": [{"points": oval_points(0, 1.2, 0.22, 0.28), "color": MAI_TOP, "radius": 0.02}],
    "neck": [{"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.08), "color": MAI_SKIN}],
    "head": [
        {"points": oval_points(0, _HEAD_CZ, 0.15, 0.17), "color": MAI_SKIN, "radius": 0.02},
        {"points": oval_points(-0.055, _HEAD_CZ + 0.02, 0.028, 0.032), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.055, _HEAD_CZ + 0.02, 0.028, 0.032), "color": (1, 1, 1, 1)},
        {"points": oval_points(-0.055, _HEAD_CZ + 0.02, 0.014, 0.016), "color": MAI_DARK},
        {"points": oval_points(0.055, _HEAD_CZ + 0.02, 0.014, 0.016), "color": MAI_DARK},
        {"points": oval_points(0, _HEAD_CZ - 0.07, 0.035, 0.018), "color": (0.6, 0.3, 0.28, 1.0)},
        # hair — a rounded cap over the top plus a ponytail puff at the back
        {"points": oval_points(0, _HEAD_CZ + 0.14, 0.16, 0.1), "color": MAI_HAIR},
        {"points": oval_points(-0.16, _HEAD_CZ + 0.05, 0.06, 0.09), "color": MAI_HAIR},
    ],
}
MAI_PARTS.update(_limb_parts(MAI_SKIN, MAI_TOP))
