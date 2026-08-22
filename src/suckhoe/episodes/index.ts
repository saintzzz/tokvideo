import gungMatOng from "./gung-mat-ong.json";
import { SucKhoeEpisode } from "../types";

// Add a new episode: create `episodes/<slug>.json` with the same shape,
// import it here, and add it to this list. scripts/generate-voiceover.mjs
// discovers new episode files on its own (it reads this directory), so
// nothing needs to change there.
export const EPISODES: SucKhoeEpisode[] = [gungMatOng as SucKhoeEpisode];
