import React from "react";
import { useCurrentFrame } from "remotion";
import { SteamWisps } from "./SteamWisps";

// Flat-vector ingredient illustrations matching the Ba Tu model-sheet
// aesthetic (warm fills, soft darker shade, no outlines-on-everything).
// resolveArt() maps an episode's ingredientName to a drawable kind —
// unknown names fall back to a generic jar so every episode gets art.

type ArtKind =
  | "pear" | "herb" | "seeds" | "soup" | "steam-basket" | "orange"
  | "porridge" | "rice-water" | "honey-spoon" | "cherry-drink"
  | "hair-rinse" | "applesauce" | "cucumber"
  | "jar" | "tea" | "bowl" | "fruit" | "leaf" | "root";

const RULES: [RegExp, ArtKind][] = [
  [/lê chưng|pear/i, "pear"],
  [/húng chanh|lá (bưởi|tía|bạc hà)|herb|mint|sage|rosemary|thyme/i, "herb"],
  [/tim sen|hạt sen|nhãn sen|táo đỏ|seed/i, "seeds"],
  [/xông|steam/i, "steam-basket"],
  [/cháo|porridge|oatmeal|soup|chè|soup/i, "porridge"],
  [/cam |orange|nước cam/i, "orange"],
  [/vo gạo|rice water|nước vo/i, "rice-water"],
  [/mật ong|honey|clove/i, "honey-spoon"],
  [/cherry|anh đào|tart/i, "cherry-drink"],
  [/tóc|hair|rinse/i, "hair-rinse"],
  [/applesauce|táo|apple/i, "applesauce"],
  [/dưa chuột|cucumber|khoai tây|potato/i, "cucumber"],
  [/gừng|ginger|nghệ|turmeric|tỏi|garlic|root|rễ/i, "root"],
  [/trà|tea|nước|juice|nước ép|milk|sữa/i, "tea"],
  [/chanh|lemon|quất|kumquat|fruit|berry|chuối|banana/i, "fruit"],
  [/lá|leaf|ngải|rau/i, "leaf"],
  [/chè|canh|cháo|bowl|ngâm|hũ|jar/i, "bowl"],
];

export const resolveArt = (ingredientName: string): ArtKind => {
  for (const [re, kind] of RULES) if (re.test(ingredientName)) return kind;
  return "jar";
};

const BODY: Record<ArtKind, React.ReactNode> = {
  pear: (
    <>
      <path d="M100 42 Q 118 60 112 88 Q 138 100 138 136 Q 138 178 100 178 Q 62 178 62 136 Q 62 100 88 88 Q 82 60 100 42 Z" fill="#cfe08a" />
      <path d="M100 178 Q 128 172 134 142 Q 128 170 100 172 Q 84 172 72 160 Q 84 178 100 178 Z" fill="#a9bd62" opacity="0.7" />
      <path d="M100 42 Q 100 30 108 24" stroke="#6b8f4e" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M108 24 Q 122 18 130 26 Q 120 34 108 30 Z" fill="#7fa05c" />
      <ellipse cx="84" cy="120" rx="10" ry="18" fill="#fff" opacity="0.25" transform="rotate(-20 84 120)" />
    </>
  ),
  herb: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M100 160 Q ${60 + i * 20} ${120 - i * 18} ${52 + i * 24} ${64 - i * 8}`}
          stroke="#5d8f4e"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={52 + i * 24} cy={60 - i * 8} rx="16" ry="10" fill="#7fb069" transform={`rotate(${-30 + i * 15} ${52 + i * 24} ${60 - i * 8})`} />
      ))}
    </>
  ),
  seeds: (
    <>
      <ellipse cx="100" cy="150" rx="66" ry="26" fill="#8a6f4d" />
      <ellipse cx="100" cy="144" rx="60" ry="22" fill="#e8dcc4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={64 + i * 15} cy={140 + (i % 2) * 8} rx="9" ry="11" fill="#f3ead6" stroke="#d8c9a8" strokeWidth="1.5" />
      ))}
      <ellipse cx="100" cy="120" rx="14" ry="10" fill="#b8493f" />
    </>
  ),
  soup: null as never,
  "steam-basket": (
    <>
      <path d="M40 110 L160 110 L150 160 Q 100 174 50 160 Z" fill="#a9855a" />
      <path d="M40 110 Q 100 96 160 110" stroke="#8a6b42" strokeWidth="8" fill="none" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${52 + i * 34} 108 L ${56 + i * 34} 158`} stroke="#8a6b42" strokeWidth="4" opacity="0.6" />
      ))}
      <ellipse cx="100" cy="100" rx="48" ry="14" fill="#7fb069" />
    </>
  ),
  orange: (
    <>
      <rect x="62" y="70" width="76" height="96" rx="12" fill="#e8e0d0" opacity="0.35" />
      <path d="M66 96 L134 96 L130 158 Q 100 168 70 158 Z" fill="#e8a13d" />
      <circle cx="100" cy="52" r="22" fill="#f0a848" />
      <path d="M100 34 Q 104 26 112 26" stroke="#6b8f4e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="92" cy="46" rx="6" ry="8" fill="#fff" opacity="0.35" />
    </>
  ),
  porridge: (
    <>
      <path d="M38 96 L162 96 L152 158 Q 100 172 48 158 Z" fill="#b85966" />
      <ellipse cx="100" cy="96" rx="62" ry="18" fill="#99424e" />
      <ellipse cx="100" cy="92" rx="54" ry="14" fill="#f3ead6" />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={78 + i * 22} cy={90 + (i % 2) * 4} rx="8" ry="5" fill="#e0b98a" />
      ))}
    </>
  ),
  "rice-water": (
    <>
      <path d="M42 92 L158 92 L150 156 Q 100 170 50 156 Z" fill="#7d6a54" />
      <ellipse cx="100" cy="92" rx="58" ry="16" fill="#5f5140" />
      <ellipse cx="100" cy="88" rx="50" ry="12" fill="#f5efe0" opacity="0.9" />
      <ellipse cx="86" cy="86" rx="10" ry="4" fill="#fff" opacity="0.5" />
    </>
  ),
  "honey-spoon": (
    <>
      <path d="M60 84 Q 60 60 84 58 L116 58 Q 140 60 140 84 L136 150 Q 100 162 64 150 Z" fill="#d99a2b" />
      <ellipse cx="100" cy="84" rx="40" ry="12" fill="#b87a1e" />
      <path d="M62 96 Q 74 106 88 98 Q 100 92 112 100 Q 126 108 138 96 L136 108 Q 100 122 62 108 Z" fill="#f0b840" />
      <rect x="94" y="30" width="12" height="34" rx="6" fill="#8a6b42" />
      <ellipse cx="100" cy="30" rx="16" ry="8" fill="#8a6b42" />
    </>
  ),
  "cherry-drink": (
    <>
      <rect x="66" y="64" width="68" height="100" rx="10" fill="#e8e0d0" opacity="0.35" />
      <path d="M70 92 L130 92 L128 156 Q 100 166 72 156 Z" fill="#a03048" />
      <circle cx="88" cy="50" r="12" fill="#b8493f" />
      <circle cx="112" cy="48" r="12" fill="#96343a" />
      <path d="M88 42 Q 96 28 110 30" stroke="#5d8f4e" strokeWidth="4" fill="none" />
    </>
  ),
  "hair-rinse": (
    <>
      <path d="M100 40 Q 76 40 72 76 Q 70 118 84 150 Q 100 160 116 150 Q 130 118 128 76 Q 124 40 100 40 Z" fill="#f2d3ad" />
      <path d="M100 40 Q 78 42 74 78 Q 100 66 126 78 Q 122 42 100 40 Z" fill="#5a4636" />
      <path d="M74 78 Q 66 110 78 140" stroke="#5a4636" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M126 78 Q 134 110 122 140" stroke="#5a4636" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M64 96 Q 56 116 64 136" stroke="#f5efe0" strokeWidth="5" fill="none" opacity="0.8" strokeLinecap="round" />
      <path d="M136 96 Q 144 116 136 136" stroke="#f5efe0" strokeWidth="5" fill="none" opacity="0.8" strokeLinecap="round" />
    </>
  ),
  applesauce: (
    <>
      <path d="M44 100 L156 100 L148 156 Q 100 170 52 156 Z" fill="#7d9bb8" />
      <ellipse cx="100" cy="100" rx="56" ry="16" fill="#5d7f9e" />
      <ellipse cx="100" cy="96" rx="48" ry="12" fill="#e8c98a" />
      <circle cx="100" cy="52" r="24" fill="#c85a4a" />
      <path d="M100 32 Q 104 24 112 24" stroke="#6b8f4e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="91" cy="46" rx="7" ry="9" fill="#fff" opacity="0.3" />
    </>
  ),
  cucumber: (
    <>
      <ellipse cx="100" cy="120" rx="70" ry="34" fill="#4e7a3e" />
      <ellipse cx="100" cy="120" rx="62" ry="27" fill="#8fbf6e" />
      <ellipse cx="100" cy="120" rx="50" ry="20" fill="#c9e2a8" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={72 + i * 11} cy={114 + (i % 2) * 10} rx="4" ry="6" fill="#eef5da" />
      ))}
    </>
  ),
  tea: (
    <>
      <path d="M58 84 L142 84 L138 148 Q 100 160 62 148 Z" fill="#f3e7d3" />
      <ellipse cx="100" cy="84" rx="42" ry="12" fill="#d8c9a8" />
      <ellipse cx="100" cy="82" rx="34" ry="8" fill="#b8813f" />
      <path d="M142 92 Q 168 96 162 118 Q 158 134 138 128" stroke="#f3e7d3" strokeWidth="10" fill="none" />
    </>
  ),
  fruit: (
    <>
      <circle cx="88" cy="110" r="34" fill="#f0c03d" />
      <circle cx="122" cy="96" r="28" fill="#e8963d" />
      <path d="M122 70 Q 126 60 136 58" stroke="#6b8f4e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="78" cy="100" rx="8" ry="12" fill="#fff" opacity="0.3" />
    </>
  ),
  leaf: (
    <>
      <path d="M100 170 Q 40 120 58 52 Q 110 60 100 170 Z" fill="#5d8f4e" />
      <path d="M100 170 Q 160 120 142 52 Q 90 60 100 170 Z" fill="#7fb069" />
      <path d="M100 165 Q 100 100 100 60" stroke="#4a7340" strokeWidth="5" fill="none" />
    </>
  ),
  root: (
    <>
      <path d="M56 100 Q 40 130 62 152 Q 84 170 110 162 Q 150 158 152 128 Q 150 100 118 92 Q 80 82 56 100 Z" fill="#d9a05b" />
      <path d="M70 108 Q 90 100 112 104" stroke="#b8813f" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M66 130 Q 88 124 110 128" stroke="#b8813f" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="140" cy="98" rx="16" ry="10" fill="#c98d4a" />
    </>
  ),
  bowl: (
    <>
      <path d="M38 96 L162 96 L152 158 Q 100 172 48 158 Z" fill="#8a6f8f" />
      <ellipse cx="100" cy="96" rx="62" ry="18" fill="#6b5470" />
      <ellipse cx="100" cy="92" rx="54" ry="14" fill="#d8b8c8" />
    </>
  ),
  jar: (
    <>
      <path d="M62 74 L138 74 L144 148 Q 100 162 56 148 Z" fill="#c9b48a" />
      <rect x="70" y="52" width="60" height="24" rx="8" fill="#8a6b42" />
      <ellipse cx="100" cy="74" rx="38" ry="10" fill="#b89f72" />
      <rect x="76" y="96" width="48" height="34" rx="6" fill="#f3e7d3" opacity="0.8" />
    </>
  ),
};
BODY.soup = BODY.porridge;

const HOT: ArtKind[] = ["porridge", "tea", "soup", "steam-basket", "pear"];

export const IngredientArt: React.FC<{
  ingredientName: string;
  size?: number;
}> = ({ ingredientName, size = 220 }) => {
  const frame = useCurrentFrame();
  const kind = resolveArt(ingredientName);
  // gentle idle float — the prop breathes, it doesn't sit dead
  const bob = Math.sin(frame * 0.06) * 5;

  return (
    <div style={{ position: "relative", transform: `translateY(${bob}px)` }}>
      {HOT.includes(kind) ? (
        <div style={{ position: "absolute", left: "50%", top: -52, transform: "translateX(-50%)" }}>
          <SteamWisps />
        </div>
      ) : null}
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "block" }}>
        {/* plate shadow */}
        <ellipse cx="100" cy="178" rx="64" ry="10" fill="#000" opacity="0.2" />
        {BODY[kind]}
      </svg>
    </div>
  );
};
