import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const files=fs.readdirSync('dist',{recursive:true}).filter(p=>fs.statSync(path.join('dist',p)).isFile()).sort();
const sums=Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(path.join('dist',p))).digest('hex')]));
fs.writeFileSync('tools/distribution-checksums.json',JSON.stringify(sums,null,2)+'\n');
console.log(`Recorded ${files.length} distribution checksums`);
