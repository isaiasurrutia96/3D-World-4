import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

export const SOCKET_DEPTH=.024;
export const SOCKET_CLEARANCE=.0006;

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

export function fitAnkleSocket(calf,foot){
 const original=calf.geometry,profile=original.parameters.points;
 const sides=original.parameters.segments,subdivisions=8,segments=sides*subdivisions;
 const joinIndex=5,joinY=profile[joinIndex].y,rimY=original.boundingBox.min.y+.014;
 const cutY=foot.geometry.boundingBox.max.y-SOCKET_DEPTH;
 const section=seatingSection(foot,cutY,segments),surface=footSurface(foot);
 calf.position.set(section.center.x,cutY-rimY,section.center.z);
 const rings=[],rimNormals=[];
 for(let k=0;k<=24;k++){
  const t=k/24;
  rings.push(section.radii.map((r,j)=>{
   const a=j/segments*Math.PI*2;
   const sample=surface(section.center.x+Math.sin(a)*r*t,section.center.z+Math.cos(a)*r*t);
   if(k===24)rimNormals.push(sample.normal);
   return sample.point.addScaledVector(sample.normal,SOCKET_CLEARANCE).sub(calf.position);
  }));
 }
 // Interpolate the original 14-sided cross-section, preserving the calf's
 // upper silhouette and profile. Only its lower rounded end becomes a socket.
 function originalDirection(j){
  const phase=j/subdivisions,i=Math.floor(phase),t=phase-i,a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;
  return new T.Vector3(T.MathUtils.lerp(Math.sin(a),Math.sin(b),t),0,T.MathUtils.lerp(Math.cos(a),Math.cos(b),t));
 }
 const rim=rings.at(-1);
 for(let k=1;k<=40;k++){
  const t=k/40,u=1-t;
  rings.push(rim.map((start,j)=>{
   const a=j/segments*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a),n=rimNormals[j];
   const tangent=new T.Vector3(dx,-(n.x*dx+n.z*dz)/n.y,dz).multiplyScalar(.014);
   const end=originalDirection(j).multiplyScalar(profile[joinIndex].x);end.y=joinY;
   const p1=start.clone().add(tangent),p2=end.clone().add(new T.Vector3(0,-.045,0));
   return start.clone().multiplyScalar(u*u*u).addScaledVector(p1,3*u*u*t).addScaledVector(p2,3*u*t*t).addScaledVector(end,t*t*t);
  }));
 }
 for(let k=joinIndex+1;k<profile.length;k++){
  rings.push(section.radii.map((_,j)=>{const v=originalDirection(j).multiplyScalar(profile[k].x);v.y=profile[k].y;return v;}));
 }
 const vertices=[],indices=[];
 for(const ring of rings)for(const v of ring)vertices.push(v.x,v.y,v.z);
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){
  const a=i*segments+j,b=i*segments+(j+1)%segments,c=a+segments,d=b+segments;
  indices.push(a,b,c,b,d,c);
 }
 const source=new T.BufferGeometry();source.setAttribute('position',new T.Float32BufferAttribute(vertices,3));source.setIndex(indices);
 const geometry=mergeVertices(source,1e-6),faces=[];
 for(let i=0;i<geometry.index.count;i+=3){const [a,b,c]=geometry.index.array.slice(i,i+3);if(a!==b&&b!==c&&c!==a)faces.push(a,b,c);}
 geometry.setIndex(faces);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 // Keep the original upper calf shading and blend the lower end into it.
 // Angular filtering prevents the resampled polygon edges forming bands.
 const n=geometry.attributes.normal,on=original.attributes.normal,saved=n.clone();
 const vertex=(ring,j)=>1+(ring-1)*segments+j;
 function originalNormal(j,k){
  const phase=j/subdivisions,side=Math.floor(phase);
  return new T.Vector3().fromBufferAttribute(on,side*profile.length+k)
   .lerp(new T.Vector3().fromBufferAttribute(on,(side+1)*profile.length+k),phase-side).normalize();
 }
 for(let k=1;k<=40;k++)for(let j=0;j<segments;j++){
  const normal=new T.Vector3();
  for(let d=-8;d<=8;d++)normal.addScaledVector(new T.Vector3().fromBufferAttribute(saved,vertex(24+k,(j+d+segments)%segments)),Math.exp(-d*d/32));
  normal.normalize().lerp(originalNormal(j,joinIndex),T.MathUtils.smoothstep(k/40,.65,1)).normalize();
  n.setXYZ(vertex(24+k,j),normal.x,normal.y,normal.z);
 }
 for(let k=joinIndex;k<profile.length-1;k++)for(let j=0;j<segments;j++){
  const normal=originalNormal(j,k);n.setXYZ(vertex(64+k-joinIndex,j),normal.x,normal.y,normal.z);
 }
 n.setXYZ(n.count-1,0,1,0);
 const lipTangents=rimNormals.map((n,j)=>{const a=j/segments*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a);return [dx*.014,-(n.x*dx+n.z*dz)/n.y*.014,dz*.014];});
 geometry.userData={socketDepth:SOCKET_DEPTH,socketClearance:SOCKET_CLEARANCE,footSeatCenter:section.center.toArray(),socketSeatCenter:[0,rimY,0],cavityVertexCount:1+24*segments,segments,joinY,lipRings:40,lipTangents};
 calf.geometry=geometry;calf.userData={socket:true,centered:true};
 original.dispose();source.dispose();
}
