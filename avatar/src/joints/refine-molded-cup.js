import * as T from 'three';
import {refineMoldSurface} from '../../../foot-lab/src/refine-mold-surface.js';
import {createSocketRoundover,originalSurface} from '../../../foot-lab/src/socket-roundover.js';

// Preserve the accepted cup while refining and reprojecting new samples.
export function refineMoldedCup(part,mold,source,{rounds=1,maxEdgeLength3D=.003,passes=4,analyticLipNormals=false}={}){
 const g=part.geometry,positions=g.attributes.position.array.slice(),normals=g.attributes.normal.array.slice(),first=positions.length/3;
 const M=new T.Matrix4().fromArray(mold.toMold),back=M.clone().invert(),center=mold.moldCenter,R=mold.ballRadius;
 source.applyMatrix4(M);const sample=originalSurface(source),roundover=createSocketRoundover(source,{...mold,center},sample);g.applyMatrix4(M);
 // Pressing deeply stretches triangles near the sphere's equator. Subdivide
 // the actual molded surface in 3D, then put the NEW samples back on the same
 // exact sphere/rolling fillet. Subdivision alone would retain the old chord.
 for(let round=0;round<rounds;round++){
 const start=g.attributes.position.count;
 refineMoldSurface(g,center[0],center[2],{passes,minY:center[1]-R-.02,preserveNormals:true,maxEdgeLength3D});
 const p=g.attributes.position,n=g.attributes.normal,used=new Set(g.index.array);
 for(let i=start;i<p.count;i++){
  const x=p.getX(i)-center[0],z=p.getZ(i)-center[2],r=Math.hypot(x,z);if(r>=R+2*mold.filletRadius||p.getY(i)<=center[1]-R)continue;
  const profile=roundover.profileAt(Math.atan2(z,x)),y=roundover.surfaceAt(r,profile);if(y===null)continue;
  p.setY(i,y);
  if(r<=profile.innerR){const v=new T.Vector3(center[0]-p.getX(i),center[1]-y,center[2]-p.getZ(i)).normalize();n.setXYZ(i,v.x,v.y,v.z);if(used.has(i))mold.core.push(i);}
  else if(used.has(i))mold.rim.push([i,profile.centerR,profile.centerY]);
 }
 }
 const lipIds=new Set(mold.rim.map(([i])=>i));
 if(analyticLipNormals){
  const p=g.attributes.position,n=g.attributes.normal;
  for(const [i,rc,yc] of mold.rim){
   const x=p.getX(i)-center[0],z=p.getZ(i)-center[2],r=Math.hypot(x,z),dx=x/r,dz=z/r,profile=roundover.profileAt(Math.atan2(z,x));
   const radial=(r-rc)/mold.filletRadius,up=(p.getY(i)-yc)/mold.filletRadius,outer=sample(center[0]+dx*profile.outerR,center[2]+dz*profile.outerR);
   const t=T.MathUtils.clamp((r-profile.innerR)/(profile.outerR-profile.innerR),0,1);
   const azimuth=outer?(-outer.nx*dz+outer.nz*dx)/Math.hypot(outer.nx*dx+outer.nz*dz,outer.ny)*t:0;
   const v=new T.Vector3(radial*dx-azimuth*dz,up,radial*dz+azimuth*dx).normalize();n.setXYZ(i,v.x,v.y,v.z);
  }
 }
 g.applyMatrix4(back);
 // Keep all existing fitted vertices exact. Authored normals are restored
 // outside the lip; the optional analytic lip field affects only that rim.
 // Only newly added position samples are reprojected.
 const p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<first;i++){p.setXYZ(i,...positions.subarray(3*i,3*i+3));if(!analyticLipNormals||!lipIds.has(i))n.setXYZ(i,...normals.subarray(3*i,3*i+3));}
 g.computeBoundingBox();g.computeBoundingSphere();
}
