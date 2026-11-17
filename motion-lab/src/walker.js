import * as T from 'three';

// Claude's movement test. The feet lead: a planted foot never moves until it
// lifts; the body travels; a foot steps only when it falls too far behind
// its spot under the hip. Legs are solved hip -> knee -> ankle each frame.
// Stage 1: standing (breathing, weight shift). Stage 2: slow walk.

export const TUNING={
 walkSpeed:1.25,   // m/s, top speed for stage 2 (slow walk only)
 accel:3.5,        // m/s^2 speeding up
 brake:5,          // m/s^2 slowing down
 turnRate:7,       // rad/s the body turns toward travel
 swingTime:.3,    // s a foot is in the air at walking speed
 stepHeight:.07,   // m the foot lifts mid-step
 heelRaise:12,     // degrees the back heel lifts before toe-off
 armSwing:.32,     // radians the arms swing at walking speed
};

const TAU=Math.PI*2,deg=T.MathUtils.radToDeg,clamp=T.MathUtils.clamp,smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
const UP=new T.Vector3(0,1,0),X=new T.Vector3(1,0,0);
const yawQ=(y,out=new T.Quaternion())=>out.setFromAxisAngle(UP,y);
const angleTo=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

export function createWalker(avatar){
 const {rig,lowerLegs}=avatar;
 rig.root.updateMatrixWorld(true);
 const rootPos=rig.root.position.clone(),bodyRest=rig.body.position.clone();
 const base=new Map();
 for(const p of [rig.shoulderLeft,rig.shoulderRight,rig.elbowLeft,rig.elbowRight,rig.head])base.set(p,{p:p.position.clone(),r:p.rotation.clone()});

 const legs=lowerLegs.map(leg=>{
  const side=leg.side,hip=side===-1?rig.hipLeft:rig.hipRight,knee=hip.children.find(o=>o.isGroup);
  const A0=leg.motion.group.localToWorld(new T.Vector3().fromArray(leg.motion.pivot));
  const ankle=new T.Group();ankle.name=(side===1?'right':'left')+'-ankle-pivot';
  ankle.position.copy(A0).sub(rootPos);rig.root.add(ankle);rig.root.updateMatrixWorld(true);ankle.attach(leg.mount);
  const H0=hip.getWorldPosition(new T.Vector3()),J0=knee.getWorldPosition(new T.Vector3());
  // How far the ankle pivot moves (in the foot's own frame) as the heel lifts.
  const heelTable=[];
  for(let h=0;h<=30;h++){leg.motion.setPose({ankle:0,roll:0,toes:0,heel:h});heelTable.push(leg.calf.position.clone().sub(leg.restCalfPosition));}
  leg.motion.setPose({ankle:0,roll:0,toes:0,heel:0});leg.motion.group.position.y=0;
  return {leg,side,hip,knee,ankle,mountRest:leg.mount.position.clone(),heelTable,
   home:new T.Vector3(A0.x-bodyRest.x,0,A0.z-bodyRest.z),ankleHeight:A0.y,
   L1:J0.distanceTo(H0),L2:J0.distanceTo(A0),restLen:H0.distanceTo(A0),
   thighDir:J0.clone().sub(H0).normalize(),calfDir:J0.clone().sub(A0).normalize(),
   hipRestQ:hip.getWorldQuaternion(new T.Quaternion()),
   pos:new T.Vector3(A0.x,0,A0.z),yaw:0,heel:0,pitch:0,swing:null,last:{ankle:0,roll:0,heel:0}};
 });

 const state={pos:new T.Vector3(0,0,0),vel:new T.Vector3(),facing:0,speed:0,idle:1,time:0,lastStep:1,steps:0};
 const tmp={a:new T.Vector3(),b:new T.Vector3(),c:new T.Vector3(),u:new T.Vector3(),w:new T.Vector3(),J:new T.Vector3(),H:new T.Vector3(),
  q:new T.Quaternion(),q2:new T.Quaternion(),rf:new T.Quaternion(),rb:new T.Quaternion(),p:new T.Quaternion(),e:new T.Euler()};

 function homeOf(L,pos,facing,out){return out.copy(L.home).applyQuaternion(yawQ(facing,tmp.q)).add(pos);}
 function heelDelta(L,h){const i=Math.min(29,Math.floor(h)),t=h-i;return tmp.c.copy(L.heelTable[i]).lerp(L.heelTable[i+1],t);}

 // Where the ankle pivot of a foot is in the world right now.
 function anklePoint(L,out,heel=L.heel){
  const d=heelDelta(L,heel);yawQ(L.yaw,tmp.rf);
  return out.set(L.side*d.x,L.ankleHeight+d.y,d.z).applyQuaternion(tmp.rf).add(L.pos);
 }

 const shownHeel=L=>(Math.abs(L.heel-L.last.heel)>(L.swing?3:.75)||(L.heel===0&&L.last.heel!==0))?L.heel:L.last.heel;
 function solveLeg(L,bodyYaw){
  // The heel shape is only redone in steps; use the heel actually shown.
  const heel=shownHeel(L);
  const A=anklePoint(L,tmp.a,heel),H=L.hip.getWorldPosition(tmp.H),u=tmp.u.copy(H).sub(A);
  const d0=u.length(),d=Math.min(d0,L.L1+L.L2-1e-5);u.normalize();
  const x=(L.L2*L.L2-L.L1*L.L1+d*d)/(2*d),h=Math.sqrt(Math.max(0,L.L2*L.L2-x*x));
  const w=tmp.w.set(Math.sin(bodyYaw),0,Math.cos(bodyYaw));w.addScaledVector(u,-w.dot(u)).normalize();
  const J=tmp.J.copy(A).addScaledVector(u,x).addScaledVector(w,h);
  // Lower leg: turn around the ankle so the calf meets the knee.
  yawQ(L.yaw,tmp.rf);
  const tilt=tmp.q.setFromUnitVectors(tmp.b.copy(L.calfDir).applyQuaternion(tmp.rf),tmp.c.copy(J).sub(A).normalize());
  L.ankle.position.copy(A).sub(rootPos);L.ankle.quaternion.copy(tilt).multiply(tmp.rf);
  const d2=heelDelta(L,heel);L.ankle.updateMatrix();
  L.leg.mount.position.set(L.mountRest.x-L.side*d2.x,L.mountRest.y-d2.y,L.mountRest.z-d2.z);
  // Foot: turned back so it keeps its own direction and pitch.
  const extra=tmp.q2.copy(tmp.rf).invert().multiply(tmp.p.copy(tilt).invert()).multiply(tmp.rf).multiply(new T.Quaternion().setFromAxisAngle(X,T.MathUtils.degToRad(L.pitch)));
  tmp.e.setFromQuaternion(extra,'ZXY');
  L.req={ankle:deg(tmp.e.x),roll:L.side*deg(tmp.e.z),yaw:deg(tmp.e.y)};
  L.resid=L.req.ankle-clamp(L.req.ankle,-18,24); // what the ankle can't reach
  const pose={ankle:clamp(deg(tmp.e.x),-18,24),roll:clamp(L.side*deg(tmp.e.z),-10,10),toes:0,heel};
  // Reshaping the foot is costly, so only redo it when the angle has moved
  // enough; the small difference in between is a plain turn of the foot
  // around the ankle (too small to show at the socket).
  const lim=L.swing?4:1.5;
  if(Math.abs(pose.ankle-L.last.ankle)>lim||Math.abs(pose.roll-L.last.roll)>lim||pose.heel!==L.last.heel){
   L.leg.motion.setPose(pose);L.leg.motion.group.position.y=0;L.last=pose;
  }
  const r=T.MathUtils.degToRad,res=tmp.q2.setFromEuler(new T.Euler(0,0,r(pose.roll),'XYZ')).multiply(new T.Quaternion().setFromAxisAngle(X,r(pose.ankle)))
   .multiply(new T.Quaternion().setFromEuler(new T.Euler(0,0,r(L.last.roll))).multiply(new T.Quaternion().setFromAxisAngle(X,r(L.last.ankle))).invert());
  const piv=tmp.b.fromArray(L.leg.motion.pivot).add(heelDelta(L,L.last.heel));
  L.leg.foot.quaternion.copy(res);L.leg.foot.position.copy(piv).sub(tmp.c.copy(piv).applyQuaternion(res));
  // Thigh: from the hip toward the knee.
  yawQ(bodyYaw,tmp.rb);
  const thigh=tmp.q.setFromUnitVectors(tmp.b.copy(L.thighDir).applyQuaternion(tmp.rb),tmp.c.copy(J).sub(H).normalize());
  L.hip.parent.getWorldQuaternion(tmp.p);
  L.hip.quaternion.copy(tmp.p.invert().multiply(thigh.multiply(tmp.rb)).multiply(L.hipRestQ));
  return d0-L.restLen;
 }

 function update(dt,wishX,wishZ){
  state.time+=dt;const t=state.time;
  // ---- Travel: speed up / slow down toward the stick, turn toward travel.
  const amount=Math.min(1,Math.hypot(wishX,wishZ)),target=tmp.a.set(wishX,0,wishZ);
  if(amount>0)target.setLength(amount*TUNING.walkSpeed);
  const dv=tmp.b.copy(target).sub(state.vel),rate=(amount>0&&state.vel.dot(target)>=0?TUNING.accel:TUNING.brake)*dt;
  if(dv.length()>rate)dv.setLength(rate);state.vel.add(dv);if(amount===0&&state.vel.length()<.02)state.vel.set(0,0,0);
  state.speed=state.vel.length();
  if(amount>0){const want=Math.atan2(wishX,wishZ);state.facing+=angleTo(state.facing,want)*Math.min(1,TUNING.turnRate*dt);}
  state.pos.addScaledVector(state.vel,dt);
  const s=state.speed,sn=s/TUNING.walkSpeed,T_=TUNING.swingTime;

  // ---- Feet: step when a planted foot falls behind its spot under the hip.
  let swinging=legs.find(L=>L.swing);
  // A standing foot whose ankle is at its limit may lift as the other foot
  // touches down (the last few centimetres of its step).
  if(swinging&&swinging.swing.t>.8){const o=legs.find(L=>L!==swinging);if(s>.05&&o.req&&o.req.ankle<-13){
   o.swing={from:o.pos.clone(),fromYaw:o.yaw,heel:o.heel,t:0,dur:T_,height:TUNING.stepHeight};state.lastStep=legs.indexOf(o);state.steps++;}}
  if(!swinging){
   const order=state.lastStep===0?[1,0]:[0,1];
   for(const i of order){
    const L=legs[i],goal=homeOf(L,tmp.a.copy(state.pos).addScaledVector(state.vel,T_*.35),state.facing,tmp.b);
    const err=Math.hypot(L.pos.x-goal.x,L.pos.z-goal.z),turn=Math.abs(angleTo(L.yaw,state.facing));
    const need=s>.05?Math.max(.05,s*T_*.45):.045;
    const strained=s>.05&&L.req&&L.req.ankle<-13; // the ankle is at its limit: time to step
    if(err>need||turn>.35||strained){
     L.swing={from:L.pos.clone(),fromYaw:L.yaw,heel:L.heel,t:0,dur:s>.05?T_:.32,height:Math.min(TUNING.stepHeight,.025+err*.25)};
     state.lastStep=i;state.steps++;break;
    }
   }
  }
  for(const L of legs){
   if(L.swing){
    const S=L.swing,partner=legs.find(o=>o!==L),strain=partner.req?clamp((-9-partner.req.ankle)/3,0,3):0;
    S.t=Math.min(1,S.t+dt/S.dur*(1+strain)); // standing ankle near its limit: land sooner
    // Aim for where the hip will be at landing, a little ahead of it.
    const left=(1-S.t)*S.dur,goal=homeOf(L,tmp.a.copy(state.pos).addScaledVector(state.vel,left+S.dur*.35),state.facing,tmp.b);
    const k=smooth(0,1,S.t);
    L.pos.set(T.MathUtils.lerp(S.from.x,goal.x,k),S.height*Math.sin(Math.PI*S.t),T.MathUtils.lerp(S.from.z,goal.z,k));
    L.yaw=S.fromYaw+angleTo(S.fromYaw,state.facing)*k;
    L.heel=S.heel*(1-smooth(0,.35,S.t));                    // toe leaves the ground, foot levels out
    L.pitch=-6*smooth(.45,.8,S.t)*(1-smooth(.85,1,S.t))*sn; // toes lift a little before landing
    L.pos.y+=Math.abs(Math.sin(T.MathUtils.degToRad(L.pitch)))*.09;
    if(L.resid)L.pos.y=Math.max(L.pos.y,Math.abs(Math.sin(T.MathUtils.degToRad(L.resid)))*(L.resid<0?.17:.08)*Math.min(1,S.t*20)); // toes or heel clear the floor
    if(S.t>=1){L.pos.y=0;L.pitch=0;L.heel=0;L.swing=null;}
   }else{
    // Planted: stays exactly where it is. The heel peels up as the body passes.
    const other=legs.find(o=>o!==L&&o.swing),fwd=tmp.a.set(Math.sin(state.facing),0,Math.cos(state.facing));
    const behind=-fwd.dot(tmp.b.copy(L.pos).sub(homeOf(L,state.pos,state.facing,tmp.c)));
    const want=other&&s>.05?TUNING.heelRaise*sn*smooth(.05,Math.max(.06,s*T_*.55),behind):0;
    L.heel+= (want-L.heel)*Math.min(1,dt*14);if(L.heel<.01)L.heel=0;
   }
  }

  // ---- Body: over the feet, bobbing and swaying toward the standing foot.
  const moving=s>.05||legs.some(L=>L.swing);
  state.idle=clamp(state.idle+(moving?-dt*3:dt*1.2),0,1);
  const sw=legs.find(L=>L.swing),p=sw?sw.swing.t:0,stanceSide=sw?-sw.side:0;
  const weight=Math.sin(t*TAU/7),sway=Math.sin(t*TAU/5.3+1),breath=Math.sin(t*TAU/4.2),id=state.idle;
  const lateral=tmp.u.set(Math.cos(state.facing),0,-Math.sin(state.facing));
  const side=.012*sn*Math.sin(Math.PI*p)*stanceSide+.013*weight*id;
  rig.body.position.set(state.pos.x+bodyRest.x,bodyRest.y-.004*sn+.006*sn*Math.sin(Math.PI*p),state.pos.z+bodyRest.z)
   .addScaledVector(lateral,side).add(tmp.w.set(0,0,.004*sway*id).applyQuaternion(yawQ(state.facing,tmp.q)));
  rig.body.quaternion.copy(yawQ(state.facing,tmp.q)).multiply(new T.Quaternion().setFromEuler(new T.Euler(.05*sn+.004*sway*id,0,-.03*side,'XYZ')));
  rig.root.updateMatrixWorld(true);
  let stretch=Math.max(...legs.map(L=>{rig.root.updateMatrixWorld(true);return L.hip.getWorldPosition(tmp.H).distanceTo(anklePoint(L,tmp.a,shownHeel(L)))-L.restLen;}));
  if(stretch>0){rig.body.position.y-=stretch;rig.root.updateMatrixWorld(true);}
  for(const L of legs)solveLeg(L,state.facing);

  // ---- Upper body: arms swing opposite the legs, from where the feet really are.
  const fwd=tmp.a.set(Math.sin(state.facing),0,Math.cos(state.facing));
  const lead=clamp((fwd.dot(legs[1].pos)-fwd.dot(legs[0].pos))/(TUNING.walkSpeed*T_),-1,1); // + right foot ahead
  const h=base.get(rig.head);rig.head.rotation.set(h.r.x-.006*breath*id-.03*sn,h.r.y,h.r.z-.0065*weight*id);
  for(const [sh,el,sd] of [[rig.shoulderLeft,rig.elbowLeft,-1],[rig.shoulderRight,rig.elbowRight,1]]){
   const b=base.get(sh),be=base.get(el),swing=TUNING.armSwing*lead*sd*sn;
   sh.position.y=b.p.y+.0025*(breath*.5+.5)*id;
   sh.rotation.set(b.r.x+swing+.012*Math.sin(t*TAU/5.3+.6)*id,b.r.y,b.r.z-sd*.006*(breath*.5+.5)*id-.008*weight*id);
   el.rotation.set(be.r.x-.18*sn-Math.max(0,-swing)*.4,be.r.y,be.r.z);
  }
  rig.root.updateMatrixWorld(true);
  return state;
 }
 update(0,0,0);
 return {update,state,legs};
}
