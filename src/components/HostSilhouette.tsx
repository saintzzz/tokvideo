import React from "react";
import { HealerSilhouette } from "./HealerSilhouette";
import { GrandmaHostSilhouette } from "./GrandmaHostSilhouette";

// Picks the right Suc Khoe host character by episode locale — the
// Vietnamese "bà lang" for locale "vi"/undefined, the Western grandma
// figure for locale "en". Scenes should use this instead of importing
// either character directly, so a new locale only needs a change here.
export const HostSilhouette: React.FC<{
  locale?: "vi" | "en";
  scale?: number;
  isSpeaking?: boolean;
}> = ({ locale, scale, isSpeaking }) =>
  locale === "en" ? (
    <GrandmaHostSilhouette scale={scale} isSpeaking={isSpeaking} />
  ) : (
    <HealerSilhouette scale={scale} isSpeaking={isSpeaking} />
  );
