import React from "react";
import { fonts } from "../fonts";

export const CommunicationBookCover: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => {
  return (
    <div
      style={{
        width: 340 * scale,
        height: 480 * scale,
        backgroundColor: "#E8871E",
        borderRadius: 6 * scale,
        boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12 * scale,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: 3 * scale,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${30 * scale}px ${18 * scale}px`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 15 * scale,
            letterSpacing: 2,
            color: "#3a3a3a",
          }}
        >
          Cốc Vũ
        </div>

        <div>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 34 * scale,
              color: "#E8871E",
              lineHeight: 1.15,
            }}
          >
            NGHỆ THUẬT
            <br />
            GIAO TIẾP
            <br />
            ĐỈNH CAO
          </div>
        </div>

        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 13 * scale,
            color: "#3a3a3a",
            lineHeight: 1.6,
          }}
        >
          160 công thức đối đáp thông minh
          <br />
          160 bí quyết giao tiếp đỉnh cao
        </div>
      </div>
    </div>
  );
};
