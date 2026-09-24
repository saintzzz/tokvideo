import ep01NoiChaoDauNgo from "./ep-01-noi-chao-dau-ngo.json";
import ep02BaiKiemTraCuaMai from "./ep-02-bai-kiem-tra-cua-mai.json";
import ep03ChuBayVaCayCoTuong from "./ep-03-chu-bay-va-cay-co-tuong.json";
import ep04BeTomKhongChiuAnRau from "./ep-04-be-tom-khong-chiu-an-rau.json";
import ep05BaTuQuenChiaKhoa from "./ep-05-ba-tu-quen-chia-khoa.json";
import ep06CaTrucDauTien from "./ep-06-ca-truc-dau-tien.json";
import ep07DeadlineCuaHuy from "./ep-07-deadline-cua-huy.json";
import ep08CoSauBanSuaChua from "./ep-08-co-sau-ban-sua-chua.json";
import ep09BacSiLongGheNha from "./ep-09-bac-si-long-ghe-nha.json";
import ep10ToCanhRauMa from "./ep-10-to-canh-rau-ma.json";
import ep11KetQuaKham from "./ep-11-ket-qua-kham.json";
import { AnimatedFilmEpisode } from "../types";

// Add a new episode: create `episodes/ep-<n hai chữ số>-<slug>.json` with the
// same shape (see ../types.ts), import it here, and add it to this list —
// same pattern as src/suckhoe/episodes/index.ts.
export const EPISODES: AnimatedFilmEpisode[] = [
  ep01NoiChaoDauNgo,
  ep02BaiKiemTraCuaMai,
  ep03ChuBayVaCayCoTuong,
  ep04BeTomKhongChiuAnRau,
  ep05BaTuQuenChiaKhoa,
  ep06CaTrucDauTien,
  ep07DeadlineCuaHuy,
  ep08CoSauBanSuaChua,
  ep09BacSiLongGheNha,
  ep10ToCanhRauMa,
  ep11KetQuaKham,
] as AnimatedFilmEpisode[];
