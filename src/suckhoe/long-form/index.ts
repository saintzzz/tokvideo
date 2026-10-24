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
import huMaGaTap01 from "./hu-ma-ga-tap-01.json";
import huMaGaTap02 from "./hu-ma-ga-tap-02.json";
import huMaGaTap03 from "./hu-ma-ga-tap-03.json";
import huMaGaTap04 from "./hu-ma-ga-tap-04.json";
import huMaGaTap05 from "./hu-ma-ga-tap-05.json";
import demKhamLiemTap01 from "./dem-kham-liem-tap-01.json";
import demKhamLiemTap02 from "./dem-kham-liem-tap-02.json";
import demKhamLiemTap03 from "./dem-kham-liem-tap-03.json";
import demKhamLiemTap04 from "./dem-kham-liem-tap-04.json";
import demKhamLiemTap05 from "./dem-kham-liem-tap-05.json";
import chuyenDoDemTap01 from "./chuyen-do-dem-tap-01.json";
import chuyenDoDemTap02 from "./chuyen-do-dem-tap-02.json";
import chuyenDoDemTap03 from "./chuyen-do-dem-tap-03.json";
import chuyenDoDemTap04 from "./chuyen-do-dem-tap-04.json";
import chuyenDoDemTap05 from "./chuyen-do-dem-tap-05.json";
import honMaTap01 from "./hon-ma-tap-01.json";
import honMaTap02 from "./hon-ma-tap-02.json";
import honMaTap03 from "./hon-ma-tap-03.json";
import honMaTap04 from "./hon-ma-tap-04.json";
import honMaTap05 from "./hon-ma-tap-05.json";
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
  // Horror arc 3 (PO topic ranking, docs/PO-001): "Hu ma ga" - a Tay
  // highland family bound to a spirit jar (ma ga). Twist at tap 4: the
  // bound spirit is the murdered soul-seller - the arc turns from
  // haunting into a debt-and-atonement story.
  huMaGaTap01,
  huMaGaTap02,
  huMaGaTap03,
  huMaGaTap04,
  huMaGaTap05,
  // Horror arc 4 (PO topic rank #3, docs/PO-001): "Dem kham liem" - a
  // funeral-night corpse possession (tu thi troi day). Twist at tap 4:
  // the grandfather who kept the spirit-jar for luck turns out to be
  // the banished lover of the drowned girl inside it - the arc turns
  // from haunting into a 70-year star-crossed love story.
  demKhamLiemTap01,
  demKhamLiemTap02,
  demKhamLiemTap03,
  demKhamLiemTap04,
  demKhamLiemTap05,
  // Horror arc 5: "Chuyen do dem" - a night-ferryman arc. Son takes
  // over father's night ferry after he vanishes mid-river; the
  // passengers are the dead a village sank 40 years ago. Twist at
  // tap 4: the father went under voluntarily to become the return
  // ferryman so the son can survive the final one-way crossing.
  chuyenDoDemTap01,
  chuyenDoDemTap02,
  chuyenDoDemTap03,
  chuyenDoDemTap04,
  chuyenDoDemTap05,
  // Horror arc 6: "Hon ma" - a mountain-village ghost wedding. A
  // photographer is lured up the pass as the substitute groom; twist
  // at tap 3-4: the bride is not the monster, the village witch who
  // sealed her for 60 years is - the arc turns from haunting into a
  // rescue of two lovers separated for sixty years.
  honMaTap01,
  honMaTap02,
  honMaTap03,
  honMaTap04,
  honMaTap05,
] as LongFormEpisode[];
