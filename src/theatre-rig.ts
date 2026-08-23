import { getProject } from "@theatre/core";

// A thin, code-first wrapper around Theatre.js (@theatre/core) for
// authoring real eased keyframe animation without ever touching the
// Studio GUI or needing an account — confirmed 2026-08-24 that
// @theatre/core accepts a hand-authored state object and works fully
// synchronously (no `await project.ready` needed) when that state is
// provided upfront, which is exactly what a React render function
// (Remotion components render synchronously) needs.
//
// Theatre.js's own state schema is deeply nested and undocumented for
// hand-authoring (its public docs assume you export it from Studio) — this
// module hides that shape behind a plain {time, value} keyframe list per
// object/property, which is the actual reusable "tool" being asked for:
// write keyframes as data, get a real bezier-eased, frame-seekable rig.
//
// Usage:
//   const rig = makeRig("healer-nod", "gesture", {
//     head: { tilt: [{ time: 0, value: 0 }, { time: 0.3, value: 8 }, { time: 0.6, value: 0 }] },
//   });
//   const { head } = rig.at(frame, fps); // { tilt: <interpolated number> }

export type RigKeyframe = { time: number; value: number };
export type RigTracks = Record<string, Record<string, RigKeyframe[]>>;

// A single, tasteful default ease (smooth in, smooth out) — good enough
// for gesture-style animation without exposing Theatre's raw bezier
// handle format at the call site. Add a `handles` escape hatch later if a
// specific rig ever needs a different feel (e.g. a sharp overshoot).
const DEFAULT_HANDLES: [number, number, number, number] = [0.5, 1, 0.5, 0];

function buildState(sheetId: string, tracks: RigTracks) {
  const tracksByObject: Record<string, unknown> = {};

  for (const [objectName, props] of Object.entries(tracks)) {
    const trackIdByPropPath: Record<string, string> = {};
    const trackData: Record<string, unknown> = {};

    for (const [propName, keyframes] of Object.entries(props)) {
      const trackId = `${objectName}_${propName}_track`;
      trackIdByPropPath[JSON.stringify([propName])] = trackId;
      trackData[trackId] = {
        type: "BasicKeyframedTrack",
        keyframes: keyframes.map((kf, i) => ({
          id: `${trackId}_kf${i}`,
          value: kf.value,
          position: kf.time,
          handles: DEFAULT_HANDLES,
          connectedRight: i < keyframes.length - 1,
          type: "bezier",
        })),
      };
    }

    tracksByObject[objectName] = { trackIdByPropPath, trackData };
  }

  const length = Math.max(
    0.1,
    ...Object.values(tracks).flatMap((props) =>
      Object.values(props).map((kfs) => kfs[kfs.length - 1]?.time ?? 0)
    )
  );

  return {
    sheetsById: {
      [sheetId]: {
        staticOverrides: { byObject: {} },
        sequence: {
          type: "PositionalSequence",
          length,
          subUnitsPerUnit: 30,
          tracksByObject,
        },
      },
    },
    definitionVersion: "0.4.0",
    revisionHistory: [],
  };
}

export function makeRig(projectId: string, sheetId: string, tracks: RigTracks) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = buildState(sheetId, tracks) as any;
  const project = getProject(projectId, { state });
  const sheet = project.sheet(sheetId);

  const objects: Record<string, ReturnType<typeof sheet.object>> = {};
  for (const [objectName, props] of Object.entries(tracks)) {
    const initial: Record<string, number> = {};
    for (const [propName, keyframes] of Object.entries(props)) {
      initial[propName] = keyframes[0]?.value ?? 0;
    }
    objects[objectName] = sheet.object(objectName, initial);
  }

  return {
    /** Set the rig to the state at `frame`/`fps` seconds and read every object's current values. */
    at(frame: number, fps: number): Record<string, Record<string, number>> {
      sheet.sequence.position = frame / fps;
      const result: Record<string, Record<string, number>> = {};
      for (const [name, obj] of Object.entries(objects)) {
        result[name] = obj.value as Record<string, number>;
      }
      return result;
    },
  };
}
