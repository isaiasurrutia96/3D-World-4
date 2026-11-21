// New avatar (version 2): the chosen parts assembled into one body (rest pose).
//
// Everything is placed from the skeleton's joint centres (motion-core/skeleton/
// bones.js): torso, neck ball and head, and each arm and leg as a chain of
// joint balls and limbs. Every joint ball follows the rule "slightly thinner
// than what it joins" (92% of the thinner limb end). Each limb runs between its
// two joint balls with the usual 6 mm gap at each end. Wrists and ankles have
// no balls yet (hands and feet come next), so the forearm and calf end at the
// wrist and ankle joint centres.
//
// Shoulder and hip balls: two placements to choose from (owner, 21 November):
//  - 'joints': centred exactly on the skeleton's joints. The shoulder ball then
//    sits about a third inside the torso and the hip ball mostly inside the
//    pelvis, like shallow sockets. The skeleton is unchanged.
//  - 'resting': pushed out (shoulders sideways, hips down) until they just clear
//    the torso by the gap. Shoulders a little wider, legs a little longer: the
//    skeleton's joints would move with them.
// The right side is the exact mirror of the left. All output is in avatar space.
import {Quaternion,Vector3} from 'three';
import {buildLimbShape,thinnestAt,pairSizes,ARM_PAIR,LEG_PAIR,BALL_GAP,BALL_TO_LIMB,CHOSEN_ARM,GIRL_ARM,CHOSEN_LEG,GIRL_LEG,HIP,KNEE,ANKLE} from './limb-options.js';
import {SHOULDER,ELBOW,WRIST} from './arm.js';
import {buildBall,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {makeTorsoOption,ringAt,CHOSEN_TORSO,CHOSEN_GIRL_TORSO,WOMEN_OPTIONS} from './torso-variants.js';
import {buildTorsoSurface} from './torso-shape.js';
import {buildHeadSet,CHOSEN_NECK} from './head-options.js';
import {CHOSEN_FACE} from './face.js';
// The clean base torso every torso option is made from.
import torsoBase from './torso.json' with {type:'json'};

export const BODIES={
 boy:{label:'Boy',torso:CHOSEN_TORSO,torsoList:undefined,arm:CHOSEN_ARM,leg:CHOSEN_LEG},
 girl:{label:'Girl',torso:CHOSEN_GIRL_TORSO,torsoList:WOMEN_OPTIONS,arm:GIRL_ARM,leg:GIRL_LEG},
};
export const PLACEMENTS=['joints','resting'];

/** Torso radius at height y in direction angle a (0 = his left, +x). 0 outside the ring range. */
export function torsoRadius(shape,y,a){
 const R=shape.rings;if(y<R[0].y||y>R.at(-1).y)return 0;
 let i=0;while(i<R.length-2&&R[i+1].y<y)i++;const t=(y-R[i].y)/(R[i+1].y-R[i].y);
 return ringAt(R[i].r,a)*(1-t)+ringAt(R[i+1].r,a)*t;
}
/**
 * How far a point is inside the torso (metres, > 0 inside, < 0 clear by about
 * that much). Uses the ring part and the rounded caps (bottom bowl and top), as
 * torso-shape.js draws them; beyond a pole it returns minus the distance to it.
 */
export function insideTorso(shape,[x,y,z]){
 const [cx,cz]=shape.center,dx=x-cx,dz=z-cz,a=Math.atan2(dz,dx),r=Math.hypot(dx,dz),R=shape.rings;
 let edge;
 if(y>=R[0].y&&y<=R.at(-1).y)edge=torsoRadius(shape,y,a);
 else{// quarter-ellipse caps from the end ring to the pole, as in torso-shape.js
  const end=y<R[0].y?R[0]:R.at(-1),pole=y<R[0].y?shape.bottom.y:shape.top.y,s=(y-end.y)/(pole-end.y);
  if(s>=1)return -Math.hypot(r,y-pole);// beyond the pole: clear by at least the distance to it
  edge=ringAt(end.r,a)*Math.sqrt(Math.max(0,1-s*s));
 }
 return edge-r;
}

const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],length=a=>Math.hypot(...a),unit=a=>scale(a,1/length(a));
const mirror=p=>[-p[0],p[1],p[2]];

/** Moves a ball out along `direction` until it clears the torso by the gap. */
function pushClear(shape,centre,radius,direction){
 const probes=Array.from({length:400},(_,i)=>{const y=1-2*(i+.5)/400,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*r,y,Math.sin(a)*r];});
 for(let d=0;d<=.3;d+=.0005){
  const c=add(centre,scale(direction,d));
  if(probes.every(p=>insideTorso(shape,add(c,scale(p,radius+BALL_GAP)))<=0))return c;
 }
 throw Error('could not clear the torso');
}

/** A surface moved into avatar space: rotated so its -y axis points along `direction`, then placed at `at`. */
function place(surface,at,direction){
 const q=new Quaternion().setFromUnitVectors(new Vector3(0,-1,0),new Vector3(...direction)),v=new Vector3(),out=[];
 for(let i=0;i<surface.positions.length;i+=3){v.set(surface.positions[i],surface.positions[i+1],surface.positions[i+2]).applyQuaternion(q);out.push(v.x+at[0],v.y+at[1],v.z+at[2]);}
 return {positions:out,index:[...surface.index]};
}
/** The mirror image of a surface (x flipped; triangles reversed so they still face out). */
function mirrored(surface){
 const positions=surface.positions.map((v,i)=>i%3===0?-v:v),index=[];
 for(let i=0;i<surface.index.length;i+=3)index.push(surface.index[i],surface.index[i+2],surface.index[i+1]);
 return {...surface,positions,index};
}
const ballAt=(radius,centre)=>{const b=buildBall({radius,triangles:CHOSEN_BALL_TRIANGLES});return {positions:b.positions.map((v,i)=>v+centre[i%3]),index:b.index,radius,centre};};

/**
 * The assembled body. Returns {body, placement, torsoShape, joints:{left side
 * centres}, balls:{name:radius}, parts:[{name, side, positions, index, ...}],
 * face}. Parts on the right side are mirrors of the left.
 */
export function assemble(bodyId,placement='joints'){
 const body=BODIES[bodyId];if(!body)throw Error('unknown body '+bodyId);
 if(!PLACEMENTS.includes(placement))throw Error('unknown placement '+placement);
 const torsoShape=makeTorsoOption(torsoBase.shape,body.torso,body.torsoList);
 const arm=body.arm,leg=body.leg;
 const balls={shoulder:BALL_TO_LIMB*thinnestAt(arm.upper,0),elbow:pairSizes(arm,ARM_PAIR).ball,hip:BALL_TO_LIMB*thinnestAt(leg.thigh,0),knee:pairSizes(leg,LEG_PAIR).ball};
 // Joint centres (his left side), moved together when a ball is pushed clear.
 let S=[...SHOULDER],E=[...ELBOW],W=[...WRIST],H=[...HIP],K=[...KNEE],A=[...ANKLE];
 if(placement==='resting'){
  const S2=pushClear(torsoShape,S,balls.shoulder,[1,0,0]),ds=sub(S2,S);[S,E,W]=[S2,add(E,ds),add(W,ds)];
  const H2=pushClear(torsoShape,H,balls.hip,[0,-1,0]),dh=sub(H2,H);[H,K,A]=[H2,add(K,dh),add(A,dh)];
 }
 const parts=[];
 const torso=buildTorsoSurface(torsoShape);parts.push({name:'torso',side:'centre',...torso});
 const neck=buildHeadSet(CHOSEN_NECK,torsoShape);
 parts.push({name:'ball-neck',side:'centre',...ballAt(neck.ball.radius,[0,neck.ball.y,0])});
 parts.push({name:'head',side:'centre',positions:neck.head.positions.map((v,i)=>v+(i%3===1?neck.head.y:0)),index:neck.head.index,radius:neck.head.radius,centre:[0,neck.head.y,0]});
 // A limb between two joints: its top tip one gap past the first ball, its bottom one gap before the second (or at the joint if none).
 const limb=(name,spec,from,rFrom,to,rTo)=>{
  const dir=unit(sub(to,from)),len=length(sub(to,from))-rFrom-BALL_GAP-(rTo?rTo+BALL_GAP:0);
  const shape=buildLimbShape(spec,len),top=add(from,scale(dir,rFrom+BALL_GAP));
  return {name,side:'left',...place(shape,top,dir),length:len,top,direction:dir};
 };
 const left=[
  {name:'ball-shoulder',side:'left',...ballAt(balls.shoulder,S)},
  limb('upper-arm',arm.upper,S,balls.shoulder,E,balls.elbow),
  {name:'ball-elbow',side:'left',...ballAt(balls.elbow,E)},
  limb('forearm',arm.fore,E,balls.elbow,W,0),
  {name:'ball-hip',side:'left',...ballAt(balls.hip,H)},
  limb('thigh',leg.thigh,H,balls.hip,K,balls.knee),
  {name:'ball-knee',side:'left',...ballAt(balls.knee,K)},
  limb('calf',leg.calf,K,balls.knee,A,0),
 ];
 for(const p of left){parts.push(p);parts.push({...mirrored(p),name:p.name,side:'right',...(p.centre?{centre:mirror(p.centre)}:{})});}
 return {body:bodyId,placement,torsoShape,joints:{shoulder:S,elbow:E,wrist:W,hip:H,knee:K,ankle:A},balls,parts,face:CHOSEN_FACE,headCentre:[0,neck.head.y,0],headRadius:neck.head.radius};
}
