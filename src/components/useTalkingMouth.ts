// Cheap "is this character talking" mouth-open signal — no ML, no audio
// analysis, just layered sine waves so the mouth doesn't move in an
// obviously robotic single-frequency loop. Good enough to read as "talking"
// in a small illustrated character; not real lip-sync.
export const useMouthOpenAmount = (isSpeaking: boolean, frame: number) => {
  if (!isSpeaking) return 0;

  const wobble =
    Math.sin(frame * 0.9) * 0.5 +
    Math.sin(frame * 1.7 + 1.3) * 0.3 +
    Math.sin(frame * 0.35 + 2.1) * 0.2;

  return Math.max(0, Math.min(1, (wobble + 1) / 2));
};
