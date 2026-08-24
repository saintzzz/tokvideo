import gungMatOng from "./gung-mat-ong.json";
import chanhDaoMatOng from "./chanh-dao-mat-ong.json";
import ngheMatOng from "./nghe-mat-ong.json";
import toiNgamMatOng from "./toi-ngam-mat-ong.json";
import traHoaCuc from "./tra-hoa-cuc.json";
import nuocDua from "./nuoc-dua.json";
import tiaToGung from "./tia-to-gung.json";
import traBacHa from "./tra-bac-ha.json";
import chanhMatOngSang from "./chanh-mat-ong-sang.json";
import nuocEpCaRot from "./nuoc-ep-ca-rot.json";
import rauDiepCa from "./rau-diep-ca.json";
import chaoHanhLa from "./chao-hanh-la.json";
import laLotXao from "./la-lot-xao.json";
import ngamChanGung from "./ngam-chan-gung.json";
import boKetGoiDau from "./bo-ket-goi-dau.json";
import khoaiLangLuoc from "./khoai-lang-luoc.json";
import trungChienNgaiCuu from "./trung-chien-ngai-cuu.json";
import nuocDinhLang from "./nuoc-dinh-lang.json";
import laTrauKhongRua from "./la-trau-khong-rua.json";
import muoiHotRangChuomVai from "./muoi-hot-rang-chuom-vai.json";
import nuocLaOi from "./nuoc-la-oi.json";
import sucMiengNuocMuoiAm from "./suc-mieng-nuoc-muoi-am.json";
import enHoneyLemonTea from "./en-honey-lemon-tea.json";
import enGingerTea from "./en-ginger-tea.json";
import enWarmMilkHoney from "./en-warm-milk-honey.json";
import enOatmealBath from "./en-oatmeal-bath.json";
import enChickenSoup from "./en-chicken-soup.json";
import nuocRauMa from "./nuoc-rau-ma.json";
import quatHapDuongPhen from "./quat-hap-duong-phen.json";
import gungSayXe from "./gung-say-xe.json";
import nhaDamLamDiuDa from "./nha-dam-lam-diu-da.json";
import chuoiChinChuotRut from "./chuoi-chin-chuot-rut.json";
import phenChuaKhuMuiChan from "./phen-chua-khu-mui-chan.json";
import ngheTuoiDapDa from "./nghe-tuoi-dap-da.json";
import dinhHuongDauRang from "./dinh-huong-dau-rang.json";
import duDuChinTieuHoa from "./du-du-chin-tieu-hoa.json";
import dauDuaNutGotChan from "./dau-dua-nut-got-chan.json";
import duaChuotDapMat from "./dua-chuot-dap-mat.json";
import dauGioXoaThaiDuong from "./dau-gio-xoa-thai-duong.json";
import enAppleCiderVinegar from "./en-apple-cider-vinegar.json";
import enBakingSodaPaste from "./en-baking-soda-paste.json";
import enColdTeaBags from "./en-cold-tea-bags.json";
import enEpsomSaltSoak from "./en-epsom-salt-soak.json";
import enPeppermintTea from "./en-peppermint-tea.json";
import traTimSen from "./tra-tim-sen.json";
import cheHatSenLongNhan from "./che-hat-sen-long-nhan.json";
import ruouGungXoaKhop from "./ruou-gung-xoa-khop.json";
import nuocEpCuDen from "./nuoc-ep-cu-den.json";
import traGaoLutRang from "./tra-gao-lut-rang.json";
import traVoQuyt from "./tra-vo-quyt.json";
import nuocLaHanQua from "./nuoc-la-han-qua.json";
import xongLaGiaiCam from "./xong-la-giai-cam.json";
import laKinhGioiTamRomSam from "./la-kinh-gioi-tam-rom-sam.json";
import nuocDauDenRang from "./nuoc-dau-den-rang.json";
import enChamomileTea from "./en-chamomile-tea.json";
import enSaltwaterGargle from "./en-saltwater-gargle.json";
import enWitchHazelToner from "./en-witch-hazel-toner.json";
import enWarmLemonWater from "./en-warm-lemon-water.json";
import enCloveOilToothache from "./en-clove-oil-toothache.json";
import traLacTien from "./tra-lac-tien.json";
import xoaDauDuaChanTruocKhiNgu from "./xoa-dau-dua-chan-truoc-khi-ngu.json";
import nuocMiaGung from "./nuoc-mia-gung.json";
import traSaGung from "./tra-sa-gung.json";
import chaoTrungTiaTo from "./chao-trung-tia-to.json";
import cuCaiHapMatOng from "./cu-cai-hap-mat-ong.json";
import traCamThao from "./tra-cam-thao.json";
import ngaiCuuRuouChuomKhop from "./ngai-cuu-ruou-chuom-khop.json";
import laKheNauNuocTam from "./la-khe-nau-nuoc-tam.json";
import muoiGungRangChuomBung from "./muoi-gung-rang-chuom-bung.json";
import enElderberrySyrup from "./en-elderberry-syrup.json";
import enBakingSodaHeartburn from "./en-baking-soda-heartburn.json";
import enRawHoneyMinorCuts from "./en-raw-honey-minor-cuts.json";
import enPeppermintOilHeadache from "./en-peppermint-oil-headache.json";
import { SucKhoeEpisode } from "../types";

// Add a new episode: create `episodes/<slug>.json` with the same shape,
// import it here, and add it to this list. scripts/generate-voiceover.mjs
// discovers new episode files on its own (it reads this directory), so
// nothing needs to change there.
//
// English-market episodes (locale: "en", slug prefixed `en-`) publish
// through a separate channel/queue — see scripts/publish-next-suckhoe.mjs
// --locale=en. They live in this same array/directory; the locale field
// is what routes them, not a separate file tree.
export const EPISODES: SucKhoeEpisode[] = [
  gungMatOng,
  chanhDaoMatOng,
  ngheMatOng,
  toiNgamMatOng,
  traHoaCuc,
  nuocDua,
  tiaToGung,
  traBacHa,
  chanhMatOngSang,
  nuocEpCaRot,
  rauDiepCa,
  chaoHanhLa,
  laLotXao,
  ngamChanGung,
  boKetGoiDau,
  khoaiLangLuoc,
  trungChienNgaiCuu,
  nuocDinhLang,
  laTrauKhongRua,
  muoiHotRangChuomVai,
  nuocLaOi,
  sucMiengNuocMuoiAm,
  enHoneyLemonTea,
  enGingerTea,
  enWarmMilkHoney,
  enOatmealBath,
  enChickenSoup,
  nuocRauMa,
  quatHapDuongPhen,
  gungSayXe,
  nhaDamLamDiuDa,
  chuoiChinChuotRut,
  phenChuaKhuMuiChan,
  ngheTuoiDapDa,
  dinhHuongDauRang,
  duDuChinTieuHoa,
  dauDuaNutGotChan,
  duaChuotDapMat,
  dauGioXoaThaiDuong,
  enAppleCiderVinegar,
  enBakingSodaPaste,
  enColdTeaBags,
  enEpsomSaltSoak,
  enPeppermintTea,
  traTimSen,
  cheHatSenLongNhan,
  ruouGungXoaKhop,
  nuocEpCuDen,
  traGaoLutRang,
  traVoQuyt,
  nuocLaHanQua,
  xongLaGiaiCam,
  laKinhGioiTamRomSam,
  nuocDauDenRang,
  enChamomileTea,
  enSaltwaterGargle,
  enWitchHazelToner,
  enWarmLemonWater,
  enCloveOilToothache,
  traLacTien,
  xoaDauDuaChanTruocKhiNgu,
  nuocMiaGung,
  traSaGung,
  chaoTrungTiaTo,
  cuCaiHapMatOng,
  traCamThao,
  ngaiCuuRuouChuomKhop,
  laKheNauNuocTam,
  muoiGungRangChuomBung,
  enElderberrySyrup,
  enBakingSodaHeartburn,
  enRawHoneyMinorCuts,
  enPeppermintOilHeadache,
] as SucKhoeEpisode[];
