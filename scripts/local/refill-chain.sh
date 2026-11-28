#!/bin/bash
# Refill chain: codex writes arc -> voiceover+captions -> push -> visuals -> push.
export PATH="/Users/kazu.nx/.npm-global/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
export HOME=/Users/kazu.nx
cd /Users/kazu.nx/devin_app/tokvideo || exit 1

node scripts/queue-refill.mjs --write --agent codex || exit 1

NEW=$(node -e "
const fs=require('fs');
const l=require('./src/suckhoe/published-long.json');
fs.readdirSync('src/suckhoe/long-form').filter(f=>f.endsWith('.json')).forEach(f=>{
  const s=f.replace('.json',''); if(l[s])return;
  const j=JSON.parse(fs.readFileSync('src/suckhoe/long-form/'+f));
  if(j.beats?.every(b=>b.speaker==='narrator')) console.log(s);
});" | tail -5)

for s in $NEW; do
  ls "public/audio/suckhoe-long/$s/beat-0.mp3" >/dev/null 2>&1 || RESUME=1 node scripts/generate-voiceover.mjs "suckhoe-long-$s"
done
git add -f public/audio/suckhoe-long/ public/captions/ src/suckhoe/long-form/ 2>/dev/null
git diff --staged --quiet || { git commit -m "arc refill: episodes + audio + captions" && git pull --rebase && git push; }

for s in $NEW; do
  node scripts/generate-story-visuals.mjs "$s" --long
done
git add -f public/images/suckhoe-long/ src/suckhoe/long-form/ 2>/dev/null
git diff --staged --quiet || { git commit -m "arc refill: scene visuals" && git pull --rebase && git push; }
echo "refill chain done"
