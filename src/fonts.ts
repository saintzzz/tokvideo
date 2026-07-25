import { loadFont as loadNotoSerif } from "@remotion/google-fonts/NotoSerif";
import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";

const { fontFamily: serifFontFamily } = loadNotoSerif("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "vietnamese"],
});

const { fontFamily: sansFontFamily } = loadBeVietnamPro("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin", "vietnamese"],
});

export const fonts = {
  serif: serifFontFamily,
  sans: sansFontFamily,
};
