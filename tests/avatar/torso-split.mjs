// Torso split checks: chest and pelvis replace the one-piece torso, the
// outer shape is unchanged except a thin seam, the waist ball sits in its
// bowl, the bowl stays clear of the hip sockets, and turning the chest
// keeps the seam the same. Usage: node tests/avatar/torso-split.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'torso-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createAssembledAvatar} from '${root}/avatar-lab/src/avatar.js';export {WAIST} from '${root}/avatar-lab/src/torso-split.js';export * as T from 'three';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {createAssembledAvatar,WAIST,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(1)+' mm';
const one=createAssembledAvatar({torsoSplit:false}),two=createAssembledAvatar();
const oldTorso=one.rig.torso.children.find(o=>o.name==='socket-torso'),{pelvis,chest,pivotLocal,ballRadius,socketRadius}=two.waist;
const pts=g=>{const P=g.attributes.position,o=[];for(let i=0;i<P.count;i++)o.push(new T.Vector3().fromBufferAttribute(P,i));return o;};
const O=pts(oldTorso.geometry),Pv=pts(pelvis.geometry),Cv=pts(chest.geometry);
check('the one-piece torso is replaced by a chest and a pelvis',!two.rig.torso.children.some(o=>o.name==='socket-torso')&&two.rig.torso.children.includes(pelvis)&&two.rig.torso.children.includes(chest));
// Outer shape: every approved surface point away from the seam is still there, exactly.
const key=v=>`${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`,have=new Set([...Pv,...Cv].map(key));
const away=O.filter(v=>Math.abs(v.y-WAIST.split)>.035),kept=away.filter(v=>have.has(key(v))).length;
check('the outer shape is exactly the approved torso, except a thin band at the waist',kept===away.length,`${kept.toLocaleString()} of ${away.length.toLocaleString()} surface points identical; the band is 7 cm tall`);
// In the band, the silhouette only rounds in at the seam (never sticks out).
const bandOld=O.filter(v=>Math.abs(v.y-WAIST.split)<=.035),outer=v=>Math.hypot(v.x,v.z);
const rOld=Math.max(...bandOld.map(outer)),rNew=Math.max(...[...Pv,...Cv].filter(v=>Math.abs(v.y-WAIST.split)<=.035).map(outer));
check('at the waist the new pieces never stick out past the approved shape',rNew<=rOld+1e-6,`widest point in the band: ${mm(rNew)} (approved ${mm(rOld)})`);
// Ball and bowl.
const near=(list,c,r)=>Math.max(...list.map(v=>Math.abs(v.distanceTo(c)-r)));
const ball=Cv.filter(v=>v.y<pivotLocal.y+.04&&v.y>WAIST.ballCut+.001&&Math.hypot(v.x,v.z)>.02);
const bowl=Pv.filter(v=>v.y<pivotLocal.y+.035&&v.y>WAIST.floor+.001&&Math.hypot(v.x,v.z)<socketRadius+1e-3&&v.distanceTo(pivotLocal)>socketRadius-1e-3);
check('the chest ends in a ball and the pelvis has a matching bowl, both centred on the waist pivot',near(ball,pivotLocal,ballRadius)<1e-6&&near(bowl,pivotLocal,socketRadius)<1e-6,`ball ${mm(ballRadius)} radius, bowl ${mm(socketRadius)}: ${mm(socketRadius-ballRadius)} clearance`);
// Bowl floor stays above the hip sockets underneath.
const floorR=Math.max(...Pv.filter(v=>Math.abs(v.y-WAIST.floor)<1e-9).map(outer));
const under=O.filter(v=>v.y<WAIST.floor&&outer(v)<floorR),roof=Math.max(...under.map(v=>v.y));
check('the bowl never reaches the hip sockets underneath',roof<WAIST.floor-.01,`at least ${mm(WAIST.floor-roof)} of clay between the bowl floor and the hip sockets`);
// Turning the chest about the waist keeps the seam gap and the ball in the bowl.
const lip=Math.max(...Pv.filter(v=>v.y>WAIST.split&&outer(v)>socketRadius+.005).map(v=>v.y));
let minGap=Infinity,ballOut=0;
for(const deg of [-35,-20,0,20,35]){const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),deg*Math.PI/180);
 for(const v of Cv){const w=v.clone().sub(pivotLocal).applyQuaternion(q).add(pivotLocal);if(outer(w)>socketRadius+.005&&w.y<lip+.05)minGap=Math.min(minGap,w.y-lip);ballOut=Math.max(ballOut,w.distanceTo(pivotLocal)>socketRadius&&w.y<lip?1:0);}}
check('turning the chest ±35° keeps the seam open and the ball inside the bowl',minGap>=WAIST.seam-1e-6&&ballOut===0,`smallest seam gap while turning ${mm(minGap)}`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: chest and pelvis split cleanly with a seated ball-and-socket waist.');process.exit(fail?1:0);
