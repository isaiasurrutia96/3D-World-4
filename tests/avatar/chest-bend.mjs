// Chest bending checks: the chest surface bends softly for a slight twist
// and a small forward bend, stays one smooth piece, never folds or pinches,
// keeps its size, keeps the waist and the shoulders firm, and is back to the
// approved chest exactly at rest. Usage: node tests/avatar/chest-bend.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'chest-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeletonAvatar} from '${root}/skeleton-test/attach.js';export {CHEST_BEND} from '${root}/avatar-lab/src/chest-bend.js';export * as T from 'three';`);
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')],
 plugins:[{name:'h',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const {createSkeletonAvatar,CHEST_BEND,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);

const R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(2)+' mm',deg=v=>(v*180/Math.PI).toFixed(1)+'°';
const A=createSkeletonAvatar(),S=A.skeleton,chest=A.attached.find(a=>a.label==='chest'),g=chest.mesh.geometry,P=g.attributes.position,N=g.attributes.normal,n=P.count;
const I=g.index.array,tris=I.length/3,bend=A.chestBend,orig=bend.original,origN=N.array.slice();
const W=i=>bend.weights(i),isLow=i=>W(i)[0]===0&&W(i)[1]===0,isFirm=i=>W(i)[0]===1&&W(i)[1]===1,inBend=i=>!isLow(i)&&!isFirm(i);
const restPos=Float32Array.from(orig);
const world=(arr,i,M)=>new T.Vector3(arr[3*i],arr[3*i+1],arr[3*i+2]).applyMatrix4(M);

// Poses: every mix of forward bend 0..15° and twist -15..15°, with and without the waist turned.
const poses=[];for(const x of [0,5,10,15])for(const y of [-15,-7.5,0,7.5,15])for(const w of [0,35])if(x||y)poses.push({chest:{x,y,z:0},spine:{x:0,y:w,z:0}});

// Rest-shape measures.
const triArea=(a,t)=>{const i0=3*I[3*t],i1=3*I[3*t+1],i2=3*I[3*t+2],u=[a[i1]-a[i0],a[i1+1]-a[i0+1],a[i1+2]-a[i0+2]],v=[a[i2]-a[i0],a[i2+1]-a[i0+1],a[i2+2]-a[i0+2]];return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
const restFace=Array.from({length:tris},(_,t)=>triArea(restPos,t)),len=c=>Math.hypot(...c);
const volume=a=>{let v=0;for(let t=0;t<tris;t++){const i0=3*I[3*t],i1=3*I[3*t+1],i2=3*I[3*t+2];v+=(a[i0]*(a[i1+1]*a[i2+2]-a[i1+2]*a[i2+1])-a[i0+1]*(a[i1]*a[i2+2]-a[i1+2]*a[i2])+a[i0+2]*(a[i1]*a[i2+1]-a[i1+1]*a[i2]))/6;}return v;};
const vol0=volume(restPos);
// Edges between bending triangles, to measure creases.
const bendTri=[];for(let t=0;t<tris;t++){if([0,1,2].some(k=>inBend(I[3*t+k]))&&len(restFace[t])>1e-12)bendTri.push(t);}
const edge=new Map(),pairs=[];for(const t of bendTri)for(let k=0;k<3;k++){const a=I[3*t+k],b=I[3*t+(k+1)%3],key=a<b?a+','+b:b+','+a;if(edge.has(key))pairs.push([edge.get(key),t]);else edge.set(key,t);}
const angle=(a,b)=>{const d=(a[0]*b[0]+a[1]*b[1]+a[2]*b[2])/(len(a)*len(b));return Math.acos(Math.max(-1,Math.min(1,d)));};
const restCrease=pairs.map(([a,b])=>angle(restFace[a],restFace[b]));

let minArea=1e9,maxArea=0,flips=0,creaseUp=0,volErr=0,waistMove=0,firmMove=0,snug=0,neckMove=0;
const shoulders=['upperArm.L','upperArm.R'].map(b=>new T.Vector3(...S.bones[S.index.get(b)].head));
// Where the shoulder balls sit inside the chest (from 1.23 m up), and the chest around the neck.
const neck=A.attached.find(a=>a.label==='neck'),NP=neck.mesh.geometry.attributes.position,neckPts=[];for(let i=0;i<NP.count;i+=4)neckPts.push(new T.Vector3().fromBufferAttribute(NP,i).applyMatrix4(neck.rest));
const firmPts=[],ringPts=[],lowPts=[],collarPts=[];
for(let i=0;i<n;i++){const p=world(restPos,i,chest.rest);if(isFirm(i))firmPts.push(i);if(p.y<CHEST_BEND.from)lowPts.push(i);
 const s=shoulders.find(s=>p.distanceTo(s)<.107);if(s)ringPts.push([i,s]);
 if(p.y>1.40&&Math.hypot(p.x,p.z)<.16)collarPts.push(i);}
const visibleTri=[];for(let t=0;t<tris;t++)if(len(restFace[t])>1e-12&&[0,1,2].some(k=>world(restPos,I[3*t+k],chest.rest).y>=CHEST_BEND.from))visibleTri.push(t);
for(const pose of poses){
 A.apply(pose);const a=P.array;
 // Above the rim (the rim and waist ball are perfect circles round the waist's centre line, so twisting only slides them round themselves; check 1).
 for(const t of visibleTri){const r=len(restFace[t]),f=triArea(a,t),ratio=len(f)/r;minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);}
 // Folding: neighbouring bits of a bending surface must keep facing the same way (no surface turning inside out).
 pairs.forEach(([p,q],k)=>{if(restCrease[k]<Math.PI/4&&angle(triArea(a,p),triArea(a,q))>Math.PI/2)flips++;});
 pairs.forEach(([p,q],k)=>{creaseUp=Math.max(creaseUp,angle(triArea(a,p),triArea(a,q))-restCrease[k]);});
 volErr=Math.max(volErr,Math.abs(volume(a)/vol0-1));
 // Waist zone follows the waist exactly; the firm zone follows the chest bone exactly.
 // Below the bend: each point may only slide round its own circle about the waist's centre line (same height, same distance).
 for(const i of lowPts){const p=world(a,i,chest.rest),o=world(orig,i,chest.rest);waistMove=Math.max(waistMove,Math.abs(p.y-o.y)+Math.abs(Math.hypot(p.x,p.z)-Math.hypot(o.x,o.z)));}
 for(const i of firmPts)firmMove=Math.max(firmMove,world(a,i,chest.mesh.matrix).distanceTo(world(orig,i,chest.firmMatrix)));
 // Shoulders: the chest stays exactly as far from each shoulder ball's centre as at rest (snug, no gap, no poking).
 const solved=A.solved;
 for(const [i,s] of ringPts){const c=solved.get(s.x>0?'upperArm.L':'upperArm.R').head;snug=Math.max(snug,Math.abs(world(a,i,chest.mesh.matrix).distanceTo(c)-world(restPos,i,chest.rest).distanceTo(s)));}
 for(const i of collarPts)neckMove=Math.max(neckMove,world(a,i,chest.mesh.matrix).distanceTo(world(orig,i,chest.firmMatrix)));
}
A.apply(S.restPose());
let restErr=0,restNErr=0;for(let i=0;i<3*n;i++){restErr=Math.max(restErr,Math.abs(P.array[i]-orig[i]));restNErr=Math.max(restNErr,Math.abs(N.array[i]-origN[i]));}

check('at rest the chest is exactly the approved shape (also after bending and coming back)',restErr===0&&restNErr===0,`${n.toLocaleString()} points and their shading identical`);
check('below the bend (rim and waist ball) every point stays on its own circle round the waist, so the seam and the waist joint never change',waistMove<1e-6,`${lowPts.length.toLocaleString()} points, largest change in height or distance ${mm(waistMove)} over ${poses.length} poses`);
check('the top of the chest moves as one firm piece with the chest bone, and the neck stays seated in it',firmMove<1e-6&&neckMove<.0005,`${firmPts.length.toLocaleString()} firm points, largest difference ${mm(firmMove)}; around the neck (${collarPts.length} points) ${mm(neckMove)}`);
check('the chest stays snug around both shoulder balls: no gap opens and the ball never pokes out',snug<.001,`${ringPts.length} socket points; distance to the ball centre changes by at most ${mm(snug)}`);
check('the surface never folds or turns inside out',flips===0,`${pairs.length.toLocaleString()} neighbouring pairs in the bend zone × ${poses.length} poses`);
check('the visible chest never pinches or over-stretches (every bit of surface stays between 60% and 160% of its size)',minArea>.6&&maxArea<1.6,`smallest ${(minArea*100).toFixed(0)}%, largest ${(maxArea*100).toFixed(0)}% (the full forward bend squeezes the belly a little, like a real body)`);
check('it stays one smooth piece: no new creases appear (no fold sharper than 8° between neighbouring bits)',creaseUp<8*Math.PI/180,`sharpest new angle between neighbouring bits: ${deg(creaseUp)}`);
check('the chest keeps its size while bending and twisting',volErr<.02,`largest change ${(volErr*100).toFixed(2)}% of its volume`);
// Speed: the bend itself, every frame while moving.
const q=new T.Quaternion();let t0=performance.now();for(let k=0;k<400;k++){q.setFromEuler(new T.Euler((k%15+1)*Math.PI/180,((k%31)-15)*Math.PI/180,0));bend.apply(q);}const ms=(performance.now()-t0)/400;
bend.apply(new T.Quaternion());
check('fast enough for every frame (well under 2 ms of a 16 ms frame); holding still costs nothing',ms<2,`${ms.toFixed(2)} ms per bend; ${bend.stats.moving.toLocaleString()} points move, ${bend.stats.soft.toLocaleString()} reshade`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: the chest bends softly, stays smooth and firm where it must, and returns exactly to the approved shape.');process.exit(fail?1:0);
