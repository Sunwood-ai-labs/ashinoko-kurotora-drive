import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const root = path.resolve(process.argv[2] || ".");
const {
  CourseDataError,
  safeAssetPath,
  validateCourseManifest,
  validateRouteData,
  validateAssetIndex,
  validatePlacementData,
  loadCoursePack,
} = await import(pathToFileURL(path.join(root, "course-loader.mjs")));
const read = async (name) =>
  JSON.parse(await fs.readFile(path.join(root, "assets", name), "utf8"));
const manifest = await read("course-manifest.json"),
  route = await read(manifest.route.file);
const clone = (value) => structuredClone(value);
let assertions = 0;
function rejected(fn, pattern) {
  assert.throws(
    fn,
    (error) =>
      error instanceof CourseDataError &&
      (!pattern || pattern.test(error.message)),
  );
  assertions++;
}
validateCourseManifest(manifest);
validateRouteData(route, manifest);
assertions += 2;
for (const name of [
  "../secret",
  "/absolute",
  "https://example.test/model.glb",
  "a//b",
  "a/./b",
  "a/../b",
  "a%2Fb",
  "a\\b",
])
  rejected(() => safeAssetPath(name));
const badManifest = clone(manifest);
badManifest.schemaVersion = 2;
rejected(() => validateCourseManifest(badManifest), /schemaVersion/);
const badCoordinates = clone(manifest);
badCoordinates.coordinates.routeToRenderAxes = ["x", "y", "z"];
rejected(() => validateCourseManifest(badCoordinates), /axis/);
for (const [change, pattern] of [
  [(x) => x.route.pop(), /lengths/],
  [(x) => (x.route[1][0] = NaN), /Non-finite/],
  [(x) => (x.station[2] = x.station[1]), /increasing/],
  [(x) => (x.station[2] += 0.1), /distance/],
  [(x) => (x.roadWidth += 1), /width/],
  [(x) => (x.roadSurfaceOffsetM = 0), /offset/],
  [(x) => (x.length += 1), /length/],
]) {
  const bad = clone(route);
  change(bad);
  rejected(() => validateRouteData(bad, manifest), pattern);
}
rejected(
  () => validateAssetIndex({ files: ["x.glb", "x.glb"] }, ".glb"),
  /Duplicate/,
);
rejected(
  () =>
    validatePlacementData({
      sets: [
        {
          name: "tree",
          prototypes: ["a"],
          count: 1,
          position: [[0, 0, 0]],
          scale: [1],
          yaw: [0],
          variant: [1],
        },
      ],
    }),
  /placement/,
);
const fixtureBase = "https://fixture.invalid/relocated-course/";
const requests = [];
const fetcher = async (url) => {
  assert(url.startsWith(fixtureBase));
  const name = url.slice(fixtureBase.length);
  requests.push(name);
  try {
    return { ok: true, status: 200, json: () => read(name) };
  } catch {
    return { ok: false, status: 404 };
  }
};
const pack = await loadCoursePack("course-manifest.json", {
  baseURL: fixtureBase,
  fetcher,
});
const placements = await pack.loadPlacements();
assert.equal(pack.manifest.courseId, "ashinoko-gt");
assert.equal(validatePlacementData(placements).count, 209834);
assert.equal(pack.resolve("world-v4-00.glb"), fixtureBase + "world-v4-00.glb");
assert(!requests.some((file) => file.includes("kurotora")));
await assert.rejects(
  loadCoursePack("course-manifest.json", {
    baseURL: fixtureBase,
    fetcher: async () => ({ ok: false, status: 404 }),
  }),
  /download failed/,
);
assertions += 5;
console.log(
  JSON.stringify({
    contractAssertions: assertions,
    routeSamples: route.route.length,
    relocatablePack: true,
    vehicleIndependent: true,
    placementCount: 209834,
    httpFailureHandled: true,
  }),
);
