import ep01NoiChaoDauNgo from "./ep-01-noi-chao-dau-ngo.json";
import { AnimatedFilmEpisode } from "../types";

// Add a new episode: create `episodes/ep-<n hai chữ số>-<slug>.json` with the
// same shape (see ../types.ts), import it here, and add it to this list —
// same pattern as src/suckhoe/episodes/index.ts.
export const EPISODES: AnimatedFilmEpisode[] = [
  ep01NoiChaoDauNgo,
] as AnimatedFilmEpisode[];
