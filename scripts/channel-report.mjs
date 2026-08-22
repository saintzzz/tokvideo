import { google } from "googleapis";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// Pulls real channel + per-video performance data so cadence/content
// decisions are evidence-based instead of guesswork. Run via CI (see the
// channel-report job in .github/workflows/render.yml) or locally once you
// have YOUTUBE_* env vars set.
//
// Needs a refresh token issued with the youtube.force-ssl (or plain
// youtube) and yt-analytics.readonly scopes (see
// scripts/youtube-get-refresh-token.mjs) — an upload-only token will fail
// here with a 403.
//
// Usage: node scripts/channel-report.mjs [--locale=vi|en] — defaults to
// "vi". Also writes the report to src/suckhoe/channel-report-<locale>.md
// so scripts/daily-content-writer-prompt.txt can read real performance
// data before deciding what to write next, instead of guessing.

const localeArg = process.argv.find((arg) => arg.startsWith("--locale="));
const locale = localeArg ? localeArg.split("=")[1] : "vi";

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = {
  CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  REFRESH_TOKEN: locale === "en" ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN,
};

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log(
    "Skipping channel report: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN not set."
  );
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const youtube = google.youtube({ version: "v3", auth: oauth2Client });
const youtubeAnalytics = google.youtubeAnalytics({
  version: "v2",
  auth: oauth2Client,
});

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  let channel;
  try {
    const res = await youtube.channels.list({
      part: ["snippet", "statistics"],
      mine: true,
    });
    channel = res.data.items?.[0];
  } catch (err) {
    console.error(
      "Failed to fetch channel stats — likely an insufficient-scope token. Re-run scripts/youtube-get-refresh-token.mjs and update YOUTUBE_REFRESH_TOKEN."
    );
    console.error(err.message ?? err);
    process.exit(1);
  }

  if (!channel) {
    console.error("No channel found for this account.");
    process.exit(1);
  }

  const stats = channel.statistics;
  const lines = [];
  lines.push(`# Channel report — ${fmtDate(new Date())}`);
  lines.push("");
  lines.push(`Channel: ${channel.snippet.title}`);
  lines.push(`Subscribers: ${stats.subscriberCount}`);
  lines.push(`Total views: ${stats.viewCount}`);
  lines.push(`Total videos: ${stats.videoCount}`);
  lines.push("");

  // Last 28 days of channel-level Analytics: views, watch time, subs
  // gained/lost, and average view duration — the core signals for whether
  // cadence/content is working.
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 28);

  try {
    const analytics = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate: fmtDate(start),
      endDate: fmtDate(end),
      metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day",
    });

    const rows = analytics.data.rows ?? [];
    const totals = rows.reduce(
      (acc, row) => {
        acc.views += row[1];
        acc.minutesWatched += row[2];
        acc.subsGained += row[4];
        acc.subsLost += row[5];
        return acc;
      },
      { views: 0, minutesWatched: 0, subsGained: 0, subsLost: 0 }
    );

    lines.push(`## Last 28 days (channel-wide)`);
    lines.push("");
    lines.push(`Views: ${totals.views}`);
    lines.push(`Watch time (minutes): ${Math.round(totals.minutesWatched)}`);
    lines.push(`Subscribers gained: ${totals.subsGained}`);
    lines.push(`Subscribers lost: ${totals.subsLost}`);
    lines.push(`Net subscriber change: ${totals.subsGained - totals.subsLost}`);
    lines.push("");
  } catch (err) {
    lines.push(
      `## Last 28 days (channel-wide)\n\n(Analytics query failed: ${err.message ?? err} — likely too little data yet for a brand-new channel, or the token needs the yt-analytics.readonly scope.)`
    );
    lines.push("");
  }

  // Per-video stats for the most recent uploads, so we can see which
  // topics/formats are actually landing vs. just guessing from gut feel.
  try {
    const search = await youtube.search.list({
      part: ["id"],
      forMine: true,
      type: "video",
      order: "date",
      maxResults: 25,
    });
    const videoIds = (search.data.items ?? [])
      .map((item) => item.id.videoId)
      .filter(Boolean);

    if (videoIds.length > 0) {
      const videos = await youtube.videos.list({
        part: ["snippet", "statistics"],
        id: videoIds,
      });

      lines.push(`## Most recent ${videos.data.items.length} videos`);
      lines.push("");
      lines.push("| Title | Views | Likes | Comments | Published |");
      lines.push("|---|---|---|---|---|");
      for (const v of videos.data.items) {
        const s = v.statistics;
        lines.push(
          `| ${v.snippet.title} | ${s.viewCount ?? 0} | ${s.likeCount ?? 0} | ${s.commentCount ?? 0} | ${fmtDate(new Date(v.snippet.publishedAt))} |`
        );
      }
      lines.push("");
    }
  } catch (err) {
    lines.push(`## Recent videos\n\n(Failed to fetch: ${err.message ?? err})`);
    lines.push("");
  }

  const report = lines.join("\n");
  console.log(report);

  const outPath = path.join(import.meta.dirname, "..", "src", "suckhoe", `channel-report-${locale}.md`);
  await writeFile(outPath, report + "\n");
  console.log(`\n(written to ${outPath})`);
}

await main();
