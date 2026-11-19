import * as T from 'three';
import {ANKLE_RADIUS,ANKLE_REST_HEIGHT} from '../../avatar/src/joints/ankle-contract.js';
import {refineMoldSurface} from './refine-mold-surface.js';

export const FOOT_SOCKET_MOLD=Object.freeze({centerXZ:Object.freeze([0,0]),ballRadius:ANKLE_RADIUS,centerHeight:ANKLE_REST_HEIGHT,blendWidth:.010,coreAngle:70*Math.PI/180});

export function moldSurfaceHeight(r,{center,ballRadius,coreAngle}){
 const rim=ballRadius*Math.sin(coreAngle);
 if(r<=rim)return center[1]-Math.sqrt(ballRadius*ballRadius-r*r);
 // Continue with matching height, slope and curvature. The original foot can
 // stand above the ball's equator: this avoids a cutoff seam at r=ballRadius.
 const d=r-rim,cos=Math.cos(coreAngle);
 return center[1]-ballRadius*cos+Math.tan(coreAngle)*d+d*d/(2*ballRadius*cos**3);
}

// Compact C2 minimum removes material while rounding the intersection between
// the original clay and the sphere. Away from that join it is the exact cut.
export function moldedHeight(y,r,mold){
 const {blendWidth}=mold,sphere=moldSurfaceHeight(r,mold);
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
 const geometry=foot.geometry,p=geometry.attributes.position,{centerXZ:[cx,cz],ballRadius,centerHeight,blendWidth,coreAngle}=FOOT_SOCKET_MOLD;
 const originalHeight=topHeightAt(geometry,cx,cz);
 refineMoldSurface(geometry,cx,cz);
 geometry.userData.moldRestPositions=p.array.slice();
 const mold={center:[cx,centerHeight,cz],ballRadius,pressDepth:originalHeight-centerHeight+ballRadius,blendWidth,coreAngle,originalHeight};
 const contactIndices=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)-cx,z=p.getZ(i)-cz,y=p.getY(i),r=Math.hypot(x,z);
  const sphere=moldSurfaceHeight(r,mold);
  if(r<=ballRadius*Math.sin(coreAngle)&&y-sphere>=blendWidth)contactIndices.push(i);
  p.setY(i,moldedHeight(y,r,mold));
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.moldContactIndices=contactIndices;
 const size=geometry.boundingBox.getSize(new T.Vector3());
 foot.userData.size={width:size.x,height:size.y,length:size.z};foot.userData.socketMold=mold;
 return foot;
}
