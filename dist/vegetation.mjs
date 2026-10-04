import * as THREE from 'three';
export function createVegetation(scene,library,placement){
 library.updateMatrixWorld(true);const trees=[],small=[],cells=new Map(),pools=new Map(),dummy=new THREE.Object3D();
 const names=['spreading','upright','windswept'];let serial=0;
 for(const set of placement.sets){for(let i=0;i<set.position.length;i++){const p=set.position[i],name=set.prototypes[set.variant[i]%set.prototypes.length],o={x:p[0],y:p[2],z:-p[1],scale:set.scale[i],yaw:set.yaw[i],name,id:serial++};(name.startsWith('broadleaf')?trees:small).push(o);}}
 for(const o of [...trees,...small]){const k=`${Math.floor(o.x/100)},${Math.floor(o.z/100)}`;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(o);}
 const mobile=innerWidth<700,limitFar=mobile?95:180,limitMid=mobile?16:30;
 function pool(name){if(pools.has(name))return pools.get(name);const root=library.getObjectByName(name);if(!root)throw Error('Missing vegetation prototype '+name);const max=name.endsWith('_high')?(mobile?1:3):name.endsWith('_mid')?limitMid:name.endsWith('_far')?limitFar:name.startsWith('grass')?160:name.startsWith('fern')?70:35;const meshes=[];const inv=root.matrixWorld.clone().invert();root.traverse(child=>{if(!child.isMesh)return;const g=child.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,child.matrixWorld)),mesh=new THREE.InstancedMesh(g,child.material,max);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=!name.endsWith('_far');mesh.receiveShadow=true;mesh.count=0;scene.add(mesh);meshes.push(mesh);});const p={meshes,max,count:0};pools.set(name,p);return p;}
 let lastX=1e20,lastZ=1e20,lastTime=-10;
 function update(position,time,force=false){if(!force&&time-lastTime<.35&&Math.hypot(position.x-lastX,position.z-lastZ)<12)return;lastTime=time;lastX=position.x;lastZ=position.z;for(const p of pools.values())p.count=0;
 const cx=Math.floor(position.x/100),cz=Math.floor(position.z/100),candidates=[];
 for(let x=cx-9;x<=cx+9;x++)for(let z=cz-9;z<=cz+9;z++)for(const o of cells.get(`${x},${z}`)||[]){const d=Math.hypot(o.x-position.x,o.z-position.z),tree=o.name.startsWith('broadleaf'),range=tree?900:o.name.startsWith('grass')?65:o.name.startsWith('fern')?80:125;if(d<range)candidates.push({o,d});}
 candidates.sort((a,b)=>a.d-b.d);
 for(const {o,d} of candidates){let name=o.name;if(name.startsWith('broadleaf')){name=name.replace(/_(high|mid|far)$/,'_'+(d<35?'high':d<110?'mid':'far'));}let p=pool(name);if(p.count>=p.max&&name.endsWith('_high')){name=name.replace('_high','_mid');p=pool(name);}if(p.count>=p.max)continue;dummy.position.set(o.x,o.y,o.z);dummy.rotation.set(0,o.yaw,0);dummy.scale.setScalar(o.scale);dummy.updateMatrix();for(const mesh of p.meshes){mesh.setMatrixAt(p.count,dummy.matrix);mesh.setColorAt(p.count,new THREE.Color().setRGB(.82+(o.id%9)*.022,.88+(o.id%7)*.018,.80+(o.id%11)*.018));}p.count++;}
 for(const p of pools.values())for(const mesh of p.meshes){mesh.count=p.count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 return {update,counts:()=>Object.fromEntries([...pools].map(([n,p])=>[n,p.count]))};
}
export function createDistantCanopy(scene,placement){
 const pts=[];for(const set of placement.sets)if(set.prototypes[0]?.startsWith('broadleaf'))for(let i=0;i<set.position.length;i++)pts.push({p:set.position[i],s:set.scale[i],yaw:set.yaw[i],variant:set.variant[i]});
 const geo=new THREE.IcosahedronGeometry(1,1),mat=new THREE.MeshStandardMaterial({color:0x3b622d,roughness:1,flatShading:false});const mesh=new THREE.InstancedMesh(geo,mat,pts.length);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);const dummy=new THREE.Object3D();let last=-10;
 return {update(pos,time){if(time-last<1)return;last=time;let count=0;for(let i=0;i<pts.length;i++){const o=pts[i],d=Math.hypot(o.p[0]-pos.x,-o.p[1]-pos.z);if(d<460||d>3500)continue;const h=[8.1,9.3,7.7][o.variant%3]*o.s;dummy.position.set(o.p[0],o.p[2]+h*.65,-o.p[1]);dummy.rotation.set(0,o.yaw,0);dummy.scale.set(3.3*o.s,h*.43,3*o.s);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count,new THREE.Color().setRGB(.69+(i%7)*.04,.78+(i%5)*.035,.65+(i%9)*.025));count++;}mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}};
}
