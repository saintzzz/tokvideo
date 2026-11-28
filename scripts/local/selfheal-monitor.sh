#!/bin/bash
# tokvideo self-heal monitor - launchd service. Every 10min:
#   1. report new CI failures
#   2. pickable queue < 5 -> full refill chain (codex arc -> voiceover -> visuals -> push)
# Env: needs gh auth + codex CLI on PATH for the refill branch.
export PATH="/Users/kazu.nx/.npm-global/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
export HOME=/Users/kazu.nx
cd /Users/kazu.nx/devin_app/tokvideo || exit 1
LOCK=/tmp/tokvideo-refill.lock
LOG=/tmp/tokvideo-monitor.log

pickable_count() {
node -e "
const fs=require('fs');
const l=require('./src/suckhoe/published-long.json');
let pick=0;
fs.readdirSync('src/suckhoe/long-form').filter(f=>f.endsWith('.json')).forEach(f=>{
  const s=f.replace('.json',''); if(l[s])return;
  const j=JSON.parse(fs.readFileSync('src/suckhoe/long-form/'+f));
  if(j.beats?.every(b=>b.speaker==='narrator')&&(j.scenePrompts||j.sceneImages))pick++;
});
console.log(pick);"
}

while true; do
  TS=$(date '+%H:%M %d/%m')
  SINCE=$(date -u -v-2H +%FT%TZ 2>/dev/null || date -u -d '2 hours ago' +%FT%TZ)
  FAILS=$(gh run list --limit 30 --json databaseId,conclusion,createdAt \
    --jq '.[]|select(.conclusion=="failure")|select(.createdAt>"'$SINCE'")|.databaseId' 2>/dev/null | tr '\n' ' ')
  git pull --rebase -q 2>/dev/null
  PICK=$(pickable_count)
  LAST=$(node -e "const l=require('./src/suckhoe/published-long.json');const t=Object.values(l).map(e=>e.publishedAt).filter(Boolean).sort().pop();console.log(t?((Date.now()-Date.parse(t))/36e5).toFixed(1):'?')")
  echo "$TS pickable:$PICK last_upload:${LAST}h fails:${FAILS:-none}" >> "$LOG"
  if [ "$PICK" -lt 5 ] && [ ! -f "$LOCK" ]; then
    echo "$TS QUEUE_LOW -> refill chain" >> "$LOG"
    touch "$LOCK"
    ( /Users/kazu.nx/devin_app/tokvideo/scripts/local/refill-chain.sh >> /tmp/tokvideo-refill.log 2>&1; rm -f "$LOCK" ) &
  fi
  sleep 600
done
