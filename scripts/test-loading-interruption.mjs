import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
const root = path.resolve(process.argv[2] || ".");
const source = await fs.readFile(path.join(root, "game.mjs"), "utf8");
const begin = source.indexOf("async function boot()");
const code = source.slice(begin, source.indexOf("let previous", begin));
const dummyScene = () => ({ children: [], traverse() {}, add() {} });
for (const interruptAt of ["manifest", "world", "vegetation", "rejection"]) {
  const pack = {
    route: {},
    manifest: {
      recommendedStartStationM: 1250,
      vegetation: { library: "flora", highDetailLibraries: [] },
    },
    world: { files: interruptAt === "world" ? ["world"] : [] },
    resolve: (x) => x,
    loadPlacements: async () => {
      if (interruptAt === "vegetation") context.graphicsFailed = true;
      return { sets: [] };
    },
  };
  const context = {
    graphicsFailed: false,
    ready: false,
    scene: {},
    wheels: [],
    mount: { position: {}, add() {} },
    document: {},
    mergeGeometries() {},
    makeTrack: () => ({}),
    initialState: () => ({}),
    optimizeCar() {},
    makeRoad() {},
    initMap() {},
    updateView() {},
    mergeWorld() {},
    createVegetation: () => ({ update() {} }),
    createDistantCanopy: () => ({}),
    console: {
      error() {
        throw Error("Unexpected catch logging after interruption");
      },
    },
    $() {
      if (context.graphicsFailed) throw Error("DOM access after context loss");
      return {};
    },
    loadCoursePack: async () => {
      if (interruptAt === "manifest" || interruptAt === "rejection")
        context.graphicsFailed = true;
      if (interruptAt === "rejection") throw Error("Download interrupted");
      return pack;
    },
    loader: {
      loadAsync: async (name) => {
        if (name === "world") context.graphicsFailed = true;
        return { scene: dummyScene() };
      },
    },
  };
  vm.runInNewContext(code + "\nglobalThis.runBoot=boot;", context);
  await context.runBoot();
  assert.equal(context.graphicsFailed, true);
  assert.equal(context.ready, false);
}
console.log(
  "Loading interruption: manifest, world, vegetation and rejection paths keep ready=false without stale DOM access",
);
