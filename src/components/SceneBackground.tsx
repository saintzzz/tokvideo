import React from "react";
import { AbsoluteFill } from "remotion";
import { StarField } from "./StarField";

export const SceneBackground: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, #1a2a4a 0%, #0c1226 55%, #050810 100%)",
      }}
    >
      <StarField />
      {children}
    </AbsoluteFill>
  );
};
