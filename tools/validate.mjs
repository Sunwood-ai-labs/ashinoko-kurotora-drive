import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {makeTrack, initialState, step, autoInput} from '../dist/physics.mjs';
const root = path.resolve('dist');
const checksums=JSON.parse(fs.readFileSync('tools/distribution-checksums.json','utf8'));
for(const [rel,expected] of Object.entries(checksums)) {
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex'),expected,`${rel}: distribution checksum mismatch`);
}
const files = fs.readdirSync(root,{recursive:true}).filter(p => fs.statSync(path.join(root,p)).isFile());
for (const rel of files) {
  const p=path.join(root,rel);
  assert(fs.statSync(p).size < 25*1024*1024,`${rel}: exceeds web upload limit`);
  if (/\.(mjs|js)$/.test(rel)) {
    const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
    assert.equal(r.status,0,`${rel}: ${r.stderr}`);
  }
  if (/\.(mjs|js|html|css|json)$/.test(rel)) {
    const text=fs.readFileSync(p,'utf8');
    assert(!/\/workspace\/|\/home\/agent\/|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(text),`${rel}: contains a private path or credential-like string`);
    assert(!/https?:\/\/(localhost|127\.0\.0\.1)/.test(text),`${rel}: contains a local development URL`);
  }
  if (rel.endsWith('.glb')) {
    const b=fs.readFileSync(p);
    assert.equal(b.readUInt32LE(0),0x46546c67,`${rel}: GLB magic`);
    assert.equal(b.readUInt32LE(4),2,`${rel}: GLB v2`);
    assert.equal(b.readUInt32LE(8),b.length,`${rel}: GLB length`);
    const meta = b.subarray(20,20+b.readUInt32LE(12)).toString('utf8');
    assert(!/\/workspace\/|\/home\/|file:/.test(meta),`${rel}: contains a private path`);
    JSON.parse(meta);
  }
}
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/course-data.json'),'utf8'));
assert.equal(data.route.length,data.station.length);
const track=makeTrack(data);
assert(track.L>25000&&track.L<25100);
for(let s=0;s<track.L;s+=5) {
  assert(track.at(s).every(Number.isFinite));
  assert(Number.isFinite(track.frame(s).grade));
  assert(Number.isFinite(track.curvature(s)));
}
const run=(state,input,seconds)=>{for(let i=0;i<120*seconds;i++)step(state,input,1/120,track);return state;};
let state=initialState();run(state,{},2);assert.equal(state.distance,0);assert.equal(state.speed,0);
state=initialState();run(state,{throttle:1},1);assert(state.speed>8);const speed=state.speed;run(state,{brake:1},1);assert(state.speed<speed);
const left=run(initialState(),{throttle:1,steer:1},.4),right=run(initialState(),{throttle:1,steer:-1},.4);assert(left.lateral>right.lateral);
state=initialState();state.distance=track.L-.01;state.speed=30;step(state,{throttle:1},1/120,track);assert(state.finished);
state=initialState(data.startStation);let maxLateral=0;
for(let i=0;i<120*7200&&!state.finished;i++) {step(state,autoInput(state,track),1/120,track);maxLateral=Math.max(maxLateral,Math.abs(state.lateral));assert(Number.isFinite(state.speed));}
assert(state.finished,'Automatic driving must complete the full circuit within two simulated hours');
console.log(JSON.stringify({files:files.length,routeKm:track.L/1000,autoFinished:state.finished,autoSeconds:state.time,maxLateral,contacts:state.contacts},null,2));
