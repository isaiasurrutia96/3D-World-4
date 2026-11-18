// Skeleton section 4 checks: reaching. Hands and feet go exactly where they
// are told, joints stay inside their limits, elbows and knees bend the right
// way, feet stay planted and flat while the body moves, out-of-reach targets
// are handled calmly, and a moving target gives smooth motion.
// Usage: node motion-core/tests/reach.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'reach-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeleton} from '${root}/motion-core/skeleton/skeleton.js';export {reach} from '${root}/motion-core/skeleton/reach.js';export {fullPose} from '${root}/motion-core/skeleton/pose.js';export * as T from 'three';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {createSkeleton,reach,fullPose,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const S=createSkeleton(),R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(2)+' mm';
const AX=['x','y','z'],inLimits=p=>S.bones.filter(b=>b.parent&&p[b.name]).every(b=>AX.every(k=>p[b.name][k]>=b.limits[k][0]-1e-6&&p[b.name][k]<=b.limits[k][1]+1e-6));
let seed=5;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647,lerp=(a,b,t)=>a+(b-a)*t;
const rest=S.solve({}),head=n=>rest.get(n).head.clone();

// 1. Hands reach targets the arm can really get to (made by random allowed arm poses).
let worst=0,ok=0,N=600;const misses=[];
for(let n=0;n<N;n++){const side=n%2?'L':'R',arm={};for(const b of ['upperArm','lowerArm'])arm[`${b}.${side}`]=Object.fromEntries(AX.map(k=>{const L=S.bones[S.index.get(`${b}.${side}`)].limits[k];return [k,lerp(L[0],L[1],rand())];}));
 const s=S.solve(arm),t=s.get('hand.'+side).head,elbow=s.get('lowerArm.'+side).head,sh=s.get('upperArm.'+side).head;
 // Use the same elbow direction as the pose that made the target (any arm pose is a fair test).
 const tHat=t.clone().sub(sh).normalize(),pole=elbow.clone().sub(sh);pole.sub(tHat.clone().multiplyScalar(pole.dot(tHat)));
 // The forearm's own roll is part of the pose (reaching keeps it), so give the same roll.
 const r=reach(S,{['lowerArm.'+side]:{x:0,y:arm['lowerArm.'+side].y,z:0}},{['hand.'+side]:{position:t.toArray(),pole:pole.toArray()}});const e=r.error['hand.'+side];worst=Math.max(worst,e);if(e<5e-4)ok++;else misses.push(e);
 if(!inLimits(r.pose))worst=1;}
check('hands go exactly where they are told, for targets the arm can reach',ok===N,`${ok} of ${N} random targets reached within 0.5 mm${misses.length?'; misses up to '+mm(Math.max(...misses)):''}`);

// 2. Default elbows point back and out; knees point forward.
const g=reach(S,{},{'hand.L':{position:[.25,1.2,.35]},'hand.R':{position:[-.25,1.2,.35]},'foot.L':{sole:[.15,.25,.25]},'foot.R':{sole:[-.15,.15,.2]}}),gs=S.solve(g.pose);
// The elbow / knee sits on the pole side of the shoulder→wrist (hip→ankle) line.
const side=(a,b,c,dir)=>{const ab=c.clone().sub(a).normalize(),off=b.clone().sub(a);off.sub(ab.multiplyScalar(off.dot(ab)));return off.normalize().dot(dir);};
const kneeFwd=['L','R'].every(s=>side(gs.get('thigh.'+s).head,gs.get('shin.'+s).head,gs.get('foot.'+s).head,new T.Vector3(0,0,1))>.8);
const elbowBack=['L','R'].every(s=>side(gs.get('upperArm.'+s).head,gs.get('lowerArm.'+s).head,gs.get('hand.'+s).head,new T.Vector3(s==='L'?.35:-.35,-1,-.35).normalize())>.8);
check('elbows point down, a little back and out; knees point forward (never the wrong way)',kneeFwd&&elbowBack&&Object.values(g.error).every(e=>e<5e-4),`errors ${Object.values(g.error).map(mm).join(', ')}`);

// 3. Feet stay planted and flat while the body squats (hips back, like a real squat: the
//    approved ankle tips the toes up only 18°), sways, leans and turns.
const soleL=[.15,0,.025],soleR=[-.15,0,.025],L1=S.bones[S.index.get('thigh.L')].length,L2=S.bones[S.index.get('shin.L')].length;
// Hips go back just enough to keep each shin tipped no more than 10° (inside the ankle's 18°).
const hipsBack=drop=>{const b=10*Math.PI/180,kz=L2*Math.sin(b),ky=L2*Math.cos(b),h=L1+L2-drop;return Math.min(0,kz-Math.sqrt(Math.max(0,L1*L1-(h-ky)**2)));};
let footErr=0,flatErr=0,limitOk=true,kneesOk=true;
for(let n=0;n<=60;n++){const dn=.32*n/60,turn=8*Math.sin(n/9),lean=2.5*Math.sin(n/7);
 const pose={root:{position:[.02*Math.sin(n/5),-dn,hipsBack(dn)],rotation:{x:0,y:turn,z:lean}}};
 // Planted feet keep facing straight ahead (heading 0) while the body turns above them.
 const r=reach(S,pose,{'foot.L':{sole:soleL,heading:0},'foot.R':{sole:soleR,heading:0}}),s=S.solve(r.pose);
 footErr=Math.max(footErr,r.error['foot.L'],r.error['foot.R']);
 for(const sd of ['L','R']){const up=new T.Vector3(0,1,0).applyQuaternion(s.get('foot.'+sd).rotation);flatErr=Math.max(flatErr,Math.acos(Math.min(1,up.y))/Math.PI*180);if(r.pose['shin.'+sd].x<-1e-9)kneesOk=false;}
 if(!inLimits(r.pose))limitOk=false;}
check('feet stay planted and flat while the body squats 32 cm (hips back), sways, leans and turns (inside the approved ankle: toes up 18°, tilt 10°)',footErr<5e-4&&flatErr<.5&&limitOk&&kneesOk,`feet off by at most ${mm(footErr)}, tilted at most ${flatErr.toFixed(2)}°`);
// 4. Out of reach: the limb points straight at the target and stops at full length (no snapping, no errors).
const far=reach(S,{},{'hand.L':{position:[2,1.3,.5]}}),fs=S.solve(far.pose),sh=fs.get('upperArm.L').head,wr=fs.get('hand.L').head;
const dirErr=wr.clone().sub(sh).normalize().angleTo(new T.Vector3(2,1.3,.5).sub(sh).normalize())/Math.PI*180;
const reachLen=wr.distanceTo(sh),fine=Object.values(far.pose).every(a=>AX.every(k=>Number.isFinite(a[k])));
check('a target out of reach: the arm points straight at it, as long as it can be',fine&&dirErr<1&&inLimits(far.pose),`points ${dirErr.toFixed(2)}° off; arm ${mm(reachLen)} long; still ${mm(far.error['hand.L'])} short, as expected`);

// 5. A moving target gives smooth motion: tiny target steps, tiny joint steps.
let jump=0,prev=null;
for(let n=0;n<=400;n++){const a=n/400*Math.PI*2,t=[.25+.15*Math.cos(a),1.15+.15*Math.sin(a),.3+.08*Math.sin(2*a)];
 const p=reach(S,{},{'hand.L':{position:t}}).pose;if(prev)for(const b of ['upperArm.L','lowerArm.L'])for(const k of AX)jump=Math.max(jump,Math.abs(p[b][k]-prev[b][k]));prev=p;}
check('a hand following a moving target moves smoothly (no sudden flips)',jump<2,`target moves 2.4 mm a step; joints change at most ${jump.toFixed(2)}° a step`);

// 6. Left and right are mirror images.
const mL=reach(S,{},{'hand.L':{position:[.3,1.1,.3]},'foot.L':{sole:[.2,.1,.15]}}).pose,mR=reach(S,{},{'hand.R':{position:[-.3,1.1,.3]},'foot.R':{sole:[-.2,.1,.15]}}).pose;
const mirr=S.mirrorPose(mL);let mErr=0;for(const b of ['upperArm.R','lowerArm.R','hand.R','thigh.R','shin.R','foot.R'])for(const k of AX)mErr=Math.max(mErr,Math.abs(mirr[b][k]-mR[b][k]));
check('reaching with the left gives the exact mirror of the right',mErr<1e-6,`largest difference ${mErr.toExponential(1)}°`);

// 7. Shoulders follow while reaching, and the hand still lands exactly.
const hi=reach(S,{},{'hand.L':{position:[.32,1.78,.08]}},{follow:true}),his=S.solve(hi.pose);
check('reaching up high: the shoulder lifts on its own and the hand still lands exactly',hi.pose['clavicle.L'].z>1.5&&hi.error['hand.L']<5e-4,`shoulder lifts ${hi.pose['clavicle.L'].z.toFixed(1)}°; hand off by ${mm(hi.error['hand.L'])}`);

// 8. Palm: the palm centre touches a moving ball exactly and faces it; smooth all the way round.
let palmErr=0,faceErr=0,pj=0,pp=null;const R0=.035;
for(let n=0;n<=360;n++){const a=n/360*Math.PI*2,c=[.24+.16*Math.cos(a),1.32+.18*Math.sin(a),.42+.06*Math.sin(2*a)];
 // Each frame starts from the arm where it was last frame (how a game runs it).
 const r=reach(S,pp?{'upperArm.L':pp['upperArm.L'],'lowerArm.L':pp['lowerArm.L'],'hand.L':pp['hand.L']}:{},{'hand.L':{touch:c,radius:R0}},{follow:true});palmErr=Math.max(palmErr,r.error['hand.L']);faceErr=Math.max(faceErr,r.facing['hand.L']);
 // The palm centre's distance from the ball's centre must be the radius.
 const s=S.solve(r.pose),h=s.get('hand.L'),H0=new T.Vector3(...S.bones[S.index.get('hand.L')].head),palm=new T.Vector3(...S.palms.L.point).sub(H0).applyQuaternion(h.rotation).add(h.head);
 palmErr=Math.max(palmErr,Math.abs(palm.distanceTo(new T.Vector3(...c))-R0));
 if(pp)for(const b of ['upperArm.L','lowerArm.L','hand.L'])for(const k of AX)pj=Math.max(pj,Math.abs(r.pose[b][k]-pp[b][k]));pp=r.pose;}
check('the palm centre touches a moving ball exactly and faces it, moving smoothly all the way round',palmErr<5e-4&&faceErr<1&&pj<2,`palm off the ball's surface by at most ${mm(palmErr)}; facing off by at most ${faceErr.toFixed(2)}°; joints change at most ${pj.toFixed(2)}° a step`);

// 9. Speed.
const t0=performance.now();for(let n=0;n<2000;n++)reach(S,{root:{position:[0,-.1,0]}},{'foot.L':{sole:soleL},'foot.R':{sole:soleR},'hand.L':{position:[.3,1.1,.3]}});const us=(performance.now()-t0)/2000*1000;
let warm={};const t1=performance.now();for(let n=0;n<500;n++){const r=reach(S,warm,{'hand.L':{touch:[.24+.16*Math.cos(n/60),1.32+.18*Math.sin(n/60),.42],radius:.035},'foot.L':{sole:soleL},'foot.R':{sole:soleR}},{follow:true});warm={'upperArm.L':r.pose['upperArm.L'],'lowerArm.L':r.pose['lowerArm.L'],'hand.L':r.pose['hand.L']};}const usP=(performance.now()-t1)/500*1000;
check('fast enough for every frame (both feet and a hand under 0.5 ms; a palm that must also face its target under 5 ms of a 16 ms frame)',us<500&&usP<5000,`${us.toFixed(0)} µs; a palm following a moving ball (starting from last frame), with the shoulders following: ${usP.toFixed(0)} µs`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: hands and feet reach exactly, smoothly and within every limit.');process.exit(fail?1:0);
