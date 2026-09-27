import baNgayTruocDamCuoi from "./ba-ngay-truoc-dam-cuoi.json";
import threeDaysBeforeTheWedding from "./3-days-before-the-wedding.json";
import kiemHonThucTinhTap01 from "./kiem-hon-thuc-tinh-tap-01.json";
import thanYMaDeTap01 from "./than-y-ma-de-tap-01.json";
import luyenKhiMuoiVanNamTap01 from "./luyen-khi-muoi-van-nam-tap-01.json";
import hongTranNuDeTap01 from "./hong-tran-nu-de-tap-01.json";
import maTonTrongSinhTap01 from "./ma-ton-trong-sinh-tap-01.json";
import { LongFormEpisode } from "./types";

// Long-form (~20-60 min, landscape) Suc Khoe episodes — a separate format
// from the Shorts pipeline, one continuous story per episode instead of
// independent scenes. Add a new one: create `long-form/<slug>.json` with
// the same shape, import it here, add it to this list.
export const LONG_FORM_EPISODES: LongFormEpisode[] = [
  baNgayTruocDamCuoi,
  threeDaysBeforeTheWedding,
  // Xianxia audiobook series (owner direction 2026-09-27): serialized
  // ~60-minute cultivation-novel episodes, narrator-only beats.
  kiemHonThucTinhTap01,
  thanYMaDeTap01,
  luyenKhiMuoiVanNamTap01,
  hongTranNuDeTap01,
  maTonTrongSinhTap01,
] as LongFormEpisode[];
