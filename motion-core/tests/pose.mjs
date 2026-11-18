// Skeleton section 3 checks: poses, blending, smooth transitions, layers and
// clips. Usage: node motion-core/tests/pose.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'pose-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeleton} from '${root}/motion-core/skeleton/skeleton.js';export * from '${root}/motion-core/skeleton/pose.js';export {POSES,CLIPS} from '${root}/motion-core/skeleton/poses.js';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {createSkeleton,EASE,fullPose,blend,createClip,createPosePlayer,POSES,CLIPS}=await import(pathToFileURL(join(dir,'o.mjs')).href);

const S=createSkeleton(),R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail});
const AX=['x','y','z'],names=S.bones.filter(b=>b.parent).map(b=>b.name);
const diff=(a,b)=>{let m=0;for(const n of names)for(const k of AX)m=Math.max(m,Math.abs(a[n][k]-b[n][k]));return m;};
const inLimits=p=>S.bones.filter(b=>b.parent&&b.limits).every(b=>AX.every(k=>p[b.name][k]>=b.limits[k][0]-1e-9&&p[b.name][k]<=b.limits[k][1]+1e-9));
let seed=11;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
const randomPose=()=>Object.fromEntries(S.bones.filter(b=>b.parent).map(b=>[b.name,Object.fromEntries(AX.map(k=>[k,b.limits[k][0]+rand()*(b.limits[k][1]-b.limits[k][0])]))]));

// ---- Easing ----
const easeOk=['inOut','out','in','linear'].every(k=>{const f=EASE[k];let mono=true,prev=-1;for(let i=0;i<=100;i++){const v=f(i/100);if(v<prev-1e-12)mono=false;prev=v;}return Math.abs(f(0))<1e-12&&Math.abs(f(1)-1)<1e-12&&mono;});
const slope=(f,t)=>(f(t+1e-5)-f(t-1e-5))/2e-5;
check('easing curves start at 0, end at 1 and never go backwards',easeOk);
check('the gentle ease starts and stops with zero speed',Math.abs(slope(EASE.inOut,1e-5))<1e-3&&Math.abs(slope(EASE.inOut,1-1e-5))<1e-3);

// ---- Blending ----
let endErr=0,limitBad=0;
for(let n=0;n<300;n++){const a=fullPose(S,randomPose()),b=fullPose(S,randomPose());endErr=Math.max(endErr,diff(blend(a,b,0),a),diff(blend(a,b,1),b));for(const t of [.1,.33,.5,.77,.95])if(!inLimits(blend(a,b,t)))limitBad++;}
check('a blend starts exactly at the first pose and ends exactly at the second',endErr<1e-9,'300 random pose pairs');
check('every in-between pose stays inside every joint limit',limitBad===0,'1,500 in-between poses');
const a=fullPose(S,POSES['arms-out']),b=fullPose(S,POSES.kick),mid=blend(a,b,.5),mirMid=blend(fullPose(S,S.mirrorPose(POSES['arms-out'])),fullPose(S,S.mirrorPose(POSES.kick)),.5);
check('blending mirrored poses gives the mirrored blend',diff(fullPose(S,S.mirrorPose(mid)),mirMid)<1e-9);

// ---- Smooth transitions ----
const P=createPosePlayer(S);P.transitionTo(POSES.wave,{duration:.6});
const target=fullPose(S,POSES.wave);let arrived=null;for(let i=1;i<=90;i++){const p=P.update(1/120);if(arrived===null&&diff(p,target)<1e-9)arrived=i/120;}
check('a transition arrives exactly on time',arrived!==null&&Math.abs(arrived-.6)<1/120+1e-9,`arrived at ${arrived?.toFixed(3)} s (asked: 0.600 s)`);
// Same transition at different frame rates gives the same pose at the same moment.
const at=(fps,t)=>{const p=createPosePlayer(S);p.transitionTo(POSES.kick,{duration:.7});let pose;for(let i=0;i<Math.round(t*fps);i++)pose=p.update(1/fps);return pose;};
const fpsSpread=Math.max(...[30,60,120,144].map(f=>diff(at(f,.5),at(120,.5))));
check('transitions are the same at 30, 60, 120 and 144 frames a second',fpsSpread<1e-6,`largest difference ${fpsSpread.toExponential(1)}°`);
// Interrupt halfway: no jump in position and no jump in speed.
const I=createPosePlayer(S);I.transitionTo(POSES['arms-up'],{duration:.8});
const dt=1/120;let frames=[];for(let i=0;i<48;i++)frames.push(I.update(dt));I.transitionTo(POSES['arms-out'],{duration:.6});for(let i=0;i<72;i++)frames.push(I.update(dt));
// Per-joint speed each frame; then how much that speed changes frame to frame.
const sp=[];for(let i=1;i<frames.length;i++){const v={};for(const n of names)v[n]={};for(const n of names)for(const k of AX)v[n][k]=(frames[i][n][k]-frames[i-1][n][k])/dt;sp.push(v);}
const acc=[];for(let i=1;i<sp.length;i++){let m=0;for(const n of names)for(const k of AX)m=Math.max(m,Math.abs(sp[i][n][k]-sp[i-1][n][k]));acc.push(m);}
// At the switch, acceleration must carry on from where it was (no jump), measured
// against the largest acceleration in the whole movement.
const maxAcc=Math.max(...acc),jump=Math.max(...[44,45,46,47,48].map(i=>Math.abs(acc[i]-acc[i-1])));
check('changing pose halfway never jerks: no jump in speed or in acceleration',jump<=.15*maxAcc,`acceleration changes by ${(100*jump/maxAcc).toFixed(1)}% of its peak at the switch (a jolt would be a large jump)`);
check('every frame of every transition stays inside the joint limits',frames.every(inLimits));

// ---- Layers ----
const L=createPosePlayer(S,POSES.look);L.setLayer('wave',{clip:CLIPS.wave,fade:.3});let p;for(let i=0;i<120;i++)p=L.update(1/120);
const touched=new Set(CLIPS.wave.bones),base=fullPose(S,POSES.look);
const others=names.filter(n=>!touched.has(n)).every(n=>AX.every(k=>Math.abs(p[n][k]-base[n][k])<1e-9));
check('a layer moves only the bones it names (waving arm), the rest of the body keeps its pose',others,`${touched.size} bones in the wave layer`);
L.clearLayer('wave',.3);for(let i=0;i<60;i++)p=L.update(1/120);
check('a layer fades out smoothly and the body returns to its pose',diff(p,base)<1e-9&&L.layers.length===0);

// ---- Clips ----
const c=CLIPS.wave,s0=c.sample(0),s1=c.sample(c.duration),e=1e-4,v0=c.sample(e).lowerArm?.x;
const loopPos=Math.max(...c.bones.flatMap(n=>AX.map(k=>Math.abs(s0[n][k]-s1[n][k]))));
const vel=t=>(c.sample(t+e)['lowerArm.L'].x-c.sample(t-e)['lowerArm.L'].x)/(2*e);
check('the wave loops seamlessly (same pose and same speed where it repeats)',loopPos<1e-9&&Math.abs(vel(c.duration-2*e)-vel(2*e))<.5,`elbow speed at the loop ${vel(c.duration-2*e).toFixed(1)} vs ${vel(2*e).toFixed(1)} °/s`);
const W=createPosePlayer(S);W.setLayer('wave',{clip:c,fade:0});let xs=[],elbow=[];
for(let i=0;i<72;i++){const pose=W.update(1/120),s=S.solve(pose);xs.push(s.get('hand.L').tail.x);elbow.push(s.get('lowerArm.L').head);}
const sway=Math.max(...xs)-Math.min(...xs),elbowMove=Math.max(...elbow.map(v=>v.distanceTo(elbow[0])));
check('in the wave the hand swings side to side from the elbow, which stays put',sway>.12&&elbowMove<1e-9,`hand swings ${(sway*100).toFixed(1)} cm; elbow moves ${(elbowMove*1000).toFixed(2)} mm`);
// ---- The body's position moves through the same smooth machinery ----
const B=createPosePlayer(S);B.transitionTo({root:{position:[0,-.3,-.2],rotation:{x:20,y:0,z:0}}},{duration:.8});
const rootTrack=[];for(let i=0;i<48;i++)rootTrack.push(B.update(1/120).root);B.transitionTo({},{duration:.6});for(let i=0;i<96;i++)rootTrack.push(B.update(1/120).root);
const rp=rootTrack.map(r=>[...r.position,r.rotation.x]),rv=rp.slice(1).map((p,i)=>p.map((v,k)=>(v-rp[i][k])*120)),ra=rv.slice(1).map((v,i)=>v.map((x,k)=>(x-rv[i][k])*120));
const peakA=Math.max(...ra.flat().map(Math.abs)),switchJ=Math.max(...[45,46,47,48].map(i=>Math.max(...ra[i].map((x,k)=>Math.abs(x-ra[i-1][k])))));
const home=rootTrack.at(-1),homeErr=Math.max(...home.position.map(Math.abs),Math.abs(home.rotation.x));
check('the body\'s position and lean move smoothly, change course without a jolt, and arrive exactly',switchJ<=.15*peakA&&homeErr<1e-9,`acceleration changes by ${(100*switchJ/peakA).toFixed(1)}% of its peak at the switch; back home within ${homeErr.toExponential(1)}`);
const rc=createClip([{time:0,pose:{root:{position:[0,0,0]}}},{time:.5,pose:{root:{position:[0,-.2,0]}}}],{loop:true,duration:1});
check('a clip can move the body too (looping seamlessly)',Math.abs(rc.sample(0).root.position[1]-rc.sample(1).root.position[1])<1e-12&&rc.sample(.5).root.position[1]<-.19,`lowest ${rc.sample(.5).root.position[1].toFixed(3)} m`);

// ---- Reaching layers: feet stay planted while the body moves, and every switch is smooth ----
const soles={'foot.L':{sole:[.15,0,.025],heading:0},'foot.R':{sole:[-.15,0,.025],heading:0}};
const G=createPosePlayer(S);G.setGoals('feet',soles,{fade:0});
const track=[];let plantErr=0;
const step=n=>{for(let i=0;i<n;i++){const p=G.update(1/60),q=S.solve(p);track.push(p);for(const f of ['foot.L','foot.R'])plantErr=Math.max(plantErr,q.get(f).head.distanceTo({x:soles[f].sole[0],y:.1635,z:soles[f].sole[2],distanceTo:null}?new (q.get(f).head.constructor)(soles[f].sole[0],S.bones[S.index.get(f)].head[1],soles[f].sole[2]):0));}};
G.transitionTo({root:{position:[0,-.2,-.15],rotation:{x:0,y:0,z:0}}},{duration:1});step(60);
G.setGoals('hand',{'hand.L':{position:[.3,.9,.3]}},{fade:.8});step(30);
// Leave: stand up and let go of the hand goal at the same moment (the old "Sit" jolt).
G.transitionTo({},{duration:1});G.clearGoals('hand',.8);step(90);
const jj=(a,b)=>{let m=0;for(const n of names)for(const k of AX)m=Math.max(m,Math.abs(a[n][k]-b[n][k]));return m;};
let worstStep=0,worstAccel=0;for(let i=2;i<track.length;i++){worstStep=Math.max(worstStep,jj(track[i],track[i-1]));let m=0,wn='';for(const n of names)for(const k of AX){const d=Math.abs(track[i][n][k]-2*track[i-1][n][k]+track[i-2][n][k]);if(d>m){m=d;wn=n+k;}}worstAccel=Math.max(worstAccel,m);}
check('reaching layers: feet stay planted while the body lowers and rises',plantErr<5e-4,`feet off by at most ${(plantErr*1000).toFixed(2)} mm`);
// A jolt is a sudden change in speed; at 60 frames a second, under 1° per frame per frame is smooth.
check('switching between movements never jolts (lower, reach, then stand up and let go together)',worstAccel<1&&G.goalLayers.length===1,`largest change in speed between frames ${worstAccel.toFixed(2)}°; fastest joint ${(worstStep*60).toFixed(0)}°/s`);

const t0=performance.now();const Q=createPosePlayer(S);Q.setLayer('wave',{clip:c});Q.transitionTo(POSES.kick,{duration:1});for(let i=0;i<3000;i++)Q.update(1/120);const us=(performance.now()-t0)/3000*1000;
check('fast enough for every frame (well under 1 ms of a 16 ms frame)',us<1000,`${us.toFixed(0)} µs per frame for transition + layer`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: poses, blends, transitions, layers and clips behave as planned.');process.exit(fail?1:0);
