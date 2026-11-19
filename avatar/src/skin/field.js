import {createSkeleton} from '../../../motion-core/skeleton/skeleton.js';
import {createMeshDistance} from './mesh-distance.js';

export const PART={torso:0,head:1,neck:2,upperArm:3,forearm:4,hand:5,thigh:6,calf:7,foot:8};
export const VOXEL=.0045;
export const FIELD_BOUNDS={maxX:.625,minY:-.0173,maxY:1.927,minZ:-.31,maxZ:.475};
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const blend=(a,b,k)=>{const h=Math.max(0,Math.min(1,.5+.5*(b-a)/k));return b+(a-b)*h-k*h*(1-h);};

// Shape-preserving cubic interpolation: no ripples or overshoot between the
// broad anatomical controls. Values and first derivatives stay continuous.
export function profile(points){
 const d=points.slice(1).map((p,i)=>(p[1]-points[i][1])/(p[0]-points[i][0]));
 const m=points.map((_,i)=>i===0?d[0]:i===points.length-1?d.at(-1):d[i-1]*d[i]<=0?0:2/(1/d[i-1]+1/d[i]));
 return x=>{
  if(x<=points[0][0])return points[0][1];if(x>=points.at(-1)[0])return points.at(-1)[1];
  let i=0;while(x>points[i+1][0])i++;
  const h=points[i+1][0]-points[i][0],t=(x-points[i][0])/h,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*points[i][1]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*points[i+1][1]+(t3-t2)*h*m[i+1];
 };
}
export function segment(a,b){const v=b.map((x,i)=>x-a[i]),length=Math.hypot(...v),u=v.map(x=>x/length);return {a,b,length,u,along:(x,y,z)=>(x-a[0])*u[0]+(y-a[1])*u[1]+(z-a[2])*u[2]};}
function tube(s,radii,{depth=1,rear=0}={}){
 const radius=profile(radii);
 return (x,y,z)=>{
  const along=s.along(x,y,z),t=Math.max(0,Math.min(1,along/s.length)),r=radius(t);
  const cx=s.a[0]+s.u[0]*s.length*t,cy=s.a[1]+s.u[1]*s.length*t,cz=s.a[2]+s.u[2]*s.length*t+rear*Math.sin(Math.PI*t);
  // A slightly elliptical section gives a believable shin/forearm silhouette.
  return Math.hypot(x-cx,y-cy,(z-cz)/depth)-r;
 };
}

export function createSkinField(reference){
 const skeleton=createSkeleton(),at=n=>skeleton.bones[skeleton.index.get(n)].head;
 const chain={upperArm:segment(at('upperArm.L'),at('lowerArm.L')),forearm:segment(at('lowerArm.L'),at('hand.L')),thigh:segment(at('thigh.L'),at('shin.L')),calf:segment(at('shin.L'),at('foot.L'))};
 const find=n=>reference.group.children.find(m=>m.name===n);
 const foot=createMeshDistance(find('foot.L'),{margin:.065});
 const rx=profile([[.70,0],[.75,.15],[.84,.235],[.95,.25],[1.06,.235],[1.16,.22],[1.27,.26],[1.36,.30],[1.415,.22],[1.46,0]]);
 const rz=profile([[.70,0],[.75,.09],[.84,.175],[.95,.195],[1.06,.19],[1.16,.195],[1.27,.19],[1.36,.17],[1.415,.11],[1.46,0]]);
 function torso(x,y,z){
  if(y<=.70||y>=1.46)return Math.hypot(x,Math.max(.70-y,0,y-1.46),z-.015);
  const a=Math.max(1e-6,rx(y)),b=Math.max(1e-6,rz(y)),r=Math.hypot(x/a,(z-.015)/b);
  return (r-1)*Math.min(a,b);
 }
 const head=at('head'),neck=segment([0,1.35,.008],[0,1.535,0]);
 const components=[
  {id:PART.torso,k:.055,fn:torso},
  {id:PART.neck,k:.065,fn:tube(neck,[[0,.105],[.5,.075],[1,.07]])},
  {id:PART.head,k:.035,fn:(x,y,z)=>Math.hypot(x-head[0],y-head[1],z-head[2])-.22},
  {id:PART.upperArm,k:.055,fn:tube(chain.upperArm,[[0,.107],[.27,.116],[.62,.108],[1,.088]],{depth:.96,rear:-.006})},
  {id:PART.forearm,k:.03,fn:tube(chain.forearm,[[0,.09],[.28,.118],[.61,.106],[1,.083]],{depth:.92,rear:.004})},
  {id:PART.thigh,k:.05,fn:tube(chain.thigh,[[0,.136],[.27,.143],[.62,.129],[1,.102]],{depth:1.02,rear:.005})},
  {id:PART.calf,k:.025,fn:tube(chain.calf,[[0,.103],[.32,.122],[.63,.107],[1,.088]],{depth:1.04,rear:-.012})},
  // Fill the old recessed ankle cup from within the foot. The upper end
  // stays inside the calf, so the external surface has no ball-shaped rim.
  {id:PART.foot,k:.035,fn:(x,y,z)=>{const a=(x-.15)/.103,b=(y-.105)/.085,c=(z-.025)/.122,k0=Math.hypot(a,b,c),k1=Math.hypot(a/.103,b/.085,c/.122);return k1>1e-12?k0*(k0-1)/k1:-.085;}},
  {id:PART.foot,k:.05,fn:foot.distance},
 ];
 const values=new Float64Array(components.length);
 function distance(x,y,z){x=Math.abs(x);let d=components[0].fn(x,y,z);for(let i=1;i<components.length;i++)d=blend(d,components[i].fn(x,y,z),components[i].k);return Math.max(d,-y);}
 function sample(x,y,z){
  x=Math.abs(x);let d=components[0].fn(x,y,z);const weights=new Float64Array(components.length);weights[0]=1;
  for(let i=1;i<components.length;i++){
   const b=components[i].fn(x,y,z),k=components[i].k,h=Math.max(0,Math.min(1,.5+.5*(b-d)/k));
   for(let j=0;j<i;j++)weights[j]*=h;weights[i]=1-h;d=blend(d,b,k);
  }
  let owner=0;for(let i=1;i<weights.length;i++)if(weights[i]>weights[owner])owner=i;
  return {distance:d,weights,part:components[owner].id};
 }
 return {distance,sample,chain,skeleton,components,referenceStats:{hand:{method:'original surface graft',triangles:find('hand.L').geometry.index.count/3},foot:{nodes:foot.nodes,triangles:foot.triangles}}};
}
