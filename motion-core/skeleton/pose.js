// Skeleton · section 3: poses and smooth movement between them.
//
// A pose is a set of joint angles: { [bone]: {x,y,z} } in degrees (see
// bones.js); any bone left out stays at rest. A pose may also say where the
// whole body is: root: {position:[x,y,z] metres, rotation:{x,y,z} degrees}
// (left out: standing where he is). This file adds:
//
//   EASE                 easing curves (how a movement speeds up and slows down)
//   fullPose / blend     fill in missing bones; mix two poses (body position too)
//   createClip(keys)     a short animation: poses at times, smoothly joined,
//                        optionally looping (the moving wave is a clip)
//   createPosePlayer()   runs everything over time: smooth transitions that
//                        never snap, even when interrupted, plus layers (a
//                        clip on one arm while the rest of the body does
//                        something else) and reaching layers (feet planted,
//                        hands on a target), each fading in and out smoothly.
//
// Every switch goes through the same smooth machinery, so nothing ever jumps:
// the body's joints AND its position move with continuous position, speed and
// acceleration.
//
// Blending happens in joint-angle space. Every joint's limits form a simple
// box of allowed angles, so any mix of two allowed poses is also allowed:
// a blend can never bend a knee backwards. Everything is a function of time
// (no step-by-step drift), so results are the same at any frame rate.
import {reach} from './reach.js';
import {shoulderFollow} from './shoulder.js';

const AXES = ['x','y','z'];
/** Standing where he is. */
const ROOT0 = () => ({position:[0,0,0], rotation:{x:0,y:0,z:0}});
const rootOf = pose => pose?.root ? {position:[...(pose.root.position ?? [0,0,0])], rotation:{x:0,y:0,z:0,...(pose.root.rotation ?? {})}} : ROOT0();

/** Easing curves: t goes 0..1, the result goes 0..1. */
export const EASE = {
 linear: t => t,
 /** Starts and stops gently (zero speed and zero jerk at both ends). */
 inOut: t => t*t*t*(t*(t*6-15)+10),
 /** Starts quickly, settles gently. */
 out: t => 1-(1-t)**3,
 /** Starts gently, ends quickly. */
 in: t => t**3,
};

/** Every bone with an angle (missing bones at rest, everything inside its limits), and the body's position. */
export function fullPose(skeleton, pose={}){
 const out=skeleton.clampPose(Object.fromEntries(skeleton.bones.filter(b=>b.parent!==null).map(b=>[b.name,{...b.rest,...(pose[b.name]??{})}])));
 out.root=rootOf(pose);
 return out;
}

/**
 * Mix two full poses: t = 0 gives a, t = 1 gives b. `weight(name)` (0..1)
 * limits which bones take part (a mask; 'root' is the body's position); by
 * default everything does.
 */
export function blend(a, b, t, weight=()=>1){
 const out={};
 for(const name of Object.keys(a)){
  const w=t*weight(name);
  if(name==='root'){
   const ra=rootOf(a),rb=b.root?rootOf(b):ra;
   out.root={position:ra.position.map((v,i)=>v+(rb.position[i]-v)*w),rotation:Object.fromEntries(AXES.map(k=>[k,ra.rotation[k]+(rb.rotation[k]-ra.rotation[k])*w]))};
   continue;
  }
  const pa=a[name],pb=b[name]??pa;
  out[name]={x:pa.x+(pb.x-pa.x)*w,y:pa.y+(pb.y-pa.y)*w,z:pa.z+(pb.z-pa.z)*w};
 }
 return out;
}

/** The same pose with left and right swapped (mirrored). */
export function mirror(skeleton, pose){ return skeleton.mirrorPose(pose); }

// The body's position as two extra "channels" (x, y, z each), so transitions and
// clips move it exactly like a joint.
const POS='@position',ROT='@rotation';
function toChannels(pose){
 const out={};
 for(const [k,v] of Object.entries(pose)){
  if(k==='root'){const r=rootOf(pose);out[POS]={x:r.position[0],y:r.position[1],z:r.position[2]};out[ROT]={...r.rotation};}
  else out[k]=v;
 }
 return out;
}
function fromChannels(ch){
 const out={};
 for(const [k,v] of Object.entries(ch)){
  if(k===POS||k===ROT)continue;
  out[k]=v;
 }
 if(ch[POS]||ch[ROT])out.root={position:ch[POS]?[ch[POS].x,ch[POS].y,ch[POS].z]:[0,0,0],rotation:ch[ROT]?{...ch[ROT]}:{x:0,y:0,z:0}};
 return out;
}

/**
 * A clip: keys = [{time, pose}] (pose may list only the bones it moves, and
 * may include root). Between keys the angles follow a smooth curve through
 * every key (Catmull-Rom), so speed changes smoothly, including across the loop.
 */
export function createClip(keys, {loop=false, duration}={}){
 const sorted=[...keys].map(k=>({time:k.time,pose:toChannels(k.pose)})).sort((a,b)=>a.time-b.time),length=duration??sorted.at(-1).time;
 const channels=[...new Set(sorted.flatMap(k=>Object.keys(k.pose)))];
 const value=(i,ch,axis)=>{
  const n=sorted.length;let k=i,shift=0;
  if(loop){shift=Math.floor(k/n)*length;k=((k%n)+n)%n;}else k=Math.max(0,Math.min(n-1,k));
  return {time:sorted[k].time+shift,v:sorted[k].pose[ch]?.[axis]};
 };
 function sample(time){
  const n=sorted.length,t=loop?((time%length)+length)%length:Math.max(0,Math.min(length,time));
  let i=0;while(i<n-1&&sorted[i+1].time<=t)i++;
  if(loop&&t<sorted[0].time)i=-1;
  const out={};
  for(const ch of channels){
   out[ch]={};
   for(const axis of AXES){
    const p0=value(i-1,ch,axis),p1=value(i,ch,axis),p2=value(i+1,ch,axis),p3=value(i+2,ch,axis);
    const v1=p1.v??0,v2=p2.v??v1,v0=p0.v??v1,v3=p3.v??v2,span=p2.time-p1.time;
    if(!(span>0)){out[ch][axis]=v1;continue;}
    const u=(t-p1.time)/span;
    // Catmull-Rom tangents, scaled for uneven key spacing.
    const m1=(v2-v0)/(p2.time-p0.time||span)*span,m2=(v3-v1)/(p3.time-p1.time||span)*span;
    const u2=u*u,u3=u2*u;
    out[ch][axis]=(2*u3-3*u2+1)*v1+(u3-2*u2+u)*m1+(-2*u3+3*u2)*v2+(u3-u2)*m2;
   }
  }
  return fromChannels(out);
 }
 const bones=channels.filter(c=>c!==POS&&c!==ROT);
 if(channels.includes(POS)||channels.includes(ROT))bones.push('root');
 return {sample,duration:length,loop,bones};
}

/**
 * Runs poses over time.
 *   transitionTo(pose, {duration})  the base pose. Each transition starts from
 *       wherever the body is and how fast it is moving (so an interrupted
 *       transition never jerks) and arrives exactly on time. The body's
 *       position moves the same way.
 *   setLayer(name, {clip | pose | fn, fade})  plays on top, only on the bones
 *       it names, fading in (fn: a pose as a function of time since the layer
 *       began); clearLayer(name, fade, {after}) fades it out (after a wait).
 *   setGoals(name, goals | (time, pose) => goals, {fade, follow})  a reaching
 *       layer (reach.js): feet planted, a palm on a target, ... applied after
 *       the pose and layers, fading in; clearGoals(name, fade) fades it out.
 *       goals may be a function of time and the pose so far (moving targets).
 *       Each reaching layer starts from where its limbs were last frame
 *       (smooth and quick). clearGoals(name, fade, {after}). glide (seconds):
 *       fingers glide to their grip instead of jumping when a touch changes.
 *   follow: the shoulders follow the arms (shoulder.js), reaching included.
 */
export function createPosePlayer(skeleton, start={}, {follow=false}={}){
 let time=0,from=toChannels(fullPose(skeleton,start)),to=from,t0=0,len=0,startVel=zero(),startAcc=zero(),done=true;
 const layers=new Map(),goalLayers=new Map();
 function zero(){return Object.fromEntries(Object.keys(toChannels(fullPose(skeleton))).map(k=>[k,{x:0,y:0,z:0}]));}

 /**
  * Base pose (as channels), its speed (per second) and how fast that speed is
  * changing at a time. Each transition is a quintic (fifth-power) curve that
  * starts with the position, speed and acceleration the body already has and
  * ends at the target, at rest. Starting from still, it is the gentle ease in/out.
  */
 function base(at){
  if(done||len<=0)return {pose:to,vel:zero(),acc:zero()};
  const s=Math.min(1,Math.max(0,(at-t0)/len));
  if(s>=1)return {pose:to,vel:zero(),acc:zero()};
  const s2=s*s,s3=s2*s,s4=s3*s,s5=s4*s,T=len;
  const H0=1-10*s3+15*s4-6*s5,H1=s-6*s3+8*s4-3*s5,H2=.5*s2-1.5*s3+1.5*s4-.5*s5,H5=10*s3-15*s4+6*s5;
  const D0=-30*s2+60*s3-30*s4,D1=1-18*s2+32*s3-15*s4,D2=s-4.5*s2+6*s3-2.5*s4,D5=30*s2-60*s3+30*s4;
  const E0=-60*s+180*s2-120*s3,E1=-36*s+96*s2-60*s3,E2=1-9*s+18*s2-10*s3,E5=60*s-180*s2+120*s3;
  const pose={},vel={},acc={};
  for(const name of Object.keys(to)){
   pose[name]={};vel[name]={};acc[name]={};
   for(const a of AXES){
    const p0=from[name][a],p1=to[name][a],v0=startVel[name][a]*T,a0=startAcc[name][a]*T*T;
    pose[name][a]=H0*p0+H1*v0+H2*a0+H5*p1;
    vel[name][a]=(D0*p0+D1*v0+D2*a0+D5*p1)/T;
    acc[name][a]=(E0*p0+E1*v0+E2*a0+E5*p1)/(T*T);
   }
  }
  return {pose,vel,acc};
 }

 function transitionTo(target, {duration=.5}={}){
  const now=base(time);
  from=now.pose;startVel=now.vel;startAcc=now.acc;to=toChannels(fullPose(skeleton,target));t0=time;len=Math.max(0,duration);done=len===0;
  if(done)from=to;
 }

 // A fade that changes course mid-way carries on from its current weight AND speed
 // (a quintic curve, like the transitions), so the weight never kinks.
 const fadeState=(old,weight,fade)=>{const w=old?fadeAt(old,time):{w:0,v:0,a:0};return {fadeFrom:w.w,fadeVel:w.v,fadeAcc:w.a,fadeTo:weight,fadeStart:time,fade};};
 function setLayer(name, {clip=null, pose=null, fn=null, fade=.35, weight=1}={}){
  layers.set(name,{clip,pose,fn,start:time,...fadeState(layers.get(name),weight,fade)});
 }
 function clearLayer(name, fade=.35, {after=0}={}){ later(layers.get(name),fade,after); }
 function setGoals(name, goals, {fade=.35, weight=1, glide=0}={}){
  const old=goalLayers.get(name);
  goalLayers.set(name,{goals,glide,start:time,warm:old?.warm??null,fingers:old?.fingers??null,last:old?.last??null,...fadeState(old,weight,fade)});
 }
 function clearGoals(name, fade=.35, {after=0}={}){ later(goalLayers.get(name),fade,after); }
 /** Fade a layer out now, or after a wait (it keeps playing until then). */
 function later(l,fade,after){ if(!l)return; if(after>0){l.clearAt=time+after;l.clearFade=fade;} else fadeOut(l,fade); }
 function due(l,at){ if(l.clearAt!==undefined&&at>=l.clearAt){const keep=time;time=l.clearAt;fadeOut(l,l.clearFade);time=keep;delete l.clearAt;} }
 function fadeOut(l,fade){ if(!l)return; Object.assign(l,fadeState(l,0,fade));l.clearing=true; }
 /** A layer's weight, its speed and acceleration at a time. */
 function fadeAt(l,at){
  if(!(l.fade>0))return {w:l.fadeTo,v:0,a:0};
  const T=l.fade,s=Math.min(1,Math.max(0,(at-l.fadeStart)/T));
  if(s>=1)return {w:l.fadeTo,v:0,a:0};
  const s2=s*s,s3=s2*s,s4=s3*s,s5=s4*s,p0=l.fadeFrom,p1=l.fadeTo,v0=(l.fadeVel??0)*T,a0=(l.fadeAcc??0)*T*T;
  return {
   w:(1-10*s3+15*s4-6*s5)*p0+(s-6*s3+8*s4-3*s5)*v0+(.5*s2-1.5*s3+1.5*s4-.5*s5)*a0+(10*s3-15*s4+6*s5)*p1,
   v:((-30*s2+60*s3-30*s4)*p0+(1-18*s2+32*s3-15*s4)*v0+(s-4.5*s2+6*s3-2.5*s4)*a0+(30*s2-60*s3+30*s4)*p1)/T,
   a:((-60*s+180*s2-120*s3)*p0+(-36*s+96*s2-60*s3)*v0+(1-9*s+18*s2-10*s3)*a0+(60*s-180*s2+120*s3)*p1)/(T*T),
  };
 }
 const layerWeight=(l,at)=>Math.min(1,Math.max(0,fadeAt(l,at).w));

 /** Pose at a time: the base, then the layers, then the reaching layers. */
 function poseAt(at){
  let pose=fromChannels(base(at).pose);
  for(const [name,l] of layers){
   due(l,at);
   const w=layerWeight(l,at);
   if(l.clearing&&w<=0&&at>=l.fadeStart+l.fade){layers.delete(name);continue;}
   if(w<=0)continue;
   const part=l.clip?l.clip.sample(at-l.start):l.fn?l.fn(at-l.start):l.pose,names=new Set(Object.keys(part));
   pose=blend(pose,{...fullPose(skeleton,{...pose,...part}),root:part.root?rootOf(part):pose.root},w,bone=>names.has(bone)?1:0);
  }
  // Shoulders follow the arms (from the pose's own collarbones).
  const authored={'clavicle.L':pose['clavicle.L'],'clavicle.R':pose['clavicle.R']};
  if(follow)pose=shoulderFollow(skeleton,pose);
  for(const [name,g] of goalLayers){
   due(g,at);
   const w=layerWeight(g,at);
   if(g.clearing&&w<=0&&at>=g.fadeStart+g.fade){goalLayers.delete(name);continue;}
   if(w<=0)continue;
   const goals=typeof g.goals==='function'?g.goals(at-g.start,pose,skeleton):g.goals;
   if(!goals||!Object.keys(goals).length)continue;
   const r=reach(skeleton,g.warm?{...pose,...g.warm}:pose,goals,{follow,clavicles:authored,continuing:!!g.warm}).pose;
   // Remember this layer's limbs for next frame (start from there: smooth and quick).
   g.warm=Object.fromEntries(Object.keys(r).filter(k=>k!=='root'&&limbOf(k,goals)).map(k=>[k,r[k]]));
   // glide: fingers glide to where the grip puts them (a critically damped spring with
   // this time constant, seconds) instead of jumping when a touch point changes.
   if(g.glide>0)glideFingers(g,r,at);
   pose=blend(pose,{...r,root:pose.root},w);
  }
  pose.root=pose.root??ROOT0();
  return {...skeleton.clampPose(pose),root:pose.root};
 }

 return {
  transitionTo,setLayer,clearLayer,setGoals,clearGoals,
  /** Move time forward and return the pose for that moment. */
  update(dt){time+=dt;return poseAt(time);},
  poseAt,
  get time(){return time;},
  get layers(){return [...layers.keys()];},
  get goalLayers(){return [...goalLayers.keys()];},
 };
}

const FINGER=/^(thumb|index|middle|ring|little)\d\./;
/** Move the finger angles in r toward their targets with a critically damped spring (state in g). */
function glideFingers(g,r,at){
 const dt=g.last===null?0:Math.max(0,at-g.last);g.last=at;
 const w0=2/g.glide,e=Math.exp(-w0*dt);
 g.fingers=g.fingers??{};
 for(const [b,target] of Object.entries(r)){
  if(!FINGER.test(b))continue;
  const st=g.fingers[b]??(g.fingers[b]={x:{...target},v:{x:0,y:0,z:0}});
  for(const k of AXES){
   const x=st.x[k]-target[k],v=st.v[k],tmp=(v+w0*x)*dt;
   st.x[k]=target[k]+(x+tmp)*e;st.v[k]=(v-w0*tmp)*e;
  }
  r[b]={...st.x};
 }
}

/** Is this bone part of a limb that one of these goals moves (or its collarbone)? */
function limbOf(bone, goals){
 const side=bone.slice(-1);
 return Object.keys(goals).some(g=>{
  const [kind,s]=g.split('.');
  if(s!==side)return false;
  // (Feet: not the ankle. It is worked out exactly each frame from the pose's own ankle,
  // so carrying last frame's over would make a partly-flat foot creep toward flat.)
  return kind==='hand'?/^(upperArm|lowerArm|hand|clavicle)\./.test(bone):/^(thigh|shin)\./.test(bone);
 });
}
