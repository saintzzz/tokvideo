#!/bin/bash
# Generic macOS port of the run-*.ps1 agent task wrappers. Usage:
#   run-agent-task.sh <prompt-basename> [--every-N-days N]
# e.g. run-agent-task.sh daily-content-writer
#      run-agent-task.sh reply-comments
#      run-agent-task.sh comment-outreach --every-N-days 3
# Invoked by launchd (com.tokvideo.* plists). Pipe the prompt file to the
# agent CLI, log to scripts/<prompt-basename>.log.
#
# devin CLI notes (2026-11-07): bundled `claude` SIGILLs on this Intel
# Mac; `devin -p` is used instead. env -i is REQUIRED - IDE terminal
# vars (DEVIN_FD_PATH etc.) hijack devin auth and fail -p mode; a clean
# env uses ~/.local/share/devin/credentials.toml like launchd.

set -u
NAME="${1:?usage: run-agent-task.sh <prompt-basename> [--every-N-days N]}"
NDAYS=0
[ "${2:-}" = "--every-N-days" ] && NDAYS="${3:?missing N}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
LOG="$SCRIPT_DIR/$NAME.log"
PROMPT="$SCRIPT_DIR/$NAME-prompt.txt"
LASTRUN="$SCRIPT_DIR/.$NAME.lastrun"

{
  echo ""
  echo "=== Run at $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo "User: $(whoami) | PID: $$ | task: $NAME | repo: $REPO_DIR"

  # every-N-days self-gate (launchd fires daily; Windows used a real
  # 3-day trigger - emulate via lastrun marker)
  if [ "$NDAYS" -gt 0 ] && [ -f "$LASTRUN" ]; then
    last=$(cat "$LASTRUN"); now=$(date +%s)
    age=$(( (now - last) / 86400 ))
    if [ "$age" -lt "$NDAYS" ]; then
      echo "skip: last run ${age}d ago (< ${NDAYS}d)"
      exit 0
    fi
  fi

  DEVIN="/Applications/Devin.app/Contents/Resources/app/extensions/windsurf/devin/bin/devin"
  if [ ! -x "$DEVIN" ]; then
    echo "!!! ERROR: devin not found at $DEVIN"
    exit 1
  fi
  AGENT="env -i HOME=$HOME PATH=/usr/local/bin:/usr/bin:/bin $DEVIN -p --prompt-file $PROMPT --permission-mode dangerous --respect-workspace-trust false"
  echo "agent: $AGENT"

  cd "$REPO_DIR" || { echo "!!! ERROR: cd $REPO_DIR failed"; exit 1; }
  eval "$AGENT" 2>&1

  date +%s > "$LASTRUN"
  echo "=== Finished at $(date '+%Y-%m-%d %H:%M:%S') ==="
} >> "$LOG" 2>&1
