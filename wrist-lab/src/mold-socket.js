import * as T from 'three';
import {createSocketRoundover,originalSurface} from '../../foot-lab/src/socket-roundover.js';
import {refineMoldSurface} from '../../foot-lab/src/refine-mold-surface.js';
import {FOOT_SOCKET_MOLD} from '../../foot-lab/src/ball-mold.js';

// Remove zero-volume triangles already present in the saved implicit hand.
// Vertex numbers stay fixed, including the finger binding's original order.
export function cleanHandFaces(g){
 const groups=new Map(),source=g.index.array;
 for(let i=0;i<source.length;i+=3){const f=Array.from(source.slice(i,i+3));if(new Set(f).size<3)continue;const sorted=[...f].sort((a,b)=>a-b),key=sorted.join(','),k=f.indexOf(sorted[0]),sign=f[(k+1)%3]===sorted[1]?1:-1;if(!groups.has(key))groups.set(key,{sum:0,faces:[]});const entry=groups.get(key);entry.sum+=sign;entry.faces.push({f,sign});}
 const faces=[];for(const entry of groups.values()){if(!entry.sum)continue;if(Math.abs(entry.sum)!==1)throw Error('Unexpected overlapping hand faces');faces.push(...entry.faces.find(f=>f.sign===entry.sum).f);}g.setIndex(faces);
}

export function makeHandFuller(hand,amount=.002){
 const g=hand.geometry,p=g.attributes.position,n=g.attributes.normal;
 cleanHandFaces(g);const localAmount=amount/hand.scale.x;
 for(let i=0;i<p.count;i++){const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),length=Math.hypot(nx,ny,nz)||1;p.setXYZ(i,p.getX(i)+localAmount*nx/length,p.getY(i)+localAmount*ny/length,p.getZ(i)+localAmount*nz/length);}
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();hand.userData.surfaceGrowth=amount;
}

function surfaceHeight(g,x,z){
 const p=g.attributes.position,index=g.index.array,ray=new T.Ray(new T.Vector3(x,g.boundingBox.max.y+1,z),new T.Vector3(0,-1,0)),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),hit=new T.Vector3();let height=-Infinity;
 for(let i=0;i<index.length;i+=3){a.fromBufferAttribute(p,index[i]);b.fromBufferAttribute(p,index[i+1]);c.fromBufferAttribute(p,index[i+2]);if(ray.intersectTriangle(a,b,c,false,hit))height=Math.max(height,hit.y);}
 if(!Number.isFinite(height))throw Error('The wrist ball mold must be over the part');return height;
}

/** Same real rolling-circle rim as the accepted ankle. No flat cap trims. */
export function moldWristSocket(part,{radius,depthFraction,underside=false,filletRadius=radius*FOOT_SOCKET_MOLD.filletRadius/FOOT_SOCKET_MOLD.ballRadius,centerXZ}){
 const g=part.geometry,localPositions=g.attributes.position.array.slice(),localNormals=g.attributes.normal.array.slice();
 const orientation=new T.Matrix4().compose(new T.Vector3(),part.quaternion,part.scale);
 const half=new T.Matrix4().makeScale(1,-1,-1),toMold=underside?half.multiply(orientation):orientation,back=toMold.clone().invert();
 g.applyMatrix4(toMold);g.computeBoundingBox();const p=g.attributes.position;
 let cx=0,cz=0;
 if(centerXZ){[cx,cz]=centerXZ;}
 else if(!underside){let top=-Infinity;for(let i=0;i<p.count;i++)top=Math.max(top,p.getY(i));let count=0;for(let i=0;i<p.count;i++)if(p.getY(i)>top-.001){cx+=p.getX(i);cz+=p.getZ(i);count++;}cx/=count;cz/=count;}
 const sample=originalSurface(g),rayHeight=surfaceHeight(g,cx,cz);
 // An exact pole/triangle-edge ray can miss the upper cap. The same
 // barycentric surface sampler used by the fillet supplies that missing hit.
 const originalHeight=Math.max(rayHeight,sample(cx,cz)?.height??-Infinity),socketDepth=2*radius*depthFraction;
 // Depth is the ball cap captured from the actual spherical contact rim to
 // the pole. A rounded source tip sits proud of that rim: merely pressing
 // by D/3 from that tip leaves much less than one-third of the ball seated.
 function measure(press){
  const mold={center:[cx,originalHeight-press+radius,cz],ballRadius:radius,filletRadius,pressDepth:press,socketDepth,depthFraction,originalHeight};
  // Eight actual radial sections define the capture measurement. Rebuild
  // at full resolution once the depth is solved, rather than 256 anchors
  // for every calibration step on every phone load.
  let roundover;try{roundover=createSocketRoundover(g,mold,sample,8);}catch(error){throw Error(`${part.name}: mold press ${press} cannot fit (${error.message})`);}
  const depths=roundover.sections.map(s=>radius-mold.center[1]+s.innerY);
  return {mold,roundover,depth:depths.reduce((a,b)=>a+b,0)/depths.length,depths};
 }
 let low=measure(socketDepth),high=null,step=radius*.10;
 for(let i=0;i<32&&!high;i++){
  let trial;try{trial=measure(low.mold.pressDepth+step);}catch(error){step*=.5;if(step<1e-7)throw Error('The requested wrist cap depth does not fit this part');continue;}
  if(trial.depth>=socketDepth)high=trial;else low=trial;
 }
 if(!high||low.depth>socketDepth)throw Error('The requested wrist cap depth does not fit this part');
 for(let i=0;i<18;i++){const mid=measure((low.mold.pressDepth+high.mold.pressDepth)/2);if(mid.depth<socketDepth)low=mid;else high=mid;}
 const {mold,depths}=high,roundover=createSocketRoundover(g,mold,sample);
 mold.contactDepths=depths;mold.measuredDepth=high.depth;
 if(underside)refineMoldSurface(g,cx,cz,{passes:3,minY:originalHeight-mold.pressDepth-.015,preserveNormals:true});
 const n=g.attributes.normal,rest=p.array.slice(),sourceNormals=n.array.slice(),used=new Set(g.index.array),changed=new Set(),core=[],rim=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)-cx,z=p.getZ(i)-cz,y=p.getY(i),r=Math.hypot(x,z);if(r>=radius+2*filletRadius||y<=mold.center[1]-radius)continue;
  const profile=roundover.profileAt(Math.atan2(z,x)),height=roundover.surfaceAt(r,profile);if(height===null||Math.fround(height)>=y)continue;
  p.setY(i,height);changed.add(i);if(used.has(i)){if(r<=profile.innerR)core.push(i);else rim.push([i,profile.centerR,profile.centerY]);}
 }
 g.computeVertexNormals();
 for(let i=0;i<p.count;i++)if(!changed.has(i))n.setXYZ(i,sourceNormals[3*i],sourceNormals[3*i+1],sourceNormals[3*i+2]);
 for(const i of core){const v=new T.Vector3(...mold.center).sub(new T.Vector3().fromBufferAttribute(p,i)).normalize();n.setXYZ(i,v.x,v.y,v.z);}
 g.applyMatrix4(back);
 for(let i=0;i<localPositions.length/3;i++)if(!changed.has(i)){p.setXYZ(i,localPositions[3*i],localPositions[3*i+1],localPositions[3*i+2]);n.setXYZ(i,localNormals[3*i],localNormals[3*i+1],localNormals[3*i+2]);}
 g.computeBoundingBox();g.computeBoundingSphere();
 const center=new T.Vector3(...mold.center).applyMatrix4(back);
 const data={...mold,center:center.toArray(),moldCenter:mold.center,toMold:toMold.toArray(),core,rim,sections:roundover.sections,sourcePositions:rest};
 g.userData.wristMold=data;return data;
}
