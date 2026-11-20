// Section 1 · Movement rules. Ground movement only (no jumps yet).
//
// A pure, drawing-free port of the 3D-WORLD-3 ground controller
// (Player.updateGround / targetSpeedFor / turnToward). Each moment it takes
// the stick as a world-space direction whose length is the stick strength
// (0..1), and works out position, facing, speed, and whether he is skidding
// (hard reversal at speed) or braking (let go at a run).
//
// step(dt, ...)    one update of exactly dt seconds: the old code, unchanged.
// advance(dt, ...) splits any frame into fixed small steps, so the result is
//                  the same at 30, 60 or 120 frames a second.
import {MOVE_TUNING} from './tuning.js';

const TAU=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;

export function createMoveController(tuning=MOVE_TUNING){
 const T=tuning;
 const s={x:0,z:0,vx:0,vz:0,facing:0,speed:0,skidding:false,braking:false,
  brakeRate:0,brakeStrength:0,momentum:0,mode:'idle'};
 let carry=0;

 // A gentle push walks, a full push runs, with a smooth range between.
 function targetSpeedFor(strength){
  return strength<=T.walkStick?lerp(0,T.walkSpeed,strength/T.walkStick)
   :lerp(T.walkSpeed,T.runSpeed,(strength-T.walkStick)/(1-T.walkStick));
 }
 // Turn toward a direction at a limited rate: quick when slow, wider when fast.
 function turnToward(dx,dz,dt,speed){
  const target=Math.atan2(dx,dz),rate=lerp(T.turnRateSlow,T.turnRateFast,clamp(speed/T.runSpeed,0,1));
  let diff=target-s.facing;while(diff>Math.PI)diff-=TAU;while(diff<-Math.PI)diff+=TAU;
  s.facing+=clamp(diff,-rate*dt,rate*dt);
 }

 function step(dt,wishX,wishZ){
  const strength=Math.min(1,Math.hypot(wishX,wishZ));
  let hx=s.vx,hz=s.vz;const speed=Math.hypot(hx,hz);
  if(strength>.001){
   const dx=wishX/Math.hypot(wishX,wishZ),dz=wishZ/Math.hypot(wishX,wishZ);
   s.braking=false;
   const target=targetSpeedFor(strength);
   // A hard reversal at speed is a skid: shed speed first, then turn.
   const alignment=speed>.01?(dx*hx+dz*hz)/speed:1;
   s.skidding=speed>T.skidMinSpeed&&alignment<T.skidDotThreshold;
   if(s.skidding){
    const ns=Math.max(0,speed-T.skidDeceleration*dt);if(speed>.001){hx*=ns/speed;hz*=ns/speed;}
   }else{
    turnToward(dx,dz,dt,speed);
    const fx=Math.sin(s.facing),fz=Math.cos(s.facing);
    // Speed is tracked along the facing; sideways drift from a turn bleeds
    // off separately, so he arcs into the new heading instead of sliding.
    const along=hx*fx+hz*fz;
    const newAlong=along<target?Math.min(target,along+T.acceleration*dt):Math.max(target,along-T.deceleration*dt);
    const keep=Math.max(0,1-T.deceleration*1.8*dt);
    const sx=(hx-fx*along)*keep,sz=(hz-fz*along)*keep;
    hx=fx*newAlong+sx;hz=fz*newAlong+sz;
   }
  }else{
   s.skidding=false;
   // Let go at a run: dig in and slide to a stop. How far depends on how
   // long he had been running (momentum).
   if(!s.braking&&speed>T.brakeMinSpeed){
    s.braking=true;
    const earned=Math.pow(s.momentum,T.brakeMomentumCurve);
    const slide=lerp(T.brakeSlideShort,T.brakeSlideLong,earned);
    s.brakeRate=speed*speed/(2*Math.max(.1,slide));s.brakeStrength=earned;
   }
   if(s.braking&&speed<T.brakeEndSpeed)s.braking=false;
   const ns=Math.max(0,speed-(s.braking?s.brakeRate:T.deceleration)*dt);
   if(speed>.001){hx*=ns/speed;hz*=ns/speed;}
  }
  s.vx=hx;s.vz=hz;
  const now=Math.hypot(hx,hz);
  if(now>T.brakeMinSpeed&&!s.braking)s.momentum=Math.min(1,s.momentum+dt/T.brakeMomentumBuild);
  else if(!s.braking)s.momentum=Math.max(0,s.momentum-dt/T.brakeMomentumFade);
  s.x+=s.vx*dt;s.z+=s.vz*dt;s.speed=now;
  s.mode=s.braking?'brake':s.skidding?'skid':now>T.walkSpeed+.6?'run':now>.25?'walk':'idle';
  return s;
 }

 function advance(frameDt,wishX,wishZ){
  carry+=Math.min(frameDt,.25);
  while(carry>=T.fixedStep-1e-9){step(T.fixedStep,wishX,wishZ);carry-=T.fixedStep;}
  return s;
 }

 function place(x=0,z=0,facing=0){Object.assign(s,{x,z,facing,vx:0,vz:0,speed:0,skidding:false,braking:false,momentum:0,mode:'idle'});carry=0;}
 return {state:s,step,advance,place,targetSpeedFor};
}
