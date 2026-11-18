import * as T from 'three';
import {ANKLE_RADIUS,ANKLE_CLEARANCE,ANKLE_CAP_ANGLE,ANKLE_LIP_RADIUS} from '../../avatar/src/joints/ankle-contract.js';

// Original seating contour depth: preserves the measured legacy ankle pivot.
export const SOCKET_DEPTH=.024;
export const SOCKET_CLEARANCE=ANKLE_CLEARANCE;

// Index the existing foot triangles in X/Z. Every cavity sample follows the
// actual upper surface, including its asymmetric outline, without reshaping it.
function footSurface(foot){
 const p=foot.geometry.attributes.position,n=foot.geometry.attributes.normal,ix=foot.geometry.index.array;
 const cells=new Map(),cellSize=.02;
 for(let i=0;i<ix.length;i+=3){
  const ids=[ix[i],ix[i+1],ix[i+2]],v=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j));
  const [a,b,c]=v,det=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if(Math.abs(det)<1e-12)continue;
  const triangle={ids,v,det};
  for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cellSize);x<=Math.floor(Math.max(a.x,b.x,c.x)/cellSize);x++){
   for(let z=Math.floor(Math.min(a.z,b.z,c.z)/cellSize);z<=Math.floor(Math.max(a.z,b.z,c.z)/cellSize);z++){
    const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(triangle);
   }
  }
 }
 return (x,z)=>{
  let highest=-Infinity,normal;
  for(const {ids,v:[a,b,c],det} of cells.get(`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`)||[]){
   const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/det;
   const v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/det,w=1-u-v;
   if(Math.min(u,v,w)<-1e-7)continue;
   const y=u*a.y+v*b.y+w*c.y;if(y<=highest)continue;
   highest=y;normal=new T.Vector3().fromBufferAttribute(n,ids[0]).multiplyScalar(u)
    .addScaledVector(new T.Vector3().fromBufferAttribute(n,ids[1]),v)
    .addScaledVector(new T.Vector3().fromBufferAttribute(n,ids[2]),w).normalize();
  }
  if(!Number.isFinite(highest))throw Error('Socket sample is outside the foot');
  return {point:new T.Vector3(x,highest,z),normal};
 };
}

function seatingSection(foot,y,segments){
 const p=foot.geometry.attributes.position,ix=foot.geometry.index.array,lines=[],points=[];
 for(let i=0;i<ix.length;i+=3){
  const crossings=[];
  for(let j=0;j<3;j++){
   const a=ix[i+j],b=ix[i+(j+1)%3],ay=p.getY(a),by=p.getY(b);
   if((ay<y)===(by<y)||Math.abs(by-ay)<1e-12)continue;
   const t=(y-ay)/(by-ay);
   crossings.push(new T.Vector2(T.MathUtils.lerp(p.getX(a),p.getX(b),t),T.MathUtils.lerp(p.getZ(a),p.getZ(b),t)));
  }
  if(crossings.length===2){lines.push(crossings);points.push(...crossings);}
 }
 if(!points.length)throw Error('Foot seating contour is empty');
 const cx=(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2;
 const cz=(Math.min(...points.map(p=>p.y))+Math.max(...points.map(p=>p.y)))/2;
 const radii=Array.from({length:segments},(_,j)=>{
  const a=j/segments*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a);let radius=0;
  for(const [start,end] of lines){
   const x=start.x-cx,z=start.y-cz,vx=end.x-start.x,vz=end.y-start.y,det=dx*vz-dz*vx;
   if(Math.abs(det)<1e-12)continue;
   const r=(x*vz-z*vx)/det,u=(x*dz-z*dx)/det;
   if(r>=0&&u>=-1e-7&&u<=1+1e-7)radius=Math.max(radius,r);
  }
  if(!radius)throw Error('Foot seating contour is incomplete');
  return radius;
 });
 return {center:new T.Vector3(cx,y,cz),radii};
}

// Split shared edges only around the small rolled lip. All original vertices
// remain in order, and neighbouring faces share each new midpoint: no T seams.
function refineFootLip(geometry,center,rimRadius){
 const position=geometry.attributes.position,normal=geometry.attributes.normal;
 const vertices=Array.from(position.array),normals=Array.from(normal.array);let faces=Array.from(geometry.index.array);
 for(let pass=0;pass<3;pass++){
  const splits=new Map(),key=(a,b)=>a<b?a+','+b:b+','+a;
  for(let i=0;i<faces.length;i+=3)for(let edge=0;edge<3;edge++){
   const a=faces[i+edge],b=faces[i+(edge+1)%3],id=key(a,b);if(splits.has(id))continue;
   const x=(vertices[a*3]+vertices[b*3])/2,y=(vertices[a*3+1]+vertices[b*3+1])/2,z=(vertices[a*3+2]+vertices[b*3+2])/2;
   const radius=Math.hypot(x-center.x,z-center.z);
   if(y<.025||(normals[a*3+1]+normals[b*3+1])/2<.15||Math.abs(radius-rimRadius)>.024)continue;
   if(Math.hypot(vertices[a*3]-vertices[b*3],vertices[a*3+2]-vertices[b*3+2])<=.00175)continue;
   const index=vertices.length/3;vertices.push(x,y,z);
   const n=new T.Vector3(normals[a*3]+normals[b*3],normals[a*3+1]+normals[b*3+1],normals[a*3+2]+normals[b*3+2]).normalize();normals.push(n.x,n.y,n.z);splits.set(id,index);
  }
  if(!splits.size)break;
  const next=[];
  for(let i=0;i<faces.length;i+=3){
   const [a,b,c]=faces.slice(i,i+3),ab=splits.get(key(a,b)),bc=splits.get(key(b,c)),ca=splits.get(key(c,a));
   const count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);
   if(count===0)next.push(a,b,c);
   else if(count===3)next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
   else if(count===1){if(ab!==undefined)next.push(a,ab,c,ab,b,c);else if(bc!==undefined)next.push(b,bc,a,bc,c,a);else next.push(c,ca,b,ca,a,b);}
   else if(ca===undefined)next.push(b,bc,ab,a,ab,c,ab,bc,c);
   else if(ab===undefined)next.push(c,ca,bc,b,bc,a,bc,ca,a);
   else next.push(a,ab,ca,c,ca,b,ca,ab,b);
  }
  faces=next;
 }
 position.copy(new T.Float32BufferAttribute(vertices,3));normal.copy(new T.Float32BufferAttribute(normals,3));geometry.setIndex(faces);
}

// Round the upper foot into a shallow, true spherical cup. Only the ankle
// patch changes: the sole, asymmetric outline and toe hinge keep their vertices.
function carveFootSocket(foot,center){
 const geometry=foot.geometry,p=geometry.attributes.position,n=geometry.attributes.normal;
 const radius=ANKLE_RADIUS+ANKLE_CLEARANCE,rim=radius*Math.sin(ANKLE_CAP_ANGLE);
 refineFootLip(geometry,center,rim);
 const original=p.array.slice(),normals=n.array.slice(),surface=footSurface(foot);
 const rimY=center.y-radius*Math.cos(ANKLE_CAP_ANGLE),fillet=ANKLE_LIP_RADIUS;
 const lipCenterR=rim+fillet/Math.sqrt(2),lipCenterY=rimY-fillet/Math.sqrt(2),lipEnd=rim+Math.sqrt(2)*fillet;
 const cavityIndices=[],smoothNormals=[];
 function heightAt(x,z,oldY){
  const dx=x-center.x,dz=z-center.z,r=Math.hypot(dx,dz),outer=.130+.030*Math.max(0,-dz/Math.max(r,1e-12));
  if(r>=outer)return oldY;
  if(r<=rim)return center.y-Math.sqrt(radius*radius-r*r);
  if(r<lipEnd)return lipCenterY+Math.sqrt(Math.max(0,fillet*fillet-(r-lipCenterR)**2));
  const t=T.MathUtils.clamp((r-lipEnd)/(outer-lipEnd),0,1),u=t*t,weight=u*u*(3-2*u);
  return T.MathUtils.lerp(rimY,oldY,weight)-(r-lipEnd)*(1-t)**2;
 }
 for(let i=0;i<p.count;i++){
  const x=original[i*3],y=original[i*3+1],z=original[i*3+2],dx=x-center.x,dz=z-center.z,r=Math.hypot(dx,dz);
  const outer=.130+.030*Math.max(0,-dz/Math.max(r,1e-12));
  if(r>=outer||y<.025||normals[i*3+1]<=0)continue;
  if(Math.abs(surface(x,z).point.y-y)>1e-5)continue;
  if(r<=rim)cavityIndices.push(i);
  p.setY(i,heightAt(x,z,y));
  // Use the smooth source normal for the unchanged surface's derivative, not
  // a triangle fan's changing slopes around the small rounded lip.
  const epsilon=.00001,dxdy=-normals[i*3]/normals[i*3+1],dzdy=-normals[i*3+2]/normals[i*3+1];
  const gx=(heightAt(x+epsilon,z,y+dxdy*epsilon)-heightAt(x-epsilon,z,y-dxdy*epsilon))/(2*epsilon);
  const gz=(heightAt(x,z+epsilon,y+dzdy*epsilon)-heightAt(x,z-epsilon,y-dzdy*epsilon))/(2*epsilon);
  const normal=new T.Vector3(-gx,1,-gz).normalize();smoothNormals.push([i,normal.x,normal.y,normal.z]);
 }
 geometry.computeVertexNormals();
 for(const [i,x,y,z] of smoothNormals)n.setXYZ(i,x,y,z);
 for(let i=0;i<p.count;i++)if(p.getZ(i)>=.145)n.setXYZ(i,normals[i*3],normals[i*3+1],normals[i*3+2]);
 for(const i of cavityIndices){const normal=center.clone().sub(new T.Vector3().fromBufferAttribute(p,i)).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}
 geometry.computeBoundingBox();geometry.computeBoundingSphere();p.needsUpdate=n.needsUpdate=true;
 const size=geometry.boundingBox.getSize(new T.Vector3());
 foot.userData.size={width:size.x,height:size.y,length:size.z};foot.userData.suggestedAnklePivot=center.toArray();foot.userData.ankleBallRadius=ANKLE_RADIUS;
 Object.assign(geometry.userData,{ankleCenter:center.toArray(),socketRadius:radius,socketCapAngle:ANKLE_CAP_ANGLE,socketLipRadius:fillet,cavityIndices});
}

export function fitAnkleSocket(calf,foot){
 const original=calf.geometry,profile=original.parameters.points,sides=original.parameters.segments;
 const subdivisions=8,segments=sides*subdivisions,joinIndex=5,joinY=profile[joinIndex].y;
 // Measure the original, uncarved foot first. This is the existing ankle pivot;
 // changing a cup must never silently change the leg length or knee/sole placement.
 const cutY=foot.geometry.boundingBox.max.y-SOCKET_DEPTH,section=seatingSection(foot,cutY,segments);
 const oldRimY=original.boundingBox.min.y+.014;
 calf.position.set(section.center.x,cutY-oldRimY,section.center.z);
 const center=section.center.clone();center.y-=.012;
 const localCenter=center.clone().sub(calf.position),radius=ANKLE_RADIUS+ANKLE_CLEARANCE;
 const vertices=[localCenter.x,localCenter.y+radius,localCenter.z],indices=[],rings=[],cavityIndices=[0];
 const addRing=points=>{const start=vertices.length/3;for(const p of points)vertices.push(p.x,p.y,p.z);rings.push(start);return start;};
 const circle=(r,y)=>Array.from({length:segments},(_,j)=>{const a=j/segments*Math.PI*2;return new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);});
 for(let k=1;k<=16;k++){
  const a=ANKLE_CAP_ANGLE*k/16,start=addRing(circle(radius*Math.sin(a),localCenter.y+radius*Math.cos(a)));
  for(let j=0;j<segments;j++)cavityIndices.push(start+j);
 }
 const rimR=radius*Math.sin(ANKLE_CAP_ANGLE),rimY=localCenter.y+radius*Math.cos(ANKLE_CAP_ANGLE),fillet=ANKLE_LIP_RADIUS;
 const circleR=rimR+fillet/Math.sqrt(2),circleY=rimY+fillet/Math.sqrt(2);
 for(let k=1;k<=12;k++){
  const a=-3*Math.PI/4+k/12*Math.PI/2;
  addRing(circle(circleR+fillet*Math.cos(a),circleY+fillet*Math.sin(a)));
 }
 const rimStart=rings.at(-1),startRing=Array.from({length:segments},(_,j)=>new T.Vector3().fromArray(vertices,(rimStart+j)*3));
 function originalDirection(j){const phase=j/subdivisions,i=Math.floor(phase),t=phase-i,a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;return new T.Vector3(T.MathUtils.lerp(Math.sin(a),Math.sin(b),t),0,T.MathUtils.lerp(Math.cos(a),Math.cos(b),t));}
 const upperSlope=(profile[joinIndex+1].x-profile[joinIndex].x)/(profile[joinIndex+1].y-profile[joinIndex].y);
 for(let k=1;k<=40;k++){
  const t=k/40,u=1-t;
  addRing(startRing.map((start,j)=>{
   const a=j/segments*Math.PI*2,end=originalDirection(j).multiplyScalar(profile[joinIndex].x);end.y=joinY;
   const p1=start.clone().add(new T.Vector3(Math.sin(a),1,Math.cos(a)).multiplyScalar(.010));
   const p2=end.clone().addScaledVector(originalDirection(j),-upperSlope*.020);p2.y-=.020;
   return start.clone().multiplyScalar(u*u*u).addScaledVector(p1,3*u*u*t).addScaledVector(p2,3*u*t*t).addScaledVector(end,t*t*t);
  }));
 }
 const upperCalfStart=rings.at(-1),upperRings=[{start:upperCalfStart,k:joinIndex}];
 for(let k=joinIndex+1;k<profile.length-1;k++){
  const start=addRing(Array.from({length:segments},(_,j)=>{const v=originalDirection(j).multiplyScalar(profile[k].x);v.y=profile[k].y;return v;}));upperRings.push({start,k});
 }
 const top=vertices.length/3;vertices.push(0,profile.at(-1).y,0);
 for(let j=0;j<segments;j++)indices.push(0,rings[0]+(j+1)%segments,rings[0]+j);
 for(let k=0;k<rings.length-1;k++)for(let j=0;j<segments;j++){const a=rings[k]+j,b=rings[k]+(j+1)%segments,c=rings[k+1]+j,d=rings[k+1]+(j+1)%segments;indices.push(a,b,c,b,d,c);}
 for(let j=0;j<segments;j++)indices.push(rings.at(-1)+j,rings.at(-1)+(j+1)%segments,top);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const normals=geometry.attributes.normal,positions=geometry.attributes.position,on=original.attributes.normal;
 for(const i of cavityIndices){const normal=localCenter.clone().sub(new T.Vector3().fromBufferAttribute(positions,i)).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);}
 function originalNormal(j,k){const phase=j/subdivisions,side=Math.floor(phase);return new T.Vector3().fromBufferAttribute(on,side*profile.length+k).lerp(new T.Vector3().fromBufferAttribute(on,(side+1)*profile.length+k),phase-side).normalize();}
 for(let k=1;k<=40;k++)for(let j=0;j<segments;j++){const i=rings[27+k]+j,normal=new T.Vector3().fromBufferAttribute(normals,i).lerp(originalNormal(j,joinIndex),T.MathUtils.smoothstep(k/40,.65,1)).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);}
 for(const {start,k} of upperRings)for(let j=0;j<segments;j++){const normal=originalNormal(j,k);normals.setXYZ(start+j,normal.x,normal.y,normal.z);}
 normals.setXYZ(top,0,1,0);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData={ankleCenter:localCenter.toArray(),socketRadius:radius,socketCapAngle:ANKLE_CAP_ANGLE,socketLipRadius:fillet,cavityIndices,upperCalfStart,joinY,segments,originalFootContour:section.center.toArray(),footSeatCenter:center.toArray(),socketSeatCenter:localCenter.toArray(),socketClearance:ANKLE_CLEARANCE,socketDepth:radius*(1-Math.cos(ANKLE_CAP_ANGLE))};
 calf.geometry=geometry;calf.userData={socket:true,centered:true,ankleCenter:localCenter.toArray()};
 carveFootSocket(foot,center);original.dispose();
}

export function createAnkleBall(material,center){
 const ball=new T.Mesh(new T.SphereGeometry(ANKLE_RADIUS,64,48),material);
 ball.name='ankle-ball';ball.position.copy(center);ball.castShadow=true;
 ball.geometry.computeBoundingBox();ball.geometry.computeBoundingSphere();
 ball.geometry.userData.ankleCenter=[0,0,0];ball.userData={ankleCenter:[0,0,0],radius:ANKLE_RADIUS};
 return ball;
}
