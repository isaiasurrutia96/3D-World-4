import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Intersect the actual rounded palm with its seating plane. The opening
// follows this contour, including the accepted hand tilt, rather than an
// estimated oval or a fixed horizontal offset.
function palmSection(hand,cutY,segments){
 const p=hand.geometry.attributes.position,index=hand.geometry.index.array,s=hand.scale.x;
 const lines=[],points=[];
 for(let i=0;i<index.length;i+=3){
  const ids=[index[i],index[i+1],index[i+2]],crossings=[];
  for(let j=0;j<3;j++){
   const a=ids[j],b=ids[(j+1)%3],ay=p.getY(a)*s,by=p.getY(b)*s;
   if((ay<cutY)===(by<cutY)||Math.abs(by-ay)<1e-12)continue;
   const t=(cutY-ay)/(by-ay);
   crossings.push([T.MathUtils.lerp(p.getX(a),p.getX(b),t)*s,T.MathUtils.lerp(p.getZ(a),p.getZ(b),t)*s]);
  }
  if(crossings.length===2){lines.push(crossings);points.push(...crossings);}
 }
 if(!lines.length)throw Error('Palm seating section is empty');
 const cx=(Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2;
 const cz=(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2;
 const radii=[];
 for(let j=0;j<segments;j++){
  const angle=j/segments*Math.PI*2,dx=Math.sin(angle),dz=Math.cos(angle);let radius=0;
  for(const [start,end] of lines){
   const x=start[0]-cx,z=start[1]-cz,vx=end[0]-start[0],vz=end[1]-start[1],det=dx*vz-dz*vx;
   if(Math.abs(det)<1e-12)continue;
   const r=(x*vz-z*vx)/det,u=(x*dz-z*dx)/det;
   if(r>=0&&u>=-1e-7&&u<=1+1e-7)radius=Math.max(radius,r);
  }
  if(!radius)throw Error('Palm seating contour is incomplete');
  radii.push(radius);
 }
 return {center:[cx,cutY,cz],radii};
}

export function fitSocket(forearm,hand){
 const segments=128,p=hand.geometry.attributes.position,s=hand.scale.x;
 let peak=-Infinity;for(let i=0;i<p.count;i++)peak=Math.max(peak,p.getY(i)*s);
 const fitDepth=.024*(hand.userData.enlargementFactor??1),depth=.006,clearance=.00035;
 const section=palmSection(hand,peak-fitDepth,segments),radii=section.radii.map(r=>r+clearance);
 const original=forearm.geometry,bounds=original.boundingBox;
 const topY=bounds.max.y,bottomY=bounds.min.y,rx=(bounds.max.x-bounds.min.x)/2,rz=(bounds.max.z-bounds.min.z)/2;
 const joinY=-.055,tilt=hand.rotation.z,cos=Math.cos(tilt),sin=Math.sin(tilt);
 const rimRadii=[Math.max(...radii.map((r,j)=>Math.abs(r*Math.sin(j/segments*Math.PI*2)))),Math.max(...radii.map((r,j)=>Math.abs(r*Math.cos(j/segments*Math.PI*2))))];
 function tilted(x,y,z,rimY){return new T.Vector3(x*cos-y*sin,rimY+x*sin+y*cos,z);}
 function lowerRings(rimY){
  const rings=[];
  for(let k=0;k<=32;k++){
   const t=k/32;
   rings.push(radii.map((r,j)=>{const a=j/segments*Math.PI*2;return tilted(Math.sin(a)*r*t,depth*(1-t*t),Math.cos(a)*r*t,rimY);}));
  }
  // The rolled lip flows into the rounded forearm with matching tangents.
  for(let k=1;k<=56;k++){
   const t=k/56,u=1-t;
   rings.push(radii.map((r,j)=>{
    const a=j/segments*Math.PI*2,x=Math.sin(a),z=Math.cos(a);
    const a0=tilted(x*r,0,z*r,rimY),a1=tilted(x*r*1.18,-2*depth*.18,z*r*1.18,rimY);
    const a2=new T.Vector3(rx*x,joinY-.045,rz*z),a3=new T.Vector3(rx*x,joinY,rz*z);
    return a0.multiplyScalar(u*u*u).addScaledVector(a1,3*u*u*t).addScaledVector(a2,3*u*t*t).addScaledVector(a3,t*t*t);
   }));
  }
  return rings;
 }
 let rimY=bottomY+.012,rings;
 // Keep the original length and elbow contact while rounding the lower end.
 for(let i=0;i<5;i++){
  rings=lowerRings(rimY);let lowest=Infinity;
  for(const ring of rings)for(const v of ring)lowest=Math.min(lowest,v.y);
  rimY+=bottomY-lowest;
 }
 rings=lowerRings(rimY);
 // Match the upper arm: a mostly straight, gently tapered cylinder,
 // followed by a short rounded elbow cap. Ease only the shaft joins.
 const capHeight=.094,capBaseY=topY-capHeight,capRadius=1/1.1;
 for(let k=1;k<=48;k++){
  const t=k/48,taper=t<.1?5*t*t:t>.9?.9-5*(1-t)*(1-t):t-.05;
  const r=1-(1-capRadius)*taper/.9,y=T.MathUtils.lerp(joinY,capBaseY,t);
  rings.push(radii.map((_,j)=>{const theta=j/segments*Math.PI*2;return new T.Vector3(rx*r*Math.sin(theta),y,rz*r*Math.cos(theta));}));
 }
 for(let k=1;k<=64;k++){
  const a=k/64*Math.PI/2,r=capRadius*Math.cos(a),y=capBaseY+capHeight*Math.sin(a);
  rings.push(radii.map((_,j)=>{const theta=j/segments*Math.PI*2;return new T.Vector3(rx*r*Math.sin(theta),y,rz*r*Math.cos(theta));}));
 }
 const positions=[],indices=[];
 for(const ring of rings)for(let j=0;j<=segments;j++)positions.push(...ring[j%segments].toArray());
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){
  const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
 const result=mergeVertices(geometry,1e-6),faces=[];
 for(let i=0;i<result.index.count;i+=3){const a=result.index.array[i],b=result.index.array[i+1],c=result.index.array[i+2];if(a!==b&&b!==c&&c!==a)faces.push(a,b,c);}
 result.setIndex(faces);result.computeVertexNormals();result.computeBoundingBox();result.computeBoundingSphere();
 result.userData={
  socketRadii:rimRadii,socketDepth:depth,socketFloorY:rimY+depth,
  palmBaseCenter:section.center,palmSeatCenter:section.center,socketSeatCenter:[0,rimY,0],
  fitDepth,socketClearance:clearance,socketTilt:tilt,
  palmSectionRadii:section.radii,socketContourRadii:radii,
  profile:'rounded-cylinder-forearm',
 };
 forearm.geometry=result;original.dispose();geometry.dispose();
}
