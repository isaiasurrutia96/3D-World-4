import * as T from 'three';
import {ANKLE_RADIUS,ANKLE_REST_HEIGHT} from '../../avatar/src/joints/ankle-contract.js';
import {refineMoldSurface} from './refine-mold-surface.js';
import {createSocketRoundover} from './socket-roundover.js';

export const FOOT_SOCKET_MOLD=Object.freeze({centerXZ:Object.freeze([0,0]),ballRadius:ANKLE_RADIUS,centerHeight:ANKLE_REST_HEIGHT,filletRadius:.0125});

function topHeightAt(geometry,x,z){
 const p=geometry.attributes.position,index=geometry.index.array,ray=new T.Ray(new T.Vector3(x,geometry.boundingBox.max.y+1,z),new T.Vector3(0,-1,0));
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),hit=new T.Vector3();let height=-Infinity;
 for(let i=0;i<index.length;i+=3){
  a.fromBufferAttribute(p,index[i]);b.fromBufferAttribute(p,index[i+1]);c.fromBufferAttribute(p,index[i+2]);
  if(ray.intersectTriangle(a,b,c,false,hit))height=Math.max(height,hit.y);
 }
 if(!Number.isFinite(height))throw Error('The mold must be positioned over the foot');
 return height;
}

export function pressAnkleBallIntoFoot(foot){
 if(foot.userData.socketMold)throw Error('The ball mold has already been pressed');
 const geometry=foot.geometry,p=geometry.attributes.position,{centerXZ:[cx,cz],ballRadius,centerHeight,filletRadius}=FOOT_SOCKET_MOLD;
 const originalHeight=topHeightAt(geometry,cx,cz);
 const mold={center:[cx,centerHeight,cz],ballRadius,pressDepth:originalHeight-centerHeight+ballRadius,filletRadius,originalHeight};
 const roundover=createSocketRoundover(geometry,mold);
 refineMoldSurface(geometry,cx,cz);
 geometry.userData.moldRestPositions=p.array.slice();
 const contactIndices=[],filletContacts=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)-cx,z=p.getZ(i)-cz,y=p.getY(i),r=Math.hypot(x,z);
  if(r>=ballRadius+2*filletRadius||y<=centerHeight-ballRadius)continue;
  const profile=roundover.profileAt(Math.atan2(z,x)),height=roundover.surfaceAt(r,profile);
  if(height===null||height>=y)continue;
  if(r<=profile.innerR)contactIndices.push(i);else filletContacts.push([i,profile.centerR,profile.centerY]);
  p.setY(i,height);
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.moldContactIndices=contactIndices;
 geometry.userData.filletContacts=filletContacts;geometry.userData.filletSections=roundover.sections;
 const size=geometry.boundingBox.getSize(new T.Vector3());
 foot.userData.size={width:size.x,height:size.y,length:size.z};foot.userData.socketMold=mold;
 return foot;
}
