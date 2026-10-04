import * as THREE from "three";

// Procedural noise is not texture sampled, so it has no automatic mip filtering.
// Fade sub-pixel detail to its mean instead of letting it sparkle as the camera moves.
const detailFilterGLSL = `
 float detailNoiseWeight(float footprint) {
   return 1.0 - smoothstep(0.25, 1.0, footprint);
 }
`;

export function terrainMaterial(mat) {
  mat = mat.clone();
  mat.color.setHex(0x889063);
  mat.roughness = 0.96;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vTerrainWorld;",
      )
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvTerrainWorld=(modelMatrix * vec4(transformed,1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
 varying vec3 vTerrainWorld;
 ${detailFilterGLSL}
 float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}
 float filteredTerrainNoise(vec2 p){float footprint=max(length(dFdx(p)),length(dFdy(p)));return mix(.5,noise2(p),detailNoiseWeight(footprint));}
 `,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
 vec2 q=vTerrainWorld.xz;float large=noise2(q*.012),med=noise2(q*.11),fine=filteredTerrainNoise(q*3.8);
 vec3 turf=mix(vec3(.055,.105,.022),vec3(.19,.23,.073),large);
 turf=mix(turf,vec3(.17,.155,.10),smoothstep(.55,.88,med)*.42);
 diffuseColor.rgb=turf*(.78+.28*fine+.18*med);
 `,
      );
  };
  mat.customProgramCacheKey = () => "terrain-v4-filtered-1";
  return mat;
}
export function gritTexture() {
  const n = 128,
    p = new Uint8Array(n * n * 4);
  let seed = 17;
  for (let i = 0; i < n * n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const c = 145 + (seed >>> 24) * 0.36;
    p[i * 4] = c;
    p[i * 4 + 1] = c;
    p[i * 4 + 2] = c;
    p[i * 4 + 3] = 255;
  }
  const tx = new THREE.DataTexture(p, n, n);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.magFilter = THREE.LinearFilter;
  tx.minFilter = THREE.LinearMipmapLinearFilter;
  tx.generateMipmaps = true;
  tx.needsUpdate = true;
  return tx;
}
export function createSky(scene, renderer) {
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color("#6e9fbd") },
      horizon: { value: new THREE.Color("#d3d9ce") },
    },
    vertexShader:
      "varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec3 dir;uniform vec3 top;uniform vec3 horizon;void main(){vec3 d=normalize(dir);float h=pow(max(d.y,0.),.55);vec3 c=mix(horizon,top,h);float s=pow(max(dot(d,normalize(vec3(-.5,.9,-.3))),0.),120.);c+=vec3(1.,.84,.56)*s*.5;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 24, 12), skyMat);
  scene.add(sky);
  const envScene = new THREE.Scene();
  envScene.add(
    new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), skyMat.clone()),
  );
  const generator = new THREE.PMREMGenerator(renderer);
  scene.environment = generator.fromScene(envScene, 0.04, 0.1, 100).texture;
  scene.environmentIntensity = 0.35;
  generator.dispose();
  return sky;
}
export function optimizeCar(root, mergeGeometries) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    groups = new Map(),
    remove = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    let p = o.parent;
    while (p && p !== root) {
      if (p.name.includes("forward_roll")) return;
      p = p.parent;
    }
    const g = o.geometry
      .clone()
      .applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld),
      );
    const key =
      o.material.uuid + ":" + Object.keys(g.attributes).sort().join(",");
    if (!groups.has(key)) groups.set(key, { mat: o.material, geos: [] });
    groups.get(key).geos.push(g);
    remove.push(o);
  });
  for (const { mat, geos } of groups.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) throw Error("Car geometry batching failed");
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const o of remove) o.removeFromParent();
  return groups.size;
}
export function surfaceMaterial(source) {
  const mat = source.clone(),
    n = mat.name.toLowerCase();
  if (n.includes("guardrail")) mat.roughness = 0.46;
  else if (n.includes("zinc")) mat.roughness = 0.32;
  else if (n.includes("roof")) mat.roughness = 0.68;
  else if (
    n.includes("concrete") ||
    n.includes("gravel") ||
    n.includes("stone")
  )
    mat.roughness = 0.92;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSurfaceWorld;",
      )
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvSurfaceWorld=(modelMatrix*vec4(transformed,1.)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
 varying vec3 vSurfaceWorld;
 ${detailFilterGLSL}
 float surfaceHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 `,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
 vec3 grainPosition=vSurfaceWorld*34.;
 float grainFootprint=max(length(dFdx(grainPosition)),length(dFdy(grainPosition)));
 float materialGrain=mix(.5,surfaceHash(floor(grainPosition)),detailNoiseWeight(grainFootprint));
 diffuseColor.rgb*=.84+.23*materialGrain;
 `,
      );
  };
  mat.customProgramCacheKey = () => "surface-grain-v4-filtered-1";
  return mat;
}
