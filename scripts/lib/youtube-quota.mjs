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
  const wrap = (obj, fb) =>
    new Proxy(obj, {
      get(target, prop) {
        const val = target[prop];
        if (typeof val === "function") {
          return async (...args) => {
            const fbFn = fb?.[prop];
            if (swapped && fbFn) return await fbFn.apply(fb, args);
            try {
              return await val.apply(target, args);
            } catch (e) {
              if (!isQuota(e) || !fbFn) throw e;
              swapped = true;
              console.log("quota pool 1 exhausted - switched to pool 2");
              return await fbFn.apply(fb, args);
            }
          };
        }
        if (val && typeof val === "object") return wrap(val, fb?.[prop]);
        return val;
      },
    });
  return wrap(primary, secondary);
}
