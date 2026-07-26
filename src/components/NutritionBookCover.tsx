import React from "react";
import { fonts } from "../fonts";

export const NutritionBookCover: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => {
  return (
    <div
      style={{
        width: 340 * scale,
        height: 480 * scale,
        backgroundColor: "#111814",
        borderRadius: 6 * scale,
        border: `${2 * scale}px solid #3a4a36`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${34 * scale}px ${22 * scale}px`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 14 * scale,
          letterSpacing: 3,
          color: "#8fae7d",
        }}
      >
        ĂN ĐÚNG · SỐNG KHOẺ
      </div>

      <div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 30 * scale,
            color: "#7CB342",
            lineHeight: 1.2,
          }}
        >
          LIỆU PHÁP
          <br />
          DINH DƯỠNG
        </div>
        <div
          style={{
            marginTop: 10 * scale,
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 22 * scale,
            color: "#F3EFE3",
          }}
        >
          CHO MỌI LOẠI BỆNH
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10 * scale,
        }}
      >
        {["#7CB342", "#C0472A", "#D8A23A"].map((c) => (
          <div
            key={c}
            style={{
              width: 34 * scale,
              height: 34 * scale,
              borderRadius: "50%",
              backgroundColor: c,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 13 * scale,
          color: "#c7d6bd",
          lineHeight: 1.6,
        }}
      >
        Hơn 500 công thức dinh dưỡng
        <br />
        theo từng nhu cầu sức khoẻ
      </div>
    </div>
  );
};
