#!/usr/bin/env node
/** Validate/package a course pack. Does not recreate source Blender geometry. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "node scripts/course-pack.mjs [--assets-dir assets] [--runtime course-loader.mjs] [--write] [--export new-directory]\nDefault: validate contracts and existing checksums. --write: regenerate course-checksums.json from the supplied pack.",
  );
  process.exit(0);
}
const allowed = new Set(["--assets-dir", "--runtime", "--write", "--export"]);
let assetsDir = path.resolve("assets"),
  runtimePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../course-loader.mjs",
  ),
  exportDir = null,
  write = false;
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw Error("Unknown argument: " + args[i]);
  if (args[i] === "--write") write = true;
  else {
    const flag = args[i];
    if (!args[i + 1]) throw Error("Missing argument for " + flag);
    const value = path.resolve(args[++i]);
    if (flag === "--assets-dir") assetsDir = value;
    else if (flag === "--runtime") runtimePath = value;
    else exportDir = value;
  }
}
const api = await import(pathToFileURL(runtimePath));
const read = async (name) =>
  JSON.parse(
    await fs.readFile(path.join(assetsDir, api.safeAssetPath(name)), "utf8"),
  );
const manifest = api.validateCourseManifest(await read("course-manifest.json"));
const route = api.validateRouteData(await read(manifest.route.file), manifest);
const world = api.validateAssetIndex(await read(manifest.world.index), ".glb");
const vegetation = api.validateAssetIndex(
  await read(manifest.vegetation.index),
  ".json",
);
if (
  !Number.isFinite(world.lengthM) ||
  Math.abs(world.lengthM - route.length) > 0.001
)
  throw Error("World/route lengths disagree");
let count = 0;
for (const name of vegetation.files)
  count += api.validatePlacementData(await read(name)).count;
if (count !== vegetation.count) throw Error("Vegetation count mismatch");
const resources = [
  ...new Set([
    "course-manifest.json",
    manifest.route.file,
    manifest.world.index,
    ...world.files,
    manifest.vegetation.index,
    ...vegetation.files,
    manifest.vegetation.library,
    ...manifest.vegetation.highDetailLibraries,
  ]),
].sort();
const files = {};
for (const name of resources) {
  const data = await fs.readFile(path.join(assetsDir, api.safeAssetPath(name)));
  if (
    name.endsWith(".glb") &&
    (data.length < 20 ||
      data.readUInt32LE(0) !== 0x46546c67 ||
      data.readUInt32LE(4) !== 2 ||
      data.readUInt32LE(8) !== data.length)
  )
    throw Error("Invalid GLB2: " + name);
  if (name.endsWith(".glb")) {
    const jsonLength = data.readUInt32LE(12);
    if (data.readUInt32LE(16) !== 0x4e4f534a || 20 + jsonLength > data.length)
      throw Error("Invalid GLB JSON chunk: " + name);
    const gltf = JSON.parse(data.subarray(20, 20 + jsonLength));
    for (const resource of [...(gltf.buffers || []), ...(gltf.images || [])]) {
      if (resource.uri && !resource.uri.startsWith("data:"))
        throw Error("Course GLBs must be self-contained: " + name);
    }
  }
  files[name] = {
    bytes: data.length,
    sha256: crypto.createHash("sha256").update(data).digest("hex"),
  };
}
const expected = {
  schemaVersion: 1,
  courseId: manifest.courseId,
  packVersion: manifest.packVersion,
  files,
};
const output = path.join(assetsDir, api.safeAssetPath(manifest.integrityFile));
if (write) {
  const temporary = output + ".tmp-" + process.pid;
  await fs.writeFile(temporary, JSON.stringify(expected, null, 2) + "\n");
  await fs.rename(temporary, output);
} else if (
  JSON.stringify(await read(manifest.integrityFile)) !==
  JSON.stringify(expected)
)
  throw Error(
    "Course checksums are stale. Regenerate only after reviewing intended asset changes.",
  );
if (exportDir) {
  if (exportDir === assetsDir || exportDir.startsWith(assetsDir + path.sep))
    throw Error("Export must be outside the input pack");
  try {
    if ((await fs.readdir(exportDir)).length)
      throw Error("Export destination must be empty");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(exportDir, { recursive: true });
  for (const name of [...resources, manifest.integrityFile]) {
    const target = path.join(exportDir, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(assetsDir, name), target);
  }
}
console.log(
  JSON.stringify({
    courseId: manifest.courseId,
    packVersion: manifest.packVersion,
    assets: resources.length,
    routeSamples: route.route.length,
    routeLengthM: route.length,
    vegetationCount: count,
    checksums: write ? "written" : "verified",
    exported: !!exportDir,
  }),
);
