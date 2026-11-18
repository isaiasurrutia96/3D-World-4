// Skeleton layer 1 checks. Measures the live Checkpoint 2 avatar and proves
// the skeleton matches it, then checks structure, limits, lengths, mirroring
// and speed. Usage: node motion-core/tests/skeleton.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=mkdtempSync(join(tmpdir(),'skeleton-')),entry=join(dir,'entry.js');
writeFileSync(entry,`
import * as T from 'three';
import {createAssembledAvatar} from '${root}/avatar-lab/src/avatar.js';
import {createHandRig,FINGERS} from '${root}/hand-lab/src/hand-rig.js';
import {lengthenDigits} from '${root}/avatar/src/hand-study/lengthen-digits.js';
import {easeDigitSweep} from '${root}/avatar/src/hand-study/ease-digit-sweep.js';
import {createSkeleton} from '${root}/motion-core/skeleton/skeleton.js';
export {createSkeleton,T};
// Measure the approved model the same way bones.js was written.
export function measure(){
 const a=createAssembledAvatar(),r=a.rig;r.root.updateMatrixWorld(true);
 const flat=createAssembledAvatar({handTilt:0});flat.rig.root.updateMatrixWorld(true);
 const W=o=>o.getWorldPosition(new T.Vector3()).toArray(),m={};
 const neck=r.torso.children.find(o=>o.name==='original-neck');neck.geometry.computeBoundingBox();
 m['neck']=neck.localToWorld(new T.Vector3(0,neck.geometry.boundingBox.min.y,0)).toArray();
 m['pelvis']=W(r.body);m['spine']=a.waist.chest.localToWorld(a.waist.pivotLocal.clone()).toArray();m['head']=W(r.head);
 const verts=mesh=>{const p=mesh.geometry.attributes.position,out=[];for(let i=0;i<p.count;i++)out.push(new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld));return out;};
 const end=(mesh,top,band)=>{const v=verts(mesh);let e=top?-1e9:1e9;for(const p of v)e=top?Math.max(e,p.y):Math.min(e,p.y);return v.filter(p=>top?p.y>e-band:p.y<e+band);};
 // Centre of a rounded joint end (least-squares sphere fit).
 const ball=pts=>{const ATA=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],N=[0,0,0,0];for(const p of pts){const a=[2*p.x,2*p.y,2*p.z,1],b=p.lengthSq();for(let i=0;i<4;i++){N[i]+=a[i]*b;for(let j=0;j<4;j++)ATA[i][j]+=a[i]*a[j];}}
  const M=new T.Matrix4().set(...ATA.flat()).invert(),e=M.elements,sol=[0,1,2,3].map(i=>e[i]*N[0]+e[4+i]*N[1]+e[8+i]*N[2]+e[12+i]*N[3]);return [sol[0],sol[1],sol[2]];};
 for(const [s,side] of [['L',1],['R',-1]]){
  const k=side===1?'Right':'Left';
  const part0=a.lowerArmParts.find(p=>p.side===side),upper=r['shoulder'+k].children.find(o=>o.isMesh),thighMesh=r['hip'+k].children.find(o=>o.isMesh),calf=a.lowerLegs.find(l=>l.side===side).calf;
  m['upperArm.'+s]=ball(end(upper,true,.06));m['armBottom.'+s]=ball(end(upper,false,.06));m['lowerArm.'+s]=ball(end(part0.forearm,true,.05));
  { // Wrist ball: pick the hand's top surface points on the untilted hand, fit them on the live (tilted) hand.
   const flatHand=flat.lowerArmParts.find(p=>p.side===side).hand,fv=verts(flatHand);let e=-1e9;for(const p of fv)e=Math.max(e,p.y);
   const lv=verts(part0.hand);m['hand.'+s]=ball(fv.map((p,i)=>p.y>e-.05?lv[i]:null).filter(Boolean));}m['thigh.'+s]=ball(end(thighMesh,true,.06));m['shin.'+s]=ball(end(calf,true,.05));
  m['restShoulder.'+s]=[r['shoulder'+k].rotation.x,r['shoulder'+k].rotation.y,r['shoulder'+k].rotation.z];
  m['restElbow.'+s]=[r['elbow'+k].rotation.x,r['elbow'+k].rotation.y,r['elbow'+k].rotation.z];
  const leg=a.lowerLegs.find(l=>l.side===side);
  m['foot.'+s]=leg.motion.group.localToWorld(new T.Vector3().fromArray(leg.motion.pivot)).toArray();
  m['toes.'+s]=leg.foot.localToWorld(new T.Vector3(0,.065,(.145+.265)/2)).toArray();
  const part=a.lowerArmParts.find(p=>p.side===side);part.forearm.geometry.computeBoundingBox();
  m['footBox.'+s]=new T.Box3().setFromObject(leg.foot);
  // Finger centre lines exactly as the hand rig builds them.
  const hand=part.hand,hs=hand.geometry.userData.labBind.side,STEPS=512,RANGE=1.6,pos=[];
  for(const d of FINGERS)for(let j=0;j<=STEPS;j++){const t=j/STEPS*RANGE;pos.push((d.root[0]+(d.tip[0]-d.root[0])*t-244)*.0008*hs,(d.root[1]+(d.tip[1]-d.root[1])*t-285)*.0008,0);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));lengthenDigits(g,hs);easeDigitSweep(g,hs);const jp=g.attributes.position;
  FINGERS.forEach((d,i)=>[.16,.485,.83].forEach((t,j)=>{const at=i*(STEPS+1)+Math.round(t/RANGE*STEPS);m['straight:'+d.id+(j+1)+'.'+s]=hand.localToWorld(new T.Vector3(jp.getX(at),jp.getY(at),jp.getZ(at))).toArray();}));
 }
  // Fingertip movement of the approved hand when the fingers curl fully.
  {const hand=a.lowerArmParts.find(p=>p.side===1).hand;
   const rig=createHandRig(hand),tips=rig.fingerTipVertices,P=hand.geometry.attributes.position;
   const avg=list=>{const v=new T.Vector3();for(const i of list)v.add(hand.localToWorld(new T.Vector3(P.getX(i),P.getY(i),P.getZ(i))));return v.multiplyScalar(1/list.length);};
   m.tipRest=tips.map(l=>avg(l).toArray());rig.setPose({index:1,middle:1,ring:1,little:1,thumb:.25,opposition:0,together:0});
   m.tipCurl=tips.map(l=>avg(l).toArray());
  }
 return m;
}`);
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'out.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')],
 plugins:[{name:'hand-bind',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const {createSkeleton,measure,T}=await import(pathToFileURL(join(dir,'out.mjs')).href);

const S=createSkeleton(),M=measure(),R=[];
const check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail});
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const mm=v=>(v*1000).toFixed(2)+' mm';
let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
const randomPose=(wild=1)=>{const p={};for(const b of S.bones){if(!b.parent)continue;const L=b.limits;p[b.name]=Object.fromEntries(['x','y','z'].map(k=>{const [lo,hi]=L[k],span=hi-lo;return [k,lo-span*(wild-1)/2+rand()*span*wild];}));}return p;};

// ---- 1. Structure ----
const names=new Set(S.bones.map(b=>b.name));
check('48 bones: body, both arms and legs, 15 finger bones per hand',S.bones.length===48&&names.size===48,`${S.bones.length} bones`);
check('one root (pelvis); every other bone has a real parent listed before it',S.bones.filter(b=>b.parentIndex<0).length===1&&S.bones.every((b,i)=>b.parentIndex<i));
check('names match his own left and right (he faces +Z, so his left is +X)',S.bones.filter(b=>b.side==='L').every(b=>b.head[0]>0)&&S.bones.filter(b=>b.side==='R').every(b=>b.head[0]<0)&&S.bones.every(b=>b.side==='C'||b.name.endsWith('.'+b.side)));

// ---- 2. Matches the approved model ----
let worst=0,worstName='';
for(const b of S.bones){const ref=M[b.name];if(!ref)continue;const e=dist(b.head,ref);if(e>worst){worst=e;worstName=b.name;}}
const measured=S.bones.filter(b=>M[b.name]).length;
check('every joint sits at the centre of its ball on the approved Checkpoint 2 model',worst<.0002,`${measured} joints measured, largest difference ${mm(worst)} (${worstName})`);
const restOk=['L','R'].every(s=>{const sh=S.bones[S.index.get('upperArm.'+s)],el=S.bones[S.index.get('lowerArm.'+s)],rs=M['restShoulder.'+s],re=M['restElbow.'+s],rad=Math.PI/180;
 return Math.abs(sh.rest.x*rad-rs[0])<1e-9&&Math.abs(sh.rest.y*rad-rs[1])<1e-9&&Math.abs(sh.rest.z*rad-rs[2])<1e-9&&Math.abs(el.rest.x*rad-re[0])<1e-9;});
check('rest angles are the ones the approved model is built with (shoulders, elbows)',restOk);
// Angle 0 means hanging straight: a straight-down arm turned by the rest angles lines up with the real upper arm.
const arm=S.bones[S.index.get('upperArm.L')],rad=Math.PI/180;
const down=new T.Vector3(0,-1,0).applyEuler(new T.Euler(arm.rest.x*rad,0,arm.rest.z*rad,'XYZ'));
const realAxis=new T.Vector3(...M['armBottom.L']).sub(new T.Vector3(...M['upperArm.L'])).normalize();
const off=down.angleTo(realAxis)/rad;
check('angle 0 means the limb hanging straight down',off<.5,`rest angles line the arm up with the real upper arm to within ${off.toFixed(2)}°`);
const rest=S.solve(S.restPose());let restErr=0;for(const b of S.bones)restErr=Math.max(restErr,dist(rest.get(b.name).head.toArray(),b.head),dist(rest.get(b.name).tail.toArray(),b.tail));
check('the rest pose reproduces the model exactly',restErr<1e-9,`largest difference ${restErr.toExponential(1)} m`);
const fb=M['footBox.L'],inside=Object.values(S.footContacts.L).every(([x,y,z])=>x>=fb.min.x&&x<=fb.max.x&&z>=fb.min.z&&z<=fb.max.z&&y===0);
check('foot contact points are on the ground, inside the real foot',inside);

// ---- 3. Moving ----
let lenErr=0;for(let n=0;n<1500;n++){const s=S.solve(randomPose());for(const b of S.bones)lenErr=Math.max(lenErr,Math.abs(s.get(b.name).head.distanceTo(s.get(b.name).tail)-b.length));}
check('bones never stretch or shrink, in 1,500 random poses',lenErr<1e-9,`largest change ${lenErr.toExponential(1)} m`);
let outside=0;for(let n=0;n<1500;n++){const c=S.clampPose(randomPose(3));for(const b of S.bones){if(!b.limits)continue;for(const k of ['x','y','z'])if(c[b.name][k]<b.limits[k][0]-1e-9||c[b.name][k]>b.limits[k][1]+1e-9)outside++;}}
check('no joint can go past its limits, even when asked to',outside===0,'1,500 wild poses, 3× past every limit');
const bentKnee=S.solve({'shin.L':{x:90,y:0,z:0},'shin.R':{x:-90,y:0,z:0}}),kr=bentKnee.get('shin.L'),kl=bentKnee.get('shin.R');
check('knees bend only backwards (asked to bend forward, they stay straight)',kr.tail.z<kr.head.z-.3&&Math.abs(kl.tail.z-kl.head.z)<1e-9,`bent knee: ankle ${mm(kr.head.z-kr.tail.z)} behind; wrong-way knee: ${mm(Math.abs(kl.tail.z-kl.head.z))}`);
const bentElbow=S.solve({'lowerArm.L':{x:-90,y:0,z:0},'lowerArm.R':{x:60,y:0,z:0}}),er=bentElbow.get('lowerArm.L'),el=bentElbow.get('lowerArm.R'),elRest=rest.get('lowerArm.R');
const straightL=S.solve({'lowerArm.R':{x:0,y:0,z:0}}).get('lowerArm.R');
check('elbows bend only forwards (asked to bend backwards, they stay straight)',er.tail.z>er.head.z+.25&&el.tail.distanceTo(straightL.tail)<1e-9,`bent elbow: wrist ${mm(er.tail.z-er.head.z)} in front`);
const raised=S.solve({'upperArm.L':{x:0,y:0,z:90},'lowerArm.L':{x:0,y:0,z:0}}),wr=raised.get('lowerArm.L').tail,sh=raised.get('upperArm.L').head;
check('raising the arm 90° out to the side puts the wrist out at shoulder height',Math.abs(wr.y-sh.y)<.03&&wr.x>sh.x+.55,`wrist ${mm(wr.y-sh.y)} from shoulder height, ${mm(wr.x-sh.x)} out`);
// Moving a parent moves its children only.
const arm2=S.solve({'upperArm.L':{x:-60,y:0,z:30}}),moved=b=>arm2.get(b.name).head.distanceTo(rest.get(b.name).head)>1e-9;
const rightArm=S.bones.filter(b=>b.side==='L'&&!/thigh|shin|foot|toes/.test(b.name)&&b.name!=='upperArm.L');
check('turning the shoulder moves the whole arm, hand and fingers, nothing else',rightArm.every(moved)&&S.bones.filter(b=>b.side!=='L'||/thigh|shin|foot|toes/.test(b.name)).every(b=>!moved(b)),`${rightArm.length} bones moved`);
const bend=S.solve({spine:{x:0,y:30,z:0}}),legStill=S.bones.filter(b=>/thigh|shin|foot|toes/.test(b.name)).every(b=>bend.get(b.name).head.distanceTo(rest.get(b.name).head)<1e-9);
check('turning the waist turns the chest, arms and head but not the legs',legStill&&bend.get('upperArm.L').head.distanceTo(rest.get('upperArm.L').head)>.1,`shoulder moved ${mm(bend.get('upperArm.L').head.distanceTo(rest.get('upperArm.L').head))}`);
let mirErr=0;for(let n=0;n<500;n++){const p=randomPose(),a=S.solve(p),b=S.solve(S.mirrorPose(p));for(const bone of S.bones){const other=bone.name.endsWith('.L')?bone.name.slice(0,-2)+'.R':bone.name.endsWith('.R')?bone.name.slice(0,-2)+'.L':bone.name;
 const h=a.get(bone.name).head,m=b.get(other).head;mirErr=Math.max(mirErr,Math.hypot(h.x+m.x,h.y-m.y,h.z-m.z));}}
check('left and right are exact mirror images in every pose',mirErr<1e-9,`500 random poses, largest difference ${mirErr.toExponential(1)} m`);
// Fingers: straight at angle 0, and curl to the same fingertip spots as the approved hand.
const fingerNames=['thumb','index','middle','ring','little'];
const straight=S.solve(Object.fromEntries(fingerNames.flatMap(f=>[1,2,3].flatMap(j=>['L','R'].map(s=>[`${f}${j}.${s}`,{x:0,y:0,z:0}])))));
let sErr=0;for(const f of fingerNames)for(const j of [1,2,3])for(const s of ['L','R'])sErr=Math.max(sErr,dist(straight.get(`${f}${j}.${s}`).head.toArray(),M[`straight:${f}${j}.${s}`]));
check('at angle 0 every finger lies straight along the approved hand\'s finger line',sErr<.0002,`largest difference ${mm(sErr)}`);
const four=['index','middle','ring','little'];
const restTip=four.map((f,i)=>dist(rest.get(`${f}3.L`).tail.toArray(),M.tipRest[i]));
const curl=S.solve(Object.fromEntries(four.flatMap(f=>[1,2,3].map(j=>[`${f}${j}.L`,{x:S.bones[S.index.get(`${f}${j}.L`)].limits.x[1],y:0,z:0}]))));
const curlTip=four.map((f,i)=>dist(curl.get(`${f}3.L`).tail.toArray(),M.tipCurl[i]));
check('at rest, fingertips are within 4 mm of the approved hand',Math.max(...restTip)<.004,`${restTip.map(mm).join(', ')}`);
check('fully curled, fingertips land within 6 mm of where the approved hand puts them',Math.max(...curlTip)<.006,`${curlTip.map(mm).join(', ')}`);
const t0=performance.now();for(let n=0;n<2000;n++)S.solve(randomPose());const ms=(performance.now()-t0)/2000;
check('fast enough for every frame',ms<.2,`${(ms*1000).toFixed(0)} µs to solve all 48 bones`);

console.table(R);const fail=R.some(r=>r.result==='FAIL');
console.log(fail?'FAIL':'PASS: the skeleton matches the approved avatar and behaves as planned.');process.exit(fail?1:0);
