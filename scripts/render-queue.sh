#!/usr/bin/env bash
# Renders every unpublished-suckhoe episode sequentially — meant to run
# unattended overnight on the local machine. Logs to out/render-queue.log.
# Usage: bash scripts/render-queue.sh
set -u
cd "$(dirname "$0")/.."

SLUGS=(
  truyen-thach-sanh-tap-1
  truyen-thach-sanh-tap-2
  truyen-thach-sanh-tap-3
  truyen-so-dua-tap-1
  truyen-so-dua-tap-2
  truyen-cay-khe-tap-1
  truyen-son-tinh-thuy-tinh-tap-1
  truyen-son-tinh-thuy-tinh-tap-2
  truyen-le-loi-tra-kiem-tap-1
  truyen-le-loi-tra-kiem-tap-2
  truyen-hai-ba-trung-tap-1
  truyen-hai-ba-trung-tap-2
  en-baba-yaga-part-1
  en-baba-yaga-part-2
  en-mothman-part-1
  en-mothman-part-2
)

mkdir -p out
LOG=out/render-queue.log
echo "=== render queue started $(date) ===" >> "$LOG"

for slug in "${SLUGS[@]}"; do
  out="out/SucKhoe-${slug}.mp4"
  if [ -s "$out" ]; then
    echo "SKIP $slug (exists)" >> "$LOG"
    continue
  fi
  echo "START $slug $(date)" >> "$LOG"
  node scripts/render-suckhoe.mjs "$slug" >> "$LOG" 2>&1
  if [ -s "$out" ]; then
    echo "DONE  $slug $(date)" >> "$LOG"
  else
    echo "FAIL  $slug $(date)" >> "$LOG"
  fi
done

echo "=== render queue finished $(date) ===" >> "$LOG"
