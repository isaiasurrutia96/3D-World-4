// Skinned hands checks: the hands bent by the graphics card (driven by the
// skeleton's finger bones) look like the approved hand rig, shape by shape,
// point by point; the palm and wrist ball stay rigid; it is fast.
// Usage: node tests/avatar/hand-skin.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'skin-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeletonAvatar} from '${root}/skeleton-test/attach.js';export {skinnedPoint} from '${root}/avatar-lab/src/hand-skin.js';export * from '${root}/motion-core/skeleton/hands.js';export {PALM_BONES,HAND_FRAME} from '${root}/motion-core/skeleton/bones.js';export * as T from 'three';`);
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')],
 plugins:[{name:'h',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const {createSkeletonAvatar,skinnedPoint,handPose,HAND_SHAPES,PALM_BONES,HAND_FRAME,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(2)+' mm';
const A=createSkeletonAvatar(),S=A.skeleton,part=s=>A.attached.find(a=>a.label==='hand.'+s);
// The avatar's own skinned hands (attach.js), and the approved rig they were built from.
const H=A.hands,rig=H.rig;
check('the avatar shows bending hands (the solid hands are kept hidden for the joint checks)',!!H&&H.L.parent===A.root&&!part('L').mesh.visible);
// The palm bones sit exactly where the approved hand's fingers begin, turning in its frame.
{const b=rig.binding,rest=part('L').rest;let e=0;for(const d of b.digits)e=Math.max(e,new T.Vector3(...d.root).applyMatrix4(rest).distanceTo(new T.Vector3(...PALM_BONES[d.id].root)));
 const q=new T.Quaternion();rest.decompose(new T.Vector3(),q,new T.Vector3());const turn=q.angleTo(new T.Quaternion(...HAND_FRAME))*180/Math.PI;
 check('the palm bones start exactly where the approved fingers begin, in the approved hand\'s frame (re-measured)',e<1e-5&&turn<.01,`roots within ${mm(e)}; frame within ${turn.toFixed(4)}°`);}
const geo=part('L').mesh.geometry,P=geo.attributes.position,n=P.count,STRIDE=+(process.env.STRIDE??7);
const compare=(shape)=>{
 rig.setPose(shape);H.update(S.solve({...handPose(S,'L',shape),...handPose(S,'R',shape)}));
 const d=[];const v=new T.Vector3(),w=new T.Vector3();
 for(const s of ['L','R'])for(let i=0;i<n;i+=STRIDE){v.fromBufferAttribute(P,i).applyMatrix4(part(s).rest);skinnedPoint(H[s],i,w);d.push(v.distanceTo(w));}
 d.sort((a,b)=>a-b);return {max:d.at(-1),p99:d[Math.floor(d.length*.99)],mean:d.reduce((a,b)=>a+b,0)/d.length};
};
const rest=compare(HAND_SHAPES.rest);
check('at rest the skinned hands are exactly the approved hands (both, mirrored correctly)',rest.max<1e-6,`largest difference ${rest.max.toExponential(1)} m`);
const rows=[];for(const [name,shape] of Object.entries(HAND_SHAPES)){if(name==='rest')continue;const c=compare(shape);rows.push(`${name}: max ${mm(c.max)}, 99% within ${mm(c.p99)}, average ${mm(c.mean)}`);R.push({check:`shape "${name}" matches the approved hand (within 5 mm anywhere, 1.5 mm on average)`,result:c.max<.005&&c.mean<.0015?'PASS':'FAIL',detail:`max ${mm(c.max)}; 99% of points within ${mm(c.p99)}; average ${mm(c.mean)}`});}
rig.setPose(HAND_SHAPES.rest);
// Palm and wrist: the points no finger owns follow the hand bone exactly, in any pose.
const curled=S.solve({'hand.L':{x:30,y:0,z:20},...handPose(S,'L',HAND_SHAPES.curl)});H.update(curled);
const h=curled.get('hand.L'),H0=new T.Vector3(...S.bones[S.index.get('hand.L')].head),W=H.L.geometry.attributes.skinWeight,I=H.L.geometry.attributes.skinIndex,HP=H.L.geometry.attributes.position;
let palmErr=0,palmCount=0;const q=new T.Vector3(),r=new T.Vector3();
for(let i=0;i<n;i+=3){if(I.getComponent(i,0)!==0||W.getComponent(i,0)<1-1e-6)continue;palmCount++;q.fromBufferAttribute(HP,i).sub(H0).applyQuaternion(h.rotation).add(h.head);palmErr=Math.max(palmErr,q.distanceTo(skinnedPoint(H.L,i,r)));}
check('the palm and wrist ball move as one solid piece with the hand bone (so the wrist stays seated)',palmErr<1e-6&&palmCount>1000,`${palmCount.toLocaleString()} palm points, largest difference ${palmErr.toExponential(1)} m`);
const t0=performance.now();for(let k=0;k<500;k++)H.update(curled);const us=(performance.now()-t0)/500*1000;
check('fast: moving both hands costs almost nothing on the main processor (the graphics card bends them)',us<200,`${us.toFixed(0)} µs a frame for both hands (the approved rig: about 40,000 µs a hand)`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: the skinned hands match the approved hands, keep the palm solid, and are fast.');process.exit(fail?1:0);
