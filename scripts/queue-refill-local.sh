#!/usr/bin/env bash
# Local queue-refill wrapper for the user's machine cron (daily 09:05 VN).
# Uses the local `claude` agent CLI for higher-quality writing than the
# CI pollinations fallback, then tops up audio locally (Edge TTS works
# from a residential IP where GitHub runners get 403'd), commits and
# pushes. Exits 0 quietly when the queue is already >= MIN_QUEUE.
#
#   crontab entry (installed by the agent on 2026-11-06):
#   5 9 * * * /Users/kazu.nx/devin_app/tokvideo/scripts/queue-refill-local.sh
#
set -uo pipefail
cd "$(dirname "$0")/.."

# Cron has a bare PATH — node lives in ~/n/bin (n), claude in
# ~/.npm-global/bin. Without this the whole job has silently no-opped
# with "node: command not found" since 2026-11-07.
export PATH="$HOME/n/bin:$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
LOG=scripts/queue-refill.log
echo "=== $(date '+%F %T %z') ===" >> "$LOG"

git fetch origin main -q && git rebase origin/main -q 2>/dev/null || git pull --rebase -q

if node scripts/queue-refill.mjs --write --agent "${LOCAL_AGENT:-claude}" >> "$LOG" 2>&1; then
  : # wrote an arc, or queue was already fine
else
  rc=$?
  [ "$rc" -eq 2 ] && echo "queue low but refill failed - see $LOG" >> "$LOG"
fi

node scripts/audio-topup.mjs >> "$LOG" 2>&1 || true

# Commit anything the refill/topup produced (episodes, index.ts, audio,
# captions). [skip ci] avoids triggering the render workflow on push.
git add src/suckhoe/long-form/ public/audio/suckhoe-long/ public/captions/ 2>/dev/null || true
if ! git diff --staged --quiet; then
  git commit -qm "Queue refill: new arc + audio topup [skip ci]" >> "$LOG" 2>&1
  for i in 1 2 3; do
    git fetch origin main -q && git rebase origin/main -q && git push -q && break
    sleep $((i * 20))
  done
fi
echo "done" >> "$LOG"
