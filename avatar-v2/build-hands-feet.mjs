// New avatar (version 2): copies the owner's ORIGINAL hand and foot (his left
// side) into hands-feet-source.json: the ones from BEFORE the ball joints were
// added (Avatar Checkpoint 2, 17 November 2026, checkpoints/avatar-2/), which
// have smooth rounded wrist and ankle ends and no sockets.
//
// How: the frozen checkpoint page is opened in a headless browser (served from
// this repository) and its hand ("right-emoji-hand", his left, +x) and foot
// ("right-rounded-foot") are copied exactly as the page draws them, in avatar
// space. (That checkpoint names sides as you look at him; its "right" is his
// left.) The hand has 260,688 triangles, ten times the whole phone budget, so
// it is simplified the same careful way the approved avatar's light copies
// were (meshoptimizer, shape change kept within a set limit); the foot is kept
// whole. Each part also records its pivot (wrist / ankle joint) and three
// directions from the skeleton (length, width, thickness).
// An earlier version of this script used the Light copy of the jointed avatar,
// whose hand and foot have sockets; the owner wants the pre-joint originals.
// Usage: node avatar-v2/build-hands-feet.mjs
//   (CHROMIUM_PATH=/path/to/chromium if Playwright cannot find its browser)
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,join,normalize} from 'node:path';
import {chromium} from 'playwright';
import {MeshoptSimplifier} from 'meshoptimizer';
import {SIDE,PALM,fingerBones} from '../motion-core/skeleton/bones.js';

const HAND_TRIANGLES=20000,MAX_ERROR=.004;// simplified hand size and largest allowed shape change (share of its size)
const checkpoint=JSON.parse(await readFile('checkpoints/avatar-2/CHECKPOINT.json','utf8'));

// 1. Serve the repository and copy the two parts out of the frozen page.
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.gz':'application/gzip','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 const path=normalize(join(process.cwd(),decodeURIComponent(req.url.split('?')[0]).replace(/\/$/,'/index.html')));
 let body;try{if(!path.startsWith(process.cwd()))throw 0;body=await readFile(path);}catch{res.writeHead(404);res.end();return;}// read first, then answer once
 res.writeHead(200,{'content-type':types[extname(path)]??'application/octet-stream'});res.end(body);
});
await new Promise(r=>server.listen(0,r));
// CHROMIUM_PATH: optional browser location, for machines whose installed browser
// does not match this project's Playwright version.
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),page=await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/checkpoints/avatar-2/`);await page.waitForFunction(()=>window.avatarLabReady,null,{timeout:120000});
const raw=await page.evaluate(()=>{const s=window.avatarLab.scene;s.updateMatrixWorld(true);const out={};
 s.traverse(o=>{if(!o.isMesh||!['right-emoji-hand','right-rounded-foot'].includes(o.name))return;const g=o.geometry,P=g.attributes.position,v=new o.position.constructor(),pos=[];
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);}
  out[o.name]={positions:pos,index:g.index?Array.from(g.index.array):Array.from({length:P.count},(_,i)=>i),mirrored:o.matrixWorld.determinant()<0};});return out;});
await browser.close();server.close();
assert(raw['right-emoji-hand']&&raw['right-rounded-foot'],'hand or foot not found in the checkpoint');
for(const part of Object.values(raw))assert(!part.mirrored,'unexpected mirrored part');

// 2. Weld points that share a position (so the simplifier can move seams), then simplify the hand.
function weld({positions,index}){
 const key=new Map(),pts=[],remap=[];
 for(let i=0;i<positions.length/3;i++){const k=positions[3*i].toFixed(6)+','+positions[3*i+1].toFixed(6)+','+positions[3*i+2].toFixed(6);let g=key.get(k);if(g===undefined){g=pts.length/3;key.set(k,g);pts.push(positions[3*i],positions[3*i+1],positions[3*i+2]);}remap.push(g);}
 const idx=[];for(let t=0;t<index.length;t+=3){const a=remap[index[t]],b=remap[index[t+1]],c=remap[index[t+2]];if(a!==b&&b!==c&&a!==c)idx.push(a,b,c);}
 return {positions:pts,index:idx};
}
await MeshoptSimplifier.ready;
function simplify(part,triangles){
 const [index,error]=MeshoptSimplifier.simplify(Uint32Array.from(part.index),Float32Array.from(part.positions),3,triangles*3,MAX_ERROR);
 const used=new Map(),positions=[],out=[];
 for(const i of index){let j=used.get(i);if(j===undefined){j=positions.length/3;used.set(i,j);positions.push(part.positions[3*i],part.positions[3*i+1],part.positions[3*i+2]);}out.push(j);}
 return {positions,index:out,error};
}
const handFull=weld(raw['right-emoji-hand']),foot=weld(raw['right-rounded-foot']),hand=simplify(handFull,HAND_TRIANGLES);
assert(hand.error<=MAX_ERROR,'hand changed shape too much: '+hand.error);

// 3. Smooth surface directions, pivots and directions from the skeleton.
function normalsOf({positions,index}){
 const n=new Array(positions.length).fill(0);
 for(let k=0;k<index.length;k+=3){const [a,b,c]=[index[k],index[k+1],index[k+2]],P=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]],pa=P(a),pb=P(b),pc=P(c);
  const u=[pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]],v=[pc[0]-pa[0],pc[1]-pa[1],pc[2]-pa[2]],f=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  for(const p of [a,b,c])for(let j=0;j<3;j++)n[3*p+j]+=f[j];}
 for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2])||1;n[i]=+(n[i]/l).toFixed(4);n[i+1]=+(n[i+1]/l).toFixed(4);n[i+2]=+(n[i+2]/l).toFixed(4);}
 return n;
}
const bone=name=>SIDE.find(b=>b.name===name);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),unit=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** Three directions from the skeleton: length, thickness (made square to length) and width (square to both). */
function axes(length,up){const l=unit(length),d=up[0]*l[0]+up[1]*l[1]+up[2]*l[2],t=unit(sub(up,l.map(v=>v*d)));return {length:l,width:unit(cross(t,l)),thickness:t};}
const wrist=bone('hand').head,middle=fingerBones().filter(b=>/^middle/.test(b.name)).at(-1),tip=middle.tail??middle.head;
const ankle=bone('foot').head,toe=bone('foot').tail;
const round=(a,d)=>a.map(v=>+v.toFixed(d));
const out={version:2,source:{checkpoint:'checkpoints/avatar-2/',tag:checkpoint.tag,saved_on:checkpoint.saved_on,hand:'right-emoji-hand',foot:'right-rounded-foot',
  handOriginalTriangles:handFull.index.length/3,handSimplifiedError:+hand.error.toFixed(5)},
 hand:{positions:round(hand.positions,5),normals:normalsOf(hand),index:hand.index,pivot:wrist,axes:axes(sub(tip,wrist),PALM.normal)},
 foot:{positions:round(foot.positions,5),normals:normalsOf(foot),index:foot.index,pivot:ankle,axes:axes(sub(toe,ankle),[0,1,0])}};
await writeFile('avatar-v2/hands-feet-source.json',JSON.stringify(out)+'\n');
console.log(`hand ${handFull.index.length/3} → ${out.hand.index.length/3} triangles (shape change ${(hand.error*100).toFixed(2)}% of its size), foot ${out.foot.index.length/3} triangles`);
