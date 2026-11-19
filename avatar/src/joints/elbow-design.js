import * as T from 'three';
import {createElbowStudy} from '../../../elbow-lab/src/study.js';
import {moldWristSocket} from '../../../wrist-lab/src/mold-socket.js';
import {refineMoldSurface} from '../../../foot-lab/src/refine-mold-surface.js';
import {softenElbowInnerEdge} from './elbow-inner-edge.js';
import {smoothElbowTransition} from './elbow-smooth.js';

// Private appearance draft, deliberately not imported by any live page.
// +Z is the inside of the elbow: the existing skeleton bends forward (-X).
export const ELBOW_DESIGN=Object.freeze({capture:.16,insideRelief:.055,filletRadius:.005});

export function createElbowDesign({base=createElbowStudy(),settings=ELBOW_DESIGN,capLengths=[.11,.12],refinementPasses=[4,1],normalTransfer=[true,true],modelScale=1}={}){
 const {group,upperArm,forearm,ball,radius}=base;
 for(const [part,underside,capLength] of [[upperArm,true,capLengths[0]],[forearm,false,capLengths[1]]]){
  const g=part.geometry,sourcePositions=g.attributes.position.array.slice(),sourceNormals=g.attributes.normal.array.slice();
  const oldWrist=g.userData.wristMold,flip=new T.Matrix4().makeScale(1,-1,-1),direction=underside?-1:1;
  g.computeBoundingBox();const tip=underside?g.boundingBox.min.y:g.boundingBox.max.y,join=tip-direction*capLength;
  // Clay has no texture here. Only the end is refined; original source
  // vertices remain a prefix for exact preservation checks along the shaft.
  g.deleteAttribute('uv');if(underside)g.applyMatrix4(flip);
  refineMoldSurface(g,0,0,{passes:refinementPasses[underside?0:1],minY:direction*join,preserveNormals:true});
  if(underside)g.applyMatrix4(flip);
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){
   const t=T.MathUtils.clamp(direction*(p.getY(i)-join)/capLength,0,1),u=T.MathUtils.clamp((p.getZ(i)+.04*modelScale)/(.115*modelScale),0,1);
   const end=t*t*(3-2*t),inside=u*u*(3-2*u),amount=settings.insideRelief*end*inside;
   const yy=1-settings.insideRelief*6*t*(1-t)*inside/capLength;
   if(yy<=.05)throw Error('Elbow relief would fold the original surface');
   const yz=-direction*settings.insideRelief*end*6*u*(1-u)/(.115*modelScale);
   const ny=n.getY(i)/yy,nz=n.getZ(i)-yz*ny,nx=n.getX(i),length=Math.hypot(nx,ny,nz);
   n.setXYZ(i,nx/length,ny/length,nz/length);
   if(amount>0)p.setY(i,p.getY(i)-direction*amount);
  }
  // Transform the authored smooth normal field with the deformation's
  // inverse-transpose Jacobian, rather than baking coarse facet normals.
  g.computeBoundingBox();
  const data=moldWristSocket(part,{radius,depthFraction:settings.capture,underside,filletRadius:settings.filletRadius,centerXZ:[0,0]});
  g.userData.elbowMold=data;if(oldWrist)g.userData.wristMold=oldWrist;else delete g.userData.wristMold;
  const preserved=[];
  for(let i=0;i<sourcePositions.length/3;i++)if(direction*(sourcePositions[3*i+1]-join)<=-.005){
   preserved.push(i);g.attributes.normal.setXYZ(i,sourceNormals[3*i],sourceNormals[3*i+1],sourceNormals[3*i+2]);
  }
  part.userData.elbowDesign={insideRelief:settings.insideRelief,join,direction,preserved};
  // Rigid seating only: the real ball and both sockets share the existing
  // pivot supplied by the base. No bone, pose, scale or ball point changes.
  const center=new T.Vector3(...data.center).multiply(part.scale).applyQuaternion(part.quaternion);
  part.position.copy(ball.position).sub(center);
  g.computeBoundingBox();g.computeBoundingSphere();
 }
 const innerEdgeReports={upperArm:softenElbowInnerEdge(upperArm,radius,true,{scale:modelScale}),forearm:softenElbowInnerEdge(forearm,radius,false,{scale:modelScale})};
 const smoothingReports={upperArm:smoothElbowTransition(upperArm,radius,true,{scale:modelScale,capTransfer:normalTransfer[0]}),forearm:smoothElbowTransition(forearm,radius,false,{scale:modelScale,capTransfer:normalTransfer[1]})};
 group.name='elbow-socket-appearance-draft';group.updateMatrixWorld(true);return {...base,innerEdgeReports,smoothingReports};
}
