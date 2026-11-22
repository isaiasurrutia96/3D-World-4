// New avatar (version 2): copies the ORIGINAL limbs and neck of the owner's first
// approved avatar (from the 3D-WORLD-3 repository, saved here as Avatar
// Checkpoint 1, avatar/index.html, preview e023230) into original-limbs.json,
// exactly as that viewer draws them (owner, 22 November 2026: keep the athletic
// torso, head, hands and feet; bring back everything else from the original).
//
// That viewer centres the model differently from the avatar's own space (the
// skeleton's space), so the offset between the two is measured, not guessed:
// the same upper arm is copied from both that viewer and Avatar Checkpoint 2
// (which uses the avatar's space), and the offset is the difference of their
// points (checked to be the same for every point, i.e. no scale or turn).
// The forearms carry 50,944 triangles each (their hand socket); they are
// simplified the same careful way as the hands (shape change kept within a set
// limit). The neck, upper arms, thighs and calves are kept whole.
// Usage: node avatar-v2/build-original-limbs.mjs   (CHROMIUM_PATH=... if needed)
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,join,normalize} from 'node:path';
import {chromium} from 'playwright';
import {MeshoptSimplifier} from 'meshoptimizer';

const FOREARM_TRIANGLES=8000,MAX_ERROR=.004;
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.gz':'application/gzip','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 const path=normalize(join(process.cwd(),decodeURIComponent(req.url.split('?')[0]).replace(/\/$/,'/index.html')));
 let body;try{if(!path.startsWith(process.cwd()))throw 0;body=await readFile(path);}catch{res.writeHead(404);res.end();return;}
 res.writeHead(200,{'content-type':types[extname(path)]??'application/octet-stream'});res.end(body);
});
await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
/** Every mesh of a page's scene, in that page's world space, with its triangles. */
async function meshesOf(url,ready){
 const page=await browser.newPage();await page.goto(`http://localhost:${server.address().port}/${url}`);
 await page.waitForFunction(ready,null,{timeout:120000});await page.waitForTimeout(500);
 const out=await page.evaluate(()=>{const host=window.viewer??window.avatarLab;const s=host.scene;s.updateMatrixWorld(true);const list=[];
  s.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,P=g.attributes.position,v=new o.position.constructor(),pos=[];
   for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);}
   list.push({name:o.name,positions:pos,index:g.index?Array.from(g.index.array):Array.from({length:P.count},(_,i)=>i),mirrored:o.matrixWorld.determinant()<0});});return list;});
 await page.close();return out;
}
const viewer=await meshesOf('avatar/',()=>window.viewer&&window.viewer.scene);
const checkpoint=await meshesOf('checkpoints/avatar-2/',()=>window.avatarLabReady);
await browser.close();server.close();

// Identify the parts by size and place (the viewer leaves most unnamed): 308-triangle capsules and the named ones.
const centre=m=>{const c=[0,0,0],n=m.positions.length/3;for(let i=0;i<m.positions.length;i+=3)for(let k=0;k<3;k++)c[k]+=m.positions[i+k]/n;return c;};
const top=m=>{let t=-Infinity;for(let i=1;i<m.positions.length;i+=3)t=Math.max(t,m.positions[i]);return t;};
const capsules=list=>list.filter(m=>m.index.length/3===308);
// Offset: the +x upper arm is the 308-triangle capsule with the highest top beside the shoulder (x > 0.15) in both pages.
const upperArm=list=>capsules(list).filter(m=>centre(m)[0]>.15&&m.name!=='original-neck').sort((a,b)=>top(b)-top(a))[0];
const a=upperArm(viewer),b=upperArm(checkpoint);assert.equal(a.positions.length,b.positions.length,'upper arms differ');
const offset=[0,1,2].map(k=>b.positions[k]-a.positions[k]);
let worst=0;for(let i=0;i<a.positions.length;i++)worst=Math.max(worst,Math.abs(a.positions[i]+offset[i%3]-b.positions[i]));
assert(worst<1e-6,'not a pure offset: '+worst);
const move=m=>({...m,positions:m.positions.map((v,i)=>v+offset[i%3])});

// The parts, sorted by height: neck; then, per side (x > 0 is his left, as in the source), upper arm, thigh, calf.
const placed=viewer.map(move);
const neck=placed.find(m=>m.name==='original-neck');
const side=(m,s)=>s==='left'?centre(m)[0]>0:centre(m)[0]<0;
const caps=capsules(placed).filter(m=>m!==neck&&m.name!=='original-neck');
const pick=s=>{const mine=caps.filter(m=>side(m,s)&&m.name!=='forward-foot').sort((p,q)=>top(q)-top(p));return {upper:mine[0],thigh:mine[1],calf:mine[2]};};
const forearms=placed.filter(m=>m.name==='forearm-hand-socket');
// A part drawn mirrored (one side made from the other) has its triangles wound backwards: turn them back so they face out.
const facing=m=>m.mirrored?{...m,index:m.index.map((v,i,I)=>i%3===1?I[i+1]:i%3===2?I[i-1]:v),mirrored:false}:m;

await MeshoptSimplifier.ready;
function weld({positions,index}){const key=new Map(),pts=[],remap=[];
 for(let i=0;i<positions.length/3;i++){const k=positions[3*i].toFixed(6)+','+positions[3*i+1].toFixed(6)+','+positions[3*i+2].toFixed(6);let g=key.get(k);if(g===undefined){g=pts.length/3;key.set(k,g);pts.push(positions[3*i],positions[3*i+1],positions[3*i+2]);}remap.push(g);}
 const idx=[];for(let t=0;t<index.length;t+=3){const p=remap[index[t]],q=remap[index[t+1]],r=remap[index[t+2]];if(p!==q&&q!==r&&p!==r)idx.push(p,q,r);}return {positions:pts,index:idx};}
function simplify(part,triangles){const [index,error]=MeshoptSimplifier.simplify(Uint32Array.from(part.index),Float32Array.from(part.positions),3,triangles*3,MAX_ERROR);
 const used=new Map(),positions=[],out=[];for(const i of index){let j=used.get(i);if(j===undefined){j=positions.length/3;used.set(i,j);positions.push(part.positions[3*i],part.positions[3*i+1],part.positions[3*i+2]);}out.push(j);}return {positions,index:out,error};}
const round=p=>({positions:p.positions.map(v=>+v.toFixed(5)),index:p.index});
const parts={neck:round(weld(facing(neck)))};let forearmError=0;
for(const s of ['left','right']){const {upper,thigh,calf}=pick(s),fore=forearms.find(m=>side(m,s));assert(upper&&thigh&&calf&&fore,'missing '+s+' part');
 const f=simplify(weld(facing(fore)),FOREARM_TRIANGLES);assert(f.error<=MAX_ERROR,'forearm changed shape too much: '+f.error);forearmError=Math.max(forearmError,f.error);
 parts[s]={'upper-arm':round(weld(facing(upper))),forearm:round(f),thigh:round(weld(facing(thigh))),calf:round(weld(facing(calf)))};}
const out={version:1,source:{viewer:'avatar/index.html',checkpoint:'avatar-approved-2026-11-17',from:'3D-WORLD-3 avatar-preview e023230',offset,offsetCheckedOn:'upper arm, every point',
 forearmOriginalTriangles:forearms[0].index.length/3,forearmSimplifiedError:+forearmError.toFixed(5)},parts};
await writeFile('avatar-v2/original-limbs.json',JSON.stringify(out)+'\n');
console.log('offset',offset.map(v=>v.toFixed(4)).join(', '),'| parts:',['neck',...Object.keys(parts.left)].join(', '),'| forearm',forearms[0].index.length/3,'→',parts.left.forearm.index.length/3,'triangles, change',(forearmError*100).toFixed(2)+'%');
