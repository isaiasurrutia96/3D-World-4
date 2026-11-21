// New avatar (version 2): mannequin head shapes with a face.
//
// How (compared 21 November 2026): a perfect Fibonacci ball is built first and
// its triangle layout kept; then every point is moved in or out by a face
// shape. (Re-wrapping shaped points in their tightest skin, as the joint balls
// do, would erase anything hollow, like eye hollows or the dip under the nose.)
// The surface stays one sealed piece whatever the shape.
//
// A face shape is numbers, in the head's own directions: azimuth (degrees
// around, 0 = straight ahead, positive = his left) and elevation (degrees up
// from level). Every head keeps the owner's overall roundness:
//  - egg: how much taller than wide (0.03 = 3% taller), and chin: how much the
//    lower face narrows toward the chin (share of the width at the very bottom);
//  - features: smooth raises (or hollows, with a negative amount) placed by
//    azimuth/elevation, with a spread around and up/down, and an amount in
//    metres. mirror: true repeats it on the other side. Nose, brow ridge,
//    jaw angles, chin, cheeks and eye hollows are all features.
import {fibonacciPoints,hullIndex} from './ball-shape.js';
import {Vector3} from 'three';

const RAD=Math.PI/180;
/**
 * Triangles for a head with a face. Evenly spread, 1,500 put points 2.5 cm
 * apart, as wide as the nose, so the face was smoothed away. So the points are
 * packed toward the face (FACE_FOCUS) and kept sparse on the back of the skull:
 * 2,400 triangles give the face points about 1 cm apart.
 */
export const FACE_TRIANGLES=2400,FACE_FOCUS=1.6;

/**
 * Points on a unit sphere, spread evenly (Fibonacci) and then pulled toward the
 * front (+z): a point at angle t from the front moves to pi*(t/pi)^focus, so the
 * face gets more points and the back of the head fewer. focus 1 = even.
 */
export function faceFocusedPoints(count,focus=FACE_FOCUS){
 return fibonacciPoints(count,1).map(p=>{
  const t=Math.acos(Math.max(-1,Math.min(1,p.z))),around=Math.atan2(p.y,p.x),t2=Math.PI*(t/Math.PI)**focus;
  return new Vector3(Math.sin(t2)*Math.cos(around),Math.sin(t2)*Math.sin(around),Math.cos(t2));
 });
}

/** Smallest difference between two angles in degrees (-180..180). */
const turn=d=>((d+180)%360+360)%360-180;
/** All features of a shape, with mirrored ones written out. */
export const expandFeatures=features=>features.flatMap(f=>f.mirror?[{...f,mirror:false},{...f,mirror:false,az:-f.az}]:[f]);

/**
 * Radius of the head (metres) in unit direction (x, y, z): +z is the front,
 * +y up, +x his left. Egg and chin set the overall shape; features add or
 * remove small amounts.
 */
export function headRadius(shape,radius,x,y,z){
 const below=Math.max(0,-y);// 0 at the middle, 1 at the very bottom
 const wide=1-shape.chin*below*below;// the lower face narrows toward the chin
 // Point on the egg: stretched up/down by egg, narrowed below; its distance.
 const ex=x*wide,ey=y*(1+shape.egg),ez=z*wide;
 let r=radius*Math.hypot(ex,ey,ez);
 const az=Math.atan2(x,z)/RAD,el=Math.asin(Math.max(-1,Math.min(1,y)))/RAD;
 for(const f of expandFeatures(shape.features)){
  const da=turn(az-f.az)/f.azSpread,de=(el-f.el)/f.elSpread;r+=f.amount*Math.exp(-(da*da+de*de));
 }
 return r;
}

/**
 * Builds a head centred at the origin: the triangle layout of a perfect ball
 * with exactly `triangles` triangles (points packed toward the face), every
 * point moved to the face shape.
 * Returns {positions, normals, index}; normals are averaged from the
 * triangles around each point (weighted by area), so shading is smooth.
 */
export function buildShapedHead(shape,radius,triangles=FACE_TRIANGLES){
 if(!(Number.isInteger(triangles)&&triangles>=8&&triangles%2===0))throw Error('triangles must be an even whole number, 8 or more');
 const points=faceFocusedPoints((triangles+4)/2),n=points.length,positions=new Array(n*3),index=hullIndex(points);
 for(let i=0;i<n;i++){
  const {x,y,z}=points[i],r=headRadius(shape,radius,x,y,z);
  positions[3*i]=x*r;positions[3*i+1]=y*r;positions[3*i+2]=z*r;
 }
 const normals=new Array(n*3).fill(0);
 for(let k=0;k<index.length;k+=3){
  const [a,b,c]=[index[k],index[k+1],index[k+2]],pa=positions.slice(3*a,3*a+3),pb=positions.slice(3*b,3*b+3),pc=positions.slice(3*c,3*c+3);
  const u=[pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]],v=[pc[0]-pa[0],pc[1]-pa[1],pc[2]-pa[2]];
  const nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0];// length = twice the area
  for(const p of [a,b,c]){normals[3*p]+=nx;normals[3*p+1]+=ny;normals[3*p+2]+=nz;}
 }
 for(let i=0;i<n;i++){const l=Math.hypot(normals[3*i],normals[3*i+1],normals[3*i+2])||1;for(let k=0;k<3;k++)normals[3*i+k]/=l;}
 return {positions,normals,index:[...index]};
}

// Shared face parts, so the options differ only where they should.
const nose=(amount,length=14,width=8)=>({az:0,el:-6,azSpread:width,elSpread:length,amount});
const brow=amount=>({az:0,el:21,azSpread:36,elSpread:6,amount});
const eyes=amount=>({az:24,el:8,azSpread:10,elSpread:8,amount:-amount,mirror:true});
const jaw=(amount,spread=20)=>({az:52,el:-42,azSpread:spread,elSpread:13,amount,mirror:true});
const chin=amount=>({az:0,el:-56,azSpread:18,elSpread:11,amount});
const cheeks=amount=>({az:38,el:-16,azSpread:16,elSpread:12,amount,mirror:true});

/** The five head options (owner, 21 November 2026): all keep the round mannequin look. */
export const HEAD_SHAPES=[
 {id:'head-classic',label:'1 · Classic',note:'Round with a slight egg shape: a subtle nose, a soft jaw and a light brow.',
  egg:.03,chin:.1,features:[nose(.022),brow(.01),eyes(.006),jaw(.01),chin(.008)]},
 {id:'head-strong-jaw',label:'2 · Strong jaw',note:'A round skull with a squarer, wider jaw and a defined chin.',
  egg:.03,chin:.02,features:[nose(.022),brow(.011),eyes(.006),jaw(.019,24),chin(.015)]},
 {id:'head-soft',label:'3 · Soft and young',note:'Round and friendly: full cheeks, a small button nose and a gentle chin.',
  egg:.02,chin:.14,features:[nose(.016,10,9),brow(.005),eyes(.004),cheeks(.012),jaw(.004),chin(.006)]},
 {id:'head-heroic',label:'4 · Heroic',note:'A round skull with a stronger brow, a straight nose and an angular jaw.',
  egg:.04,chin:.06,features:[nose(.025,17,7),brow(.017),eyes(.008),jaw(.016,17),chin(.012)]},
 {id:'head-round',label:'5 · Extra round',note:'Almost a perfect ball, with the nose, brow and jaw only lightly suggested. Closest to the current head.',
  egg:0,chin:.03,features:[nose(.012,11,8),brow(.005),eyes(.003),jaw(.005),chin(.005)]},
];
