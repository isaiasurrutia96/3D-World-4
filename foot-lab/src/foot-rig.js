import * as T from 'three';

export const REST_POSE=Object.freeze({ankle:0,roll:0,toes:0,heel:0});
export const MOTIONS=Object.freeze([
 {id:'ankle',label:'Ankle bend',min:-18,max:24,left:'Toes up',right:'Toes down'},
 {id:'roll',label:'Side tilt',min:-10,max:10,left:'Left',right:'Right'},
 {id:'toes',label:'Toe bend',min:0,max:25,left:'Rest',right:'Raised'},
 {id:'heel',label:'Heel raise',min:0,max:30,left:'Flat',right:'Tiptoe'},
]);
export const POSES=Object.freeze({
 rest:{...REST_POSE},point:{...REST_POSE,ankle:24},flex:{...REST_POSE,ankle:-18},
 toes:{...REST_POSE,toes:25},tiptoe:{...REST_POSE,heel:30},
});
export const BEND_START=.145,BEND_END=.265;
const MID_HEIGHT=.065,STEPS=192;

// Transport cross-sections along a smooth arc through the ball of the foot.
// Bending around its middle keeps the thick clay surface from folding over.
function bendCurve(degrees,maxZ){
 const angle=T.MathUtils.degToRad(degrees),step=(maxZ-BEND_START)/STEPS;
 const ys=new Float64Array(STEPS+1),zs=new Float64Array(STEPS+1);zs[0]=BEND_START;
 for(let i=1;i<=STEPS;i++){
  const z=BEND_START+(i-.5)*step,a=-angle*T.MathUtils.smoothstep(z,BEND_START,BEND_END);
  ys[i]=ys[i-1]-Math.sin(a)*step;zs[i]=zs[i-1]+Math.cos(a)*step;
 }
 return (x,y,z,out)=>{
  if(z<=BEND_START||angle===0)return out.set(x,y,z);
  const q=T.MathUtils.clamp((z-BEND_START)/step,0,STEPS),i=Math.min(STEPS-1,Math.floor(q)),t=q-i;
  const a=-angle*T.MathUtils.smoothstep(z,BEND_START,BEND_END),offset=y-MID_HEIGHT;
  return out.set(x,MID_HEIGHT+T.MathUtils.lerp(ys[i],ys[i+1],t)+offset*Math.cos(a),T.MathUtils.lerp(zs[i],zs[i+1],t)+offset*Math.sin(a));
 };
}

export function motionPose(seconds){
 const phase=((seconds%16)+16)%16,p={...REST_POSE};
 if(phase<5){p.ankle=phase<2.5?24*Math.sin(phase/2.5*Math.PI):-18*Math.sin((phase-2.5)/2.5*Math.PI);}
 else if(phase<9)p.roll=10*Math.sin((phase-5)/4*Math.PI*2);
 else if(phase<12)p.toes=25*Math.sin((phase-9)/3*Math.PI)**2;
 else p.heel=30*Math.sin((phase-12)/4*Math.PI)**2;
 return p;
}

export function createFootRig(foot,calf){
 const group=new T.Group();group.name='foot-motion-study';group.add(foot,calf);
 const fp=foot.geometry.attributes.position,fn=foot.geometry.attributes.normal,cp=calf.geometry.attributes.position,cn=calf.geometry.attributes.normal;
 const restFoot=fp.array.slice(),restFootNormals=fn.array.slice(),restCalf=cp.array.slice(),restCalfNormals=cn.array.slice();
 const calfPosition=calf.position.clone(),seat=calf.geometry.userData.footSeatCenter;
 const pivot=new T.Vector3(seat[0],seat[1]-.012,seat[2]),anchor=new T.Vector3(0,0,0);
 let soleFront=-Infinity;for(let i=0;i<fp.count;i++)if(fp.getY(i)<1e-7)soleFront=Math.max(soleFront,fp.getZ(i));
 anchor.z=soleFront-.003;
 const maxZ=foot.geometry.boundingBox.max.z,point=new T.Vector3(),bent=new T.Vector3(),offset=new T.Vector3();
 const heelRotation=new T.Matrix4(),extraRotation=new T.Matrix4(),rigid=new T.Matrix4();
 const pivotNow=new T.Vector3(),pivotDelta=new T.Vector3(),residual=new T.Vector3();
 const colX=new T.Vector3(),colY=new T.Vector3(),colZ=new T.Vector3(),coX=new T.Vector3(),coY=new T.Vector3(),coZ=new T.Vector3(),normal=new T.Vector3();
 let pose={...REST_POSE},updates=0;
 function setPose(input){
  pose=Object.fromEntries(MOTIONS.map(({id,min,max})=>[id,T.MathUtils.clamp(Number.isFinite(input[id])?input[id]:0,min,max)]));
  const rest=Object.values(pose).every(v=>v===0);
  if(rest){
   fp.array.set(restFoot);fn.array.set(restFootNormals);cp.array.set(restCalf);cn.array.set(restCalfNormals);
   calf.position.copy(calfPosition);group.position.set(0,0,0);
  }else{
   const bend=bendCurve(pose.heel+pose.toes,maxZ),heelBend=bendCurve(pose.heel,maxZ);
   heelRotation.makeRotationX(T.MathUtils.degToRad(pose.heel));
   heelBend(anchor.x,anchor.y,anchor.z,bent).applyMatrix4(heelRotation);
   offset.copy(anchor).sub(bent);heelRotation.setPosition(offset);
   pivotNow.copy(pivot).applyMatrix4(heelRotation);pivotDelta.copy(pivotNow).sub(pivot);
   extraRotation.makeRotationZ(T.MathUtils.degToRad(pose.roll)).multiply(new T.Matrix4().makeRotationX(T.MathUtils.degToRad(pose.ankle)));
   offset.copy(pivotNow).sub(point.copy(pivotNow).applyMatrix4(extraRotation));extraRotation.setPosition(offset);
   rigid.multiplyMatrices(extraRotation,heelRotation);
   let lowest=Infinity;
   for(let i=0;i<fp.count;i++){
    bend(restFoot[i*3],restFoot[i*3+1],restFoot[i*3+2],point).applyMatrix4(rigid);
    fp.setXYZ(i,point.x,point.y,point.z);lowest=Math.min(lowest,point.y);
   }
   group.position.y=-lowest;
   calf.position.copy(calfPosition).add(pivotDelta);
   const m=rigid.elements;
   for(let i=0;i<cp.count;i++){
    const x=restCalf[i*3],y=restCalf[i*3+1],z=restCalf[i*3+2];
    point.set(x,y,z).add(calfPosition).sub(pivot);
    residual.set(m[0]*point.x+m[4]*point.y+m[8]*point.z-point.x,m[1]*point.x+m[5]*point.y+m[9]*point.z-point.y,m[2]*point.x+m[6]*point.y+m[10]*point.z-point.z);
    const t=T.MathUtils.clamp((y+.16)/.185,0,1),w=1-t*t*(3-2*t),dw=-6*t*(1-t)/.185;
    cp.setXYZ(i,x+w*residual.x,y+w*residual.y,z+w*residual.z);
    // Inverse-transpose Jacobian keeps the saved smooth shading through the
    // socket's soft blend. The entire seated cavity follows the ankle rigidly.
    colX.set(1-w+w*m[0],w*m[1],w*m[2]);
    colY.set(w*m[4],1-w+w*m[5],w*m[6]).addScaledVector(residual,dw);
    colZ.set(w*m[8],w*m[9],1-w+w*m[10]);
    coX.crossVectors(colY,colZ);coY.crossVectors(colZ,colX);coZ.crossVectors(colX,colY);
    normal.copy(coX).multiplyScalar(restCalfNormals[i*3]).addScaledVector(coY,restCalfNormals[i*3+1]).addScaledVector(coZ,restCalfNormals[i*3+2]).normalize();
    cn.setXYZ(i,normal.x,normal.y,normal.z);
   }
   foot.geometry.computeVertexNormals();
  }
  for(const attribute of [fp,fn,cp,cn])attribute.needsUpdate=true;
  for(const mesh of [foot,calf]){mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
  group.updateMatrixWorld(true);updates++;
 }
 return {group,setPose,getState:()=>({pose:{...pose},updates,groundLift:group.position.y}),pivot:pivot.toArray(),bendStart:BEND_START,bendEnd:BEND_END};
}
