// Shared metadata builder for long-form Suc Khoe episodes — used by
// upload-youtube-long.mjs (publish time) and update-long-metadata.mjs
// (retroactive metadata fixes on already-published videos), so both
// paths produce identical titles/descriptions/tags.
//
// Title convention (2026-10-18 SEO pass): the searchable keyword phrase
// leads, not the arc name — nobody searches "đêm khâm liệm", they search
// "truyện ma có thật" / "truyện ma làng quê". Legacy titles were
// "ARC | Tập N: HOOK | Truyện Ma Dài"; the new format is
// "Truyện Ma Có Thật | ARC - Tập N: HOOK" (arc name de-uppercased).

const SEARCH_LEAD_VI = "Truyện Ma Có Thật";
const SEARCH_LEAD_EN = "True Horror Story";

export function arcBase(slug) {
  const m = slug.match(/^(.*)-tap-\d+$/);
  return m ? m[1] : slug;
}

// "dem-kham-liem" -> "Đêm Khâm Liệm" using the episode's own title
// casing when available, else a title-cased slug.
export function arcDisplayName(episode, slug) {
  // Legacy title format: "ARC NAME | Tập N: ...". Reuse the arc part
  // but title-case it so the new title doesn't shout.
  const legacy = episode.title?.split("|")[0]?.trim();
  if (legacy) {
    return legacy
      .toLocaleLowerCase("vi")
      .replace(/(^|\s)([\p{L}])/gu, (_, sp, ch) => sp + ch.toLocaleUpperCase("vi"));
  }
  return arcBase(slug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function hookPart(episode) {
  // Legacy: "ARC | Tập N: HOOK | Truyện Ma Dài" -> "HOOK".
  // New-format or plain titles pass through unchanged.
  const parts = (episode.title ?? "").split("|").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[1].replace(/^Tập\s*\d+\s*:\s*/i, "").trim();
  }
  return episode.title;
}

function episodeNumber(slug) {
  const m = slug.match(/-tap-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

// Keyword-first title. Always <= 100 chars (YouTube hard limit); if the
// full form overflows, the hook is truncated with an ellipsis rather
// than dropping the searchable lead.
export function longFormTitle(episode, slug) {
  const isEn = episode.locale === "en";
  const lead = isEn ? SEARCH_LEAD_EN : SEARCH_LEAD_VI;
  const arc = arcDisplayName(episode, slug);
  const num = episodeNumber(slug);
  const hook = hookPart(episode);

  const full = num
    ? `${lead} | ${arc} - Tập ${num}: ${hook}`
    : `${lead} | ${arc}: ${hook}`;
  if ([...full].length <= 100) return full;

  const suffix = num ? `${lead} | ${arc} - Tập ${num}: ` : `${lead} | ${arc}: `;
  const budget = 100 - [...suffix].length - 1;
  return suffix + [...hook].slice(0, budget).join("") + "…";
}

export function playlistUrl(playlistId) {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}

export function videoUrl(videoId) {
  return `https://youtu.be/${videoId}`;
}

// Full description. prevVideoId/nextVideoId come from the publish ledger
// (may be absent for arc edges) — the links are the binge-session
// chaining signal, so they're placed before the boilerplate.
export function longFormDescription(episode, { playlistId, prevVideoId, nextVideoId } = {}) {
  const isEn = episode.locale === "en";
  const lines = [episode.description, ""];

  if (prevVideoId) {
    lines.push(isEn ? `◀ Previous episode: ${videoUrl(prevVideoId)}` : `◀ Tập trước: ${videoUrl(prevVideoId)}`);
  }
  if (nextVideoId) {
    lines.push(isEn ? `▶ Next episode: ${videoUrl(nextVideoId)}` : `▶ Tập tiếp theo: ${videoUrl(nextVideoId)}`);
  }
  if (playlistId) {
    lines.push(isEn ? `▶ Full series playlist: ${playlistUrl(playlistId)}` : `▶ Nghe trọn bộ: ${playlistUrl(playlistId)}`);
    lines.push("");
  }

  if (isEn) {
    lines.push(
      "A serialized fiction story, narrated chapter by chapter. Subscribe and open the playlist to follow the full arc.",
      "",
      episode.hashtags ?? "#storytime #audiobook #serializedfiction",
    );
  } else {
    lines.push(
      "Truyện ma dài kể theo tập, nghe trọn một lần. Đăng ký kênh và mở playlist để nghe trọn bộ.",
      "",
      episode.hashtags ?? "#truyenma #truyenmadai #nghetruyen #truyenmacothat",
    );
  }
  return lines.join("\n");
}

export function longFormTags(episode) {
  if (episode.tags) return episode.tags;
  const isEn = episode.locale === "en";
  return isEn
    ? ["storytime", "audiobook", "fiction", "serializedstory"]
    : ["truyện ma", "truyện ma dài", "truyện ma có thật", "nghe truyện", "truyện audio"];
}
