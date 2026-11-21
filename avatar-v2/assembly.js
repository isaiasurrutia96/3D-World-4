// New avatar (version 2): the chosen parts assembled into one body (rest pose).
//
// Everything is placed from the skeleton's joint centres (motion-core/skeleton/
// bones.js): torso, neck ball and head, and each arm and leg as a chain of
// joint balls and limbs. Every joint ball follows the rule "slightly thinner
// than what it joins" (92% of the thinner limb end). Each limb runs between its
// two joint balls with the usual 6 mm gap at each end. Wrists and ankles have
// no balls in this full assembly yet (see wristPreview and anklePreview), so the
// forearm and calf end at the wrist and ankle joint centres.
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
import {buildLimbShape,limbRadius,thinnestAt,pairSizes,ARM_PAIR,LEG_PAIR,BALL_GAP,BALL_TO_LIMB,CHOSEN_ARM,GIRL_ARM,BOY_ARM,APPROVED_ARM_LENGTHS,CHOSEN_LEG,GIRL_LEG,HIP,KNEE,ANKLE} from './limb-options.js';
import {SHOULDER,ELBOW,WRIST} from './arm.js';
import {buildBall,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {makeTorsoOption,ringAt,CHOSEN_TORSO,CHOSEN_GIRL_TORSO,WOMEN_OPTIONS} from './torso-variants.js';
import {buildTorsoSurface} from './torso-shape.js';
import {buildHeadSet,CHOSEN_NECK} from './head-options.js';
import {CHOSEN_FACE} from './face.js';
import {buildHandFoot,CHOSEN_HAND_FOOT,HAND_FEET_SOURCE} from './hands-feet.js';
// The clean base torso every torso option is made from.
import torsoBase from './torso.json' with {type:'json'};

export const BODIES={
 boy:{label:'Boy',torso:CHOSEN_TORSO,torsoList:undefined,arm:BOY_ARM,leg:CHOSEN_LEG},
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

/** Moves a ball out along `direction` until it clears the torso by `gap` (default: the limb gap). */
function pushClear(shape,centre,radius,direction,gap=BALL_GAP){
 const probes=Array.from({length:400},(_,i)=>{const y=1-2*(i+.5)/400,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*r,y,Math.sin(a)*r];});
 for(let d=0;d<=.3;d+=.0005){
  const c=add(centre,scale(direction,d));
  if(probes.every(p=>insideTorso(shape,add(c,scale(p,radius+gap)))<=0))return c;
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

/** The thickest a limb gets anywhere along its length, in any direction (metres). */
export function thickestRadius(limb){let r=0;for(let k=0;k<=100;k++)for(let a=0;a<72;a++)r=Math.max(r,limbRadius(limb,k/100,a/72*Math.PI*2));return r;}
/**
 * The shoulder ball's size (owner, 21 November 2026): "the size of a shoulder",
 * as big as the upper arm, if not slightly bigger: 5% bigger than the upper
 * arm's thickest point. (Other joint balls keep the 92% rule.)
 */
export const SHOULDER_TO_ARM=1.05;
/** Space between each shoulder ball and the torso (owner: "separated, not
 *  resting against the torso"): 2 cm, clearly visible; the 6 mm limb gap read
 *  as touching on screen. */
export const SHOULDER_TORSO_GAP=.02;

/**
 * Owner's request (21 November 2026): the boy's torso with a shoulder ball and
 * the upper arm on BOTH sides (the boy's: the approved arm 10% thicker, same
 * shape, approved length). The ball must never sit inside the
 * torso: it starts at the skeleton's shoulder joint and moves straight out
 * sideways until it is separated from the torso by SHOULDER_TORSO_GAP (2 cm). The upper arm is EXACTLY as
 * approved (same shape, same 24.5 cm length) and hangs one gap below the ball,
 * pointing the same way as the skeleton's upper arm. The right side mirrors
 * the left.
 */
export function shoulderPreview(bodyId='boy'){
 const body=BODIES[bodyId],torsoShape=makeTorsoOption(torsoBase.shape,body.torso,body.torsoList);
 const arm=body.arm,rS=SHOULDER_TO_ARM*thickestRadius(arm.upper),approvedLength=APPROVED_ARM_LENGTHS.upper;// length stays as approved
 const S=pushClear(torsoShape,[...SHOULDER],rS,[1,0,0],SHOULDER_TORSO_GAP),dir=unit(sub(ELBOW,SHOULDER)),top=add(S,scale(dir,rS+BALL_GAP));
 const ball={name:'ball-shoulder',side:'left',...ballAt(rS,S)};
 const upper={name:'upper-arm',side:'left',...place(buildLimbShape(arm.upper,approvedLength),top,dir),length:approvedLength,top,direction:dir};
 const parts=[{name:'torso',side:'centre',...buildTorsoSurface(torsoShape)}];
 for(const p of [ball,upper]){parts.push(p);parts.push({...mirrored(p),side:'right',...(p.centre?{centre:mirror(p.centre)}:{})});}
 return {body:bodyId,torsoShape,shoulder:S,movedOut:S[0]-SHOULDER[0],shoulderBall:rS,upper,parts};
}

/**
 * Wrist and ankle balls: the SAME size as the bottom end of the forearm or calf
 * (owner, 21 November 2026: "make the ball the same size as the bottom part of
 * the forearm"). This replaces the 92% joint rule for these two balls only; the
 * other joints keep BALL_TO_LIMB. "The bottom part" is the limb's bottom edge
 * as drawn: its last full-width ring, where the rounded end begins (owner,
 * again: "make the ball the overall same size as the bottom part of the
 * calve"). The first try used the radius at the very tip, which the drawn limb
 * never reaches, so the ball looked smaller than the limb. The limb ends are
 * round, so the ball matches them in every direction.
 */
export const END_BALL_TO_LIMB=1;
/** The radius of a limb's bottom edge as drawn (its lowest full-width ring). */
export function bottomEdgeRadius(limb,limbLength){
 const {rings}=buildLimbShape(limb,limbLength).shape,lowest=rings.reduce((a,b)=>b.y<a.y?b:a);return Math.max(...lowest.r);
}

/**
 * One end joint, one side, laid out along the skeleton's bone (from the middle
 * joint to the end joint): the lower limb at its approved length, starting one
 * gap below the middle ball; the end ball one gap below the limb, the same size
 * as the limb's bottom end; then the chosen hand or foot, only MOVED straight
 * along the bone's line so its highest point sits one gap below the ball.
 * Nothing is reshaped.
 */
function endJoint({limb,limbName,ballName,partName,limbLength,middle,end,middleBall,part,ballRadius}){
 const d=unit(sub(end,middle)),r=ballRadius??END_BALL_TO_LIMB*bottomEdgeRadius(limb,limbLength);
 const top=add(middle,scale(d,middleBall+BALL_GAP)),J=add(top,scale(d,limbLength+BALL_GAP+r));
 const lower={name:limbName,side:'left',...place(buildLimbShape(limb,limbLength),top,d),length:limbLength,top,direction:d};
 const pivot=part.pivot;let reach=-Infinity;
 for(let i=0;i<part.positions.length;i+=3)reach=Math.max(reach,-((part.positions[i]-pivot[0])*d[0]+(part.positions[i+1]-pivot[1])*d[1]+(part.positions[i+2]-pivot[2])*d[2]));
 const newPivot=add(J,scale(d,r+BALL_GAP+reach)),shift=sub(newPivot,pivot);
 const moved={name:partName,side:'left',positions:part.positions.map((v,i)=>v+shift[i%3]),index:part.index,pivot:newPivot,reach,shift};
 return {direction:d,joint:J,ball:r,lower,moved,parts:[lower,{name:ballName,side:'left',...ballAt(r,J)},moved],movedBy:length(sub(J,end))};
}

/**
 * Owner's request (21 November 2026): the wrist joint, one side: the forearm,
 * the wrist ball and the chosen hand (option 2, the original 8% bigger),
 * separate, with the usual 6 mm gaps, along the skeleton's forearm. The forearm
 * is the boy's at its approved length (22.2 cm); the wrist ball is the size of
 * the forearm's bottom edge; the hand is only moved.
 */
export function wristPreview(bodyId='boy'){
 const arm=BODIES[bodyId].arm;
 const j=endJoint({limb:arm.fore,limbName:'forearm',ballName:'ball-wrist',partName:'hand',limbLength:APPROVED_ARM_LENGTHS.fore,
  middle:ELBOW,end:WRIST,middleBall:pairSizes(arm,ARM_PAIR).ball,part:buildHandFoot(CHOSEN_HAND_FOOT).hand});
 return {body:bodyId,direction:j.direction,wrist:j.joint,wristBall:j.ball,forearm:j.lower,hand:j.moved,parts:j.parts,
  // How far the wrist joint moved from the skeleton's wrist (the forearm kept its length and the parts are separate).
  wristMovedBy:j.movedBy};
}

/**
 * Longer legs and a bigger ankle ball (owner, 21 November 2026: the leg limbs
 * look too short, and once the balls sit in sockets the limbs will overlap them
 * and the avatar would come out shorter than the original; "lengthen the
 * overall size and make the ankle ball bigger"). The owner gave no amounts:
 * 10% each is Claude's pick, waiting for the owner's confirmation. The thigh
 * and calf keep their shape and thickness; only their length changes. The
 * knee ball stays by its rule (it depends on the limbs' thickness, not length).
 */
export const LEG_LENGTHEN=1.1,ANKLE_BALL_SCALE=1.1;

/**
 * One whole leg, one side, hanging straight down the skeleton's leg line (hip
 * to ankle): thigh, knee ball, calf, ankle ball and the chosen foot, separate,
 * with the usual 6 mm gaps. The thigh starts where it sits below the hip ball
 * (the hip ball itself is not shown here; `hip` moves its centre). `lengthen`
 * scales both limb lengths; `ankleBallScale` scales the ankle ball against the
 * ankle ball before (the approved calf's bottom edge). With (1, 1) this is the leg as it was before.
 */
export function legPreview(bodyId='boy',{lengthen=LEG_LENGTHEN,ankleBallScale=ANKLE_BALL_SCALE,hip=HIP}={}){
 const leg=BODIES[bodyId].leg,size=pairSizes(leg,LEG_PAIR),d=unit(sub(ANKLE,HIP));
 const hipBall=hipBallRadius(leg),thighLength=size.thigh*lengthen,calfLength=size.calf*lengthen;
 const thighTop=add(hip,scale(d,hipBall+BALL_GAP)),K=add(thighTop,scale(d,thighLength+BALL_GAP+size.ball));
 const thigh={name:'thigh',side:'left',...place(buildLimbShape(leg.thigh,thighLength),thighTop,d),length:thighLength,top:thighTop,direction:d};
 const j=endJoint({limb:leg.calf,limbName:'calf',ballName:'ball-ankle',partName:'foot',limbLength:calfLength,
  middle:K,end:add(K,d),middleBall:size.ball,part:buildHandFoot(CHOSEN_HAND_FOOT).foot,
  // Bigger than the ankle ball before (the size of the approved calf's bottom edge), whatever the calf's length.
  ballRadius:ankleBallScale*END_BALL_TO_LIMB*bottomEdgeRadius(leg.calf,size.calf)});
 let sole=Infinity;for(let i=1;i<j.moved.positions.length;i+=3)sole=Math.min(sole,j.moved.positions[i]);
 return {body:bodyId,lengthen,ankleBallScale,direction:d,knee:K,kneeBall:size.ball,ankle:j.joint,ankleBall:j.ball,thigh,calf:j.lower,foot:j.moved,
  parts:[thigh,{name:'ball-knee',side:'left',...ballAt(size.ball,K)},...j.parts],
  // Hip joint to the bottom of the foot, to compare with the original avatar (whose sole is at y = 0).
  hipToSole:hip[1]-sole,originalHipToSole:HIP[1],sole};
}

/**
 * The ankle joint, one side: the calf, the ankle ball and the chosen foot (the
 * lower part of legPreview, with the longer calf and the bigger ankle ball).
 */
export function anklePreview(bodyId='boy'){
 const l=legPreview(bodyId);
 return {body:bodyId,direction:l.direction,ankle:l.ankle,ankleBall:l.ankleBall,calf:l.calf,foot:l.foot,parts:l.parts.slice(2),knee:l.knee,kneeBall:l.kneeBall};
}


/** The hip ball's size: the joint rule (92% of the thigh's top end), as in assemble(). */
export const hipBallRadius=leg=>BALL_TO_LIMB*thinnestAt(leg.thigh,0);

/**
 * Owner's request (21 November 2026): all the approved pieces put together,
 * still separate. Nothing is reshaped and every approved length is kept, so
 * each joint sits where the pieces above it end:
 *  - torso, shoulder balls and upper arms: exactly shoulderPreview (balls 2 cm
 *    clear of the torso);
 *  - neck ball and head: the chosen neck (option 5) with the base face;
 *  - each arm continues down the skeleton's arm directions: elbow ball (joint
 *    rule), forearm (approved length), wrist ball (size of the forearm's bottom
 *    edge), chosen hand;
 *  - hip balls (joint rule) moved straight down until 2 cm clear of the torso,
 *    the same rule as the shoulders (Claude's assumption: the owner set it for
 *    the shoulders; hips were never decided);
 *  - each leg below its hip ball: legPreview's longer leg (thigh and calf 10%
 *    longer, ankle ball 10% bigger) with the chosen foot;
 *  - then every arm and leg piece made LIMB_SCALE bigger (each whole chain
 *    scaled about its top ball), torso, neck and head unchanged; then each foot
 *    made smaller, to the head's height plus FOOT_OVER_HEAD; each leg moves
 *    outward only if the two feet would overlap.
 * The right side is the exact mirror of the left.
 */
export function fullBodyPreview(bodyId='boy',{limbScale=LIMB_SCALE}={}){
 const body=BODIES[bodyId],arm=body.arm,leg=body.leg,top=shoulderPreview(bodyId),torsoShape=top.torsoShape;
 const parts=[top.parts.find(p=>p.name==='torso')];
 const neck=buildHeadSet(CHOSEN_NECK,torsoShape);
 parts.push({name:'ball-neck',side:'centre',...ballAt(neck.ball.radius,[0,neck.ball.y,0])});
 parts.push({name:'head',side:'centre',positions:neck.head.positions.map((v,i)=>v+(i%3===1?neck.head.y:0)),index:neck.head.index,radius:neck.head.radius,centre:[0,neck.head.y,0]});
 // Arm (approved size): shoulder ball and upper arm from the shoulder preview, then elbow ball, forearm, wrist ball, hand.
 const elbowBall=pairSizes(arm,ARM_PAIR).ball,up=top.upper,E=add(up.top,scale(up.direction,up.length+BALL_GAP+elbowBall));
 const w=endJoint({limb:arm.fore,limbName:'forearm',ballName:'ball-wrist',partName:'hand',limbLength:APPROVED_ARM_LENGTHS.fore,
  middle:E,end:add(E,unit(sub(WRIST,ELBOW))),middleBall:elbowBall,part:buildHandFoot(CHOSEN_HAND_FOOT).hand});
 const armChain=[top.parts.find(p=>p.name==='ball-shoulder'&&p.side==='left'),up,{name:'ball-elbow',side:'left',...ballAt(elbowBall,E)},...w.parts];
 // Leg (approved size, longer legs): hip ball clear of the torso, then the leg below it.
 const hipBall=hipBallRadius(leg),H=pushClear(torsoShape,[...HIP],hipBall,[0,-1,0],SHOULDER_TORSO_GAP);
 const l=legPreview(bodyId,{hip:H});
 const legChain=[{name:'ball-hip',side:'left',...ballAt(hipBall,H)},...l.parts];
 // Bigger limbs (owner, 21 November 2026): each whole chain is scaled up about its top ball's centre
 // (every piece keeps its shape, only bigger; the gaps grow with it), then moved so the bigger top
 // ball is again 2 cm clear of the torso (shoulders straight out, hips straight down).
 const S2=pushClear(torsoShape,[...SHOULDER],top.shoulderBall*limbScale,[1,0,0],SHOULDER_TORSO_GAP);
 const H2=pushClear(torsoShape,[...HIP],hipBall*limbScale,[0,-1,0],SHOULDER_TORSO_GAP);
 const grow=(chain,c,to)=>chain.map(p=>scaledPart(p,c,limbScale,to));
 const left=[...grow(armChain,top.shoulder,S2),...grow(legChain,H,H2)];
 // Smaller feet (owner, 21 November 2026: the feet looked huge next to the calves; each foot should be
 // "an inch or two longer than the head"): the foot is scaled, shape kept, so its length (heel to toe,
 // measured flat along the floor, as seen from the side) is the head's height plus FOOT_OVER_HEAD. It shrinks toward
 // the point one (grown) gap below the ankle ball, so it stays right under the ball with the same gap.
 {const i=left.findIndex(p=>p.name==='foot'),foot=left[i],ankle=left.find(p=>p.name==='ball-ankle'),d=l.direction,ax=unit([HAND_FEET_SOURCE.foot.axes.length[0],0,HAND_FEET_SOURCE.foot.axes.length[2]]);
  let lo=Infinity,hi=-Infinity;for(let k=0;k<foot.positions.length;k+=3){const v=foot.positions[k]*ax[0]+foot.positions[k+1]*ax[1]+foot.positions[k+2]*ax[2];lo=Math.min(lo,v);hi=Math.max(hi,v);}
  const headHeight=2*neck.head.radius,footScale=(headHeight+FOOT_OVER_HEAD)/(hi-lo),P=add(ankle.centre,scale(d,ankle.radius+BALL_GAP*limbScale));
  left[i]={...scaledPart(foot,P,footScale,P),footScale,footLength:headHeight+FOOT_OVER_HEAD,headHeight};}
 // Slightly smaller hands (owner, 21 November 2026): each hand HAND_SCALE of its size, shape kept, toward
 // the point one (grown) gap below the wrist ball, so it stays right under the ball with the same gap.
 {const i=left.findIndex(p=>p.name==='hand'),wrist=left.find(p=>p.name==='ball-wrist'),d=left.find(p=>p.name==='forearm').direction;
  const P=add(wrist.centre,scale(d,wrist.radius+BALL_GAP*limbScale));left[i]={...scaledPart(left[i],P,HAND_SCALE,P),handScale:HAND_SCALE};}
 // The two feet (8% bigger, chosen option 2) would overlap in the middle: each whole leg moves
 // straight outward just enough to leave the usual gap between the feet (nothing reshaped; each
 // foot stays under its own leg).
 let foot=left.find(p=>p.name==='foot'),inner=Infinity;for(let i=0;i<foot.positions.length;i+=3)inner=Math.min(inner,foot.positions[i]);
 const footOut=Math.max(0,BALL_GAP/2-inner),legOut=[footOut,0,0];
 if(footOut)for(let i=armChain.length;i<left.length;i++)left[i]=scaledPart(left[i],[0,0,0],1,legOut);
 foot=left.find(p=>p.name==='foot');
 for(const p of left){parts.push(p);parts.push({...mirrored(p),name:p.name,side:'right',...(p.centre?{centre:mirror(p.centre)}:{})});}
 const get=n=>left.find(p=>p.name===n);let sole=Infinity;for(let i=1;i<foot.positions.length;i+=3)sole=Math.min(sole,foot.positions[i]);
 return {body:bodyId,limbScale,torsoShape,parts,face:CHOSEN_FACE,headCentre:[0,neck.head.y,0],headRadius:neck.head.radius,
  joints:Object.fromEntries(['shoulder','elbow','wrist','hip','knee','ankle'].map(j=>[j,get('ball-'+j).centre])),
  balls:Object.fromEntries(['shoulder','elbow','wrist','hip','knee','ankle'].map(j=>[j,get('ball-'+j).radius])),
  legOut:footOut,handScale:HAND_SCALE,footScale:foot.footScale,footLength:foot.footLength,headHeight:foot.headHeight,
  // Heights above the sole (the original avatar stands with its sole at 0).
  height:Math.max(...neck.head.positions.filter((_,i)=>i%3===1))+neck.head.y-sole,sole};
}

/** How much bigger every arm and leg piece is (owner, 21 November 2026: "our guy looks very skinny, at least the limbs and ball joints; increase the overall size of everything minus the torso, head and neck"). No amount given: 15% is Claude's pick, waiting for the owner's confirmation. */
export const LIMB_SCALE=1.15;
/** Each foot is this much longer than the head is tall (owner: first "an inch or two" (1.5 inches), then "slightly bigger": 3 inches, Claude's pick). */
export const FOOT_OVER_HEAD=.0762;
/** The hands' size against the 15% bigger hands (owner: "hands slightly smaller"; 10% smaller, Claude's pick). */
export const HAND_SCALE=.9;

/** A part scaled by k about point c, then moved so c lands on `to` (shape kept; sizes, lengths and centres follow). */
function scaledPart(p,c,k,to){
 const T=v=>add(to,scale(sub(v,c),k)),out={...p,positions:p.positions.map((v,i)=>to[i%3]+(v-c[i%3])*k)};
 if(p.centre)out.centre=T(p.centre);if(p.radius)out.radius=p.radius*k;if(p.top)out.top=T(p.top);if(p.length)out.length=p.length*k;if(p.pivot)out.pivot=T(p.pivot);
 return out;
}
