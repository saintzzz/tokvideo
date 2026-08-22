import React from "react";
import { AbsoluteFill } from "remotion";
import { ScienceDiagram, DiagramKey } from "../components/ScienceDiagram";

export const DiagramScene: React.FC<{ diagram: DiagramKey; locale: "vi" | "en" }> = ({
  diagram,
  locale,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0c140e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ScienceDiagram diagram={diagram} locale={locale} />
    </AbsoluteFill>
  );
};
