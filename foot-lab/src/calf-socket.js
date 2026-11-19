import {createSocketRoundover} from './socket-roundover.js';
import {refineMoldSurface} from './refine-mold-surface.js';

export const CALF_SOCKET_DEPTH_RATIO=.75;

// Exact half-turn, without sin(PI) noise: present the underside to the same
// checked top-facing mold solver, then return to the original calf frame.
function halfTurn(geometry){
 for(const name of ['position','normal']){
  const p=geometry.attributes[name];
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i),-p.getY(i),-p.getZ(i));
  p.needsUpdate=true;
 }
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
}

function joinLowerSeam(geometry){
 const p=geometry.attributes.position,canonical=new Map(),ids=Array.from({length:p.count},(_,i)=>i);
 for(let i=0;i<p.count;i++)if(p.getY(i)>=.09-1e-7){
  const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v/1e-7)).join(',');
  if(!canonical.has(key))canonical.set(key,i);ids[i]=canonical.get(key);
 }
 const faces=[],source=geometry.index.array;
 for(let i=0;i<source.length;i+=3){const a=ids[source[i]],b=ids[source[i+1]],c=ids[source[i+2]];if(a!==b&&b!==c&&c!==a)faces.push(a,b,c);}
 geometry.setIndex(faces);
}

export function carveCalfSocket(calf,footMold){
 if(calf.userData.socketMold)throw Error('The calf socket is already carved');
 const geometry=calf.geometry,originalNormals=geometry.attributes.normal.array.slice(),original=geometry.attributes.position.array.slice();
 const originalBase=geometry.boundingBox.min.y,pressDepth=footMold.pressDepth*CALF_SOCKET_DEPTH_RATIO;
 halfTurn(geometry);joinLowerSeam(geometry);
 geometry.deleteAttribute('uv');
 const originalHeight=-originalBase,ballRadius=footMold.ballRadius,filletRadius=footMold.filletRadius;
 const inverseMold={center:[0,originalHeight-pressDepth+ballRadius,0],ballRadius,filletRadius};
 const roundover=createSocketRoundover(geometry,inverseMold);
 refineMoldSurface(geometry,0,0,{passes:6,minY:.09,preserveNormals:true});
 const p=geometry.attributes.position,n=geometry.attributes.normal,rest=p.array.slice(),used=new Set(geometry.index.array),contactIndices=[],filletContacts=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,z);
  if(r>=ballRadius+2*filletRadius||y<=inverseMold.center[1]-ballRadius)continue;
  const profile=roundover.profileAt(Math.atan2(z,x)),height=roundover.surfaceAt(r,profile);
  if(height===null||height>=y)continue;
  if(used.has(i)){if(r<=profile.innerR)contactIndices.push(i);else filletContacts.push([i,profile.centerR,-profile.centerY]);}
  p.setY(i,height);
  if(r<=profile.innerR){
   n.setXYZ(i,-x/ballRadius,(inverseMold.center[1]-height)/ballRadius,-z/ballRadius);
  }else{
   // Keep the original interpolated outer shading and meet the exact cavity
   // normal at the inner tangent; coarse source triangles must not imprint a
   // shading seam across a physically smooth rounded rim.
   const dx=x/r,dz=z/r,t=(r-profile.innerR)/(profile.outerR-profile.innerR);
   const radial=(r-profile.centerR)/filletRadius,up=(height-profile.centerY)/filletRadius;
   const outerRadial=n.getX(i)*dx+n.getZ(i)*dz,outerUp=n.getY(i);
   const azimuth=(-n.getX(i)*dz+n.getZ(i)*dx)/Math.hypot(outerRadial,outerUp)*t;
   const scale=Math.hypot(radial,up,azimuth);
   n.setXYZ(i,(radial*dx-azimuth*dz)/scale,up/scale,(radial*dz+azimuth*dx)/scale);
  }
 }
 halfTurn(geometry);
 // Preserve the existing upper calf's authored shading and exact geometry.
 const normals=geometry.attributes.normal;
 for(let i=0;i<original.length/3;i++)if(original[i*3+1]>=-.09-1e-7)normals.setXYZ(i,originalNormals[i*3],originalNormals[i*3+1],originalNormals[i*3+2]);
 normals.needsUpdate=true;
 for(let i=0;i<rest.length;i+=3){rest[i+1]=-rest[i+1];rest[i+2]=-rest[i+2];}
 geometry.userData.moldRestPositions=rest;geometry.userData.moldContactIndices=contactIndices;
 geometry.userData.filletContacts=filletContacts;
 geometry.userData.filletSections=roundover.sections.map(p=>({...p,theta:-p.theta,innerY:-p.innerY,outerY:-p.outerY,centerY:-p.centerY,slope:-p.slope}));
 calf.userData.socketMold={center:[0,-inverseMold.center[1],0],ballRadius,filletRadius,pressDepth,depthRatio:CALF_SOCKET_DEPTH_RATIO,sourceFootDepth:footMold.pressDepth,originalBase,axis:'-Y'};
 return calf;
}
