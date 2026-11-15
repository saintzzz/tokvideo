// Shared YouTube client with transparent quota-pool fallback.
// Pool 1 (YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN) is tried first; when a
// call fails with a quota error the SAME call is retried once against
// pool 2 (YOUTUBE_*_2 secrets), which lives in a separate GCP project
// with its own 10k/day bucket. Drop-in replacement for the inline
// OAuth2 + google.youtube({...}) block every script currently builds by
// hand — quota storms turn into silent fallbacks instead of red steps.
import { google } from "googleapis";

const build = (id, secret, token) => {
  const auth = new google.auth.OAuth2(id, secret);
  auth.setCredentials({ refresh_token: token });
  return google.youtube({ version: "v3", auth });
};

const isQuota = (e) => /quota|quotaExceeded/i.test(String(e?.message ?? e));

export const youtubeConfigured = () =>
  !!(
    process.env.YOUTUBE_CLIENT_ID &&
    process.env.YOUTUBE_CLIENT_SECRET &&
    (process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_EN_REFRESH_TOKEN)
  );

export function makeYoutube({ en = false } = {}) {
  const refresh = en ? process.env.YOUTUBE_EN_REFRESH_TOKEN : process.env.YOUTUBE_REFRESH_TOKEN;
  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !refresh) return null;
  const primary = build(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, refresh);

  const { YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2, YOUTUBE_REFRESH_TOKEN_2 } = process.env;
  const secondary =
    YOUTUBE_CLIENT_ID_2 && YOUTUBE_CLIENT_SECRET_2 && YOUTUBE_REFRESH_TOKEN_2
      ? build(YOUTUBE_CLIENT_ID_2, YOUTUBE_CLIENT_SECRET_2, YOUTUBE_REFRESH_TOKEN_2)
      : null;
  if (!secondary) return primary;

  let swapped = false;
  const fallback = (orig, fbFn) =>
    async (...args) => {
      if (swapped && fbFn) return await fbFn(...args);
      try {
        return await orig(...args);
      } catch (e) {
        if (!isQuota(e) || !fbFn) throw e;
        swapped = true;
        console.log("quota pool 1 exhausted - switched to pool 2");
        return await fbFn(...args);
      }
    };
  // Resources like `search` are non-configurable non-writable data
  // properties - a proxy can't wrap them (invariant violation). Their
  // methods on the resource object itself are usually writable though,
  // so patch fallback in place; skip silently where even that fails.
  for (const name of ["search"]) {
    const res = primary[name], fbRes = secondary[name];
    if (!res || !fbRes) continue;
    for (const k of Object.getOwnPropertyNames(res)) {
      const orig = res[k];
      if (typeof orig !== "function" || typeof fbRes[k] !== "function") continue;
      const d = Object.getOwnPropertyDescriptor(res, k);
      if (d && "value" in d && d.configurable === false && d.writable === false) continue;
      try { res[k] = fallback(orig.bind(res), fbRes[k].bind(fbRes)); } catch { /* frozen */ }
    }
  }
  const wrap = (obj, fb) =>
    new Proxy(obj, {
      get(target, prop) {
        const val = target[prop];
        // Proxy invariant: a non-configurable, non-writable data property
        // must be returned verbatim (googleapis exposes `search` this
        // way). Wrapping it throws "proxy did not return its actual
        // value" — return raw; its methods were fallback-patched above.
        const d = Object.getOwnPropertyDescriptor(target, prop);
        if (d && "value" in d && d.configurable === false && d.writable === false) {
          return val;
        }
        if (typeof val === "function") {
          const fbFn = fb?.[prop];
          return fallback(val.bind(target), fbFn ? fbFn.bind(fb) : null);
        }
        if (val && typeof val === "object") return wrap(val, fb?.[prop]);
        return val;
      },
    });
  return wrap(primary, secondary);
}
