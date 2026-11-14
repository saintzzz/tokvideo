// Targeted deletion queue — src/suckhoe/pending-delete.json lists videoIds
// (long or teaser) that must be removed from the channel: quality rejects,
// black renders, wrong-content uploads. Quality verifiers enqueue here;
// the watchdog drains it with CI credentials so a bad video never has to
// wait for someone's manual quota window.
//
// On success the videoId is also purged from published-long.json /
// published.json ledger entries, so the episode becomes unpublished again
// and the picker re-renders it cleanly. Processed ids are appended to
// `done` inside the same file so the drain is resumable and auditable.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const root = path.join(import.meta.dirname, "..");
const queuePath = path.join(root, "src/suckhoe/pending-delete.json");
const longLedgerPath = path.join(root, "src/suckhoe/published-long.json");
const shortLedgerPath = path.join(root, "src/suckhoe/published.json");

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
};
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("drain-deletes skipped: YouTube credentials not set.");
  process.exit(0);
}

let queue;
try {
  queue = JSON.parse(await readFile(queuePath, "utf8"));
} catch {
  console.log("drain-deletes: no queue file, nothing to do.");
  process.exit(0);
}
const pending = (queue.delete ?? []).filter((v) => !(queue.done ?? []).includes(v));
if (!pending.length) {
  console.log("drain-deletes: queue empty.");
  process.exit(0);
}

const mkYoutube = (id, secret, token) => {
  const o = new google.auth.OAuth2(id, secret);
  o.setCredentials({ refresh_token: token });
  return google.youtube({ version: "v3", auth: o });
};
let youtube = mkYoutube(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN);
const { YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2, YOUTUBE_REFRESH_TOKEN_2 } = process.env;
const youtube2 =
  YOUTUBE_CLIENT_ID_2 && YOUTUBE_CLIENT_SECRET_2 && YOUTUBE_REFRESH_TOKEN_2
    ? mkYoutube(YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2, YOUTUBE_REFRESH_TOKEN_2)
    : null;
let usingPool2 = false;

const longLedger = JSON.parse(await readFile(longLedgerPath, "utf8"));
let shortLedger = {};
try {
  shortLedger = JSON.parse(await readFile(shortLedgerPath, "utf8"));
} catch { /* ledger optional */ }
const done = [...(queue.done ?? [])];
let ledgerDirty = false;

for (const id of pending) {
  try {
    await youtube.videos.delete({ id });
    console.log(`deleted ${id}`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (/quota/i.test(msg) && youtube2 && !usingPool2) {
      youtube = youtube2;
      usingPool2 = true;
      console.log("pool-1 quota exhausted - switched to pool 2");
      try {
        await youtube.videos.delete({ id });
        console.log(`deleted ${id} (pool 2)`);
      } catch (e2) {
        console.log(`${id}: pool-2 delete failed - ${String(e2?.message ?? e2).slice(0, 120)}`);
        break;
      }
    } else if (/not found|404/i.test(msg)) {
      console.log(`${id} already gone`);
    } else if (/quota/i.test(msg)) {
      console.log(`${id}: quota exhausted - remaining ids stay queued for the next drain`);
      break;
    } else {
      console.log(`${id}: delete failed - ${msg.slice(0, 120)}`);
      continue;
    }
  }
  done.push(id);
  for (const [slug, entry] of Object.entries(longLedger)) {
    if (entry?.videoId === id || entry?.teaserVideoId === id) {
      const field = entry.videoId === id ? "videoId" : "teaserVideoId";
      delete entry[field];
      delete entry[`${field}PublishedAt`];
      ledgerDirty = true;
      console.log(`  ledger ${slug}: cleared ${field}`);
    }
  }
  for (const [slug, entry] of Object.entries(shortLedger)) {
    if (entry?.videoId === id) {
      delete entry.videoId;
      ledgerDirty = true;
      console.log(`  ledger ${slug}: cleared videoId`);
    }
  }
}

queue.done = done;
await writeFile(queuePath, JSON.stringify(queue, null, 2) + "\n");
if (ledgerDirty) {
  await writeFile(longLedgerPath, JSON.stringify(longLedger, null, 2) + "\n");
  await writeFile(shortLedgerPath, JSON.stringify(shortLedger, null, 2) + "\n");
}
console.log(`drain-deletes: ${done.length} processed total, queue file updated.`);
