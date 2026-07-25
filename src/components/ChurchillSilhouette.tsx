import React from "react";

// Stylised silhouette (not a photo) evoking Churchill's signature homburg
// hat, cigar and stout silhouette — original shapes, no copyrighted image.
export const ChurchillSilhouette: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => {
  const w = 220 * scale;
  const h = 300 * scale;

  return (
    <div style={{ width: w, height: h, position: "relative" }}>
      <svg width={w} height={h} viewBox="0 0 220 300">
        <ellipse cx="110" cy="230" rx="95" ry="70" fill="#1a1a1a" />
        <ellipse cx="110" cy="140" rx="55" ry="60" fill="#1a1a1a" />
        <path
          d="M 55 110 Q 110 60 165 110 L 172 128 Q 110 100 48 128 Z"
          fill="#1a1a1a"
        />
        <ellipse cx="110" cy="98" rx="66" ry="14" fill="#1a1a1a" />
        <rect
          x="150"
          y="168"
          width="46"
          height="9"
          rx="4.5"
          fill="#1a1a1a"
          transform="rotate(-8 150 168)"
        />
        <ellipse cx="198" cy="163" rx="5" ry="4" fill="#c9a24b" opacity="0.85" />
      </svg>
    </div>
  );
};
