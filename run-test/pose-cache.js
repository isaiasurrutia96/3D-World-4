import * as T from 'three';

// Capture during the existing contact-analysis pass. Playback interpolates
// transforms and surface samples; it never rebuilds or smooths a mesh.
export function createPoseCache(motion){
 const nodes=[motion.rig.body,motion.spine,...motion.legs.flatMap(l=>[l.hip,l.calf,l.foot]),...motion.arms.flatMap(a=>[a.shoulder,a.elbow])],frames=[],surfaces=[],scratch=new T.Vector3();
 function capture(f){
  frames[f]={nodes:nodes.map(o=>({p:o.position.clone(),q:o.quaternion.clone()})),legs:motion.legs.map(l=>({h:l.toeBend,rear:l.motion.rear.clone()}))};
  if(f%2===0)surfaces.push(motion.legs.map(l=>[l.foot,l.calf].map(mesh=>({p:mesh.geometry.attributes.position.array.slice(),n:mesh.geometry.attributes.normal.array.slice()}))));
 }
 function interpolate(target,a,b,t){for(let i=0;i<target.length;i++)target[i]=a[i]+(b[i]-a[i])*t;}
 function sample(frame){
  const f=((frame%77)+77)%77,i=Math.floor(f),t=f-i,a=frames[i],b=frames[(i+1)%77],si=Math.floor(f/2),st=(f-si*2)/(si===38?1:2),sa=surfaces[si],sb=surfaces[(si+1)%39];
  nodes.forEach((o,j)=>{o.position.copy(a.nodes[j].p).lerp(b.nodes[j].p,t);o.quaternion.copy(a.nodes[j].q).slerp(b.nodes[j].q,t);});
  motion.root.updateMatrixWorld(true);
  motion.legs.forEach((l,j)=>{
   l.toeBend=T.MathUtils.lerp(a.legs[j].h,b.legs[j].h,t);
   const ra=frames[si*2].legs[j].rear.elements,rb=frames[si===38?0:(si+1)*2].legs[j].rear.elements;interpolate(l.motion.rear.elements,ra,rb,st);
   [l.foot,l.calf].forEach((mesh,k)=>{const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;interpolate(p.array,sa[j][k].p,sb[j][k].p,st);interpolate(n.array,sa[j][k].n,sb[j][k].n,st);p.needsUpdate=n.needsUpdate=true;});
   // Re-seat joints after quaternion interpolation, keeping both bone lengths
   // exact instead of linearly interpolating independent joint positions.
   l.hip.getWorldPosition(l.H);l.knee.getWorldPosition(l.K);l.A.copy(l.K).addScaledVector(scratch.set(0,1,0).applyQuaternion(l.calf.quaternion),-l.lower);
   l.calf.position.copy(l.K).addScaledVector(scratch,-.17).sub(motion.root.position);
   l.motion.anklePoint(scratch);scratch.x*=l.side;l.foot.position.copy(l.A).sub(scratch.applyQuaternion(l.foot.quaternion)).sub(motion.root.position);
  });
  motion.root.updateMatrixWorld(true);motion.frame=f;
 }
 return {capture,sample,bytes:()=>surfaces.reduce((sum,s)=>sum+s.flat().reduce((n,g)=>n+g.p.byteLength+g.n.byteLength,0),0),frames};
}
