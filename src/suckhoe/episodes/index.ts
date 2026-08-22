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
import { SucKhoeEpisode } from "../types";

// Add a new episode: create `episodes/<slug>.json` with the same shape,
// import it here, and add it to this list. scripts/generate-voiceover.mjs
// discovers new episode files on its own (it reads this directory), so
// nothing needs to change there.
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
] as SucKhoeEpisode[];
