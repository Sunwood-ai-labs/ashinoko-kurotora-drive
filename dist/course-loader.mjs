/** Course-pack API v1. Pure data validation; no renderer, input or vehicle dependencies. */
export const COURSE_SCHEMA_VERSION = 1;
export class CourseDataError extends Error {
  constructor(message) {
    super(message);
    this.name = "CourseDataError";
  }
}
const fail = (message) => {
  throw new CourseDataError(message);
};
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export function safeAssetPath(path) {
  if (
    typeof path !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(path) ||
    path.split("/").some((p) => p === "." || p === ".." || !p)
  )
    fail("Invalid course-relative asset path");
  return path;
}
export function validateCourseManifest(value) {
  if (!object(value) || value.schemaVersion !== COURSE_SCHEMA_VERSION)
    fail("Unsupported course schemaVersion");
  if (
    typeof value.courseId !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.courseId)
  )
    fail("Invalid courseId");
  if (
    typeof value.packVersion !== "string" ||
    !/^\d+\.\d+\.\d+$/.test(value.packVersion)
  )
    fail("Invalid packVersion");
  if (
    value.units !== "metres" ||
    value.coordinates?.route !== "local-z-up" ||
    value.coordinates?.geometry !== "gltf-y-up" ||
    value.coordinates?.placements !== "local-z-up"
  )
    fail("Unsupported course coordinate contract");
  if (
    JSON.stringify(value.coordinates.routeToRenderAxes) !==
    JSON.stringify(["x", "z", "-y"])
  )
    fail("Unsupported axis transform");
  if (typeof value.integrityFile !== "string")
    fail("Missing course integrity file");
  safeAssetPath(value.integrityFile);
  if (
    !object(value.route) ||
    value.route.closed !== true ||
    value.route.distanceMetric !== "polyline-3d" ||
    value.route.elevationReference !== "road-top"
  )
    fail("Unsupported route contract");
  if (
    !finite(value.route.roadWidthM) ||
    value.route.roadWidthM < 3 ||
    value.route.roadWidthM > 50
  )
    fail("Invalid road width");
  if (
    !finite(value.route.renderSurfaceLiftM) ||
    value.route.renderSurfaceLiftM < 0 ||
    value.route.renderSurfaceLiftM > 0.1
  )
    fail("Invalid road render lift");
  if (
    !finite(value.route.sourceSurfaceOffsetAppliedM) ||
    value.route.sourceSurfaceOffsetAppliedM < 0 ||
    value.route.sourceSurfaceOffsetAppliedM > 10
  )
    fail("Invalid applied surface offset");
  if (
    value.vegetation?.profile !== "broadleaf-v1" ||
    !Array.isArray(value.vegetation.highDetailLibraries)
  )
    fail("Unsupported vegetation profile");
  for (const path of [
    value.route.file,
    value.world?.index,
    value.vegetation.index,
    value.vegetation.library,
    ...value.vegetation.highDetailLibraries,
  ])
    safeAssetPath(path);
  if (
    !finite(value.recommendedStartStationM) ||
    value.recommendedStartStationM < 0
  )
    fail("Invalid starting station");
  return value;
}
export function validateRouteData(data, manifest) {
  if (
    !object(data) ||
    !Array.isArray(data.route) ||
    !Array.isArray(data.station) ||
    data.route.length < 4 ||
    data.route.length !== data.station.length
  )
    fail("Route/station lengths must match");
  if (data.route.length > 1000000 || data.station[0] !== 0)
    fail("Invalid route station origin or size");
  for (let i = 0; i < data.route.length; i++) {
    const p = data.route[i];
    if (
      !Array.isArray(p) ||
      p.length !== 3 ||
      !p.every(finite) ||
      !finite(data.station[i])
    )
      fail("Non-finite route sample");
    if (i) {
      if (data.station[i] <= data.station[i - 1])
        fail("Stations must be strictly increasing");
      const a = data.route[i - 1],
        expected = Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
      if (Math.abs(data.station[i] - data.station[i - 1] - expected) > 0.001)
        fail("Station distance does not match the 3D route");
    }
  }
  const a = data.route[0],
    b = data.route.at(-1);
  if (Math.hypot(...a.map((v, i) => v - b[i])) > 0.001)
    fail("Course route is not closed");
  if (!finite(data.roadWidth) || data.roadWidth !== manifest.route.roadWidthM)
    fail("Road width disagrees with manifest");
  if (
    !finite(data.roadSurfaceOffsetM) ||
    Math.abs(
      data.roadSurfaceOffsetM - manifest.route.sourceSurfaceOffsetAppliedM,
    ) > 0.000001
  )
    fail("Applied road surface offset disagrees with manifest");
  if (
    !finite(data.length) ||
    Math.abs(data.length - data.station.at(-1)) > 0.001
  )
    fail("Route length disagrees with stations");
  if (manifest.recommendedStartStationM >= data.length)
    fail("Starting station is outside the route");
  return data;
}
export function validateAssetIndex(index, extension) {
  if (
    !object(index) ||
    !Array.isArray(index.files) ||
    !index.files.length ||
    index.files.length > 1000
  )
    fail("Invalid asset index");
  const unique = new Set();
  for (const path of index.files) {
    safeAssetPath(path);
    if (!path.endsWith(extension) || unique.has(path))
      fail("Duplicate or invalid indexed asset");
    unique.add(path);
  }
  return index;
}
export function validatePlacementData(data) {
  if (!object(data) || !Array.isArray(data.sets))
    fail("Invalid vegetation data");
  let total = 0;
  for (const set of data.sets) {
    if (
      !object(set) ||
      typeof set.name !== "string" ||
      !Array.isArray(set.prototypes) ||
      !set.prototypes.length ||
      !set.prototypes.every((n) => typeof n === "string" && n.length > 0)
    )
      fail("Invalid vegetation set");
    if (!Number.isInteger(set.count) || set.count < 0)
      fail("Invalid vegetation count");
    for (const field of ["position", "scale", "yaw", "variant"])
      if (!Array.isArray(set[field]) || set[field].length !== set.count)
        fail("Vegetation field length mismatch");
    for (let i = 0; i < set.count; i++) {
      const p = set.position[i];
      if (
        !Array.isArray(p) ||
        p.length !== 3 ||
        !p.every(finite) ||
        !finite(set.scale[i]) ||
        set.scale[i] <= 0 ||
        !finite(set.yaw[i]) ||
        !Number.isInteger(set.variant[i]) ||
        set.variant[i] < 0 ||
        set.variant[i] >= set.prototypes.length
      )
        fail("Invalid vegetation placement");
    }
    total += set.count;
    if (total > 1000000) fail("Vegetation budget exceeded");
  }
  return { data, count: total };
}
export async function loadCoursePack(manifestPath, options = {}) {
  const fetcher = options.fetcher || fetch;
  const manifestURL = new URL(
    manifestPath,
    options.baseURL || globalThis.location?.href,
  );
  if (!["https:", "http:"].includes(manifestURL.protocol))
    fail("Unsupported course URL protocol");
  const base = new URL("./", manifestURL);
  const resolve = (path) => new URL(safeAssetPath(path), base).href;
  const read = async (url) => {
    const response = await fetcher(url);
    if (!response.ok) fail(`Course download failed (${response.status})`);
    return response.json();
  };
  const manifest = validateCourseManifest(await read(manifestURL.href));
  const [rawRoute, rawWorld, rawVegetation] = await Promise.all([
    read(resolve(manifest.route.file)),
    read(resolve(manifest.world.index)),
    read(resolve(manifest.vegetation.index)),
  ]);
  const route = validateRouteData(rawRoute, manifest);
  const world = validateAssetIndex(rawWorld, ".glb");
  const vegetationIndex = validateAssetIndex(rawVegetation, ".json");
  if (!Number.isInteger(vegetationIndex.count) || vegetationIndex.count < 0)
    fail("Invalid vegetation index count");
  if (!finite(world.lengthM) || Math.abs(world.lengthM - route.length) > 0.001)
    fail("World/route revision length mismatch");
  return {
    manifest,
    route,
    world,
    resolve,
    async loadPlacements() {
      const parts = await Promise.all(
        vegetationIndex.files.map((path) => read(resolve(path))),
      );
      const data = {
        sets: parts.flatMap((part) => validatePlacementData(part).data.sets),
      };
      const checked = validatePlacementData(data);
      if (checked.count !== vegetationIndex.count)
        fail("Vegetation count disagrees with index");
      return data;
    },
  };
}
