import * as T from 'three';
import {ANKLE_RADIUS} from '../../avatar/src/joints/ankle-contract.js';

export const FOOT_SOCKET_MOLD=Object.freeze({centerXZ:Object.freeze([0,0]),ballRadius:ANKLE_RADIUS,pressDepth:.032,blendWidth:.006});

// Compact C2 minimum removes material while rounding the intersection between
// the original clay and the sphere. Away from that join it is the exact cut.
export function moldedHeight(y,r,{center,ballRadius,blendWidth}){
 if(r>=ballRadius)return y;
 const sphere=center[1]-Math.sqrt(ballRadius*ballRadius-r*r);
 const h=Math.max(0,1-Math.abs(y-sphere)/blendWidth);
 return Math.min(y,sphere)-blendWidth*h*h*h/6;
}

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
 const geometry=foot.geometry,p=geometry.attributes.position,{centerXZ:[cx,cz],ballRadius,pressDepth,blendWidth}=FOOT_SOCKET_MOLD;
 const originalHeight=topHeightAt(geometry,cx,cz);
 const mold={center:[cx,originalHeight-pressDepth+ballRadius,cz],ballRadius,pressDepth,blendWidth,originalHeight};
 const contactIndices=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)-cx,z=p.getZ(i)-cz,y=p.getY(i),r=Math.hypot(x,z);
  if(r>=ballRadius)continue;
  const sphere=mold.center[1]-Math.sqrt(ballRadius*ballRadius-r*r);
  if(y-sphere>=blendWidth)contactIndices.push(i);
  p.setY(i,moldedHeight(y,r,mold));
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.moldContactIndices=contactIndices;
 const size=geometry.boundingBox.getSize(new T.Vector3());
 foot.userData.size={width:size.x,height:size.y,length:size.z};foot.userData.socketMold=mold;
 return foot;
}
