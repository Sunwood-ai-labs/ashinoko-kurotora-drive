import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
const text = fs
  .readFileSync(path.resolve(process.argv[2] || ".", "game.mjs"), "utf8")
  .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "");
let reloads = 0;
const classes = new Set(),
  button = {},
  message = {},
  panel = {
    classList: { add: (x) => classes.add(x) },
    innerHTML: "",
    querySelector: (s) => (s === "button" ? button : message),
  },
  overlay = { classList: { remove() {} }, querySelector: () => panel };
const context = {
  THREE: {
    Scene: class {},
    Color: class {},
    Fog: class {},
    WebGLRenderer: class {
      constructor() {
        throw Error("Expected unavailable WebGL");
      }
    },
  },
  document: {
    body: { classList: { add: (x) => classes.add(x) } },
    getElementById: (id) => (id === "overlay" ? overlay : {}),
    querySelectorAll: () => [],
  },
  location: { reload: () => reloads++ },
};
let caught;
try {
  vm.runInNewContext(text, context);
} catch (e) {
  caught = e.message;
}
assert.equal(caught, "Expected unavailable WebGL");
assert(classes.has("webgl-failed"));
assert(panel.innerHTML.includes("WebGL 2"));
assert(panel.innerHTML.includes("再読み込み"));
assert(panel.innerHTML.includes("セキュリティ"));
assert(message.textContent.includes("開始できません"));
assert.equal(typeof button.onclick, "function");
button.onclick();
assert.equal(reloads, 1);
console.log(
  "Graphics error UI: initialization-failure path, recovery text, hidden controls class and reload action passed",
);
