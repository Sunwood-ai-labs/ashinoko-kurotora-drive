import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const root = path.resolve(process.argv[2] || "dist");
const threeURL = pathToFileURL(path.join(root, "vendor/three.module.js")).href;
const THREE = await import(threeURL);
const source = await fs.readFile(path.join(root, "appearance.mjs"), "utf8");
// Use the identical bundled Three.js implementation, without downloading packages.
const moduleSource = source.replace('from "three"', `from ${JSON.stringify(threeURL)}`);
const { terrainMaterial, surfaceMaterial } = await import(
  `data:text/javascript;base64,${Buffer.from(moduleSource).toString("base64")}`
);
const terrainSource = new THREE.MeshStandardMaterial({ color: 0xabcdef });
terrainSource.name = "Mountain grass and canopy underlay";
const surfaceSource = new THREE.MeshStandardMaterial({ color: 0xabcdef });
surfaceSource.name = "V2 weathered concrete";
const terrain = terrainMaterial(terrainSource);
const surface = surfaceMaterial(surfaceSource);
assert.notEqual(terrain, terrainSource);
assert.notEqual(surface, surfaceSource);
assert.equal(terrainSource.color.getHex(), 0xabcdef, "Do not mutate shared source materials");
assert.equal(surfaceSource.color.getHex(), 0xabcdef);

function assemble(material) {
  const shader = {
    vertexShader: THREE.ShaderLib.standard.vertexShader,
    fragmentShader: THREE.ShaderLib.standard.fragmentShader,
  };
  material.onBeforeCompile(shader);
  assert.equal((shader.fragmentShader.match(/float detailNoiseWeight\(/g) || []).length, 1);
  assert(shader.fragmentShader.includes("#include <tonemapping_fragment>"));
  assert(shader.fragmentShader.includes("#include <fog_fragment>"));
  assert(!shader.fragmentShader.includes("${"), "All GLSL template substitutions must resolve");
  return shader;
}
const terrainShader = assemble(terrain);
const surfaceShader = assemble(surface);
assert(terrainShader.vertexShader.includes("vTerrainWorld=(modelMatrix * vec4(transformed,1.0)).xyz"));
assert(terrainShader.fragmentShader.includes("fine=filteredTerrainNoise(q*3.8)"));
assert(terrainShader.fragmentShader.includes("max(length(dFdx(p)),length(dFdy(p)))"));
assert(terrainShader.fragmentShader.includes("large=noise2(q*.012),med=noise2(q*.11)"), "Preserve broad landscape tint");
assert(terrainShader.fragmentShader.includes("mix(.5,noise2(p),detailNoiseWeight(footprint))"));
assert(surfaceShader.fragmentShader.includes("dFdx(grainPosition)"));
assert(surfaceShader.fragmentShader.includes("dFdy(grainPosition)"));
assert(surfaceShader.fragmentShader.includes("mix(.5,surfaceHash(floor(grainPosition)),detailNoiseWeight(grainFootprint))"));
assert(terrain.customProgramCacheKey().includes("filtered"));
assert(surface.customProgramCacheKey().includes("filtered"));

// Execute the actual scalar GLSL expression, rather than a separately maintained curve.
const body = terrainShader.fragmentShader.match(/float detailNoiseWeight\(float footprint\)\s*\{([^}]+)\}/)?.[1];
assert(body);
const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const kernel = new Function("footprint", "smoothstep", body);
const weight = (footprint) => kernel(footprint, smoothstep);
assert.equal(weight(0), 1);
assert.equal(weight(0.25), 1, "Resolved close-up detail must remain unchanged");
assert.equal(weight(1), 0, "One or more noise cells per pixel must converge to the mean");
assert.equal(weight(100), 0);
let previous = 1;
for (let i = 0; i <= 1024; i++) {
  const w = weight(i / 1024);
  assert(Number.isFinite(w) && w >= 0 && w <= previous);
  assert(previous - w < 0.003, "No hard distance/LOD switch in the fade");
  previous = w;
}

// Analytic front-facing screen footprint; grazing surfaces can be larger.
const pixelM = (distance) => 2 * distance * Math.tan(58 * Math.PI / 360) / 1080;
const fract = (x) => x - Math.floor(x);
const hsh = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const mix = (a, b, t) => a + (b - a) * t;
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smoothstep(0, 1, fract(x)), fy = smoothstep(0, 1, fract(y));
  return mix(mix(hsh(ix, iy), hsh(ix + 1, iy), fx), mix(hsh(ix, iy + 1), hsh(ix + 1, iy + 1), fx), fy);
}
const samples = Array.from({ length: 120 }, (_, i) => noise2((1000 + i * pixelM(500) / 4) * 3.8, 813 * 3.8));
const filtered = samples.map((x) => mix(0.5, x, weight(pixelM(500) * 3.8)));
const span = (xs) => Math.max(...xs) - Math.min(...xs);
assert(span(samples) > 0.1, "The unfiltered motion fixture must exercise changing noise");
assert.equal(span(filtered), 0, "Unresolved terrain detail must not change during the motion fixture");
for (const x of samples) assert(Math.abs(mix(0.5, x, weight(pixelM(10) * 3.8)) - x) < 1e-15);
assert.equal(weight(pixelM(50) * 34), 0, "Unresolved roadside grain must also be suppressed");
console.log(JSON.stringify({
  detailFilter: "passed",
  shaderAssembly: "bundled Three.js standard shader hooks checked; no GPU compilation",
  terrainCellsPerPixelAt500m: pixelM(500) * 3.8,
  surfaceCellsPerPixelAt50m: pixelM(50) * 34,
  unfilteredMotionNoiseSpan: span(samples),
  filteredMotionNoiseSpan: span(filtered),
  closeDetailPreserved: true,
  browserRendering: "not exercised by this test",
}, null, 2));
