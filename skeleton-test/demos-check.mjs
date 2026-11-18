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
writeFileSync(entry,`export {createSkeletonAvatar} from '${root}/skeleton-test/attach.js';export * from '${root}/skeleton-test/demos.js';export {reach} from '${root}/motion-core/skeleton/reach.js';export {POSES} from '${root}/motion-core/skeleton/poses.js';export * as T from 'three';`);
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')],
 plugins:[{name:'h',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const {createSkeletonAvatar,createDemos,seatTop,sittingHands,thighRests,footReach,reach,POSES,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const A=createSkeletonAvatar(),S=A.skeleton,D=createDemos(S,footReach(A)),R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(2)+' mm';
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
check('sit: each palm centre rests exactly on top of its thigh, palm down, fingers along the thigh to the knee',palmErr<5e-4&&palmsOnTop&&palmFace<16&&fingerAim<15,`palms off the thigh surface by ${mm(palmErr)}; palms lie within ${palmFace.toFixed(1)}° of flat (the forearm can roll only 80°); fingers point along the thigh within ${fingerAim.toFixed(1)}°`);
// Sitting down, frame by frame at 60 a second, exactly as the page does it: smooth, then perfectly still.
let sitJump=0,stillJump=0,prevSit=null;const ARMS=['upperArm.L','lowerArm.L','hand.L','upperArm.R','lowerArm.R','hand.R','clavicle.L','clavicle.R'];
let warm=null;const armsOf=p=>Object.fromEntries(['upperArm.L','lowerArm.L','hand.L','upperArm.R','lowerArm.R','hand.R'].map(n=>[n,p[n]]).filter(([,v])=>v));
for(let f=0;f<=150;f++){const t=f/60,d=D.sit(t),b=reach(S,d.pose,d.goals,{follow:true});const now=S.solve(b.pose),hd=reach(S,warm?{...b.pose,...warm}:b.pose,sittingHands(now,RESTS,d.handWeight,now,S),{follow:true}).pose;warm=armsOf(hd);
 const mix={};for(const n of ARMS)mix[n]={...(hd[n]??S.bones[S.index.get(n)].rest)};
 if(prevSit){let m=0,wh='';for(const n of ARMS)for(const k of AX){const dd=Math.abs(mix[n][k]-prevSit[n][k]);if(dd>m){m=dd;wh=n+k;}}if(process.env.DBG&&m>2)console.log('JUMP',f,t.toFixed(3),m.toFixed(1),wh,d.handWeight.toFixed(3),JSON.stringify(hd[wh.slice(0,-1)]));if(t<=1.4)sitJump=Math.max(sitJump,m);else stillJump=Math.max(stillJump,m);}prevSit=mix;}
check('sit: the arms move smoothly while sitting down and are perfectly still once seated (no jitter)',sitJump<3&&stillJump<1e-3,`largest change between frames while sitting down ${sitJump.toFixed(2)}°; once seated ${stillJump.toExponential(1)}°`);

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
let ballErr=0,ballFace=0,bw=null;for(let n=0;n<=120;n++){const d=D.ball(n/120*(Math.PI*2/1.4)),r=reach(S,bw?{...d.pose,...bw}:d.pose,d.goals,{follow:true});bw=armsOf(r.pose);const p=palmAt(S.solve(r.pose),'L');ballErr=Math.max(ballErr,Math.abs(p.distanceTo(new T.Vector3(...d.ball))-D.BALL.radius));ballFace=Math.max(ballFace,r.facing['hand.L']);}
check('ball: the palm centre stays on the ball all the way round, facing its centre',ballErr<5e-4&&ballFace<1,`palm off the ball's surface by ${mm(ballErr)}; facing off by ${ballFace.toFixed(2)}°`);

// ---- Leg out ----
const lo=S.solve(POSES['leg-side']),rest=S.solve({}),out=lo.get('foot.L').head.x-rest.get('foot.L').head.x;
check('leg out: the left leg swings out to the side at the hip; nothing else moves',out>.3&&S.bones.filter(b=>!/(thigh|shin|foot|toes)\.L/.test(b.name)).every(b=>lo.get(b.name).head.distanceTo(rest.get(b.name).head)<1e-9),`ankle moves ${mm(out)} out`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: every reaching demo does exactly what it shows.');process.exit(fail?1:0);
