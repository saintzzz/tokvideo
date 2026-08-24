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
# First-pass version of this character used ~6 shapes total (one oval per
# body part) — cheap to build but reads as a placeholder, not a drawn
# character. This version is deliberately much more worked: layered
# clothing (collar, waist tie, fold lines, cuffs), an actual hand shape
# (palm + thumb, not one blob), age-appropriate face detail (brow,
# under-eye crease, smile lines, nose shadow), and individual hair
# strands instead of one bun blob. Every shape is still just an oval/
# capsule polygon (no new drawing primitive), the difference is
# investing real time in HOW MANY of them combine into the silhouette.
BA_TU_SKIN = (0.95, 0.83, 0.68, 1.0)
BA_TU_SKIN_SHADOW = (0.86, 0.72, 0.58, 1.0)
BA_TU_CARDIGAN = (0.72, 0.35, 0.4, 1.0)
BA_TU_CARDIGAN_SHADOW = (0.6, 0.27, 0.32, 1.0)
BA_TU_BLOUSE = (0.88, 0.82, 0.7, 1.0)
BA_TU_HAIR = (0.82, 0.8, 0.78, 1.0)
BA_TU_HAIR_SHADOW = (0.68, 0.66, 0.64, 1.0)
BA_TU_DARK = (0.25, 0.16, 0.1, 1.0)
BA_TU_BLUSH = (0.85, 0.55, 0.5, 0.55)

BA_TU_PARTS = {
    "spine": [
        {"points": oval_points(0, 1.18, 0.28, 0.32), "color": BA_TU_CARDIGAN, "radius": 0.02},
        # blouse peeking through the collar
        {"points": oval_points(0, 1.34, 0.11, 0.09), "color": BA_TU_BLOUSE},
        # V-neck collar trim, drawn as a thin crescent over the cardigan
        {"points": [(-0.16, 0, 1.42), (0, 0, 1.24), (0.16, 0, 1.42), (0.1, 0, 1.4), (0, 0, 1.3), (-0.1, 0, 1.4)], "color": BA_TU_CARDIGAN_SHADOW, "outline": False},
        # waist tie-knot, a small accent low on the torso
        {"points": oval_points(0, 0.98, 0.05, 0.045), "color": BA_TU_CARDIGAN_SHADOW, "outline": False},
        # a fold-line shadow along one side, breaks up the flat oval
        {"points": capsule_points((0.14, 0, 1.28), (0.1, 0, 1.02), 0.035), "color": BA_TU_CARDIGAN_SHADOW, "outline": False},
    ],
    "neck": [{"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.09), "color": BA_TU_SKIN}],
    "head": [
        {"points": oval_points(0, _HEAD_CZ, 0.17, 0.19), "color": BA_TU_SKIN, "radius": 0.02},
        # subtle jaw/cheek shadow along the lower edge for a touch of form
        {"points": oval_points(0, _HEAD_CZ - 0.1, 0.15, 0.09), "color": BA_TU_SKIN_SHADOW, "radius": 0.02, "outline": False},
        # rosy cheeks (age-appropriate blush, not a childlike pink)
        {"points": oval_points(-0.1, _HEAD_CZ - 0.04, 0.035, 0.025), "color": BA_TU_BLUSH, "outline": False},
        {"points": oval_points(0.1, _HEAD_CZ - 0.04, 0.035, 0.025), "color": BA_TU_BLUSH, "outline": False},
        # eyebrows — thin arched shapes, not just implied by eye position
        {"points": capsule_points((-0.09, 0, _HEAD_CZ + 0.065), (-0.03, 0, _HEAD_CZ + 0.075), 0.018), "color": BA_TU_DARK},
        {"points": capsule_points((0.03, 0, _HEAD_CZ + 0.075), (0.09, 0, _HEAD_CZ + 0.065), 0.018), "color": BA_TU_DARK},
        # eye whites
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        # under-eye crease — a hairline arc, the single detail that reads
        # as "elderly" more than any other on this face. Drawn OUTSIDE the
        # eye white's own footprint (lower z-offset) so it doesn't overlap
        # the eye itself and get mistaken for eyelid/closed-eye shading.
        {"points": capsule_points((-0.095, 0, _HEAD_CZ - 0.015), (-0.03, 0, _HEAD_CZ - 0.025), 0.007), "color": BA_TU_SKIN_SHADOW, "outline": False},
        {"points": capsule_points((0.03, 0, _HEAD_CZ - 0.025), (0.095, 0, _HEAD_CZ - 0.015), 0.007), "color": BA_TU_SKIN_SHADOW, "outline": False},
        # pupils with a tiny highlight dot each, so the eyes catch light
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.015, 0.018), "color": BA_TU_DARK},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.015, 0.018), "color": BA_TU_DARK},
        {"points": oval_points(-0.065, _HEAD_CZ + 0.027, 0.005, 0.006), "color": (1, 1, 1, 1), "outline": False},
        {"points": oval_points(0.055, _HEAD_CZ + 0.027, 0.005, 0.006), "color": (1, 1, 1, 1), "outline": False},
        # nose — a soft shadow shape instead of just a line, reads better
        # at this silhouette scale than a stroke would
        {"points": oval_points(0, _HEAD_CZ - 0.03, 0.018, 0.03), "color": BA_TU_SKIN_SHADOW, "outline": False},
        # smile lines beside the mouth — small parenthesis shapes
        {"points": capsule_points((-0.07, 0, _HEAD_CZ - 0.06), (-0.06, 0, _HEAD_CZ - 0.1), 0.008), "color": BA_TU_SKIN_SHADOW, "outline": False},
        {"points": capsule_points((0.06, 0, _HEAD_CZ - 0.1), (0.07, 0, _HEAD_CZ - 0.06), 0.008), "color": BA_TU_SKIN_SHADOW, "outline": False},
        # hair bun with a shaded underside, plus two escaped wisps for
        # texture instead of one flat blob
        {"points": oval_points(0, _HEAD_CZ + 0.22, 0.09, 0.08), "color": BA_TU_HAIR},
        {"points": oval_points(0, _HEAD_CZ + 0.18, 0.08, 0.04), "color": BA_TU_HAIR_SHADOW, "outline": False},
        {"points": capsule_points((-0.13, 0, _HEAD_CZ + 0.14), (-0.16, 0, _HEAD_CZ + 0.04), 0.012), "color": BA_TU_HAIR},
        {"points": capsule_points((0.14, 0, _HEAD_CZ + 0.15), (0.17, 0, _HEAD_CZ + 0.07), 0.012), "color": BA_TU_HAIR},
    ],
    # mouth — its own bone ("jaw") so talking can stretch it open/closed
    # via bone scale (see gp_character.Character.pose's `scales` param)
    # instead of being welded rigidly to the rest of the face.
    "jaw": [{"points": oval_points(0, _HEAD_CZ - 0.08, 0.04, 0.02), "color": (0.55, 0.28, 0.24, 1.0)}],
}
BA_TU_PARTS.update(_limb_parts(BA_TU_SKIN, BA_TU_CARDIGAN))
# Cuff bands where sleeve meets skin, and a real hand shape (palm +
# thumb) instead of one plain oval — added on top of _limb_parts' base
# shapes rather than replacing them.
for _side, _fore_bone, _hand_bone, _hand_pos in [
    ("L", "forearm_L", "hand_L", BONE_SPEC["hand_L"]["tail"]),
    ("R", "forearm_R", "hand_R", BONE_SPEC["hand_R"]["tail"]),
]:
    _fore_head = BONE_SPEC[_fore_bone]["head"]
    BA_TU_PARTS[_fore_bone].append(
        {"points": oval_points(_fore_head[0], _fore_head[2], 0.055, 0.03), "color": BA_TU_CARDIGAN_SHADOW}
    )
    _thumb_dx = -0.03 if _side == "L" else 0.03
    BA_TU_PARTS[_hand_bone].append(
        {"points": oval_points(_hand_pos[0] + _thumb_dx, _hand_pos[2] + 0.02, 0.02, 0.028), "color": BA_TU_SKIN, "outline": False}
    )


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
        # hair — a rounded cap over the top plus a ponytail puff at the back
        {"points": oval_points(0, _HEAD_CZ + 0.14, 0.16, 0.1), "color": MAI_HAIR},
        {"points": oval_points(-0.16, _HEAD_CZ + 0.05, 0.06, 0.09), "color": MAI_HAIR},
    ],
    "jaw": [{"points": oval_points(0, _HEAD_CZ - 0.07, 0.035, 0.018), "color": (0.6, 0.3, 0.28, 1.0)}],
}
MAI_PARTS.update(_limb_parts(MAI_SKIN, MAI_TOP))


# --- Co Sau (neighbor, runs the breakfast stall) --------------------------
CO_SAU_SKIN = (0.88, 0.72, 0.56, 1.0)
CO_SAU_APRON = (0.85, 0.6, 0.25, 1.0)
CO_SAU_HAIR = (0.18, 0.12, 0.09, 1.0)
CO_SAU_DARK = (0.22, 0.14, 0.08, 1.0)

CO_SAU_PARTS = {
    "spine": [{"points": oval_points(0, 1.18, 0.29, 0.31), "color": CO_SAU_APRON, "radius": 0.02}],
    "neck": [{"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.09), "color": CO_SAU_SKIN}],
    "head": [
        {"points": oval_points(0, _HEAD_CZ, 0.17, 0.18), "color": CO_SAU_SKIN, "radius": 0.02},
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.03, 0.035), "color": (1, 1, 1, 1)},
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.015, 0.018), "color": CO_SAU_DARK},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.015, 0.018), "color": CO_SAU_DARK},
        # hair pulled back in a low bun, a headscarf knot at the back
        {"points": oval_points(0, _HEAD_CZ + 0.15, 0.17, 0.09), "color": CO_SAU_HAIR},
        {"points": oval_points(0, _HEAD_CZ + 0.24, 0.06, 0.05), "color": (0.9, 0.75, 0.3, 1.0)},
    ],
    "jaw": [{"points": oval_points(0, _HEAD_CZ - 0.08, 0.04, 0.02), "color": (0.55, 0.28, 0.2, 1.0)}],
}
CO_SAU_PARTS.update(_limb_parts(CO_SAU_SKIN, CO_SAU_APRON))


# --- Chu Bay (neighbor, retired, plays chess) -----------------------------
CHU_BAY_SKIN = (0.86, 0.7, 0.55, 1.0)
CHU_BAY_SHIRT = (0.55, 0.58, 0.5, 1.0)
CHU_BAY_HAIR = (0.85, 0.84, 0.8, 1.0)
CHU_BAY_DARK = (0.2, 0.13, 0.09, 1.0)

CHU_BAY_PARTS = {
    "spine": [{"points": oval_points(0, 1.19, 0.3, 0.3), "color": CHU_BAY_SHIRT, "radius": 0.02}],
    "neck": [{"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.09), "color": CHU_BAY_SKIN}],
    "head": [
        {"points": oval_points(0, _HEAD_CZ, 0.17, 0.18), "color": CHU_BAY_SKIN, "radius": 0.02},
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.028, 0.03), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.028, 0.03), "color": (1, 1, 1, 1)},
        {"points": oval_points(-0.06, _HEAD_CZ + 0.02, 0.014, 0.016), "color": CHU_BAY_DARK},
        {"points": oval_points(0.06, _HEAD_CZ + 0.02, 0.014, 0.016), "color": CHU_BAY_DARK},
        # white/grey hair, receding — just a thin band, not a full cap
        {"points": oval_points(0, _HEAD_CZ + 0.16, 0.17, 0.05), "color": CHU_BAY_HAIR},
        # mustache
        {"points": oval_points(0, _HEAD_CZ - 0.055, 0.05, 0.016), "color": CHU_BAY_HAIR},
    ],
    "jaw": [{"points": oval_points(0, _HEAD_CZ - 0.08, 0.038, 0.018), "color": (0.5, 0.26, 0.2, 1.0)}],
}
CHU_BAY_PARTS.update(_limb_parts(CHU_BAY_SKIN, CHU_BAY_SHIRT))


# --- Be Tom (neighbor's child, 7 years old) -------------------------------
BE_TOM_SKIN = (0.94, 0.78, 0.62, 1.0)
BE_TOM_SHIRT = (0.9, 0.45, 0.3, 1.0)
BE_TOM_HAIR = (0.12, 0.08, 0.06, 1.0)
BE_TOM_DARK = (0.2, 0.13, 0.09, 1.0)

BE_TOM_PARTS = {
    "spine": [{"points": oval_points(0, 1.2, 0.2, 0.22), "color": BE_TOM_SHIRT, "radius": 0.02}],
    "neck": [{"points": capsule_points(BONE_SPEC["neck"]["head"], BONE_SPEC["neck"]["tail"], 0.07), "color": BE_TOM_SKIN}],
    "head": [
        # kids get a proportionally BIGGER head relative to body — a
        # standard cartoon shorthand for reading as young at a glance.
        {"points": oval_points(0, _HEAD_CZ, 0.19, 0.19), "color": BE_TOM_SKIN, "radius": 0.02},
        {"points": oval_points(-0.065, _HEAD_CZ + 0.02, 0.032, 0.036), "color": (1, 1, 1, 1)},
        {"points": oval_points(0.065, _HEAD_CZ + 0.02, 0.032, 0.036), "color": (1, 1, 1, 1)},
        {"points": oval_points(-0.065, _HEAD_CZ + 0.02, 0.016, 0.02), "color": BE_TOM_DARK},
        {"points": oval_points(0.065, _HEAD_CZ + 0.02, 0.016, 0.02), "color": BE_TOM_DARK},
        {"points": oval_points(0, _HEAD_CZ + 0.16, 0.19, 0.09), "color": BE_TOM_HAIR},
    ],
    "jaw": [{"points": oval_points(0, _HEAD_CZ - 0.07, 0.04, 0.02), "color": (0.65, 0.35, 0.3, 1.0)}],
}
BE_TOM_PARTS.update(_limb_parts(BE_TOM_SKIN, BE_TOM_SHIRT))
