import * as T from 'three';

const BEND_START=.145,BEND_END=.265,MID_HEIGHT=.065,STEPS=192;
const kernel=Array.from({length:17},(_,i)=>Math.exp(-((i-8)**2)/32));
function curve(degrees,maxZ){
 const a=T.MathUtils.degToRad(degrees),step=(maxZ-BEND_START)/STEPS,ys=new Float64Array(STEPS+1),zs=new Float64Array(STEPS+1);zs[0]=BEND_START;
 for(let i=1;i<=STEPS;i++){const angle=-a*T.MathUtils.smoothstep(BEND_START+(i-.5)*step,BEND_START,BEND_END);ys[i]=ys[i-1]-Math.sin(angle)*step;zs[i]=zs[i-1]+Math.cos(angle)*step;}
 return (x,y,z,out)=>{if(z<=BEND_START||a===0)return out.set(x,y,z);const q=T.MathUtils.clamp((z-BEND_START)/step,0,STEPS),i=Math.min(STEPS-1,Math.floor(q)),t=q-i,angle=-a*T.MathUtils.smoothstep(z,BEND_START,BEND_END);return out.set(x,MID_HEIGHT+T.MathUtils.lerp(ys[i],ys[i+1],t)+(y-MID_HEIGHT)*Math.cos(angle),T.MathUtils.lerp(zs[i],zs[i+1],t)+(y-MID_HEIGHT)*Math.sin(angle));};
}

// Same authored ball bend as Checkpoint 2, with no animation-time rescaling.
export function createFootMotion(foot,calf){
 const p=foot.geometry.attributes.position,n=foot.geometry.attributes.normal,rest=p.array.slice(),normals=n.array.slice(),maxZ=foot.geometry.boundingBox.max.z;
 const seat=calf.geometry.userData.footSeatCenter,pivot=new T.Vector3(seat[0],seat[1]-.012,seat[2]),rear=new T.Matrix4(),extra=new T.Matrix4(),anchor=new T.Vector3(0,0,0),v=new T.Vector3();
 let soleFront=-Infinity,probe=-1;for(let i=0;i<p.count;i++)if(p.getY(i)<1e-7){soleFront=Math.max(soleFront,p.getZ(i));if(p.getZ(i)>BEND_END&&probe<0)probe=i;}anchor.z=soleFront-.003;
 let lastHeel=-1,lastAnkle=-1,lowest=0;
 p.setUsage(T.DynamicDrawUsage);n.setUsage(T.DynamicDrawUsage);
 function setPose(heel=0,ankle=0){
  heel=Math.round(T.MathUtils.clamp(heel,0,30)*4)/4;ankle=Math.round(T.MathUtils.clamp(ankle,-15,15)*4)/4;
  if(heel===lastHeel&&ankle===lastAnkle)return;lastHeel=heel;lastAnkle=ankle;
  if(!heel&&!ankle){p.array.set(rest);n.array.set(normals);rear.identity();lowest=0;}
  else{
   const bend=curve(heel,maxZ);rear.makeRotationX(T.MathUtils.degToRad(heel));bend(anchor.x,anchor.y,anchor.z,v).applyMatrix4(rear);rear.setPosition(anchor.clone().sub(v));
   extra.makeRotationX(T.MathUtils.degToRad(ankle));extra.setPosition(pivot.clone().sub(v.copy(pivot).applyMatrix4(extra)));rear.premultiply(extra);
   lowest=Infinity;for(let i=0;i<p.count;i++){bend(rest[i*3],rest[i*3+1],rest[i*3+2],v).applyMatrix4(rear);p.setXYZ(i,v.x,v.y,v.z);lowest=Math.min(lowest,v.y);}foot.geometry.computeVertexNormals();
  }
  p.needsUpdate=true;n.needsUpdate=true;
 }
 foot.geometry.boundingSphere=new T.Sphere(new T.Vector3(0,.15,.1),.6);
 setPose();
 return {setPose,rear,pivot,probe,restPositions:rest,restNormals:normals,get lowest(){return lowest;},anklePoint(out){return out.copy(pivot).applyMatrix4(rear);}};
}

// The calf shaft is one rigid bone. Only the original rounded socket lip
// bridges between its fixed join and the independently planted foot.
export function createSocketMotion(calf,referenceCalfPosition){
 const g=calf.geometry,p=g.attributes.position,n=g.attributes.normal,rest=p.array.slice(),normals=n.array.slice();
 const {segments,cavityVertexCount,lipRings,lipTangents}=g.userData,rim=cavityVertexCount-segments,join=cavityVertexCount+(lipRings-1)*segments;
 const relative=new T.Matrix4(),previous=new T.Matrix4(),translation=new T.Matrix4().makeTranslation(...referenceCalfPosition.toArray()),normalMatrix=new T.Matrix3(),linear=new T.Matrix3(),v=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3(),tangent=new T.Vector3(),normal=new T.Vector3(),generated=new Float32Array(n.array.length);let initialized=false;
 p.setUsage(T.DynamicDrawUsage);n.setUsage(T.DynamicDrawUsage);
 function update(foot,rear,normalBlend){
  calf.updateWorldMatrix(true,false);foot.updateWorldMatrix(true,false);
  relative.copy(calf.matrixWorld).invert().multiply(foot.matrixWorld).multiply(rear).multiply(translation);
  if(initialized&&relative.elements.every((v,i)=>Math.abs(v-previous.elements[i])<1e-8))return;previous.copy(relative);initialized=true;
  normalMatrix.getNormalMatrix(relative);linear.setFromMatrix4(relative);
  p.array.set(rest);
  for(let i=0;i<cavityVertexCount;i++){v.fromArray(rest,i*3).applyMatrix4(relative);p.setXYZ(i,v.x,v.y,v.z);}
  for(let j=0;j<segments;j++){
   start.fromBufferAttribute(p,rim+j);end.fromArray(rest,(join+j)*3);tangent.fromArray(lipTangents[j]).applyMatrix3(linear);
   for(let k=1;k<lipRings;k++){const t=k/lipRings,u=1-t;v.copy(start).multiplyScalar(u*u*u+3*u*u*t).addScaledVector(tangent,3*u*u*t).addScaledVector(end,3*u*t*t+t*t*t);v.y-=.045*3*u*t*t;p.setXYZ(cavityVertexCount+(k-1)*segments+j,v.x,v.y,v.z);}
  }
  // Live playback already supplies cached smooth normals. During a short
  // start/stop blend, blend those with rest normals instead of rebuilding
  // and filtering the complete surface again. Offline/lab posing stays exact.
  const cachedNormals=Number.isFinite(normalBlend);
  if(!cachedNormals)g.computeVertexNormals();generated.set(n.array);
  for(let k=1;k<lipRings;k++)for(let j=0;j<segments;j++){
   const at=(cavityVertexCount+(k-1)*segments+j)*3;
   if(cachedNormals)normal.fromArray(generated,at).lerp(v.fromArray(normals,at),normalBlend).normalize();
   else{let x=0,y=0,z=0;for(let d=-8;d<=8;d++){const i=(cavityVertexCount+(k-1)*segments+(j+d+segments)%segments)*3,w=kernel[d+8];x+=generated[i]*w;y+=generated[i+1]*w;z+=generated[i+2]*w;}normal.set(x,y,z).normalize();}
   normal.lerp(v.fromArray(normals,(join+j)*3),T.MathUtils.smoothstep(k/lipRings,.65,1)).normalize();n.setXYZ(cavityVertexCount+(k-1)*segments+j,normal.x,normal.y,normal.z);
  }
  for(let i=0;i<cavityVertexCount;i++){normal.fromArray(normals,i*3).applyMatrix3(normalMatrix).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}
  n.array.set(normals.subarray(join*3),join*3);p.needsUpdate=true;n.needsUpdate=true;
 }
 g.boundingSphere=new T.Sphere(new T.Vector3(),.6);
 return {update,restPositions:rest,restNormals:normals};
}
