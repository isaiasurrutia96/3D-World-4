import * as T from 'three';
import {lengthenDigits} from './lengthen-digits.js';
import {easeDigitSweep} from './ease-digit-sweep.js';

// Bind the existing surface to gentle finger bends, without replacing any
// shapes. Index -> little finger progressively relax further into the palm.
const digits=[
 {root:[225,199],tip:[260,79],radius:46,angles:[10,18,7]},
 {root:[300,214],tip:[353,92],radius:46,angles:[13,23,8]},
 {root:[350,242],tip:[410,154],radius:43,angles:[16,28,10]},
 {root:[371,287],tip:[438,249],radius:37,angles:[20,30,12]},
 {root:[162,267],tip:[131,190],radius:45,angles:[8,10,0]},
];
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

export function poseRestingDigits(geometry,side,bindPositions){
 // Sample each accepted centreline after the extensions and sweep easing.
 // Integrating its bent tangent preserves length, while rotating each
 // cross-section preserves the softly rounded volume through the bends.
 const steps=512,range=1.6,jointPositions=[];
 for(const d of digits)for(let j=0;j<=steps;j++){
  const t=j/steps*range;
  jointPositions.push((d.root[0]+(d.tip[0]-d.root[0])*t-244)*.0008*side,
   (d.root[1]+(d.tip[1]-d.root[1])*t-285)*.0008,0);
 }
 const joints=new T.BufferGeometry();
 joints.setAttribute('position',new T.Float32BufferAttribute(jointPositions,3));
 lengthenDigits(joints,side);easeDigitSweep(joints,side);
 const jp=joints.attributes.position;
 const bindings=digits.map((d,i)=>{
  const angle=t=>T.MathUtils.degToRad(d.angles[0]*smooth(0,.32,t)
   +d.angles[1]*smooth(.25,.72,t)+d.angles[2]*smooth(.62,1.04,t));
  const samples=[],correction=new T.Vector3();
  for(let j=0;j<=steps;j++){
   const t=j/steps*range,base=new T.Vector3().fromBufferAttribute(jp,i*(steps+1)+j);
   if(j){
    const step=base.clone().sub(samples[j-1].base),theta=angle((j-.5)/steps*range);
    correction.addScaledVector(step,Math.cos(theta)-1);
    correction.z+=step.length()*Math.sin(theta);
   }
   const previous=new T.Vector3().fromBufferAttribute(jp,i*(steps+1)+Math.max(0,j-1));
   const next=new T.Vector3().fromBufferAttribute(jp,i*(steps+1)+Math.min(steps,j+1));
   const direction=next.sub(previous).normalize();
   samples.push({base,correction:correction.clone(),axis:new T.Vector3(direction.y,-direction.x,0),angle:angle(t)});
  }
  const dx=d.tip[0]-d.root[0],dy=d.tip[1]-d.root[1],length=Math.hypot(dx,dy);
  return {...d,length,ux:dx/length,uy:dy/length,samples};
 });
 const p=geometry.attributes.position,point=new T.Vector3(),base=new T.Vector3(),correction=new T.Vector3(),axis=new T.Vector3(),offset=new T.Vector3(),change=new T.Vector3(),delta=new T.Vector3();
 let maxDisplacement=0;
 for(let i=0;i<p.count;i++){
  const px=bindPositions[i*3]*side/.0008+244,py=bindPositions[i*3+1]/.0008+285;
  // The rounded attachment and lower palm remain exactly fixed.
  if(py>=300)continue;
  const palmProtection=1-smooth(285,300,py);
  point.fromBufferAttribute(p,i);delta.set(0,0,0);let totalWeight=0;
  for(const d of bindings){
   const rx=px-d.root[0],ry=py-d.root[1],along=rx*d.ux+ry*d.uy;
   const q=T.MathUtils.clamp(along,0,d.length),distanceSq=(rx-q*d.ux)**2+(ry-q*d.uy)**2;
   const weight=Math.exp(-8*distanceSq/(d.radius*d.radius));
   totalWeight+=weight;
   if(along<=0||weight<1e-10)continue;
   const t=T.MathUtils.clamp(along/d.length/range*steps,0,steps),index=Math.min(steps-1,Math.floor(t)),f=t-index;
   const a=d.samples[index],b=d.samples[index+1];
   base.copy(a.base).lerp(b.base,f);
   correction.copy(a.correction).lerp(b.correction,f);
   axis.copy(a.axis).lerp(b.axis,f).normalize();
   offset.copy(point).sub(base);
   change.copy(offset).applyAxisAngle(axis,T.MathUtils.lerp(a.angle,b.angle,f)).sub(offset).add(correction);
   delta.addScaledVector(change,weight*palmProtection);
  }
  if(totalWeight<1e-8)continue;
  delta.divideScalar(totalWeight);
  maxDisplacement=Math.max(maxDisplacement,delta.length());
  p.setXYZ(i,point.x+delta.x,point.y+delta.y,point.z+delta.z);
 }
 geometry.userData.restingFingerAngles=digits.map(d=>d.angles);
 geometry.userData.restingPoseMaxDisplacement=maxDisplacement;
 joints.dispose();
 return geometry;
}
