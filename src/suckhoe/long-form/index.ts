import baNgayTruocDamCuoi from "./ba-ngay-truoc-dam-cuoi.json";
import threeDaysBeforeTheWedding from "./3-days-before-the-wedding.json";
import loiNguyenGiengCuTap01 from "./loi-nguyen-gieng-cu-tap-01.json";
import loiNguyenGiengCuTap02 from "./loi-nguyen-gieng-cu-tap-02.json";
import loiNguyenGiengCuTap03 from "./loi-nguyen-gieng-cu-tap-03.json";
import loiNguyenGiengCuTap04 from "./loi-nguyen-gieng-cu-tap-04.json";
import loiNguyenGiengCuTap05 from "./loi-nguyen-gieng-cu-tap-05.json";
import dungTraLoiTap01 from "./dung-tra-loi-tap-01.json";
import dungTraLoiTap02 from "./dung-tra-loi-tap-02.json";
import dungTraLoiTap03 from "./dung-tra-loi-tap-03.json";
import dungTraLoiTap04 from "./dung-tra-loi-tap-04.json";
import dungTraLoiTap05 from "./dung-tra-loi-tap-05.json";
import { LongFormEpisode } from "./types";

// Long-form (~20-60 min, landscape) Suc Khoe episodes — a separate format
// from the Shorts pipeline, one continuous story per episode instead of
// independent scenes. Add a new one: create `long-form/<slug>.json` with
// the same shape, import it here, add it to this list.
export const LONG_FORM_EPISODES: LongFormEpisode[] = [
  baNgayTruocDamCuoi,
  threeDaysBeforeTheWedding,
  // Horror arc (CR-002): "Loi nguyen gieng cu" - one continuous ghost
  // story in 5 ~30-min episodes, shared sceneImages across episodes.
  loiNguyenGiengCuTap01,
  loiNguyenGiengCuTap02,
  loiNguyenGiengCuTap03,
  loiNguyenGiengCuTap04,
  loiNguyenGiengCuTap05,
  // Horror arc 2 (owner direction 2026-10-10: drop xianxia, focus on
  // gripping ghost stories): "Dung tra loi" - a voice-mimicking spirit
  // arc in 5 ~25-min episodes, shares the village-ghost tone of Gieng Cu
  // but a different mechanism (answering = opening the door for it).
  dungTraLoiTap01,
  dungTraLoiTap02,
  dungTraLoiTap03,
  dungTraLoiTap04,
  dungTraLoiTap05,
] as LongFormEpisode[];
