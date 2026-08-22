import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../fonts";

export type DiagramKey =
  | "honey"
  | "ginger"
  | "ginger-en"
  | "turmeric"
  | "fishmint"
  | "honeylemon"
  | "chickensoup"
  | "oatmeal"
  | "mythbust";

type Step = { icon: "hex" | "molecule" | "bacteria" | "gate" | "stomach" | "skin" | "cell" | "bottle" | "x"; label: string };

const DIAGRAMS: Record<DiagramKey, { steps: Step[]; verdict: "confirmed" | "unproven" }> = {
  honey: {
    steps: [
      { icon: "hex", label: "Enzyme" },
      { icon: "molecule", label: "H2O2" },
      { icon: "bacteria", label: "Vi khuẩn giảm" },
    ],
    verdict: "confirmed",
  },
  honeylemon: {
    steps: [
      { icon: "hex", label: "Enzyme" },
      { icon: "molecule", label: "H2O2" },
      { icon: "bacteria", label: "Bacteria reduced" },
    ],
    verdict: "confirmed",
  },
  ginger: {
    steps: [
      { icon: "molecule", label: "Gingerol" },
      { icon: "gate", label: "Chặn thụ thể" },
      { icon: "stomach", label: "Giảm buồn nôn" },
    ],
    verdict: "confirmed",
  },
  "ginger-en": {
    steps: [
      { icon: "molecule", label: "Gingerol" },
      { icon: "gate", label: "Blocks receptor" },
      { icon: "stomach", label: "Less nausea" },
    ],
    verdict: "confirmed",
  },
  turmeric: {
    steps: [
      { icon: "molecule", label: "Curcumin" },
      { icon: "stomach", label: "Bọc niêm mạc" },
      { icon: "cell", label: "Giảm viêm" },
    ],
    verdict: "confirmed",
  },
  fishmint: {
    steps: [
      { icon: "molecule", label: "Hoạt chất" },
      { icon: "bacteria", label: "Kháng khuẩn" },
      { icon: "skin", label: "Giảm mẩn ngứa" },
    ],
    verdict: "confirmed",
  },
  chickensoup: {
    steps: [
      { icon: "cell", label: "White blood cells" },
      { icon: "gate", label: "Movement slows" },
      { icon: "skin", label: "Less congestion" },
    ],
    verdict: "confirmed",
  },
  oatmeal: {
    steps: [
      { icon: "molecule", label: "Avenanthramides" },
      { icon: "cell", label: "Less inflammation" },
      { icon: "skin", label: "Skin calms down" },
    ],
    verdict: "confirmed",
  },
  mythbust: {
    steps: [
      { icon: "bottle", label: "Apple cider vinegar / Epsom salt" },
      { icon: "x", label: "Not enough evidence" },
    ],
    verdict: "unproven",
  },
};

const Icon: React.FC<{ type: Step["icon"]; size: number }> = ({ type, size }) => {
  const color = "#F2FAEC";
  const s = size;
  switch (type) {
    case "hex":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke={color} strokeWidth="6" />
        </svg>
      );
    case "molecule":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="30" cy="35" r="14" fill={color} />
          <circle cx="70" cy="35" r="10" fill={color} opacity={0.7} />
          <circle cx="50" cy="70" r="12" fill={color} opacity={0.85} />
          <line x1="30" y1="35" x2="70" y2="35" stroke={color} strokeWidth="4" />
          <line x1="30" y1="35" x2="50" y2="70" stroke={color} strokeWidth="4" />
        </svg>
      );
    case "bacteria":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="26" fill="none" stroke={color} strokeWidth="6" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const x1 = 50 + Math.cos(a) * 26;
            const y1 = 50 + Math.sin(a) * 26;
            const x2 = 50 + Math.cos(a) * 40;
            const y2 = 50 + Math.sin(a) * 40;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="5" />;
          })}
        </svg>
      );
    case "gate":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke={color} strokeWidth="6" />
          <line x1="20" y1="50" x2="80" y2="50" stroke={color} strokeWidth="6" />
        </svg>
      );
    case "stomach":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path
            d="M 30 20 Q 15 40 25 65 Q 35 90 60 85 Q 85 78 80 55 Q 78 35 55 30 Q 45 28 30 20 Z"
            fill="none"
            stroke={color}
            strokeWidth="6"
          />
        </svg>
      );
    case "skin":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M 15 50 Q 30 30 45 50 T 75 50 T 100 50" stroke={color} strokeWidth="6" fill="none" />
          <path d="M 15 68 Q 30 48 45 68 T 75 68 T 100 68" stroke={color} strokeWidth="6" fill="none" opacity={0.6} />
        </svg>
      );
    case "cell":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="32" fill="none" stroke={color} strokeWidth="6" />
          <circle cx="50" cy="50" r="10" fill={color} />
        </svg>
      );
    case "bottle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="35" y="15" width="14" height="14" fill={color} />
          <path d="M 30 30 L 30 90 Q 30 95 35 95 L 65 95 Q 70 95 70 90 L 70 30 Z" fill="none" stroke={color} strokeWidth="6" />
        </svg>
      );
    case "x":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <line x1="25" y1="25" x2="75" y2="75" stroke="#E0A03C" strokeWidth="10" strokeLinecap="round" />
          <line x1="75" y1="25" x2="25" y2="75" stroke="#E0A03C" strokeWidth="10" strokeLinecap="round" />
        </svg>
      );
  }
};

export const ScienceDiagram: React.FC<{ diagram: DiagramKey; locale?: "vi" | "en" }> = ({
  diagram,
  locale,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { steps, verdict } = DIAGRAMS[diagram];

  const containerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const containerScale = interpolate(containerSpring, [0, 1], [0.85, 1]);
  const containerOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const verdictOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const verdictScale = spring({ frame: frame - 55, fps, config: { damping: 10 }, durationInFrames: 20 });

  const verdictLabel =
    verdict === "confirmed"
      ? locale === "en"
        ? "CONFIRMED"
        : "XÁC THỰC"
      : locale === "en"
      ? "UNPROVEN"
      : "CẦN THÊM NGHIÊN CỨU";
  const verdictColor = verdict === "confirmed" ? "#7CB342" : "#E0A03C";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
        opacity: containerOpacity,
        transform: `scale(${containerScale})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        {steps.map((step, i) => {
          const stepDelay = i * 15;
          const stepOpacity = interpolate(frame, [stepDelay, stepDelay + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const stepY = interpolate(frame, [stepDelay, stepDelay + 15], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  opacity: stepOpacity,
                  transform: `translateY(${stepY}px)`,
                }}
              >
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: "rgba(124,179,66,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon type={step.icon} size={64} />
                </div>
                <div
                  style={{
                    fontFamily: fonts.sans,
                    fontWeight: 700,
                    fontSize: 24,
                    color: "#F2FAEC",
                    textAlign: "center",
                    maxWidth: 200,
                  }}
                >
                  {step.label}
                </div>
              </div>
              {i < steps.length - 1 ? (
                <div
                  style={{
                    opacity: stepOpacity,
                    fontSize: 40,
                    color: "#7CB342",
                  }}
                >
                  →
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      <div
        style={{
          opacity: verdictOpacity,
          transform: `scale(${verdictScale})`,
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 34,
          color: "#0e150d",
          backgroundColor: verdictColor,
          borderRadius: 16,
          padding: "12px 36px",
          letterSpacing: 1,
        }}
      >
        {verdictLabel}
      </div>
    </div>
  );
};
