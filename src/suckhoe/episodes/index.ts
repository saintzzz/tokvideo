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
] as SucKhoeEpisode[];
