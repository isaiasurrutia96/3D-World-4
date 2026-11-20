// Checks the one-piece torso (avatar-v2/torso.json drawn by torso-shape.js).
// Usage: node avatar-v2/check-torso.mjs   (npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildTorsoSurface} from './torso-shape.js';

const torso=JSON.parse(await readFile('avatar-v2/torso.json','utf8'));
globalThis.__source=await readFile('avatar-v2/torso-source.json','utf8');
const {positions,index}=buildTorsoSurface(torso.shape);
const results=[];
const check=(name,fn)=>{try{const detail=fn();results.push({check:name,result:'PASS',detail});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};

check('one piece: a single part with no separate chest and pelvis',()=>{
 assert.equal(torso.kind,'torso-shape');assert(!('parts' in torso),'still has separate parts');return 'one surface';
});
check('every number is a real number',()=>{
 assert(positions.every(Number.isFinite),'bad position');assert(torso.shape.rings.every(r=>r.r.every(v=>Number.isFinite(v)&&v>0)),'bad radius');return positions.length/3+' points';
});
check('sealed: every edge is shared by exactly two triangles (no holes, no seams)',()=>{
 const edges=new Map();
 for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){const a=index[i+k],b=index[i+(k+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);}
 const bad=[...edges.values()].filter(n=>n!==2).length;assert.equal(bad,0,bad+' open or doubled edges');return edges.size+' edges';
});
check('consistent: neighbouring triangles agree on which side is outside',()=>{
 const directed=new Set();
 for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){const key=index[i+k]+'>'+index[i+(k+1)%3];assert(!directed.has(key),'flipped triangle at edge '+key);directed.add(key);}
 return 'all agree';
});
check('outside faces out: enclosed volume is positive and torso-sized',()=>{
 let volume=0;const p=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]];
 for(let i=0;i<index.length;i+=3){const a=p(index[i]),b=p(index[i+1]),c=p(index[i+2]);volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
 assert(volume>.03&&volume<.15,'volume '+volume.toFixed(4)+' m³');return (volume*1000).toFixed(1)+' litres';
});
check('no sockets: no dent deeper than 1 cm anywhere around a ring',()=>{
 // A dent shows up as a radius well below both neighbours around the ring.
 let worst=0;
 for(const ring of torso.shape.rings){const r=ring.r,n=r.length;for(let s=0;s<n;s++){const lo=Math.min(r[(s+n-3)%n],r[(s+3)%n]);worst=Math.max(worst,lo-r[s]);}}
 assert(worst<.01,'dent '+(worst*1000).toFixed(1)+' mm');return 'deepest '+(worst*1000).toFixed(1)+' mm';
});
check('no line: no groove deeper than 3 mm up the body',()=>{
 let worst=0;const rings=torso.shape.rings;
 for(let s=0;s<torso.shape.segments;s++)for(let i=2;i<rings.length-2;i++){const lo=Math.min(rings[i-2].r[s],rings[i+2].r[s]);worst=Math.max(worst,lo-rings[i].r[s]);}
 assert(worst<.003,'groove '+(worst*1000).toFixed(1)+' mm');return 'deepest '+(worst*1000).toFixed(1)+' mm';
});
check('same size as before: height and width match the old torso within 2 cm',()=>{
 const source=JSON.parse(globalThis.__source);const ys=[],xs=[];
 for(const p of source.parts)for(let i=0;i<p.positions.length;i+=3){ys.push(p.positions[i+1]);xs.push(p.positions[i]);}
 const range=a=>Math.max(...a)-Math.min(...a),newY=[],newX=[];for(let i=0;i<positions.length;i+=3){newY.push(positions[i+1]);newX.push(positions[i]);}
 assert(Math.abs(range(ys)-range(newY))<.02,'height');assert(Math.abs(range(xs)-range(newX))<.02,'width');
 return `height ${range(newY).toFixed(3)} m (was ${range(ys).toFixed(3)}), width ${range(newX).toFixed(3)} m (was ${range(xs).toFixed(3)})`;
});
check('phone-ready: under 6,000 triangles',()=>{assert(index.length/3<6000);assert.equal(index.length/3,torso.triangles);return index.length/3+' triangles';});
check('attach points kept for the arms and legs',()=>{const bones=torso.attach.map(a=>a.bone).sort().join(' ');assert.equal(bones,'thigh.L thigh.R upperArm.L upperArm.R');return bones;});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the torso is one sealed, smooth piece with no sockets or line.');
process.exitCode=failed?1:0;
