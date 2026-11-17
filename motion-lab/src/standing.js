import * as T from 'three';

// Stage 1: standing still, alive. The feet stay planted exactly where they
// are; the body breathes and shifts its weight gently from foot to foot.
// Each leg turns as one rigid piece around its ankle so the thigh and calf
// always meet at the knee, and the foot is turned back so it stays flat.
export function createStanding(avatar){
 const {rig,lowerLegs}=avatar;
 rig.root.updateMatrixWorld(true);
 const bodyRest=rig.body.position.clone(),q=new T.Quaternion(),parentQ=new T.Quaternion(),e=new T.Euler();
 const v=new T.Vector3(),hipW=new T.Vector3();
 const base=new Map();
 for(const part of [rig.shoulderLeft,rig.shoulderRight,rig.elbowLeft,rig.elbowRight,rig.head])base.set(part,{p:part.position.clone(),r:part.rotation.clone()});
 const legs=lowerLegs.map(leg=>{
  const hip=leg.side===-1?rig.hipLeft:rig.hipRight,knee=hip.children.find(o=>o.isGroup);
  const ankleW=leg.motion.group.localToWorld(new T.Vector3().fromArray(leg.motion.pivot));
  const ankle=new T.Group();ankle.name=(leg.side===1?'right':'left')+'-ankle-pivot';
  ankle.position.copy(rig.root.worldToLocal(ankleW.clone()));rig.root.add(ankle);rig.root.updateMatrixWorld(true);ankle.attach(leg.mount);
  const H0=hip.getWorldPosition(new T.Vector3()),J0=knee.getWorldPosition(new T.Vector3());
  const u0=H0.clone().sub(ankleW).normalize(),off=J0.clone().sub(ankleW);
  const bend=off.clone().addScaledVector(u0,-off.dot(u0));if(bend.length()<1e-5)bend.set(0,0,1);bend.normalize();
  return {leg,hip,knee,ankle,ankleW,bend,L1:J0.distanceTo(H0),L2:J0.distanceTo(ankleW),
   thighDir:J0.clone().sub(H0).normalize(),calfDir:off.clone().normalize(),restLen:H0.distanceTo(ankleW),
   hipRestWorldQ:hip.getWorldQuaternion(new T.Quaternion())};
 });
 const deg=T.MathUtils.radToDeg,TAU=Math.PI*2,u=new T.Vector3(),w=new T.Vector3(),J=new T.Vector3(),q2=new T.Quaternion();
 // Two-bone solve: find the knee from the hip, the planted ankle and the
 // fixed thigh and calf lengths, bending forward like a real knee.
 function solveLegs(){
  rig.root.updateMatrixWorld(true);let stretch=-Infinity;
  for(const L of legs){
   L.hip.getWorldPosition(hipW);u.copy(hipW).sub(L.ankleW);const d0=u.length();stretch=Math.max(stretch,d0-L.restLen);
   const d=Math.min(d0,L.L1+L2safe(L));u.normalize();
   const x=(L.L2*L.L2-L.L1*L.L1+d*d)/(2*d),h=Math.sqrt(Math.max(0,L.L2*L.L2-x*x));
   w.copy(L.bend).addScaledVector(u,-L.bend.dot(u)).normalize();
   J.copy(L.ankleW).addScaledVector(u,x).addScaledVector(w,h);
   q2.setFromUnitVectors(L.calfDir,v.copy(J).sub(L.ankleW).normalize());L.ankle.quaternion.copy(q2);
   q.setFromUnitVectors(L.thighDir,v.copy(J).sub(hipW).normalize());
   L.hip.parent.getWorldQuaternion(parentQ);L.hip.quaternion.copy(parentQ.invert().multiply(q.multiply(L.hipRestWorldQ)));
   e.setFromQuaternion(q2,'XZY');
   L.leg.motion.setPose({ankle:-deg(e.x),roll:-L.leg.side*deg(e.z),toes:0,heel:0});
   L.leg.motion.group.position.y=0; // the foot is turned back flat, so no lift: it stays planted
  }
  return stretch;
 }
 const L2safe=L=>L.L2-1e-6;
 function update(t){
  const weight=Math.sin(t*TAU/7),sway=Math.sin(t*TAU/5.3+1),breath=Math.sin(t*TAU/4.2);
  rig.body.position.set(bodyRest.x+.013*weight,bodyRest.y,bodyRest.z+.004*sway);
  rig.body.rotation.set(.004*sway,0,.0065*weight); // hips tip slightly with the weight
  const stretch=solveLegs();if(stretch>0){rig.body.position.y-=stretch;solveLegs();} // never overstretch a leg
  const h=base.get(rig.head);rig.head.rotation.set(h.r.x-.006*breath,h.r.y,h.r.z-.0065*weight);
  for(const [s,side] of [[rig.shoulderLeft,-1],[rig.shoulderRight,1]]){
   const b=base.get(s);s.position.y=b.p.y+.0025*(breath*.5+.5);
   s.rotation.set(b.r.x+.012*Math.sin(t*TAU/5.3+.6),b.r.y,b.r.z-side*.006*(breath*.5+.5)-.008*weight);
  }
  rig.root.updateMatrixWorld(true);
  return {weight,breath};
 }
 update(0);
 return {update,legs,bodyRest};
}
