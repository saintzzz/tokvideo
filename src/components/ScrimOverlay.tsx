import React from "react";
import { AbsoluteFill } from "remotion";

// Gradient darkening so white text stays legible over a real (bright)
// product photo. `position` picks which edge the text will sit near.
export const ScrimOverlay: React.FC<{
  position?: "bottom" | "top" | "full";
}> = ({ position = "bottom" }) => {
  const gradient =
    position === "bottom"
      ? "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)"
      : position === "top"
        ? "linear-gradient(to top, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)"
        : "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.75) 100%)";

  return <AbsoluteFill style={{ background: gradient }} />;
};
