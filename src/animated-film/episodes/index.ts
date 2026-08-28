import ep01NoiChaoDauNgo from "./ep-01-noi-chao-dau-ngo.json";
import ep02BaiKiemTraCuaMai from "./ep-02-bai-kiem-tra-cua-mai.json";
import ep03ChuBayVaCayCoTuong from "./ep-03-chu-bay-va-cay-co-tuong.json";
import ep04BeTomKhongChiuAnRau from "./ep-04-be-tom-khong-chiu-an-rau.json";
import { AnimatedFilmEpisode } from "../types";

// Add a new episode: create `episodes/ep-<n hai chữ số>-<slug>.json` with the
// same shape (see ../types.ts), import it here, and add it to this list —
// same pattern as src/suckhoe/episodes/index.ts.
export const EPISODES: AnimatedFilmEpisode[] = [
  ep01NoiChaoDauNgo,
  ep02BaiKiemTraCuaMai,
  ep03ChuBayVaCayCoTuong,
  ep04BeTomKhongChiuAnRau,
] as AnimatedFilmEpisode[];
