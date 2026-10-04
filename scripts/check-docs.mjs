import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const files=['README.md','README.ja.md','LICENSE.md','CONTRIBUTING.md','SECURITY.md','AGENTS.md',...fs.readdirSync('docs',{recursive:true}).filter(p=>p.endsWith('.md')).map(p=>'docs/'+p)];
let links=0;
for(const file of files){
 const text=fs.readFileSync(file,'utf8');
 for(const match of text.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)){
  const href=match[1];if(/^[a-z][a-z0-9+.-]*:/i.test(href)||href.startsWith('#'))continue;
  const target=decodeURIComponent(href.split('#')[0]);if(!target)continue;
  assert(fs.existsSync(path.resolve(path.dirname(file),target)),`${file}: missing local link ${href}`);links++;
 }
}
const headings=file=>fs.readFileSync(file,'utf8').match(/^## /gm)?.length||0;
assert.equal(headings('README.md'),headings('README.ja.md'),'README language section parity');
assert(fs.readFileSync('README.md','utf8').includes('README.ja.md'));
assert(fs.readFileSync('README.ja.md','utf8').includes('README.md'));
console.log(JSON.stringify({documentationFiles:files.length,localLinks:links,bilingualReadmeParity:true}));
