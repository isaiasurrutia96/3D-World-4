import * as T from 'three';
import {point} from './fit.js';
const key=v=>v.map(x=>Math.round(x/1e-7)).join(',');

function geometry(positions,normals,index){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setIndex(index);g.computeBoundingBox();g.computeBoundingSphere();return g;}

// Reuse the approved +X shoulder and reflect it once. Both hip cups already
// belong to this same source torso. There is no second independent mold solve.
export function symmetricTorso(source){
 const g=source.geometry,p=g.attributes.position,n=g.attributes.normal,I=g.index.array,positions=[],normals=[],index=[],maps=[new Map(),new Map()];
 const faces=[];for(let i=0;i<I.length;i+=3){const f=Array.from(I.subarray(i,i+3));if(f.every(j=>p.getX(j)>=-1e-8))faces.push(f);}
 for(let side=0;side<2;side++){const sign=side===0?1:-1,map=maps[side];for(const f of faces){const out=f.map(i=>{if(!map.has(i)){map.set(i,positions.length/3);positions.push(sign*p.getX(i),p.getY(i),p.getZ(i));normals.push(sign*n.getX(i),n.getY(i),n.getZ(i));}return map.get(i);});if(side)[out[1],out[2]]=[out[2],out[1]];index.push(...out);}}
 const cloneMold=(m,side)=>({...m,center:[side?-m.center[0]:m.center[0],m.center[1],m.center[2]],core:m.core.map(i=>maps[side].get(i)),rim:m.rim.map(([i,...v])=>[maps[side].get(i),...v])});
 const sockets={};for(const [side,s]of [[0,'L'],[1,'R']]){sockets['upperArm.'+s]=cloneMold(g.userData.shoulderMold,side);sockets['thigh.'+s]=cloneMold(g.userData.hipMolds.L,side);}
 if(Object.values(sockets).some(m=>[...m.core,...m.rim.map(([i])=>i)].some(i=>i===undefined)))throw Error('Torso mirror lost a fitted contact');
 return {geometry:geometry(positions,normals,index),sockets};
}

export function fitTorso(g,sockets,skeleton){
 const hip=sockets['thigh.L'],shoulder=sockets['upperArm.L'],bone=name=>point(skeleton.bones[skeleton.index.get(name)].head),hipMove=bone('thigh.L').sub(point(hip.center)),shoulderMove=bone('upperArm.L').sub(point(shoulder.center));
 if(Math.abs(hipMove.x)+Math.abs(hipMove.z)>1e-9||Math.abs(shoulderMove.y)+Math.abs(shoulderMove.z)>1e-9)throw Error('Unexpected authored torso coordinate frame');
 const p=g.attributes.position,n=g.attributes.normal,restPositions=p.array.slice(),restNormals=n.array.slice(),hipMax=Math.max(...[...hip.core,...hip.rim.map(([i])=>i)].map(i=>p.getY(i)))+.003;
 const S=T.MathUtils.smoothstep,move=v=>{
  const low=1-S(v.y,hipMax,1.05),r=Math.hypot(v.y-shoulder.center[1],v.z-shoulder.center[2]);
  const high=(1-S(r,.106,.20))*S(Math.abs(v.x),.10,.19)*S(v.y,1.12,1.14);
  return new T.Vector3(Math.sign(v.x)*shoulderMove.x*high,hipMove.y*low,0);
 };
 let minimumDeterminant=Infinity;const h=1e-5;
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i),d=move(v);if(d.lengthSq()===0)continue;
  const derivatives=[];for(let k=0;k<3;k++){const a=v.clone(),b=v.clone();a.setComponent(k,a.getComponent(k)+h);b.setComponent(k,b.getComponent(k)-h);derivatives.push(move(a).sub(move(b)).multiplyScalar(.5/h));}
  const J=new T.Matrix3().set(1+derivatives[0].x,derivatives[1].x,derivatives[2].x,derivatives[0].y,1+derivatives[1].y,derivatives[2].y,derivatives[0].z,derivatives[1].z,1+derivatives[2].z),det=J.determinant();minimumDeterminant=Math.min(minimumDeterminant,det);if(det<.2)throw Error('Torso fitting would fold the surface');
  v.add(d);p.setXYZ(i,v.x,v.y,v.z);const normal=new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(J.invert().transpose()).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);
 }
 for(const [bone,m]of Object.entries(sockets)){const delta=bone.startsWith('thigh')?hipMove:new T.Vector3(bone.endsWith('.L')?shoulderMove.x:-shoulderMove.x,0,0);m.sourceCenter=[...m.center];m.center=point(m.center).add(delta).toArray();}
 g.computeBoundingBox();g.computeBoundingSphere();return {restPositions,restNormals,hipMove:hipMove.toArray(),shoulderMove:shoulderMove.toArray(),hipMax,minimumDeterminant};
}

// Reuse the exact existing internal waist ball, cup, lips and seam. Only
// replace their old outer shell with the newly approved shoulder/hip shell.
export function splitAtExistingSeam(full,oldChest,oldPelvis){
 const sourceP=full.attributes.position,sourceN=full.attributes.normal,keys=new Set();for(let i=0;i<sourceP.count;i++)keys.add(key([sourceP.getX(i),sourceP.getY(i),sourceP.getZ(i)]));
 function join(old,upper){
  const g=old.geometry.clone();g.applyMatrix4(new T.Matrix4().fromArray(old.userData.restMatrix));const P=g.attributes.position,N=g.attributes.normal,I=g.index.array,rows=P.count/161;
  if(!Number.isInteger(rows))throw Error('Unexpected original chest seam');
  const candidates=[];for(let j=0;j<rows;j++){const y=P.getY(j);if(y<1.07||y>1.14)continue;let shared=0;for(let c=0;c<161;c++){const i=c*rows+j;if(keys.has(key([P.getX(i),P.getY(i),P.getZ(i)])))shared++;}if(shared>=159)candidates.push({j,y});}
  if(!candidates.length)throw Error('No shared authored torso ring');const {j:joinRow,y:cut}=upper?candidates[0]:candidates.at(-1);
  const positions=[],normals=[],faces=[],sourceMap=new Map(),oldMap=new Map();
  const append=(p,n)=>{const id=positions.length/3;positions.push(...p);normals.push(...n);return id;};
  const fromSource=i=>{if(!sourceMap.has(i))sourceMap.set(i,append([sourceP.getX(i),sourceP.getY(i),sourceP.getZ(i)],[sourceN.getX(i),sourceN.getY(i),sourceN.getZ(i)]));return sourceMap.get(i);};
  const sourceI=full.index.array;for(let i=0;i<sourceI.length;i+=3){const f=Array.from(sourceI.subarray(i,i+3));if(f.every(j=>upper?sourceP.getY(j)>=cut-1e-7:sourceP.getY(j)<=cut+1e-7))faces.push(...f.map(fromSource));}
  const boundary=[...sourceMap].filter(([i])=>Math.abs(sourceP.getY(i)-cut)<1e-7).map(([i,id])=>({i,id,p:new T.Vector3(sourceP.getX(i),sourceP.getY(i),sourceP.getZ(i))}));
  const snap=new Map();for(const q of boundary)snap.set(key(q.p.toArray()),q.id);
  const fromOld=i=>{if(!oldMap.has(i)){const v=[P.getX(i),P.getY(i),P.getZ(i)],k=key(v);const shared=Math.abs(v[1]-cut)<1e-7&&snap.has(k),id=shared?snap.get(k):append(v,[N.getX(i),N.getY(i),N.getZ(i)]);if(shared)normals.splice(id*3,3,N.getX(i),N.getY(i),N.getZ(i));oldMap.set(i,id);}return oldMap.get(i);};
  let stitched=0;
  for(let i=0;i<I.length;i+=3){const f=Array.from(I.subarray(i,i+3));if(!f.every(v=>upper?v%rows<=joinRow:v%rows>=joinRow))continue;const poly=[];
   for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3];poly.push(fromOld(a));if(a%rows!==joinRow||b%rows!==joinRow)continue;
    const A=new T.Vector3().fromBufferAttribute(P,a),B=new T.Vector3().fromBufferAttribute(P,b),edge=B.clone().sub(A),inside=[];
    for(const q of boundary){const t=q.p.clone().sub(A).dot(edge)/edge.lengthSq();if(t<=1e-5||t>=1-1e-5||A.clone().addScaledVector(edge,t).distanceTo(q.p)>2e-7)continue;inside.push({...q,t});}
    const seen=new Set();for(const q of inside.sort((a,b)=>a.t-b.t)){const k=key(q.p.toArray());if(seen.has(k))continue;seen.add(k);poly.push(q.id);stitched++;const normal=new T.Vector3().fromBufferAttribute(N,a).lerp(new T.Vector3().fromBufferAttribute(N,b),q.t).normalize();normals.splice(q.id*3,3,normal.x,normal.y,normal.z);}
   }
   if(poly.length===3){faces.push(...poly);continue;}
   const center=new T.Vector3(),normal=new T.Vector3();for(const id of poly){center.add(point(positions.slice(3*id,3*id+3)));normal.add(point(normals.slice(3*id,3*id+3)));}center.multiplyScalar(1/poly.length);normal.normalize();const id=append(center.toArray(),normal.toArray());for(let k=0;k<poly.length;k++)if(key(positions.slice(3*poly[k],3*poly[k]+3))!==key(positions.slice(3*poly[(k+1)%poly.length],3*poly[(k+1)%poly.length]+3)))faces.push(id,poly[k],poly[(k+1)%poly.length]);
  }
  return {geometry:geometry(positions,normals,faces),sourceMap,oldMap,cut,joinRow,stitched,baseline:g};
 }
 return {chest:join(oldChest,true),pelvis:join(oldPelvis,false)};
}
