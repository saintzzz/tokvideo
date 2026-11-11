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
const ytReporting = google.youtubereporting({
  version: "v1",
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

    // Impressions + CTR + retention per video — splits "YouTube is not
    // showing the video" (impressions ~0) from "shown but not clicked"
    // (impressions ok, CTR < ~4%) from "clicked but abandoned"
    // (CTR ok, averageViewPercentage low).
    if (videoIds.length > 0) {
      try {
        const perVideo = await youtubeAnalytics.reports.query({
          ids: "channel==MINE",
          startDate: fmtDate(start),
          endDate: fmtDate(end),
          metrics:
            "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
          dimensions: "video",
          filters: `video==${videoIds.join(",")}`,
          sort: "-views",
        });
        const rows = perVideo.data.rows ?? [];
        if (rows.length > 0) {
          lines.push(`## Funnel per video (last 28 days)`);
          lines.push("");
          lines.push("| videoId | Views | WatchMin | AvgView(s) | AvgView% |");
          lines.push("|---|---|---|---|---|");
          for (const r of rows) {
            lines.push(
              `| ${r[0]} | ${r[1]} | ${(+r[2]).toFixed(1)} | ${Math.round(r[3])} | ${(+r[4]).toFixed(1)} |`
            );
          }
          lines.push("");
          const dead = rows.filter((r) => (+r[4] ?? 0) < 15).length;
          lines.push(
            `Videos under 15% avg retention: ${dead}/${rows.length} — low % means viewers abandon early (hook problem), not a click problem.`
          );
          lines.push("");
        }
      } catch (err) {
        lines.push(
          `## Funnel per video\n\n(Per-video analytics failed: ${err.message ?? err})`
        );
        lines.push("");
      }
    }

    // Thumbnail impressions + CTR per video. These metrics do NOT exist in
    // the Analytics query API at all — they only ship via the bulk
    // Reporting API's channel_reach_basic_a1 report (one CSV per day, lag
    // ~24-72h). Ensure the reporting job exists, then aggregate the most
    // recent daily CSVs per video.
    try {
      const jobs = (await ytReporting.jobs.list()).data.jobs ?? [];
      let reachJob = jobs.find(
        (j) => j.reportTypeId === "channel_reach_basic_a1"
      );
      if (!reachJob) {
        const created = await ytReporting.jobs.create({
          requestBody: {
            reportTypeId: "channel_reach_basic_a1",
            name: "channel-reach-basic",
          },
        });
        reachJob = created.data;
      }
      const reports =
        (
          await ytReporting.jobs.reports.list({
            jobId: reachJob.id,
            pageSize: 30,
          })
        ).data.reports ?? [];
      const sorted = reports
        .filter((r) => r.downloadUrl)
        .sort((a, b) => (b.endTime ?? "").localeCompare(a.endTime ?? ""))
        .slice(0, 14);

      if (sorted.length === 0) {
        lines.push(`## Reach per video (impressions/CTR)`);
        lines.push("");
        lines.push(
          `Reach report job ${reachJob.id} scheduled — first CSV lands ~24-72h after creation.`
        );
        lines.push("");
      } else {
        const { token } = await oauth2Client.getAccessToken();
        const byVideo = new Map();
        for (const rep of sorted) {
          const res = await fetch(rep.downloadUrl, {
            headers: { authorization: `Bearer ${token}` },
          });
          if (!res.ok) continue;
          const csv = await res.text();
          const rowsCsv = csv.trim().split("\n");
          const header = rowsCsv[0].split(",");
          const vi = header.indexOf("video_id");
          const ii = header.indexOf("video_thumbnail_impressions");
          const ci = header.indexOf("video_thumbnail_impressions_ctr");
          if (vi < 0 || ii < 0) continue;
          for (const line of rowsCsv.slice(1)) {
            const cols = line.split(",");
            const vid = cols[vi];
            const imp = +cols[ii] || 0;
            const cur = byVideo.get(vid) ?? { imp: 0, ctrW: 0 };
            cur.imp += imp;
            cur.ctrW += ci >= 0 ? (+cols[ci] || 0) * imp : 0;
            byVideo.set(vid, cur);
          }
        }
        const recent = new Set(videoIds);
        const agg = [...byVideo.entries()]
          .filter(([vid]) => recent.has(vid))
          .sort((a, b) => b[1].imp - a[1].imp);
        lines.push(`## Reach per video (impressions/CTR)`);
        lines.push("");
        if (agg.length === 0) {
          lines.push(`(no reach rows yet for the recent uploads)`);
        } else {
          lines.push("| videoId | Impressions | CTR% |");
          lines.push("|---|---|---|");
          for (const [vid, a] of agg) {
            lines.push(
              `| ${vid} | ${a.imp} | ${a.imp ? (a.ctrW / a.imp).toFixed(2) : "0"} |`
            );
          }
          lines.push("");
          const zero = agg.filter(([, a]) => a.imp === 0).length;
          lines.push(
            `Videos with zero impressions: ${zero}/${agg.length} — 0 means YouTube never surfaced it (distribution problem), not a click problem.`
          );
        }
        lines.push("");
      }
    } catch (err) {
      lines.push(`## Reach per video\n\n(Reach report failed: ${err.message ?? err})`);
      lines.push("");
    }

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
