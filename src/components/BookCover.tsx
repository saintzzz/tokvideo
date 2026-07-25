import React from "react";
import { fonts } from "../fonts";

const ZODIAC = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const BookCover: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  return (
    <div
      style={{
        width: 340 * scale,
        height: 480 * scale,
        backgroundColor: "#7A1F1F",
        borderRadius: 6 * scale,
        border: `${3 * scale}px solid #C9A24B`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14 * scale,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#F3E7C9",
          borderRadius: 3 * scale,
          border: `${1.5 * scale}px solid #7A1F1F`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${28 * scale}px ${16 * scale}px`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 15 * scale,
            letterSpacing: 2,
            color: "#5B4630",
          }}
        >
          Khải Tâm
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: fonts.serif,
              fontWeight: 700,
              fontSize: 52 * scale,
              color: "#7A1F1F",
              lineHeight: 1.05,
            }}
          >
            TỬ VI
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontWeight: 700,
              fontSize: 26 * scale,
              color: "#241a10",
              marginTop: 6 * scale,
            }}
          >
            LUẬN GIẢI
          </div>
        </div>

        <div
          style={{
            width: 120 * scale,
            height: 120 * scale,
            borderRadius: "50%",
            border: `${3 * scale}px solid #C9A24B`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 46 * scale,
              height: 46 * scale,
              borderRadius: "50%",
              background:
                "conic-gradient(#241a10 0deg 180deg, #F3E7C9 180deg 360deg)",
              border: `${1.5 * scale}px solid #241a10`,
            }}
          />
          {ZODIAC.map((glyph, i) => {
            const angle = (i / ZODIAC.length) * 360;
            const radius = 52 * scale;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  fontSize: 10 * scale,
                  color: "#7A1F1F",
                  transform: `rotate(${angle}deg) translate(0, -${radius}px) rotate(-${angle}deg)`,
                }}
              >
                {glyph}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
