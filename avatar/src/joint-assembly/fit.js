import * as T from 'three';

export const point=a=>new T.Vector3(...a);
const clamp=x=>T.MathUtils.clamp(x,0,1);
// Integrate a smooth ramp into an almost-linear middle. Its bounded slope
// avoids folding short shafts when both unchanged end cups are brought in.
function transition(x,ramp=.12){
 const t=clamp(x),S=u=>u*u*u-u*u*u*u/2;
 if(t<ramp)return {value:ramp*S(t/ramp)/(1-ramp),slope:(3*(t/ramp)**2-2*(t/ramp)**3)/(1-ramp)};
 if(t>1-ramp){const u=(1-t)/ramp;return {value:1-ramp*S(u)/(1-ramp),slope:(3*u*u-2*u*u*u)/(1-ramp)};}
 return {value:(t-ramp/2)/(1-ramp),slope:1/(1-ramp)};
}

export function fitLimb(mesh,proximal,distal,targetA,targetB,referenceQuaternion){
 const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,A=point(proximal.center),B=point(distal.center),axis=B.clone().sub(A),sourceLength=axis.length();axis.normalize();
 const target=point(targetB).sub(point(targetA)),targetLength=target.length(),change=targetLength-sourceLength;
 const projected=i=>point([p.getX(i),p.getY(i),p.getZ(i)]).sub(A).dot(axis);
 const contact=m=>[...m.core,...m.rim.map(([i])=>i)];
 const lo=Math.max(...contact(proximal).map(projected))+.002,hi=Math.min(...contact(distal).map(projected))-.002;
 if(!(hi>lo))throw Error(mesh.name+': fitted end cups leave no shaft');
 const minimumStretch=1+Math.min(0,change/(hi-lo)/.88);if(minimumStretch<.15)throw Error(mesh.name+': fitting would collapse the shaft');
 const sourcePositions=p.array.slice(),sourceNormals=n.array.slice();
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i),s=v.clone().sub(A).dot(axis),t=transition((s-lo)/(hi-lo)),stretch=1+change*t.slope/(hi-lo);
  v.addScaledVector(axis,change*t.value);p.setXYZ(i,v.x,v.y,v.z);
  if(t.slope){const normal=new T.Vector3().fromBufferAttribute(n,i);normal.addScaledVector(axis,(1/stretch-1)*normal.dot(axis)).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}
 }
 const q=referenceQuaternion.clone(),current=axis.clone().applyQuaternion(q),swing=new T.Quaternion().setFromUnitVectors(current,target.normalize());q.premultiply(swing);
 mesh.quaternion.copy(q);mesh.scale.set(1,1,1);mesh.position.copy(point(targetA)).sub(A.clone().applyQuaternion(q));
 const shifted=B.clone().addScaledVector(axis,change);
 g.computeBoundingBox();g.computeBoundingSphere();mesh.updateMatrixWorld(true);
 return {proximal:{...proximal,center:A.toArray()},distal:{...distal,center:shifted.toArray()},sourcePositions,sourceNormals,sourceLength,targetLength,lo,hi,minimumStretch,axis:axis.toArray(),change};
}

export function placeSocket(mesh,center,target,quaternion){
 mesh.quaternion.copy(quaternion);mesh.position.copy(point(target)).sub(point(center).multiply(mesh.scale).applyQuaternion(quaternion));mesh.updateMatrixWorld(true);
}

export function reflectMesh(mesh){
 const g=mesh.geometry.clone(),p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){p.setX(i,-p.getX(i));n.setX(i,-n.getX(i));}
 const I=g.index.array;for(let i=0;i<I.length;i+=3)[I[i+1],I[i+2]]=[I[i+2],I[i+1]];
 g.userData={};g.computeBoundingBox();g.computeBoundingSphere();
 const out=new T.Mesh(g,mesh.material);out.position.set(-mesh.position.x,mesh.position.y,mesh.position.z);out.quaternion.fromArray([mesh.quaternion.x,-mesh.quaternion.y,-mesh.quaternion.z,mesh.quaternion.w].map(v=>v===0?0:v));out.scale.copy(mesh.scale);return out;
}
