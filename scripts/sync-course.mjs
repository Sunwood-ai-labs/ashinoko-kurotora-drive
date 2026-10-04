#!/usr/bin/env node
/** Import an audited local course release. Never fetches remote data or runs imported code. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);
const flags=new Set(['--source','--accept-update','--check']);
let source,accept=false,check=false;
for(let i=0;i<args.length;i++){
 assert(flags.has(args[i]),'Unknown argument: '+args[i]);
 if(args[i]==='--source'){assert(args[i+1]&&!args[i+1].startsWith('--'),'Missing source');source=path.resolve(args[++i]);}
 else if(args[i]==='--accept-update')accept=true;
 else check=true;
}
assert(!(check&&accept),'--check cannot accept updates');
const lockPath=path.join(root,'course.lock.json');
const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));
function validateRelease(release){
 assert.equal(release.schemaVersion,1,'Unsupported release schema');
 assert.equal(release.repository,'https://github.com/Sunwood-ai-labs/ashinoko-course-data','Unexpected course repository');
 assert.equal(release.courseId,'ashinoko-gt','Unexpected course ID');
 assert(/^\d+\.\d+\.\d+$/.test(release.packVersion),'Invalid pack version');
 assert(release.files&&typeof release.files==='object'&&!Array.isArray(release.files),'Missing files');
 const names=Object.keys(release.files);assert(names.length>0&&names.length<10000,'Invalid file budget');
 for(const [p,v] of Object.entries(release.files)){
  assert(/^(?:assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:json|glb)|schemas\/[A-Za-z0-9][A-Za-z0-9._-]*\.schema\.json|course-loader\.mjs|PROVENANCE\.json|LICENSE\.md)$/.test(p),'Unsafe release path: '+p);
  assert(!['assets/kurotora.glb','assets/course-origin.json','assets/course-license.md'].includes(p.toLowerCase()),'Game-owned path: '+p);
  assert(v&&Number.isSafeInteger(v.bytes)&&v.bytes>0&&v.bytes<25*1024*1024&&/^[a-f0-9]{64}$/.test(v.sha256),'Invalid hash or size');
 }
 assert.equal(new Set(names.map(p=>destination(p).toLowerCase())).size,names.length,'Case-insensitive destination collision');
 for(const p of ['course-loader.mjs','PROVENANCE.json','LICENSE.md','assets/course-manifest.json','assets/course-checksums.json','schemas/course-manifest.schema.json'])assert(release.files[p],'Required release file missing: '+p);
 return release;
}
const destination=p=>p==='PROVENANCE.json'?'assets/course-origin.json':p==='LICENSE.md'?'assets/course-license.md':p;
async function readSafe(base,relative){
 let current=base;
 assert(!(await fs.lstat(base)).isSymbolicLink(),'Source directory may not be a symlink');
 for(const part of relative.split('/')){current=path.join(current,part);assert(!(await fs.lstat(current)).isSymbolicLink(),'Symlink rejected: '+relative);}
 assert((await fs.stat(current)).isFile(),'Regular files only');
 return fs.readFile(current);
}
async function checkDestination(relative){
 let current=root;
 for(const part of ['dist',...relative.split('/')]){
  current=path.join(current,part);
  try{assert(!(await fs.lstat(current)).isSymbolicLink(),'Destination symlink rejected: '+relative);}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
}
function verify(bytes,expected,p){assert.equal(bytes.length,expected.bytes,'Size mismatch: '+p);assert.equal(hash(bytes),expected.sha256,'SHA-256 mismatch: '+p);}
if(check){
 assert(!source,'--check validates the committed snapshot; omit --source');
 const lock=await readJson(lockPath);validateRelease(lock.release);
 assert.equal(hash(Buffer.from(JSON.stringify(lock.release))),lock.releaseSha256,'Lock inventory hash mismatch');
 for(const [p,expected]of Object.entries(lock.release.files))verify(await readSafe(path.join(root,'dist'),destination(p)),expected,p);
 console.log(JSON.stringify({pinned:true,packVersion:lock.release.packVersion,files:Object.keys(lock.release.files).length,sha256:lock.releaseSha256}));
}else{
 assert(source,'Usage: node scripts/sync-course.mjs --source ../ashinoko-course-data [--accept-update] | --check');
 const release=validateRelease(JSON.parse(await readSafe(source,'course-release.json')));
 const releaseSha256=hash(Buffer.from(JSON.stringify(release)));
 if(!accept){const lock=await readJson(lockPath);assert.equal(releaseSha256,lock.releaseSha256,'Release differs from pin; review it, then use --accept-update');}
 const contents=new Map();
 for(const [p,expected]of Object.entries(release.files)){const bytes=await readSafe(source,p);verify(bytes,expected,p);contents.set(p,bytes);}
 const manifest=JSON.parse(contents.get('assets/course-manifest.json'));
 assert.equal(manifest.packVersion,release.packVersion,'Manifest/release version mismatch');assert.equal(manifest.courseId,release.courseId,'Manifest/release ID mismatch');
 const sums=JSON.parse(contents.get('assets/course-checksums.json'));
 for(const [p,v]of Object.entries(sums.files)){assert.deepEqual(release.files['assets/'+p],v,'Integrity/release mismatch: '+p);}
 // No destination is touched until every source file, hash, pin and destination has passed.
 for(const p of contents.keys())await checkDestination(destination(p));
 try{assert(!(await fs.lstat(lockPath)).isSymbolicLink(),'Lock symlink rejected');}catch(error){if(error.code!=='ENOENT')throw error;}
 for(const [p,bytes]of contents){const target=path.join(root,'dist',destination(p));await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);}
 const lock={schemaVersion:1,releaseSha256,release};
 await fs.writeFile(lockPath,JSON.stringify(lock,null,2)+'\n');
 console.log(JSON.stringify({imported:true,packVersion:release.packVersion,files:contents.size,sha256:releaseSha256}));
}
