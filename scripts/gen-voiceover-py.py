"""Generate long-form beat audio via Python edge-tts.

Workaround for msedge-tts (Node) getting HTTP 403 from Microsoft's
endpoint - this package uses a different auth path (Sec-MS-GEC token)
that still works.

Usage:
  python scripts/gen-voiceover-py.py <slug> [<slug> ...]

Writes raw mp3s to public/audio/suckhoe-long/<slug>/beat-N.mp3,
respecting each episode's prosody (rate/pitch/volume) from the JSON.
Pitch: Node uses %-offsets ("-3%"); edge-tts Python accepts Hz offsets
("-3Hz") - we convert % -> Hz of a ~100Hz baseline.
"""
import asyncio
import json
import os
import re
import sys

import edge_tts

VOICE = os.environ.get("EDGE_TTS_VOICE", "vi-VN-NamMinhNeural")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def pct_to_hz(value: str) -> str:
    m = re.match(r"^([+-]?\d+(?:\.\d+)?)%$", value.strip())
    if not m:
        return value
    # NamMinh baseline pitch ~100Hz; % -> Hz approximation.
    return f"{int(round(float(m.group(1))))}Hz" if float(m.group(1)) >= 0 else f"{int(round(float(m.group(1))))}Hz"


def norm_rate(value: str) -> str:
    v = value.strip()
    return v if v.endswith("%") else f"{v}%"


def norm_vol(value: str) -> str:
    v = value.strip()
    return v if v.endswith("%") else f"{v}%"


async def gen_beat(text: str, out_path: str, prosody: dict) -> None:
    communicate = edge_tts.Communicate(
        text,
        VOICE,
        rate=norm_rate(prosody.get("rate", "+0%")),
        pitch=pct_to_hz(prosody.get("pitch", "+0%")),
        volume=norm_vol(prosody.get("volume", "+0%")),
    )
    with open(out_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])


async def gen_episode(slug: str) -> None:
    ep_path = os.path.join(ROOT, "src", "suckhoe", "long-form", f"{slug}.json")
    with open(ep_path, encoding="utf-8") as f:
        ep = json.load(f)
    prosody = ep.get("prosody", {})
    out_dir = os.path.join(ROOT, "public", "audio", "suckhoe-long", slug)
    os.makedirs(out_dir, exist_ok=True)

    beats = ep["beats"]
    for i, beat in enumerate(beats, 1):
        out_path = os.path.join(out_dir, f"beat-{i}.mp3")
        if os.path.exists(out_path) and os.path.getsize(out_path) > 4096:
            continue
        for attempt in range(1, 7):
            try:
                await gen_beat(beat["text"], out_path, prosody)
                if os.path.getsize(out_path) > 4096:
                    break
                raise RuntimeError("empty audio")
            except Exception as e:  # noqa: BLE001
                print(f"{slug} beat-{i} attempt {attempt} failed: {e}", flush=True)
                await asyncio.sleep(min(attempt * 5, 30))
        else:
            raise RuntimeError(f"{slug} beat-{i}: gave up after 6 attempts")
        if i % 5 == 0 or i == len(beats):
            print(f"{slug}: {i}/{len(beats)} beats", flush=True)


async def main() -> None:
    for slug in sys.argv[1:]:
        await gen_episode(slug)
        print(f"{slug}: done", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
