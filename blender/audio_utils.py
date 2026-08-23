"""
Probes real audio file durations via the ffprobe binary the Remotion
pipeline already bundles (node_modules/@remotion/compositor-win32-x64-msvc
/ffprobe.exe) — no extra install, consistent with how poc_bouncing_ball.py
reused the sibling ffmpeg.exe for encoding instead of requiring a system
install.
"""

import os
import subprocess

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFPROBE = os.path.join(
    REPO_ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)


def get_duration_seconds(audio_path):
    """Returns the audio file's duration in seconds (float), or None if
    the file is missing/unreadable — callers should fall back to an
    estimate (e.g. word-count-based) rather than crash an unattended
    render over one bad beat file."""
    if not os.path.isfile(audio_path):
        return None
    try:
        result = subprocess.run(
            [
                FFPROBE, "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                audio_path,
            ],
            capture_output=True, text=True, timeout=15,
        )
        return float(result.stdout.strip())
    except (ValueError, subprocess.SubprocessError):
        return None
