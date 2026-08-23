"""
Cheap "is this character talking" mouth-open signal for the Blender rig —
ported directly from src/components/useTalkingMouth.ts (same layered-sine
formula) so both animation tracks read the same way: no ML, no audio
analysis, just enough wobble that a talking mouth doesn't look like an
obviously robotic single-frequency loop. Not real lip-sync.

Drives the "jaw" bone's Z-scale (see gp_character.py's BONE_SPEC comment
and Character.pose()'s `scales` param) rather than swapping mouth shapes.
"""

import math


def mouth_open_amount(frame, is_speaking):
    """Returns 0..1. 0 when not speaking (mouth closed)."""
    if not is_speaking:
        return 0.0
    wobble = (
        math.sin(frame * 0.9) * 0.5
        + math.sin(frame * 1.7 + 1.3) * 0.3
        + math.sin(frame * 0.35 + 2.1) * 0.2
    )
    return max(0.0, min(1.0, (wobble + 1) / 2))


def jaw_scale(frame, is_speaking, min_scale=0.6, max_scale=2.4):
    """Maps mouth_open_amount to a Z-scale factor for the "jaw" bone —
    below 1.0 when closed (thin line), above 1.0 when open wide."""
    amount = mouth_open_amount(frame, is_speaking)
    z = min_scale + (max_scale - min_scale) * amount
    return (1.0, 1.0, z)
