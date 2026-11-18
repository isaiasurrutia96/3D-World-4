// Skeleton · section 3: poses and smooth movement between them.
//
// A pose is a set of joint angles: { [bone]: {x,y,z} } in degrees (see
// bones.js); any bone left out stays at rest. This file adds:
//
//   EASE                 easing curves (how a movement speeds up and slows down)
//   fullPose / blend     fill in missing bones; mix two poses
//   createClip(keys)     a short animation: poses at times, smoothly joined,
//                        optionally looping (the moving wave is a clip)
//   createPosePlayer()   runs everything over time: smooth transitions that
//                        never snap, even when interrupted, plus layers (a
//                        clip on one arm while the rest of the body does
//                        something else), each fading in and out smoothly.
//
// Blending happens in joint-angle space. Every joint's limits form a simple
// box of allowed angles, so any mix of two allowed poses is also allowed:
// a blend can never bend a knee backwards. Everything is a function of time
// (no step-by-step drift), so results are the same at any frame rate.

const AXES = ['x','y','z'];

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

/** Every bone with an angle: missing bones at rest, everything inside its limits. */
export function fullPose(skeleton, pose={}){
 const out=skeleton.clampPose(Object.fromEntries(skeleton.bones.filter(b=>b.parent!==null).map(b=>[b.name,{...b.rest,...(pose[b.name]??{})}])));
 if(pose.root)out.root=pose.root;
 return out;
}

/**
 * Mix two full poses: t = 0 gives a, t = 1 gives b. `weight(bone)` (0..1)
 * limits which bones take part (a mask); by default every bone does.
 */
export function blend(a, b, t, weight=()=>1){
 const out={};
 for(const name of Object.keys(a)){
  if(name==='root'){out.root=a.root;continue;}
  const w=t*weight(name),pa=a[name],pb=b[name]??pa;
  out[name]={x:pa.x+(pb.x-pa.x)*w,y:pa.y+(pb.y-pa.y)*w,z:pa.z+(pb.z-pa.z)*w};
 }
 return out;
}

/** The same pose with left and right swapped (mirrored). */
export function mirror(skeleton, pose){ return skeleton.mirrorPose(pose); }

/**
 * A clip: keys = [{time, pose}] (pose may list only the bones it moves).
 * Between keys the angles follow a smooth curve through every key
 * (Catmull-Rom), so speed changes smoothly, including across the loop.
 */
export function createClip(keys, {loop=false, duration}={}){
 const sorted=[...keys].sort((a,b)=>a.time-b.time),length=duration??sorted.at(-1).time;
 const bones=[...new Set(sorted.flatMap(k=>Object.keys(k.pose)))];
 const value=(i,bone,axis)=>{
  const n=sorted.length;let k=i,shift=0;
  if(loop){shift=Math.floor(k/n)*length;k=((k%n)+n)%n;}else k=Math.max(0,Math.min(n-1,k));
  return {time:sorted[k].time+shift,v:sorted[k].pose[bone]?.[axis]};
 };
 function sample(time){
  const n=sorted.length,t=loop?((time%length)+length)%length:Math.max(0,Math.min(length,time));
  let i=0;while(i<n-1&&sorted[i+1].time<=t)i++;
  if(loop&&t<sorted[0].time)i=-1;
  const out={};
  for(const bone of bones){
   out[bone]={};
   for(const axis of AXES){
    const p0=value(i-1,bone,axis),p1=value(i,bone,axis),p2=value(i+1,bone,axis),p3=value(i+2,bone,axis);
    const v1=p1.v??0,v2=p2.v??v1,v0=p0.v??v1,v3=p3.v??v2,span=p2.time-p1.time;
    if(!(span>0)){out[bone][axis]=v1;continue;}
    const u=(t-p1.time)/span;
    // Catmull-Rom tangents, scaled for uneven key spacing.
    const m1=(v2-v0)/(p2.time-p0.time||span)*span,m2=(v3-v1)/(p3.time-p1.time||span)*span;
    const u2=u*u,u3=u2*u;
    out[bone][axis]=(2*u3-3*u2+1)*v1+(u3-2*u2+u)*m1+(-2*u3+3*u2)*v2+(u3-u2)*m2;
   }
  }
  return out;
 }
 return {sample,duration:length,loop,bones};
}

/**
 * Runs poses over time. Base: transitionTo(pose, {duration}). Each
 * transition starts from wherever the body is and how fast it is moving
 * (so an interrupted transition never jerks) and arrives exactly on time.
 * Layers: setLayer(name, {clip | pose, fade}) plays on top, only on the
 * bones it names, fading in; clearLayer(name, fade) fades it out.
 */
export function createPosePlayer(skeleton, start={}){
 let time=0,from=fullPose(skeleton,start),to=from,t0=0,len=0,startVel=zero(),startAcc=zero(),done=true;
 const layers=new Map();
 function zero(){return Object.fromEntries(Object.keys(fullPose(skeleton)).filter(k=>k!=='root').map(k=>[k,{x:0,y:0,z:0}]));}

 /**
  * Base pose, its speed (°/s) and how fast that speed is changing (°/s²) at
  * a time. Each transition is a quintic (fifth-power) curve that starts with
  * the position, speed and acceleration the body already has and ends at
  * the target, at rest. Starting from still, it is the gentle ease in/out.
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
   if(name==='root'){pose.root=to.root;continue;}
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
  from=now.pose;startVel=now.vel;startAcc=now.acc;to=fullPose(skeleton,target);t0=time;len=Math.max(0,duration);done=len===0;
  if(done)from=to;
 }

 function setLayer(name, {clip=null, pose=null, fade=.35, weight=1}={}){
  const old=layers.get(name),w=old?layerWeight(old,time):0;
  layers.set(name,{clip,pose,start:time,fadeFrom:w,fadeTo:weight,fadeStart:time,fade});
 }
 function clearLayer(name, fade=.35){
  const l=layers.get(name);if(!l)return;
  l.fadeFrom=layerWeight(l,time);l.fadeTo=0;l.fadeStart=time;l.fade=fade;l.clearing=true;
 }
 function layerWeight(l,at){
  const s=l.fade>0?Math.min(1,Math.max(0,(at-l.fadeStart)/l.fade)):1;
  return l.fadeFrom+(l.fadeTo-l.fadeFrom)*EASE.inOut(s);
 }

 /** Pose at the player's current time. */
 function poseAt(at){
  let pose=base(at).pose;
  for(const [name,l] of layers){
   const w=layerWeight(l,at);
   if(l.clearing&&w<=0&&at>=l.fadeStart+l.fade){layers.delete(name);continue;}
   if(w<=0)continue;
   const part=l.clip?l.clip.sample(at-l.start):l.pose,names=new Set(Object.keys(part));
   pose=blend(pose,fullPose(skeleton,{...pose,...part}),w,bone=>names.has(bone)?1:0);
  }
  return skeleton.clampPose(pose);
 }

 return {
  transitionTo,setLayer,clearLayer,
  /** Move time forward and return the pose for that moment. */
  update(dt){time+=dt;return poseAt(time);},
  poseAt,
  get time(){return time;},
  get layers(){return [...layers.keys()];},
 };
}
