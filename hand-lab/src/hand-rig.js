import * as T from 'three';
import {lengthenDigits} from '../../avatar/src/hand-study/lengthen-digits.js';
import {easeDigitSweep} from '../../avatar/src/hand-study/ease-digit-sweep.js';

const STEPS=512,RANGE=1.6,REST=.25;
export const FINGERS=[
 {id:'index',label:'Index',root:[225,199],tip:[260,79],radius:46,rest:[10,18,7],closed:[32,45,15],adduction:4},
 {id:'middle',label:'Middle',root:[300,214],tip:[353,92],radius:46,rest:[13,23,8],closed:[35,50,18],adduction:0},
 {id:'ring',label:'Ring',root:[350,242],tip:[410,154],radius:43,rest:[16,28,10],closed:[38,55,20],adduction:-4},
 {id:'little',label:'Little',root:[371,287],tip:[438,249],radius:37,rest:[20,30,12],closed:[40,55,22],adduction:-6},
 {id:'thumb',label:'Thumb',root:[162,267],tip:[131,190],radius:45,rest:[8,10,0],closed:[20,18,0]},
];
export const REST_POSE={index:REST,middle:REST,ring:REST,little:REST,thumb:REST,opposition:0,together:0};
export const POSES={
 rest:{...REST_POSE},
 relax:{...REST_POSE,together:.6},
 open:{...REST_POSE,index:0,middle:0,ring:0,little:0,thumb:0},
 curl:{...REST_POSE,index:1,middle:1,ring:1,little:1,thumb:.6,opposition:.35},
 point:{...REST_POSE,index:0,middle:.9,ring:.9,little:.9,thumb:.45,opposition:.25},
};
const clamp=v=>T.MathUtils.clamp(v,0,1);
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};

function anglesFor(d,curl){
 return d.rest.map((a,j)=>curl<=REST?a*curl/REST:a+(d.closed[j]-a)*(curl-REST)/(1-REST));
}
function curve(d,curl){
 const angles=anglesFor(d,curl),data=new Float64Array((STEPS+1)*5);
 let cx=0,cy=0,cz=0;
 for(let j=0;j<=STEPS;j++){
  const t=j/STEPS*RANGE;
  const theta=T.MathUtils.degToRad(angles[0]*smooth(0,.32,t)+angles[1]*smooth(.25,.72,t)+angles[2]*smooth(.62,1.04,t));
  if(j){
   const mid=(j-.5)/STEPS*RANGE;
   const a=T.MathUtils.degToRad(angles[0]*smooth(0,.32,mid)+angles[1]*smooth(.25,.72,mid)+angles[2]*smooth(.62,1.04,mid));
   const k=j*3,dx=d.centres[k]-d.centres[k-3],dy=d.centres[k+1]-d.centres[k-2];
   cx+=dx*(Math.cos(a)-1);cy+=dy*(Math.cos(a)-1);cz+=Math.hypot(dx,dy)*Math.sin(a);
  }
  const k=j*5;data[k]=cx;data[k+1]=cy;data[k+2]=cz;data[k+3]=Math.cos(theta);data[k+4]=Math.sin(theta);
 }
 return data;
}
function rotateOffset(x,y,z,ax,ay,c,s){
 const dot=ax*x+ay*y,k=1-c;
 return [x*c+ay*z*s+ax*dot*k,y*c-ax*z*s+ay*dot*k,z*c+(ax*y-ay*x)*s];
}

export function createHandRig(hand){
 const geometry=hand.geometry,bind=geometry.userData.labBind;
 if(!bind)throw Error('Hand Lab bind data was not captured');
 const approved=geometry.attributes.position.array.slice(),approvedNormals=geometry.attributes.normal.array.slice();
 const {straight,original,side}=bind,vertexCount=approved.length/3;
 const jointPositions=[];
 for(const d of FINGERS)for(let j=0;j<=STEPS;j++){
  const t=j/STEPS*RANGE;
  jointPositions.push((d.root[0]+(d.tip[0]-d.root[0])*t-244)*.0008*side,(d.root[1]+(d.tip[1]-d.root[1])*t-285)*.0008,0);
 }
 const joints=new T.BufferGeometry();joints.setAttribute('position',new T.Float32BufferAttribute(jointPositions,3));
 lengthenDigits(joints,side);easeDigitSweep(joints,side);
 const jp=joints.attributes.position;
 const digits=FINGERS.map((d,i)=>{
  const dx=d.tip[0]-d.root[0],dy=d.tip[1]-d.root[1],length=Math.hypot(dx,dy),centres=new Float64Array((STEPS+1)*3),axes=new Float64Array((STEPS+1)*2);
  for(let j=0;j<=STEPS;j++){
   const at=i*(STEPS+1)+j;centres[j*3]=jp.getX(at);centres[j*3+1]=jp.getY(at);centres[j*3+2]=jp.getZ(at);
   const a=i*(STEPS+1)+Math.max(0,j-1),b=i*(STEPS+1)+Math.min(STEPS,j+1),vx=jp.getX(b)-jp.getX(a),vy=jp.getY(b)-jp.getY(a),n=Math.hypot(vx,vy);
   axes[j*2]=vy/n;axes[j*2+1]=-vx/n;
  }
  const digit={...d,length,ux:dx/length,uy:dy/length,centres,axes,rows:[],adductionRows:[],tipVertices:[],rigidVertices:[]};
  digit.restCurve=curve(digit,REST);return digit;
 });
 joints.dispose();
 const thumbWeights=new Float32Array(vertexCount);
 // Bind once in the original reference coordinates. Only the same finger
 // region used by the approved rest pose can move; palm/socket stay fixed.
 for(let i=0;i<vertexCount;i++){
  const px=original[i*3]*side/.0008+244,py=original[i*3+1]/.0008+285;
  if(py>=300)continue;
  const guard=1-smooth(285,300,py),matches=[];let total=0;
  for(const d of digits){
   const x=px-d.root[0],y=py-d.root[1],along=x*d.ux+y*d.uy,q=T.MathUtils.clamp(along,0,d.length);
   const weight=Math.exp(-8*((x-q*d.ux)**2+(y-q*d.uy)**2)/(d.radius*d.radius));
   total+=weight;matches.push({along,weight});
  }
  if(total<1e-8)continue;
  const owner=matches.reduce((best,m,j)=>m.weight>matches[best].weight?j:best,0);
  // Use a smooth partition at the webs, with a solid 100% plateau on each
  // finger body. A hard ownership border produces creases at the knuckles.
  const ownership=matches.map((m,j)=>smooth(-.2,.2,(m.weight-Math.max(...matches.filter((_,k)=>k!==j).map(other=>other.weight)))/total));
  const ownershipTotal=ownership.reduce((sum,w)=>sum+w,0);
  for(let j=0;j<digits.length;j++){
   const d=digits[j],{along,weight}=matches[j];if(along<=0||weight<1e-10)continue;
   const w=weight/total*guard;if(w<1e-7)continue;
   if(j<4&&ownership[j]>0){
    // Full influence beyond the attachment keeps the finger body rigid;
    // smooth transitions are confined to the knuckle/web region.
    const movement=ownership[j]/ownershipTotal*guard*smooth(0,.30,along/d.length);
    d.adductionRows.push(i,movement);
    if(movement===1)d.rigidVertices.push(i);
    if(j===owner&&along/d.length>.92)d.tipVertices.push(i);
   }
   const t=T.MathUtils.clamp(along/d.length/RANGE*STEPS,0,STEPS),index=Math.min(STEPS-1,Math.floor(t)),f=t-index;
   const k=index*3,ak=index*2,ck=index*5;
   const bx=T.MathUtils.lerp(d.centres[k],d.centres[k+3],f),by=T.MathUtils.lerp(d.centres[k+1],d.centres[k+4],f),bz=T.MathUtils.lerp(d.centres[k+2],d.centres[k+5],f);
   let ax=T.MathUtils.lerp(d.axes[ak],d.axes[ak+2],f),ay=T.MathUtils.lerp(d.axes[ak+1],d.axes[ak+3],f);const n=Math.hypot(ax,ay);ax/=n;ay/=n;
   const ox=straight[i*3]-bx,oy=straight[i*3+1]-by,oz=straight[i*3+2]-bz;
   const c=T.MathUtils.lerp(d.restCurve[ck+3],d.restCurve[ck+8],f),s=T.MathUtils.lerp(d.restCurve[ck+4],d.restCurve[ck+9],f);
   const r=rotateOffset(ox,oy,oz,ax,ay,c,s);
   d.rows.push(i,index,f,w,ox,oy,oz,ax,ay,r[0]+T.MathUtils.lerp(d.restCurve[ck],d.restCurve[ck+5],f),r[1]+T.MathUtils.lerp(d.restCurve[ck+1],d.restCurve[ck+6],f),r[2]+T.MathUtils.lerp(d.restCurve[ck+2],d.restCurve[ck+7],f));
   if(j===4)thumbWeights[i]=w*smooth(0,.25,along/d.length);
  }
 }
 for(const d of digits){d.rows=new Float64Array(d.rows);d.adductionRows=new Float64Array(d.adductionRows);}
 delete geometry.userData.labBind;
 const accumulation=new Float64Array(approved.length),position=geometry.attributes.position;
 position.setUsage(T.DynamicDrawUsage);geometry.attributes.normal.setUsage(T.DynamicDrawUsage);
 geometry.boundingSphere=new T.Sphere(new T.Vector3(),.65);
 const thumbPivot=digits[4].centres.slice(0,3);
 let pose={...REST_POSE};
 function setPose(next){
  pose=Object.fromEntries(Object.keys(REST_POSE).map(id=>[id,clamp(Number.isFinite(next[id])?next[id]:REST_POSE[id])]));
  const isRest=Object.keys(REST_POSE).every(id=>Math.abs(pose[id]-REST_POSE[id])<1e-9);
  if(isRest){position.array.set(approved);geometry.attributes.normal.array.set(approvedNormals);}
  else{
   accumulation.fill(0);
   for(const d of digits){
    if(Math.abs(pose[d.id]-REST)<1e-9)continue;
    const data=curve(d,pose[d.id]),rows=d.rows;
    for(let j=0;j<rows.length;j+=12){
     const i=rows[j]*3,k=rows[j+1]*5,f=rows[j+2],w=rows[j+3],x=rows[j+4],y=rows[j+5],z=rows[j+6],ax=rows[j+7],ay=rows[j+8];
     const c=data[k+3]+(data[k+8]-data[k+3])*f,s=data[k+4]+(data[k+9]-data[k+4])*f,dot=ax*x+ay*y,one=1-c;
     accumulation[i]+=(x*c+ay*z*s+ax*dot*one+data[k]+(data[k+5]-data[k])*f-rows[j+9])*w;
     accumulation[i+1]+=(y*c-ax*z*s+ay*dot*one+data[k+1]+(data[k+6]-data[k+1])*f-rows[j+10])*w;
     accumulation[i+2]+=(z*c+(ax*y-ay*x)*s+data[k+2]+(data[k+7]-data[k+2])*f-rows[j+11])*w;
    }
   }
   for(let i=0;i<approved.length;i++)position.array[i]=approved[i]+accumulation[i];
   if(pose.opposition>0){
    const a=-T.MathUtils.degToRad(30)*pose.opposition,b=side*T.MathUtils.degToRad(42)*pose.opposition,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
    for(let i=0;i<vertexCount;i++){
     const w=thumbWeights[i];if(w<1e-7)continue;const k=i*3,x=position.array[k]-thumbPivot[0],y=position.array[k+1]-thumbPivot[1],z=position.array[k+2]-thumbPivot[2];
     const xx=ca*x+sa*z,zz=-sa*x+ca*z,rx=cb*xx-sb*y,ry=sb*xx+cb*y;
     position.array[k]+=(rx-x)*w;position.array[k+1]+=(ry-y)*w;position.array[k+2]+=(zz-z)*w;
    }
   }
   if(pose.together>0){
    // Rotate each finger toward the middle finger, rather than squeezing
    // or rescaling its surface. Blend only near the knuckle attachment.
    accumulation.fill(0);
    for(const d of digits){
     if(!d.adduction)continue;
     const angle=side*T.MathUtils.degToRad(d.adduction)*pose.together,c=Math.cos(angle),s=Math.sin(angle),rows=d.adductionRows;
     for(let j=0;j<rows.length;j+=2){
      const k=rows[j]*3,w=rows[j+1],x=position.array[k]-d.centres[0],y=position.array[k+1]-d.centres[1];
      accumulation[k]+=(c*x-s*y-x)*w;accumulation[k+1]+=(s*x+c*y-y)*w;
     }
    }
    for(let i=0;i<position.array.length;i++)position.array[i]+=accumulation[i];
   }
   geometry.computeVertexNormals();
  }
  position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;
 }
 return {setPose,getPose:()=>({...pose}),approvedPositions:approved,approvedNormals,vertexCount,
  fingerTipVertices:digits.slice(0,4).map(d=>d.tipVertices),
  rigidFingerVertices:digits.slice(0,4).map(d=>d.rigidVertices),
  protectedVertices:Array.from({length:vertexCount},(_,i)=>i).filter(i=>original[i*3+1]/.0008+285>=300)};
}
