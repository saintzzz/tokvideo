import React from "react";
import { fonts } from "../fonts";

const EyePyramid: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      d="M 50 15 L 90 82 L 10 82 Z"
      fill="none"
      stroke={color}
      strokeWidth="4"
    />
    <ellipse cx="50" cy="58" rx="18" ry="10" fill={color} />
    <circle cx="50" cy="58" r="6" fill="#0e0d0a" />
  </svg>
);

const CrossedSwords: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      d="M 15 15 L 85 85 M 78 78 L 90 82 L 82 90"
      stroke={color}
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M 85 15 L 15 85 M 22 78 L 10 82 L 18 90"
      stroke={color}
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MiniCover: React.FC<{
  title: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  rotate: number;
  scale: number;
}> = ({ title, bg, border, icon, rotate, scale }) => (
  <div
    style={{
      width: 240 * scale,
      height: 340 * scale,
      backgroundColor: bg,
      border: `${3 * scale}px solid ${border}`,
      borderRadius: 8 * scale,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `${22 * scale}px ${14 * scale}px`,
      boxShadow: "0 20px 45px rgba(0,0,0,0.5)",
      transform: `rotate(${rotate}deg)`,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: fonts.serif,
        fontSize: 12 * scale,
        letterSpacing: 3,
        color: border,
      }}
    >
      MẶC AM
    </div>

    {icon}

    <div
      style={{
        fontFamily: fonts.serif,
        fontWeight: 700,
        fontSize: 24 * scale,
        color: border,
        lineHeight: 1.2,
        whiteSpace: "pre-line",
      }}
    >
      {title}
    </div>
  </div>
);

export const AmMuuBookCovers: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 10 * scale,
        alignItems: "center",
      }}
    >
      <MiniCover
        title={"THUYẾT\nÂM MƯU"}
        bg="#161512"
        border="#C9A24B"
        icon={<EyePyramid size={70 * scale} color="#C9A24B" />}
        rotate={-6}
        scale={scale}
      />
      <MiniCover
        title={"THUYẾT\nDƯƠNG MƯU"}
        bg="#7A1F1F"
        border="#F0DDB0"
        icon={<CrossedSwords size={70 * scale} color="#F0DDB0" />}
        rotate={5}
        scale={scale}
      />
    </div>
  );
};
