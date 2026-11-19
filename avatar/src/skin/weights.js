import * as T from 'three';
import {PART,smooth} from './field.js';

// Appearance binding only. The motion skeleton remains the authority for
// pivots, limits and pose angles; no animation or input lives here.
export function bindSurfaceWeights(geometry,field){
 const {skeleton,chain,components}=field,P=geometry.attributes.position,n=P.count;
 const indices=new Uint16Array(n*4),weights=new Float32Array(n*4),parts=new Uint8Array(n),all=new Float64Array(skeleton.bones.length);
 const add=(name,w)=>{if(w>1e-12)all[skeleton.index.get(name)]+=w;};
 function body(w,x,y,z){
  const a=smooth(1.00,1.15,y),b=smooth(1.14,1.36,y);
  // Both shoulder caps follow their collarbone fully; the torso between
  // them retains a broad, gentle waist-to-chest transition.
  const sh=skeleton.bones[skeleton.index.get('upperArm.L')].head;
  const shoulder=(1-smooth(.105,.19,Math.hypot(x-sh[0],y-sh[1],z-sh[2])))*smooth(1.11,1.18,y);
  add('clavicle.L',w*shoulder);w*=1-shoulder;
  add('pelvis',w*(1-a));add('spine',w*a*(1-b));add('chest',w*a*b);
 }
 function part(id,w,x,y,z){
  let s,e,q;
  switch(id){
   case PART.torso:body(w,x,y,z);break;
   case PART.head:add('head',w);break;
   case PART.neck:q=smooth(1.37,1.50,y);add('chest',w*(1-q));add('neck',w*q);break;
   case PART.upperArm:s=chain.upperArm.along(x,y,z);e=smooth(-.045,.085,s);q=smooth(chain.upperArm.length-.065,chain.upperArm.length+.065,s);add('clavicle.L',w*(1-e));add('upperArm.L',w*e*(1-q));add('lowerArm.L',w*e*q);break;
   case PART.forearm:s=chain.forearm.along(x,y,z);e=smooth(-.065,.065,s);q=smooth(chain.forearm.length-.065,chain.forearm.length+.065,s);add('upperArm.L',w*(1-e));add('lowerArm.L',w*e*(1-q));add('hand.L',w*e*q);break;
   case PART.hand:s=chain.forearm.along(x,y,z);q=smooth(chain.forearm.length-.065,chain.forearm.length+.04,s);add('lowerArm.L',w*(1-q));add('hand.L',w*q);break;
   case PART.thigh:s=chain.thigh.along(x,y,z);e=smooth(-.055,.075,s);q=smooth(chain.thigh.length-.06,chain.thigh.length+.06,s);add('pelvis',w*(1-e));add('thigh.L',w*e*(1-q));add('shin.L',w*e*q);break;
   case PART.calf:s=chain.calf.along(x,y,z);e=smooth(-.06,.06,s);q=smooth(chain.calf.length-.055,chain.calf.length+.055,s);add('thigh.L',w*(1-e));add('shin.L',w*e*(1-q));add('foot.L',w*e*q);break;
   case PART.foot:s=chain.calf.along(x,y,z);q=smooth(chain.calf.length-.045,chain.calf.length+.045,s);add('shin.L',w*(1-q));add('foot.L',w*q);break;
   default:throw Error('Unknown skin region');
  }
 }
 for(let i=0;i<n;i++){
  const x=P.getX(i),y=P.getY(i),z=P.getZ(i),sample=field.sample(x,y,z),hand=geometry.attributes.handMask?.getX(i)??0;all.fill(0);parts[i]=hand>.5?PART.hand:sample.part;
  for(let j=0;j<components.length;j++)if(sample.weights[j]>1e-9)part(components[j].id,sample.weights[j]*(1-hand),Math.abs(x),y,z);
  if(hand>0)part(PART.hand,hand,Math.abs(x),y,z);
  const top=[];for(let j=0;j<all.length;j++)if(all[j]>1e-10)top.push([j,all[j]]);
  top.sort((a,b)=>b[1]-a[1]||a[0]-b[0]);top.length=Math.min(4,top.length);const total=top.reduce((a,b)=>a+b[1],0);if(!(total>0))throw Error('Unbound skin vertex '+i);
  for(let k=0;k<top.length;k++){
   const [j,w]=top[k],name=skeleton.bones[j].name;
   indices[4*i+k]=x<0&&name.endsWith('.L')?skeleton.index.get(name.replace('.L','.R')):j;
   weights[4*i+k]=w/total;
  }
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.setAttribute('part',new T.Uint8BufferAttribute(parts,1));
 geometry.userData.skin={version:1,method:'dual-quaternion',boneNames:skeleton.bones.map(b=>b.name),jointHeads:skeleton.bones.map(b=>b.head.map(v=>v===0?0:v)),parts:PART,fingerSkin:false,toeSkin:false};
 return geometry;
}
