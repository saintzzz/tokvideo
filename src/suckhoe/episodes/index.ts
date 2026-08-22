import gungMatOng from "./gung-mat-ong.json";
import chanhDaoMatOng from "./chanh-dao-mat-ong.json";
import ngheMatOng from "./nghe-mat-ong.json";
import toiNgamMatOng from "./toi-ngam-mat-ong.json";
import traHoaCuc from "./tra-hoa-cuc.json";
import nuocDua from "./nuoc-dua.json";
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
] as SucKhoeEpisode[];
