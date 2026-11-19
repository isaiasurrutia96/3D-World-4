import * as T from 'three';
import {refineMoldSurface} from '../../../foot-lab/src/refine-mold-surface.js';

export const INNER_EDGE=Object.freeze({maxInset:.012,cornerExtra:.010,cornerFall:[.080,.160],reach:.21,blendStart:.075,frontWidth:.10,sphereGuard:.012,sphereBlend:.045});

function smooth(value,low,high){
 const t=T.MathUtils.clamp((value-low)/(high-low),0,1);
 return {weight:t*t*(3-2*t),derivative:6*t*(1-t)/(high-low)};
}

// A small, smooth inward sculpt on +Z, the inside of the bend. The exact
// spherical cups and fillets are protected. Some arm-to-arm overlap is an
// accepted design choice; this does not carve a full collision envelope.
export function softenElbowInnerEdge(part,radius,upper,{scale=1}={}){
 const cfg=scale===1?INNER_EDGE:Object.fromEntries(Object.entries(INNER_EDGE).map(([key,value])=>[key,Array.isArray(value)?value.map(v=>v*scale):value*scale]));
 const g=part.geometry,center=g.userData.elbowMold.center,body=upper?1:-1;
 const oldPositions=g.attributes.position.array.slice(),oldNormals=g.attributes.normal.array.slice(),flip=new T.Matrix4().makeScale(1,-1,-1);
 if(upper)g.applyMatrix4(flip);
 refineMoldSurface(g,0,0,{passes:5,minY:upper?-(center[1]+cfg.reach):center[1]-cfg.reach,preserveNormals:true,maxEdgeLength3D:.006*scale});
 if(upper)g.applyMatrix4(flip);
 const p=g.attributes.position,n=g.attributes.normal;
 // Refinement keeps original vertices as a prefix. Preserve authored source
 // data exactly before applying the new sculpt and its analytic normals.
 for(let i=0;i<oldPositions.length/3;i++){p.setXYZ(i,oldPositions[3*i],oldPositions[3*i+1],oldPositions[3*i+2]);n.setXYZ(i,oldNormals[3*i],oldNormals[3*i+1],oldNormals[3*i+2]);}
 const beforePositions=p.array.slice(),beforeNormals=n.array.slice(),changed=[];let maximumInset=0,minimumJacobian=1;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)-center[0],y=p.getY(i)-center[1],z=p.getZ(i)-center[2],r=Math.hypot(x,y,z);
  const front=smooth(z,0,cfg.frontWidth),end=smooth(body*y,cfg.blendStart,cfg.reach),guard=smooth(r,radius+cfg.sphereGuard,radius+cfg.sphereBlend);
  // Extra trim is confined to the two re-marked corners, rather than
  // increasing the original sculpt along the full shaft. Smooth support
  // fades out before 16 cm from the pivot; cups/rims remain protected.
  // A single monotonic fade avoids a raised shoulder behind the trim.
  const fall=smooth(body*y,...cfg.cornerFall);
  const bump=1-fall.weight,bumpDerivative=-fall.derivative;
  const k=cfg.maxInset+cfg.cornerExtra*bump,ky=cfg.cornerExtra*bumpDerivative*body;
  const axial=1-end.weight,amount=k*front.weight*axial*guard.weight;if(amount===0)continue;
  const dr=guard.derivative/r;
  const dx=k*front.weight*axial*dr*x;
  const dy=front.weight*(ky*axial*guard.weight+k*(-body*end.derivative*guard.weight+axial*dr*y));
  const dz=k*(front.derivative*axial*guard.weight+front.weight*axial*dr*z),jacobian=1-dz;
  if(jacobian<=.05)throw Error('Inner edge sculpt would fold the clay surface');
  const nz=n.getZ(i)/jacobian,nx=n.getX(i)+dx*nz,ny=n.getY(i)+dy*nz,length=Math.hypot(nx,ny,nz);
  p.setZ(i,p.getZ(i)-amount);n.setXYZ(i,nx/length,ny/length,nz/length);
  changed.push(i);maximumInset=Math.max(maximumInset,amount);minimumJacobian=Math.min(minimumJacobian,jacobian);
 }
 const changedSet=new Set(changed);
 part.userData.elbowDesign.preserved=part.userData.elbowDesign.preserved.filter(i=>!changedSet.has(i));
 part.userData.elbowInnerEdge={maximumInset,minimumJacobian,reach:cfg.reach,modifiedVertices:changed.length};
 p.needsUpdate=true;n.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
 return {beforePositions,beforeNormals,changed,maximumInset,minimumJacobian};
}
