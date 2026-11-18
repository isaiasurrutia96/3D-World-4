// Skeleton layer 1 checks. Measures the live assembled avatar and proves
// the skeleton matches it, then checks structure, limits, lengths, mirroring
// and speed. Usage: node motion-core/tests/skeleton.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {ANKLE_LIMITS,ANKLE_MAX_COMBINED} from '../../avatar/src/joints/ankle-contract.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=mkdtempSync(join(tmpdir(),'skeleton-')),entry=join(dir,'entry.js');
writeFileSync(entry,`
import * as T from 'three';
import {createAssembledAvatar} from '${root}/avatar-lab/src/avatar.js';
import {createHandRig,FINGERS} from '${root}/hand-lab/src/hand-rig.js';
import {lengthenDigits} from '${root}/avatar/src/hand-study/lengthen-digits.js';
import {easeDigitSweep} from '${root}/avatar/src/hand-study/ease-digit-sweep.js';
import {createSkeleton} from '${root}/motion-core/skeleton/skeleton.js';
import {shoulderFollow} from '${root}/motion-core/skeleton/shoulder.js';
import {POSES} from '${root}/motion-core/skeleton/poses.js';
import {measurePalm} from '${root}/avatar-lab/src/palm.js';
export {createSkeleton,shoulderFollow,POSES,T};
// Measure the live model the same way bones.js was written.
export function measure(){
 const a=createAssembledAvatar(),r=a.rig;r.root.updateMatrixWorld(true);
 const flat=createAssembledAvatar({handTilt:0});flat.rig.root.updateMatrixWorld(true);
 const W=o=>o.getWorldPosition(new T.Vector3()).toArray(),m={};
 const neck=r.torso.children.find(o=>o.name==='original-neck');neck.geometry.computeBoundingBox();
 m['neck']=neck.localToWorld(new T.Vector3(0,neck.geometry.boundingBox.min.y,0)).toArray();
 m['spine']=a.waist.chest.localToWorld(a.waist.pivotLocal.clone()).toArray();m['head']=W(r.head);
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
  // Palm centre (measured before anything else touches the hand).
  {const S0=createSkeleton(),bb=n=>S0.bones[S0.index.get(n)];m['palm.'+s]=measurePalm(part0.hand,new T.Vector3(...bb('hand.'+s).head),['index','middle','ring','little'].map(f=>{const x=bb(f+'1.'+s);return {head:x.head,tail:x.tail,bendAxis:x.frame.bendAxis};}));}
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
const {createSkeleton,shoulderFollow,POSES,measure,T}=await import(pathToFileURL(join(dir,'out.mjs')).href);

const S=createSkeleton(),M=measure(),R=[];
const check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail});
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const mm=v=>(v*1000).toFixed(2)+' mm';
let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
const randomPose=(wild=1)=>{const p={};for(const b of S.bones){if(!b.parent)continue;const L=b.limits;p[b.name]=Object.fromEntries(['x','y','z'].map(k=>{const [lo,hi]=L[k],span=hi-lo;return [k,lo-span*(wild-1)/2+rand()*span*wild];}));}return p;};

// ---- 1. Structure ----
const names=new Set(S.bones.map(b=>b.name));
check('63 bones: body (with an upper chest), collarbones, hip bones, both arms and legs, per hand 5 palm bones and 15 finger bones',S.bones.length===63&&names.size===63,`${S.bones.length} bones`);
check('one root (pelvis); every other bone has a real parent listed before it',S.bones.filter(b=>b.parentIndex<0).length===1&&S.bones.every((b,i)=>b.parentIndex<i));
check('names match his own left and right (he faces +Z, so his left is +X)',S.bones.filter(b=>b.side==='L').every(b=>b.head[0]>=0&&b.tail[0]>0)&&S.bones.filter(b=>b.side==='R').every(b=>b.head[0]<=0&&b.tail[0]<0)&&S.bones.every(b=>b.side==='C'||b.name.endsWith('.'+b.side)));

// ---- 2. Matches the live model ----
let worst=0,worstName='';
for(const b of S.bones){const ref=M[b.name];if(!ref)continue;const e=dist(b.head,ref);if(e>worst){worst=e;worstName=b.name;}}
const measured=S.bones.filter(b=>M[b.name]).length;
check('every joint sits at the centre of its ball on the live assembled avatar',worst<.0002,`${measured} joints measured, largest difference ${mm(worst)} (${worstName})`);
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
const ankle=S.bones[S.index.get('foot.L')],ankleR=S.bones[S.index.get('foot.R')],shin=S.bones[S.index.get('shin.L')];
check('ankle ball uses the exact measured joint centre without changing the knee or sole contacts',dist(ankle.head,M['foot.L'])<1e-9&&dist(ankle.head,shin.tail)<1e-12&&shin.head[1]===.4724,`ankle ${ankle.head.map(v=>v.toFixed(10)).join(', ')} m`);
check('isolated ankle bend and tilt double; combined bend uses the measured shell-safe cap',ANKLE_LIMITS.ankle[0]===-36&&ANKLE_LIMITS.ankle[1]===48&&ANKLE_LIMITS.heel[1]===30&&ANKLE_MAX_COMBINED===60&&ankle.limits.x[0]===-36&&ankle.limits.x[1]===ANKLE_MAX_COMBINED&&ankle.limits.z[0]===-20&&ankle.limits.z[1]===20&&ankle.limits.y.every(v=>v===0)&&ankleR.limits.x[0]===-36&&ankleR.limits.x[1]===ANKLE_MAX_COMBINED&&S.bones[S.index.get('toes.L')].limits.x[0]===-55,'ankle up 36° / point 48°, tilt ±20°; heel still 30°; composed ankle+heel capped at 60° to clear the calf; toes remain 55° combined');
const palmErr=Math.max(...['L','R'].map(sd=>dist(S.palms[sd].point,M['palm.'+sd].point))),palmTurn=Math.max(...['L','R'].map(sd=>new T.Vector3(...S.palms[sd].normal).angleTo(new T.Vector3(...M['palm.'+sd].normal))/Math.PI*180));
check('the palm centre sits on the approved hand\'s palm (re-measured), facing the right way',palmErr<1e-4&&palmTurn<.1,`both palms within ${mm(palmErr)}, facing within ${palmTurn.toFixed(3)}°`);

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
const notArm=/thigh|shin|foot|toes|hip|clavicle/,rightArm=S.bones.filter(b=>b.side==='L'&&!notArm.test(b.name)&&b.name!=='upperArm.L');
check('turning the shoulder moves the whole arm, hand and fingers, nothing else (not the collarbone)',rightArm.every(moved)&&S.bones.filter(b=>b.side!=='L'||notArm.test(b.name)).every(b=>!moved(b)),`${rightArm.length} bones moved`);
const bend=S.solve({spine:{x:0,y:30,z:0}}),legStill=S.bones.filter(b=>/thigh|shin|foot|toes/.test(b.name)).every(b=>bend.get(b.name).head.distanceTo(rest.get(b.name).head)<1e-9);
check('turning the waist turns the chest, arms and head but not the legs',legStill&&bend.get('upperArm.L').head.distanceTo(rest.get('upperArm.L').head)>.1,`shoulder moved ${mm(bend.get('upperArm.L').head.distanceTo(rest.get('upperArm.L').head))}`);
const linked=['L','R'].every(sd=>{const c=S.bones[S.index.get('clavicle.'+sd)],u=S.bones[S.index.get('upperArm.'+sd)],h=S.bones[S.index.get('hip.'+sd)],t=S.bones[S.index.get('thigh.'+sd)];
 return u.parent==='clavicle.'+sd&&t.parent==='hip.'+sd&&dist(c.tail,u.head)<1e-9&&dist(h.tail,t.head)<1e-9&&dist(c.head,S.bones[S.index.get('chest')].tail)<1e-9&&dist(h.head,S.bones[S.index.get('pelvis')].head)<1e-9;});
const hipLocked=S.bones.filter(b=>/^hip\./.test(b.name)).every(b=>['x','y','z'].every(k=>b.limits[k][0]===0&&b.limits[k][1]===0));
check('arms hang from collarbones (neck base to shoulder) and legs from hip bones (pelvis to hip); hip bones are fixed',linked&&hipLocked);
// Collarbones: a small shrug lifts the whole arm about 3 cm; forward brings it forward; never more than the limits.
const shrug=S.solve(POSES.shrug),fwdC=S.solve({'clavicle.L':{x:0,y:-4,z:0}}),over=S.solve({'clavicle.L':{x:20,y:-30,z:40}});
const lift=shrug.get('upperArm.L').head.y-rest.get('upperArm.L').head.y,liftR=shrug.get('upperArm.R').head.y-rest.get('upperArm.R').head.y,ahead=fwdC.get('upperArm.L').head.z-rest.get('upperArm.L').head.z;
const handUp=shrug.get('hand.L').head.y-rest.get('hand.L').head.y,maxLift=over.get('upperArm.L').head.y-rest.get('upperArm.L').head.y;
check('collarbones shrug the shoulders up about 2 cm and bring them forward a little, carrying the whole arm with them, within small limits',lift>.017&&lift<.03&&Math.abs(lift-liftR)<1e-9&&ahead>.018&&handUp>=lift&&maxLift<=lift+1e-9,`shrug: shoulders up ${mm(lift)} (both sides equal), hand follows ${mm(handUp)}; forward: ${mm(ahead)}; asked for far more, still ${mm(maxLift)}`);
// Shoulders follow the arms on their own.
const F=p=>shoulderFollow(S,p),restF=F({}),up=F(POSES['arms-up']),reach=F({'upperArm.L':{x:-90,y:0,z:0}}),both=F({...POSES['arms-up'],...POSES.shrug});
const lim=S.bones[S.index.get('clavicle.L')].limits;
check('shoulders follow the arms: still at rest, lift when the arms go up, come forward when reaching, never past the limits',Math.abs(restF['clavicle.L'].z)<1e-9&&Math.abs(restF['clavicle.L'].y)<1e-9&&up['clavicle.L'].z>2&&Math.abs(up['clavicle.R'].z+up['clavicle.L'].z)<1e-9&&reach['clavicle.L'].y<-3.5&&both['clavicle.L'].z<=lim.z[1]+1e-9,`arms up: shoulders lift ${up['clavicle.L'].z.toFixed(1)}°; reaching ahead: shoulder forward ${(-reach['clavicle.L'].y).toFixed(1)}°; arms up + shrug: ${both['clavicle.L'].z.toFixed(1)}° (limit ${lim.z[1]}°)`);
const pv=S.bones[S.index.get('pelvis')],tl=S.bones[S.index.get('thigh.L')],tr=S.bones[S.index.get('thigh.R')];
check('the pelvis control sits exactly between the two hip balls and reaches up to the waist',dist(pv.head,tl.head.map((v,i)=>(v+tr.head[i])/2))<1e-9&&dist(pv.tail,S.bones[S.index.get('spine')].head)<1e-9,`control at ${pv.head.map(v=>v.toFixed(4)).join(', ')} m`);
// Chest: a small forward bend and twist carry the shoulders, arms and head, never the waist or legs.
const fwd=S.solve({chest:{x:15,y:0,z:0}}),tw=S.solve({chest:{x:0,y:15,z:0}}),sideAsk=S.solve({chest:{x:0,y:0,z:20}});
const still=s=>S.bones.filter(b=>/^(pelvis|spine|hip|thigh|shin|foot|toes)/.test(b.name)).every(b=>s.get(b.name).head.distanceTo(rest.get(b.name).head)<1e-9&&s.get(b.name).tail.distanceTo(rest.get(b.name).tail)<1e-9);
const shT=tw.get('upperArm.L').head.distanceTo(rest.get('upperArm.L').head);
const noSide=S.bones.every(b=>sideAsk.get(b.name).head.distanceTo(rest.get(b.name).head)<1e-9);
const shB=fwd.get('upperArm.L').head.distanceTo(rest.get('upperArm.L').head);
check('the upper chest bends forward (shoulder balls turn in place, head goes forward) and twists a little (shoulders swing round), never moving the waist or legs; no side bend',still(fwd)&&still(tw)&&shB<.002&&shT>.02&&fwd.get('head').head.z>rest.get('head').head.z+.08&&noSide,`15° bend: head ${mm(fwd.get('head').head.z-rest.get('head').head.z)} forward, shoulders move ${mm(shB)}; 15° twist: shoulders swing ${mm(shT)}`);
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
check('fast enough for every frame',ms<.2,`${(ms*1000).toFixed(0)} µs to solve all 63 bones`);

console.table(R);const fail=R.some(r=>r.result==='FAIL');
console.log(fail?'FAIL':'PASS: the skeleton matches the live avatar and behaves as planned.');process.exit(fail?1:0);
