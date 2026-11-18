// Section 5 checks: hand shapes and gripping. Hand shapes turn into finger
// angles and back exactly; gripping curls each finger until it touches the
// shape and stops (never inside it); fingers press into each other no more
// than the approved rest hand already does; it is fast.
// Usage: node motion-core/tests/hands.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'hands-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeleton} from '${root}/motion-core/skeleton/skeleton.js';export * from '${root}/motion-core/skeleton/hands.js';export {reach} from '${root}/motion-core/skeleton/reach.js';export {FINGER_RADII} from '${root}/motion-core/skeleton/bones.js';export * as T from 'three';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {createSkeleton,handPose,handShape,grip,HAND_SHAPES,DIGITS,reach,FINGER_RADII,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const S=createSkeleton(),R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(2)+' mm';

// Hand shapes ↔ angles.
let rt=0;for(const s of Object.values(HAND_SHAPES))for(const sd of ['L','R']){const back=handShape(S,handPose(S,sd,s),sd);for(const k of Object.keys(s))rt=Math.max(rt,Math.abs(back[k]-s[k]));}
const restOk=Object.entries(handPose(S,'L',HAND_SHAPES.rest)).every(([n,a])=>{const b=S.bones[S.index.get(n)].rest;return ['x','y','z'].every(k=>Math.abs(a[k]-b[k])<1e-9);});
check('hand shapes turn into finger angles and back exactly; the rest shape is the skeleton\'s rest',rt<1e-9&&restOk,`largest round-trip difference ${rt.toExponential(1)}`);
const m=S.mirrorPose(handPose(S,'L',HAND_SHAPES.curl)),r=handPose(S,'R',HAND_SHAPES.curl);let me=0;for(const n of Object.keys(r))for(const k of ['x','y','z'])me=Math.max(me,Math.abs(m[n][k]-r[n][k]));
check('his right hand is the exact mirror of his left',me<1e-9);

// Finger capsules (world) for a pose.
const capsules=(pose,side)=>{const q=S.solve(pose),out={};for(const d of DIGITS)out[d]=[1,2,3].map(j=>{const b=q.get(`${d}${j}.${side}`);return {a:b.head,b:b.tail,r:FINGER_RADII[d][j-1]};});return out;};
const segDist=(p1,q1,p2,q2)=>{let best=Infinity;for(let i=0;i<=20;i++){const a=p1.clone().lerp(q1,i/20);for(let j=0;j<=20;j++)best=Math.min(best,a.distanceTo(p2.clone().lerp(q2,j/20)));}return best;};
const overlap=(caps)=>{let worst=0;const order=['thumb','index','middle','ring','little'];for(let i=1;i<order.length-1;i++){const A=caps[order[i]],B=caps[order[i+1]];for(const x of A)for(const y of B)worst=Math.max(worst,x.r+y.r-segDist(x.a,x.b,y.a,y.b));}return worst;};

// Gripping a rod held across the palm (a bar, a steering-wheel rim): the fingers curl round it.
const placed=reach(S,{},{'hand.L':{palm:[.3,1.0,.4],face:[-1,0,0],fingers:[0,-1,0]}},{follow:true}).pose,pq=S.solve(placed),hb=pq.get('hand.L'),H0=new T.Vector3(...S.bones[S.index.get('hand.L')].head);
const palmP=new T.Vector3(...S.palms.L.point).sub(H0).applyQuaternion(hb.rotation).add(hb.head),nrm=new T.Vector3(...S.palms.L.normal).applyQuaternion(hb.rotation);
const fdir=new T.Vector3(...S.bones[S.index.get('hand.L')].tail).sub(H0).applyQuaternion(hb.rotation);fdir.sub(nrm.clone().multiplyScalar(fdir.dot(nrm))).normalize();
const across=nrm.clone().cross(fdir).normalize(),RAD_=.025,mid=palmP.clone().addScaledVector(nrm,RAD_+.002).addScaledVector(fdir,.03);
const rod={capsule:[mid.clone().addScaledVector(across,-.12).toArray(),mid.clone().addScaledVector(across,.12).toArray()],radius:RAD_};
const hold={...placed,...grip(S,placed,'L',[rod],{opposition:.4})};
const caps=capsules(hold,'L');let deepest=0,touch=0,closed=0,curls={};const shape=handShape(S,hold,'L');
const rDist=(c,s)=>segDist(c.a,c.b,new T.Vector3(...s.capsule[0]),new T.Vector3(...s.capsule[1]))-c.r-s.radius;
for(const d of DIGITS){const g=Math.min(...caps[d].map(c=>rDist(c,rod)));deepest=Math.min(deepest,g);curls[d]=shape[d].toFixed(2);if(Math.abs(g)<.002)touch++;else if(shape[d]>.999)closed++;}
check('gripping a rod across the palm: every finger either touches it (within 2 mm) or closes fully; none goes into it',deepest>-.002&&touch+closed===5&&touch>=3,`${touch} fingers touch, ${closed} close fully; deepest ${mm(-deepest)} in; curls ${JSON.stringify(curls)}`);
const restOverlap=overlap(capsules(handPose(S,'L',HAND_SHAPES.rest),'L')),gripOverlap=overlap(caps);
check('fingers press into each other no more than the approved rest hand already does',gripOverlap<=restOverlap+.001,`neighbouring fingers overlap by at most ${mm(gripOverlap)} (the approved rest hand: ${mm(restOverlap)}; finger thickness is measured, so some overlap is the shape itself)`);

// A finger already touching at straight stays straight; nothing to touch closes fully.
const far=grip(S,{},'L',[{sphere:[5,5,5],radius:.01}]);
check('with nothing to touch the fingers close fully',DIGITS.every(d=>Math.abs(far[`${d}1.L`].x-S.bones[S.index.get(`${d}1.L`)].limits.x[1])<1e-6));

const t0=performance.now();for(let k=0;k<200;k++)grip(S,placed,'L',[rod],{opposition:.4});const us=(performance.now()-t0)/200*1000;
check('fast enough for every frame (under 0.5 ms a hand)',us<500,`${us.toFixed(0)} µs for one hand's grip`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: hand shapes are exact and fingers grip without going into what they hold.');process.exit(fail?1:0);
