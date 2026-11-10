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
import quanTaiTroiTap01 from "./quan-tai-troi-tap-01.json";
import quanTaiTroiTap02 from "./quan-tai-troi-tap-02.json";
import quanTaiTroiTap03 from "./quan-tai-troi-tap-03.json";
import quanTaiTroiTap04 from "./quan-tai-troi-tap-04.json";
import quanTaiTroiTap05 from "./quan-tai-troi-tap-05.json";
import mieuHoangTap01 from "./mieu-hoang-tap-01.json";
import mieuHoangTap02 from "./mieu-hoang-tap-02.json";
import mieuHoangTap03 from "./mieu-hoang-tap-03.json";
import mieuHoangTap04 from "./mieu-hoang-tap-04.json";
import mieuHoangTap05 from "./mieu-hoang-tap-05.json";
import cayDaTap01 from "./cay-da-tap-01.json";
import cayDaTap02 from "./cay-da-tap-02.json";
import cayDaTap03 from "./cay-da-tap-03.json";
import cayDaTap04 from "./cay-da-tap-04.json";
import cayDaTap05 from "./cay-da-tap-05.json";
import cauKhiTap01 from "./cau-khi-tap-01.json";
import cauKhiTap02 from "./cau-khi-tap-02.json";
import cauKhiTap03 from "./cau-khi-tap-03.json";
import cauKhiTap04 from "./cau-khi-tap-04.json";
import cauKhiTap05 from "./cau-khi-tap-05.json";
import nguoiDiDanMuaTap01 from "./nguoi-di-dan-mua-tap-01.json";
import nguoiDiDanMuaTap02 from "./nguoi-di-dan-mua-tap-02.json";
import nguoiDiDanMuaTap03 from "./nguoi-di-dan-mua-tap-03.json";
import nguoiDiDanMuaTap04 from "./nguoi-di-dan-mua-tap-04.json";
import nguoiDiDanMuaTap05 from "./nguoi-di-dan-mua-tap-05.json";
import denDauXanhTap01 from "./den-dau-xanh-tap-01.json";
import denDauXanhTap02 from "./den-dau-xanh-tap-02.json";
import denDauXanhTap03 from "./den-dau-xanh-tap-03.json";
import denDauXanhTap04 from "./den-dau-xanh-tap-04.json";
import denDauXanhTap05 from "./den-dau-xanh-tap-05.json";
import chiecKhanTrangTap01 from "./chiec-khan-trang-tap-01.json";
import chiecKhanTrangTap02 from "./chiec-khan-trang-tap-02.json";
import chiecKhanTrangTap03 from "./chiec-khan-trang-tap-03.json";
import chiecKhanTrangTap04 from "./chiec-khan-trang-tap-04.json";
import chiecKhanTrangTap05 from "./chiec-khan-trang-tap-05.json";
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
  // Horror arc 7: "Quan tai troi" - a drifting black coffin returns to
  // a flooded village, carved with the mark of the local carpenter's
  // own craft, seeking the unpaid debt of a 40-year-old desecration.
  quanTaiTroiTap01,
  quanTaiTroiTap02,
  quanTaiTroiTap03,
  quanTaiTroiTap04,
  quanTaiTroiTap05,
  mieuHoangTap01,
  mieuHoangTap02,
  mieuHoangTap03,
  mieuHoangTap04,
  mieuHoangTap05,
  cayDaTap01,
  cayDaTap02,
  cayDaTap03,
  cayDaTap04,
  cayDaTap05,
  cauKhiTap01,
  cauKhiTap02,
  cauKhiTap03,
  cauKhiTap04,
  cauKhiTap05,
  // Horror arc 8 (backlog C: nguoi-di-dan-mua): "Nguoi di danh mua" - a
  // rain-night soul-retriever who nets the vong of the drowned and jars
  // them under his stilt house until kin call them home by name. Twist
  // at tap 4-5: the nameless jar older than his own trade tries to trade
  // itself for the protagonist's brother; it is finally freed when the
  // village gives it back the name it forgot - the unmourned ferryman
  // who was the whirlpool's first soul.
  nguoiDiDanMuaTap01,
  nguoiDiDanMuaTap02,
  nguoiDiDanMuaTap03,
  nguoiDiDanMuaTap04,
  nguoiDiDanMuaTap05,
  // Horror arc 9 (backlog C: den-dau-xanh): "Bong den dau xanh" - a
  // marsh ghost-light that turns out to be a lamplighter banished for a
  // granary fire he did not set, still guarding the night crossing.
  // Twist at tap 3: the protagonist's own grandfather was the false
  // witness; tap 4 unearths the lamplighter's letter forgiving him -
  // the arc turns from haunting into debt-and-atonement.
  denDauXanhTap01,
  denDauXanhTap02,
  denDauXanhTap03,
  denDauXanhTap04,
  denDauXanhTap05,
  // Horror arc 10 (backlog C: chiec-khan-trang): "Chiec khan trang" -
  // a white cloth that keeps reappearing on the main roof beam is not a
  // death omen but a midwife's lifelong signal to gather family before
  // a passing. Twist at tap 3: the cloth calls the living home, it does
  // not mark the dying - the arc turns from omen-fear into gratitude.
  chiecKhanTrangTap01,
  chiecKhanTrangTap02,
  chiecKhanTrangTap03,
  chiecKhanTrangTap04,
  chiecKhanTrangTap05,
] as LongFormEpisode[];
