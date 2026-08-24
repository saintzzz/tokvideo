"""
Action-to-pose library for the "Nha Ba Tu" animated-film scene assembler.

Every beat in an episode JSON (src/animated-film/episodes/*.json) carries
an "action" string (idle, stir_pot, wave, walk_in, ...) — this module
maps each one to a function that returns a partial bone-rotation dict
(gp_character.Character.pose()'s `rotations_deg` shape) given how many
seconds into that action the current frame is. The scene assembler calls
`ACTIONS[beat["action"]](t)`, merges the result under the baseline idle
sway, and passes it straight to `character.pose(frame, pose)`.

One known simplification, worth fixing later rather than silently
pretending it's not there:
  - sit_down/stand_up are still root_location height changes rather
    than a real bend at hip/knee — a viewer would need to see it seated
    from an angle where the leg fold reads clearly before that's worth
    building; standing-up/sitting-down is usually a quick beat where a
    height change alone reads fine.

walk_in/walk_out used to be a root_location slide with no leg motion at
all (characters.py had no thigh/shin/foot shapes when this file was
first written). Now that every character has real lower-body art
(_pants_lower_body / _skirt_lower_body), they drive an actual
alternating leg swing + knee bend + counter-swinging arms, not just a
translated statue — see walk_in/walk_out below.
"""

import math

# Every action can drive these bones; unlisted ones simply aren't touched
# by that action (idle's baseline sway still applies underneath — see
# `combine_with_idle`).
BASE_ARMS = {"upperarm_L": 6, "forearm_L": -8, "upperarm_R": -6, "forearm_R": 8}


def idle(t):
    sway = math.sin(t * 2.2) * 1.2
    head = math.sin(t * 1.6) * 2.0
    return {"spine": sway, "head": head, **BASE_ARMS}


def gesture_explain(t):
    """Talking with your hands — the most common action in the show
    (Mai explaining science, Ba Tu making a point). Alternating,
    moderate arm movement, not a fixed pose, so a long explaining beat
    doesn't freeze."""
    wave = math.sin(t * 2.8) * 14
    return {
        "spine": math.sin(t * 2.0) * 1.5,
        "head": 4 + math.sin(t * 1.4) * 5,
        "upperarm_R": -20 + wave,
        "forearm_R": 30 + math.sin(t * 3.4) * 10,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def stir_pot(t):
    circle = t * 2 * math.pi * 1.2
    return {
        "spine": math.sin(t * 1.5) * 1.0,
        "head": 6 + math.sin(t * 1.2) * 4,
        "upperarm_R": -20 + math.sin(circle) * 12,
        "forearm_R": 35 + math.cos(circle) * 15,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def wave(t):
    wag = math.sin(t * 6.0) * 20
    return {
        "spine": 2,
        "head": 8,
        "upperarm_R": -80,
        "forearm_R": -30 + wag,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def point(t):
    settle = min(1.0, t / 0.3)  # quick ease into the pose, then hold
    return {
        "spine": 3 * settle,
        "head": -6 * settle,
        "upperarm_R": -55 * settle,
        "forearm_R": 10 * settle,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def hug(t):
    settle = min(1.0, t / 0.4)
    return {
        "spine": 4 * settle,
        "head": -10 * settle,
        "upperarm_L": -50 * settle,
        "forearm_L": 60 * settle,
        "upperarm_R": 50 * settle,
        "forearm_R": -60 * settle,
    }


def cough(t):
    # A quick double-hunch — cough is short, so this is one fast cycle,
    # not a sustained loop like idle/talking actions.
    hunch = max(0.0, math.sin(min(t, 0.6) / 0.6 * math.pi * 2)) * 12
    return {
        "spine": 8 + hunch,
        "head": 10 + hunch,
        "upperarm_R": -40,
        "forearm_R": 90,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def laugh(t):
    bounce = math.sin(t * 7.0) * 3
    return {
        "spine": -6 + bounce,
        "head": -12 + math.sin(t * 5.0) * 4,
        **BASE_ARMS,
    }


def cry_softly(t):
    tremble = math.sin(t * 9.0) * 1.0
    return {
        "spine": 10 + tremble,
        "head": 16 + tremble,
        "upperarm_L": 20,
        "forearm_L": -70,
        "upperarm_R": 6,
        "forearm_R": -8,
    }


def eat(t):
    cycle = (t % 1.4) / 1.4
    lift = math.sin(cycle * math.pi) * 40
    return {
        "spine": 3,
        "head": 4,
        "upperarm_R": -20 - lift * 0.4,
        "forearm_R": 60 + lift,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def drink(t):
    cycle = min(1.0, t / 1.6)
    raise_amount = math.sin(cycle * math.pi) * 60
    return {
        "spine": 2,
        "head": -8 * math.sin(cycle * math.pi),
        "upperarm_R": -30 - raise_amount * 0.3,
        "forearm_R": 50 + raise_amount,
        "upperarm_L": 6,
        "forearm_L": -8,
    }


def write(t):
    scribble = math.sin(t * 8.0) * 6
    return {
        "spine": 6,
        "head": 14,
        "upperarm_R": -10,
        "forearm_R": 70 + scribble,
        "upperarm_L": 10,
        "forearm_L": -20,
    }


def read_chart(t):
    settle = min(1.0, t / 0.4)
    return {
        "spine": 6 * settle,
        "head": 18 * settle,
        "upperarm_L": 15 * settle,
        "forearm_L": -50 * settle,
        "upperarm_R": -15 * settle,
        "forearm_R": -50 * settle,
    }


def sit_down(t):
    settle = min(1.0, t / 0.5)
    return {"spine": 2 * settle, "head": 0, **BASE_ARMS}, {"z": -0.25 * settle}


def stand_up(t):
    settle = min(1.0, t / 0.5)
    return {"spine": -2 * (1 - settle), "head": 0, **BASE_ARMS}, {"z": -0.25 * (1 - settle)}


STRIDE_HZ = 3.0  # one full left-right stride cycle per ~1/3 second


def _walk_cycle(t):
    """Shared leg/arm swing for walk_in/walk_out — a real alternating
    stride using the thigh/shin bones (see this module's docstring),
    not a slide. Thighs swing opposite phase (scissor), shins bend more
    on the forward-swinging leg (a lift, not a stiff pendulum), and
    arms counter-swing opposite their same-side leg the way an actual
    gait does. Returns just the rotations dict — callers add spine/head
    sway and the root offset on top."""
    phase = t * STRIDE_HZ * 2 * math.pi
    thigh_swing = math.sin(phase) * 22
    # Knee bends most while that leg is swinging forward (front half of
    # its own cycle), stays nearly straight on the back/plant half —
    # cos-shaped lift gated to the forward swing only.
    knee_l = max(0.0, math.sin(phase)) * 30
    knee_r = max(0.0, math.sin(phase + math.pi)) * 30
    bob = abs(math.sin(phase)) * 0.05
    return {
        "thigh_L": thigh_swing,
        "shin_L": -knee_l,
        "thigh_R": -thigh_swing,
        "shin_R": -knee_r,
        "upperarm_L": 6 - thigh_swing * 0.5,
        "forearm_L": -8,
        "upperarm_R": -6 + thigh_swing * 0.5,
        "forearm_R": 8,
        "spine": math.sin(phase) * 2.5,
        "head": math.sin(phase) * 1.5,
    }, bob


def walk_in(t, direction=1):
    settle = min(1.0, t / 1.2)
    rotations, bob = _walk_cycle(t)
    return rotations, {"x": (1 - settle) * -0.6 * direction, "z": bob}


def walk_out(t, direction=1):
    rotations, bob = _walk_cycle(t)
    return rotations, {"x": t * 0.6 * direction, "z": bob}


# Actions that also move the character's root (a tuple of
# (rotations_dict, root_offset_dict) instead of just rotations_dict).
ROOT_MOVING_ACTIONS = {"sit_down", "stand_up", "walk_in", "walk_out"}

ACTIONS = {
    "idle": idle,
    "gesture_explain": gesture_explain,
    "stir_pot": stir_pot,
    "wave": wave,
    "point": point,
    "hug": hug,
    "cough": cough,
    "laugh": laugh,
    "cry_softly": cry_softly,
    "eat": eat,
    "drink": drink,
    "write": write,
    "read_chart": read_chart,
    "sit_down": sit_down,
    "stand_up": stand_up,
    "walk_in": walk_in,
    "walk_out": walk_out,
}


def get_pose(action_name, t):
    """Returns (rotations_dict, root_offset_dict_or_None). Falls back to
    idle for an unknown action name rather than raising, since a scene
    assembler running unattended across many auto-written episodes
    shouldn't hard-crash on an action the writer prompt didn't quite
    stick to."""
    fn = ACTIONS.get(action_name, idle)
    result = fn(t)
    if action_name in ROOT_MOVING_ACTIONS:
        return result
    return result, None
