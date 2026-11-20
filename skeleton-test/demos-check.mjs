// Reaching demo checks: what the Skeleton page shows is exactly right.
// Sit: the block touches him exactly, thighs level, palms resting on the
// thighs palm-down. Squat: gym form, feet planted flat. Step: the foot never
// enters the block and lands flat on top. Ball: the palm centre stays on the
// ball. Usage: node skeleton-test/demos-check.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dir=mkdtempSync(join(tmpdir(),'demos-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeletonAvatar} from '${root}/skeleton-test/attach.js';export * from '${root}/skeleton-test/demos.js';export {reach} from '${root}/motion-core/skeleton/reach.js';export {POSES} from '${root}/motion-core/skeleton/poses.js';export {createPosePlayer} from '${root}/motion-core/skeleton/pose.js';export {FINGER_RADII} from '${root}/motion-core/skeleton/bones.js';export * as T from 'three';`);
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')],
 plugins:[{name:'h',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const {createSkeletonAvatar,createDemos,seatTop,sittingHands,thighRests,footReach,createDemoRunner,createPosePlayer,FINGER_RADII,reach,POSES,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const A=createSkeletonAvatar(),S=A.skeleton,D=createDemos(S,footReach(A)),R=[],check=(name,ok,detail='',known='')=>R.push({check:name,result:ok?'PASS':known?'KNOWN':'FAIL',detail:ok||!known?detail:detail+' — known: '+known}),mm=v=>(v*1000).toFixed(2)+' mm';
const AX=['x','y','z'],inLimits=p=>S.bones.filter(b=>b.parent&&p[b.name]).every(b=>AX.every(k=>p[b.name][k]>=b.limits[k][0]-1e-6&&p[b.name][k]<=b.limits[k][1]+1e-6));
const ray=new T.Raycaster(),verts=label=>{const a=A.attached.find(x=>x.label===label),P=a.mesh.geometry.attributes.position,o=[];for(let i=0;i<P.count;i++)o.push(new T.Vector3().fromBufferAttribute(P,i).applyMatrix4(a.mesh.matrix));return o;};
const feetOk=(pose,res)=>{const s=S.solve(pose);let tilt=0;for(const sd of ['L','R'])tilt=Math.max(tilt,Math.acos(Math.min(1,new T.Vector3(0,1,0).applyQuaternion(s.get('foot.'+sd).rotation).y))/Math.PI*180);return {err:Math.max(res.error['foot.L'],res.error['foot.R']),tilt};};
const palmAt=(s,sd)=>{const h=s.get('hand.'+sd),H0=new T.Vector3(...S.bones[S.index.get('hand.'+sd)].head);return new T.Vector3(...S.palms[sd].point).sub(H0).applyQuaternion(h.rotation).add(h.head);};

// ---- Sit ----
const sitD=D.sit(99),sitBody=reach(S,sitD.pose,sitD.goals,{follow:true}),fit=seatTop(A,sitBody.pose);
const under=[...verts('pelvis'),...verts('thigh.L'),...verts('thigh.R')].filter(v=>v.z<=fit.front&&Math.abs(v.x)<=.25);
const gapToBlock=Math.min(...under.map(v=>v.y))-fit.top;
const s1=A.solved,thighLevel=Math.max(...['L','R'].map(sd=>{const d=s1.get('thigh.'+sd).tail.clone().sub(s1.get('thigh.'+sd).head);return Math.abs(Math.asin(d.y/d.length()))/Math.PI*180;}));
const RESTS=thighRests(A),sitHands=reach(S,sitBody.pose,sittingHands(S.solve(sitBody.pose),RESTS),{follow:true}),sitFeet=feetOk(sitHands.pose,sitBody);
const palmErr=Math.max(sitHands.error['hand.L'],sitHands.error['hand.R']),palmFace=Math.max(sitHands.facing['hand.L'],sitHands.facing['hand.R']),fingerAim=Math.max(sitHands.pointing['hand.L'],sitHands.pointing['hand.R']);
check('sit: the block touches him exactly (nothing sinks into it, nothing floats above it)',Math.abs(gapToBlock)<1e-9,`block top ${mm(fit.top)} above the floor; lowest body point over it ${mm(gapToBlock)} from it`);
check('sit: thighs level, feet planted flat, every joint inside its limits',thighLevel<.5&&sitFeet.err<5e-4&&sitFeet.tilt<.5&&inLimits(sitHands.pose),`thighs ${thighLevel.toFixed(2)}° from level; feet off by ${mm(sitFeet.err)}, tilted ${sitFeet.tilt.toFixed(2)}°`);
A.apply(sitHands.pose);const palmsOnTop=['L','R'].every(sd=>{const g=sittingHands(A.solved,RESTS)['hand.'+sd];return g.face[1]<-.99;});
check('sit: each palm centre rests exactly on top of its thigh, palm down, fingers turned in toward each other',palmErr<5e-4&&palmsOnTop&&palmFace<16&&fingerAim<15,`palms off the thigh surface by ${mm(palmErr)}; palms lie within ${palmFace.toFixed(1)}° of flat (the forearm can roll only 80°); fingers point along the thigh within ${fingerAim.toFixed(1)}°`);
// Sitting down, frame by frame at 60 a second, exactly as the page does it (the pose
// player and the demo runner): smooth, then perfectly still once seated.
const sitRun=(()=>{const P=createPosePlayer(S,{},{follow:true}),run=createDemoRunner(P,D,thighRests(A)),fr=[];run.start('sit');for(let i=0;i<150;i++)fr.push(P.update(1/60));return fr;})();
const ARMS=['upperArm.L','lowerArm.L','hand.L','upperArm.R','lowerArm.R','hand.R','clavicle.L','clavicle.R'];
let sitJump=0,stillJump=0;for(let i=1;i<sitRun.length;i++){let m=0;for(const n of ARMS)for(const k of AX)m=Math.max(m,Math.abs(sitRun[i][n][k]-sitRun[i-1][n][k]));if(i<=84)sitJump=Math.max(sitJump,m);else if(i>100)stillJump=Math.max(stillJump,m);}
// Holding the knees: once seated, the fingers wrap over the thighs and knees and stop at their surface.
{const seated=sitRun.at(-1),q=S.solve(seated),R2=thighRests(A);let deepest=0,touching=0;
 for(const sd of ['L','R']){const t=q.get('thigh.'+sd),shapes=[{a:t.head,b:t.tail,r:R2[sd].radius},{a:t.tail,b:t.tail,r:R2[sd].radius}];
  for(const d of ['index','middle','ring','little']){let g=Infinity;for(const j of [2,3]){const b=q.get(`${d}${j}.${sd}`),r=FINGER_RADII[d][j-1];for(const sh of shapes){let best=Infinity;for(let u=0;u<=16;u++){const p=b.head.clone().lerp(b.tail,u/16);for(let v=0;v<=16;v++)best=Math.min(best,p.distanceTo(sh.a.clone().lerp(sh.b,v/16)));}g=Math.min(g,best-r-sh.r);}}
   deepest=Math.min(deepest,g);if(g<.003)touching++;}}
 check('sit: the hands hold the knees: the outer finger segments wrap over the thighs and knees and stop at their surface (the palm rests on the thigh)',deepest>-.003&&touching>=6,`${touching} of 8 fingers touching; deepest ${mm(-deepest)} into the leg (measured finger and thigh thickness)`);}
check('sit: the arms move smoothly while sitting down and are perfectly still once seated (no jitter)',sitJump<4&&stillJump<1e-3,`fastest arm joint ${(sitJump*60).toFixed(0)}°/s while sitting down; once seated ${stillJump.toExponential(1)}° between frames`);

// ---- Squat ----
let sqFeet=0,sqTilt=0,sqLimits=true,bottomLevel=99;
for(let n=0;n<=120;n++){const t=n/120*(Math.PI*2/1.8),d=D.squat(t),r=reach(S,d.pose,d.goals,{follow:true}),f=feetOk(r.pose,r);sqFeet=Math.max(sqFeet,f.err);sqTilt=Math.max(sqTilt,f.tilt);if(!inLimits(r.pose))sqLimits=false;
 if(n===60){const s=S.solve(r.pose);bottomLevel=Math.max(...['L','R'].map(sd=>{const v=s.get('thigh.'+sd).tail.clone().sub(s.get('thigh.'+sd).head);return Math.abs(Math.asin(v.y/v.length()))/Math.PI*180;}));}}
check('squat: gym form (thighs level at the bottom, upper body leaning 28°), feet planted flat the whole way',bottomLevel<.5&&sqFeet<5e-4&&sqTilt<.5&&sqLimits,`thighs ${bottomLevel.toFixed(2)}° from level at the bottom; feet off by ${mm(sqFeet)}, tilted ${sqTilt.toFixed(2)}°`);

// ---- Step ----
const box=new T.Box3().setFromCenterAndSize(new T.Vector3(...D.STEP.centre),new T.Vector3(D.STEP.width,D.STEP.height,D.STEP.depth));
let into=0,stepFeet=0,stepLimits=true,landed=null;
for(let n=0;n<=500;n++){const t=n/500*5,d=D.step(t),r=reach(S,d.pose,d.goals,{follow:true});A.apply(r.pose);if(!inLimits(r.pose))stepLimits=false;stepFeet=Math.max(stepFeet,r.error['foot.L'],r.error['foot.R']);
 // How deep any point of the left foot goes into the block.
 for(const v of verts('foot.L'))if(box.containsPoint(v))into=Math.max(into,Math.min(v.x-box.min.x,box.max.x-v.x,v.y-box.min.y,box.max.y-v.y,v.z-box.min.z,box.max.z-v.z));
 if(Math.abs(t-2.1)<1e-9)landed=verts('foot.L');}
const sole=Math.min(...landed.map(v=>v.y)),onTop=landed.filter(v=>v.y<sole+.002),inside=onTop.every(v=>v.z>=box.min.z&&v.z<=box.max.z);
check('step: the foot never goes into the block, on the way up or down',into<5e-4,`deepest point inside the block: ${mm(into)}`);
check('step: the foot lands flat on top of the block, fully on it; the other foot stays planted',Math.abs(sole-box.max.y)<.002&&inside&&stepFeet<5e-4&&stepLimits,`sole ${mm(sole-box.max.y)} from the block top; feet off their targets by ${mm(stepFeet)}`);

// ---- Ball ----
const armsOf=p=>Object.fromEntries(['upperArm.L','lowerArm.L','hand.L','upperArm.R','lowerArm.R','hand.R'].map(n=>[n,p[n]]).filter(([,v])=>v));let ballErr=0,ballFace=0,bw=null;for(let n=0;n<=120;n++){const d=D.ball(n/120*(Math.PI*2/1.4)),r=reach(S,bw?{...d.pose,...bw}:d.pose,d.goals,{follow:true});bw=armsOf(r.pose);const p=palmAt(S.solve(r.pose),'L');ballErr=Math.max(ballErr,Math.abs(p.distanceTo(new T.Vector3(...d.ball))-D.BALL.radius));ballFace=Math.max(ballFace,r.facing['hand.L']);}
check('ball: the palm centre stays on the ball all the way round, facing its centre',ballErr<5e-4&&ballFace<1,`palm off the ball's surface by ${mm(ballErr)}; facing off by ${ballFace.toFixed(2)}°`);

// ---- Leg out ----
const lo=S.solve(POSES['leg-side']),rest=S.solve({}),out=lo.get('foot.L').head.x-rest.get('foot.L').head.x;
check('leg out: the left leg swings out to the side at the hip; nothing else moves',out>.3&&S.bones.filter(b=>!/(thigh|shin|foot|toes)\.L/.test(b.name)).every(b=>lo.get(b.name).head.distanceTo(rest.get(b.name).head)<1e-9),`ankle moves ${mm(out)} out`);
// ---- Starting and stopping each demo, exactly as the page runs it (60 frames a second) ----
const RESTS2=thighRests(A),allBones=S.bones.filter(b=>b.parent).map(b=>b.name);
function simulate(name,on,off){
 const P=createPosePlayer(S,{},{follow:true}),run=createDemoRunner(P,D,RESTS2),frames=[];
 run.start(name);for(let i=0;i<on*60;i++)frames.push({pose:P.update(1/60),stopped:false});
 run.stop();for(let i=0;i<off*60;i++)frames.push({pose:P.update(1/60),stopped:true});
 return {frames,P};
}
const jolt=frames=>{let m=0,rm=0;for(let i=2;i<frames.length;i++){const a=frames[i].pose,b=frames[i-1].pose,c=frames[i-2].pose;
 for(const n of allBones)for(const k of AX)m=Math.max(m,Math.abs(a[n][k]-2*b[n][k]+c[n][k]));
 for(let k=0;k<3;k++)rm=Math.max(rm,Math.abs(a.root.position[k]-2*b.root.position[k]+c.root.position[k]));}return {m,rm};};
const restPose=S.restPose(),atRest=p=>Math.max(...allBones.flatMap(n=>AX.map(k=>Math.abs(p[n][k]-(n.startsWith('clavicle')?p[n][k]:restPose[n][k])))),...p.root.position.map(Math.abs));
const planted=(frames,sides)=>{let e=0;for(const f of frames){const q=S.solve(f.pose);for(const sd of sides){const h=q.get('foot.'+sd).head,s0=S.bones[S.index.get('foot.'+sd)].head;e=Math.max(e,Math.hypot(h.x-s0[0],h.y-s0[1],h.z-s0[2]));}}return e;};
for(const [name,on,off,sides,label] of [['sit',2.4,2.4,['L','R']],['squat',3,1.6,['L','R']],['step',1.0,2.8,['R'],'step (stopped while the foot is rising)'],['step',1.9,2.8,['R'],'step (stopped after landing on the block)'],['step',3.5,2.8,['R'],'step (stopped while stepping back down)'],['ball',2,1.2,[]],['look',4,2,[]]]){
 const {frames,P}=simulate(name,on,off),j=jolt(frames),end=atRest(frames.at(-1).pose),feet=sides.length?planted(frames,sides):0;
 check(`${label??name}: starts and stops smoothly (no jolt), feet stay planted, and ends exactly at rest with nothing left running`,j.m<1&&j.rm<.0015&&end<1e-6&&feet<5e-4&&!P.layers.length&&!P.goalLayers.length,
  `largest change in joint speed between frames ${j.m.toFixed(2)}°; in body speed ${(j.rm*1000).toFixed(2)} mm; ${sides.length?'planted foot off by '+mm(feet)+'; ':''}back at rest within ${end.toExponential(1)}`,
  '');
}

// ---- Walk and run: exactly as the page runs them (the demo runner ticks the walking body before the pose player) ----
for(const [name,secs,jmax,words] of [['walk',14,14,'joints never jolt (under 14° change of speed in a frame)'],['run',13,200,'no joint snaps by more than 200° change of speed in a frame (flat out at 8.6 m/s the legs swing 7 steps a second and hit their limits)']]){
 const P=createPosePlayer(S,{},{follow:true}),run=createDemoRunner(P,D,RESTS2),frames=[];
 run.start(name);for(let i=0;i<secs*60;i++){run.tick(1/60);frames.push({pose:P.update(1/60)});}
 run.stop();let back=0;for(;back<120*60&&run.walking;back++){run.tick(1/60);frames.push({pose:P.update(1/60)});}
 for(let i=0;i<150;i++){run.tick(1/60);frames.push({pose:P.update(1/60)});}
 const j=jolt(frames),end=atRest(frames.at(-1).pose);let bad=0,nan=0;
 for(const f of frames){if(!inLimits(f.pose))bad++;for(const b of Object.values(f.pose))if(b&&typeof b==='object'&&'x' in b&&!(Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.z)))nan++;}
 check(`${name}: goes, comes home and stops; every joint stays inside its limits, no invalid numbers, ${words}, and ends exactly at rest with nothing left running`,back<120*60&&bad===0&&nan===0&&j.m<jmax&&end<1e-6&&!P.layers.length&&!P.goalLayers.length,`${(frames.length/60).toFixed(0)} seconds; ${bad} frames with a joint past its limit; largest change in joint speed ${j.m.toFixed(2)}°; back at rest within ${end.toExponential(1)}`);
}

// ---- Look: the face follows the ball ----
{const {frames}=simulate('look',6,0.1);let worst=0,sum=0,n=0,limits=true;
 for(let i=60;i<6*60;i++){const t=i/60,pose=frames[i].pose,h=S.solve(pose).get('head'),f=new T.Vector3(0,0,1).applyQuaternion(h.rotation),want=new T.Vector3(...D.look(t).target).sub(h.head),e=f.angleTo(want)*180/Math.PI;worst=Math.max(worst,e);sum+=e;n++;if(!inLimits(pose))limits=false;}
 check('look: the face keeps on the swinging ball (within 12° at worst after the first second, 5° on average), every joint inside its limits',worst<12&&sum/n<5&&limits,`worst ${worst.toFixed(1)}°, average ${(sum/n).toFixed(1)}° off the ball`);
}
console.table(R);const fail=R.some(r=>r.result==='FAIL'),known=R.filter(r=>r.result==='KNOWN').length;console.log(fail?'FAIL':'PASS: every reaching demo does exactly what it shows'+(known?` (${known} known item${known>1?'s':''} listed above, planned)`:'')+'.');process.exit(fail?1:0);
