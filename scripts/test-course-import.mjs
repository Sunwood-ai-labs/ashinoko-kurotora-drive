/** Integration tests use tiny data fixtures, never touch the real installed pack. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'course-import-test-'));
const game=path.join(temp,'game'),source=path.join(temp,'source');
let checks=0;
try{
 await fs.mkdir(path.join(game,'scripts'),{recursive:true});await fs.mkdir(source);
 await fs.copyFile('scripts/sync-course.mjs',path.join(game,'scripts/sync-course.mjs'));
 const contents={
  'course-loader.mjs':'// fixture: never executed\n',
  'PROVENANCE.json':'{"source":"fixture"}\n','LICENSE.md':'Fixture rights\n',
  'assets/course-manifest.json':JSON.stringify({courseId:'ashinoko-gt',packVersion:'4.0.0'}),
  'assets/course-checksums.json':'{"files":{}}',
  'schemas/course-manifest.schema.json':'{"type":"object"}'
 };
 const release={schemaVersion:1,repository:'https://github.com/Sunwood-ai-labs/ashinoko-course-data',courseId:'ashinoko-gt',packVersion:'4.0.0',files:{}};
 for(const[p,b]of Object.entries(contents)){await fs.mkdir(path.dirname(path.join(source,p)),{recursive:true});await fs.writeFile(path.join(source,p),b);release.files[p]={bytes:Buffer.byteLength(b),sha256:crypto.createHash('sha256').update(b).digest('hex')};}
 const save=async()=>fs.writeFile(path.join(source,'course-release.json'),JSON.stringify(release));await save();
 const run=(...args)=>spawnSync(process.execPath,[path.join(game,'scripts/sync-course.mjs'),...args],{encoding:'utf8'});
 const pass=r=>{assert.equal(r.status,0,r.stderr);checks++;};
 const fail=(r,pattern)=>{assert.notEqual(r.status,0,'Invalid input unexpectedly accepted');if(pattern)assert.match(r.stderr,pattern);checks++;};
 fail(run('--source',source)); // first import must explicitly accept a reviewed pin
 pass(run('--source',source,'--accept-update'));pass(run('--check'));pass(run('--source',source));
 const lock=await fs.readFile(path.join(game,'course.lock.json'));
 await fs.writeFile(path.join(source,'LICENSE.md'),'tampered');fail(run('--source',source,'--accept-update'));
 assert.deepEqual(await fs.readFile(path.join(game,'course.lock.json')),lock);checks++;
 await fs.writeFile(path.join(source,'LICENSE.md'),contents['LICENSE.md']);
 release.files['../escape.json']=release.files['LICENSE.md'];await save();fail(run('--source',source,'--accept-update'));delete release.files['../escape.json'];await save();
 release.files['assets/kurotora.glb']=release.files['LICENSE.md'];await save();fail(run('--source',source,'--accept-update'),/Game-owned path/);delete release.files['assets/kurotora.glb'];await save();
 release.files['assets/KUROTORA.glb']=release.files['LICENSE.md'];await save();fail(run('--source',source,'--accept-update'),/Game-owned path/);delete release.files['assets/KUROTORA.glb'];await save();
 release.files['schemas/COURSE-manifest.schema.json']=release.files['schemas/course-manifest.schema.json'];await save();fail(run('--source',source,'--accept-update'),/Case-insensitive destination collision/);delete release.files['schemas/COURSE-manifest.schema.json'];await save();
 await fs.rename(path.join(source,'LICENSE.md'),path.join(temp,'outside'));await fs.symlink(path.join(temp,'outside'),path.join(source,'LICENSE.md'));fail(run('--source',source,'--accept-update'));await fs.unlink(path.join(source,'LICENSE.md'));
 fail(run('--source',source,'--accept-update'));await fs.writeFile(path.join(source,'LICENSE.md'),contents['LICENSE.md']);
 await fs.writeFile(path.join(temp,'outside'),'OUTSIDE SENTINEL - MUST NOT CHANGE');
 const installed=path.join(game,'dist','assets','course-license.md');
 await fs.unlink(installed);await fs.symlink(path.join(temp,'outside'),installed);
 fail(run('--source',source,'--accept-update'));
 assert.equal(await fs.readFile(path.join(temp,'outside'),'utf8'),'OUTSIDE SENTINEL - MUST NOT CHANGE');checks++;
 await fs.unlink(installed);await fs.writeFile(installed,contents['LICENSE.md']);
 await fs.writeFile(path.join(game,'dist','course-loader.mjs'),'drift');fail(run('--check'));
 release.packVersion='4.0.1';await save();fail(run('--source',source));fail(run('--source',source,'--accept-update'));
 fail(run('--check','--accept-update'));
 console.log(JSON.stringify({importChecks:checks,coverage:['pin','tamper','path traversal','vehicle overwrite','source/destination symlink','missing file','installed drift','version mismatch','no mutation on invalid input']}));
}finally{await fs.rm(temp,{recursive:true,force:true});}
