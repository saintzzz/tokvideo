// Shared teaser ledger-key helpers. The second-cut teaser ("climax
// teaser", mid-episode beats) uses the `${slug}-teaser2` key — every
// sweep that treats `-teaser` keys as Shorts must recognize both
// suffixes, else a teaser2 entry looks like a long pointing at a
// Short and doctor's wrong-type check would delete it.
export const isTeaserKey = (key) => /-teaser\d*$/.test(key);
export const teaserSlug = (key) => key.replace(/-teaser\d*$/, "");
export const teaserKeyFor = (slug, variant = 1) =>
  `${slug}-teaser${variant > 1 ? String(variant) : ""}`;
export const teaserVariantOf = (key) =>
  Number(key.match(/-teaser(\d*)$/)?.[1] || 1);
