import React from "react";

// Dev overlay marking the areas the Shorts/TikTok UI covers (PRD Q-07).
// Render only inside Remotion Studio — wrap usage in
// `process.env.NODE_ENV !== "production"` or a flag prop — never in
// final renders. Bands are approximate for the 1080x1920 frame:
// bottom ~360px (title/description/follow), right rail ~140px,
// top ~120px (feed chrome).
export const SafeZone: React.FC = () => {
  const band = (style: React.CSSProperties, label: string) => (
    <div
      style={{
        position: "absolute",
        backgroundColor: "rgba(255,60,60,0.18)",
        border: "1px dashed rgba(255,60,60,0.7)",
        color: "rgba(255,120,120,0.9)",
        fontSize: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        ...style,
      }}
    >
      {label}
    </div>
  );
  return (
    <>
      {band({ top: 0, left: 0, right: 0, height: 120 }, "UI top")}
      {band({ bottom: 0, left: 0, right: 0, height: 360 }, "UI bottom (title/desc)")}
      {band({ bottom: 360, right: 0, width: 140, height: 560 }, "rail")}
    </>
  );
};
