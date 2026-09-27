import { SucKhoeEpisode } from "../types";

// Add a new episode: create `episodes/<slug>.json` with the same shape,
// import it here, and add it to this list. scripts/generate-voiceover.mjs
import truyenCayTreTramDotTap1 from "./truyen-cay-tre-tram-dot-tap-1.json";
import truyenCayTreTramDotTap2 from "./truyen-cay-tre-tram-dot-tap-2.json";
import truyenMaNhaHoangDauLangTap1 from "./truyen-ma-nha-hoang-dau-lang-tap-1.json";
import truyenMaNhaHoangDauLangTap2 from "./truyen-ma-nha-hoang-dau-lang-tap-2.json";
import truyenBatComCuoiCungTap1 from "./truyen-bat-com-cuoi-cung-tap-1.json";
import truyenBatComCuoiCungTap2 from "./truyen-bat-com-cuoi-cung-tap-2.json";
import truyenVuaLyDoiDoTap1 from "./truyen-vua-ly-doi-do-tap-1.json";
import truyenVuaLyDoiDoTap2 from "./truyen-vua-ly-doi-do-tap-2.json";
import truyenNguoiLinhChoDoiTap1 from "./truyen-nguoi-linh-cho-doi-tap-1.json";
import truyenNguoiLinhChoDoiTap2 from "./truyen-nguoi-linh-cho-doi-tap-2.json";
import truyenTamCamCaBongTap1 from "./truyen-tam-cam-ca-bong-tap-1.json";
import truyenTamCamCaBongTap2 from "./truyen-tam-cam-ca-bong-tap-2.json";
import truyenTamCamCaBongTap3 from "./truyen-tam-cam-ca-bong-tap-3.json";
import truyenBongDenGiuaDongTap1 from "./truyen-bong-den-giua-dong-tap-1.json";
import truyenBongDenGiuaDongTap2 from "./truyen-bong-den-giua-dong-tap-2.json";
import truyenAnDuongVuongNoThanTap1 from "./truyen-an-duong-vuong-no-than-tap-1.json";
import truyenAnDuongVuongNoThanTap2 from "./truyen-an-duong-vuong-no-than-tap-2.json";
import enJackOLanternPart1 from "./en-jack-o-lantern-part-1.json";
import enJackOLanternPart2 from "./en-jack-o-lantern-part-2.json";
import enVanishingHitchhikerPart1 from "./en-vanishing-hitchhiker-part-1.json";
import enVanishingHitchhikerPart2 from "./en-vanishing-hitchhiker-part-2.json";
import enTwoBrothersWheatPart1 from "./en-two-brothers-wheat-part-1.json";
import enTwoBrothersWheatPart2 from "./en-two-brothers-wheat-part-2.json";
import enChessboardRiceHistoryPart1 from "./en-chessboard-rice-history-part-1.json";
import enChessboardRiceHistoryPart2 from "./en-chessboard-rice-history-part-2.json";
// discovers new episode files on its own (it reads this directory), so
// nothing needs to change there.
//
// English-market episodes (locale: "en", slug prefixed `en-`) publish
// through a separate channel/queue — see scripts/publish-next-suckhoe.mjs
// --locale=en. They live in this same array/directory; the locale field
// is what routes them, not a separate file tree.
export const EPISODES: SucKhoeEpisode[] = [
  truyenCayTreTramDotTap1,
  truyenCayTreTramDotTap2,
  truyenMaNhaHoangDauLangTap1,
  truyenMaNhaHoangDauLangTap2,
  truyenBatComCuoiCungTap1,
  truyenBatComCuoiCungTap2,
  truyenVuaLyDoiDoTap1,
  truyenVuaLyDoiDoTap2,
  truyenNguoiLinhChoDoiTap1,
  truyenNguoiLinhChoDoiTap2,
  truyenTamCamCaBongTap1,
  truyenTamCamCaBongTap2,
  truyenTamCamCaBongTap3,
  truyenBongDenGiuaDongTap1,
  truyenBongDenGiuaDongTap2,
  truyenAnDuongVuongNoThanTap1,
  truyenAnDuongVuongNoThanTap2,
  enJackOLanternPart1,
  enJackOLanternPart2,
  enVanishingHitchhikerPart1,
  enVanishingHitchhikerPart2,
  enTwoBrothersWheatPart1,
  enTwoBrothersWheatPart2,
  enChessboardRiceHistoryPart1,
  enChessboardRiceHistoryPart2,
] as SucKhoeEpisode[];
