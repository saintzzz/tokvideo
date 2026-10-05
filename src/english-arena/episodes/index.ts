import { EnglishArenaEpisode } from "../types";

// English Arena marketing episodes — same JSON-driven pattern as
// src/suckhoe/episodes: add a new <slug>.json, import it, done.
import ep01 from "./01-con-khong-chiu-luyen.json";
import ep02 from "./02-khong-biet-con-yeu-gi.json";
import ep03 from "./03-so-phong-thi.json";
import ep04 from "./04-sai-lai-sai.json";
import ep05 from "./05-khong-can-email.json";
import ep06 from "./06-hai-ky-thi-mot-app.json";
import ep07 from "./07-me-di-lam-ca-ngay.json";
import ep08 from "./08-giao-vien-ca-lop.json";
import ep09 from "./09-de-co-phan-nghe.json";
import ep10 from "./10-trung-tam-bao-cao.json";

export const EA_EPISODES: EnglishArenaEpisode[] = [
  ep01,
  ep02,
  ep03,
  ep04,
  ep05,
  ep06,
  ep07,
  ep08,
  ep09,
  ep10,
] as EnglishArenaEpisode[];
