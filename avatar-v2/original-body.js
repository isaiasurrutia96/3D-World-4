// New avatar (version 2): the owner's mix (22 November 2026): "keep the hands,
// feet, athletic torso and head, and bring back everything else" from the
// original avatar (3D-WORLD-3, saved here as Avatar Checkpoint 1).
//
// Everything sits where the original had it, in the avatar's own space (the
// skeleton's space):
//  - the original neck (unchanged), and the original upper arms, forearms (with
//    their hand sockets), thighs and calves as copied by
//    build-original-limbs.mjs, each lengthened 10% in its middle (same
//    thickness, ends unchanged), everything below moving down with it;
//  - the athletic torso (the boy's approved torso) in its usual place, which is
//    where the original torso stood;
//  - the approved head (with the base face), centred where the original head was;
//  - the approved hands and feet at the original wrists and ankles (the
//    skeleton's joints, where the original hands and feet were attached), at
//    their latest approved sizes: hands as on the full body (option 2, 15%
//    bigger, then 10% smaller), then 10% smaller again (owner); feet 3 inches
//    longer than the head.
import source from './original-limbs.json' with {type:'json'};
import {ShapeUtils,Vector2} from 'three';
import ourAvatar from './our-avatar-sizes.json' with {type:'json'};
import {makeTorsoOption} from './torso-variants.js';
import {buildTorsoSurface,buildRingSurface,direction} from './torso-shape.js';
import {rayHit,keepOutside} from './body-sockets.js';
import {press as pressBall,refineNear,pointNormals,softEdge,SOCKET_GAP,SOCKET_EDGE} from './sockets.js';
import {buildHeadSet,CHOSEN_NECK} from './head-options.js';
import {CHOSEN_FACE} from './face.js';
import {HAND_FEET_SOURCE,adjustPart,CHOSEN_HAND_FOOT} from './hands-feet.js';
import {BODIES,LIMB_SCALE,HAND_SCALE,FOOT_OVER_HEAD,pushClear,insideTorso,SHOULDER_TORSO_GAP} from './assembly.js';
import {buildBall,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {BALL_GAP,HIP,ANKLE} from './limb-options.js';
import {SHOULDER,ELBOW,WRIST} from './arm.js';
import torsoBase from './torso.json' with {type:'json'};

export const ORIGINAL_LIMBS=source;
/** Where the original head's centre was (Avatar Checkpoint 2, the avatar's space): its round head spanned 1.455 to 1.895 m. */
export const ORIGINAL_HEAD_CENTRE=[0,1.675,0];

const mirrorPoint=p=>[-p[0],p[1],p[2]];
const extent=(positions,axis)=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<positions.length;i+=3){const v=positions[i]*axis[0]+positions[i+1]*axis[1]+positions[i+2]*axis[2];lo=Math.min(lo,v);hi=Math.max(hi,v);}return hi-lo;};

/** The approved hand or foot at the original joint (its pivot), scaled about that joint. */
function handOrFoot(which,size){
 const part=HAND_FEET_SOURCE[which];
 return {...adjustPart(part,{...CHOSEN_HAND_FOOT,size}),pivot:part.pivot};
}
/** The left-side part mirrored to the right (x flipped, triangles turned back to face out). */
function mirrored(p){
 const positions=p.positions.map((v,i)=>i%3===0?-v:v),index=[];
 for(let i=0;i<p.index.length;i+=3)index.push(p.index[i],p.index[i+2],p.index[i+1]);
 return {...p,positions,index,...(p.pivot?{pivot:mirrorPoint(p.pivot)}:{}),...(p.axis?{axis:[-p.axis[0],p.axis[1],p.axis[2]]}:{})};
}

/**
 * The forearm's wrist end rounded like every other limb (owner, 22 November 2026: the original forearm flares
 * out toward the wrist and ends in an open cup, its old hand socket; "round it out like almost every other
 * limb"). The forearm is rebuilt as one smooth ring surface along its own line, the same way the limbs here are
 * built:
 *  - its upper half keeps the original shape exactly: each ring's radius in each direction is where a ray from
 *    the centre line first meets the original surface;
 *  - from the middle down it keeps the middle's width (no bulge), then closes in a rounded cap as long as it is
 *    wide, like the other limbs' ends, at the original bottom tip, so the length is unchanged.
 */
export const FOREARM_ROUND_FROM=.5,FOREARM_SEGMENTS=28;
export function roundForearmEnd(positions){
 const L=limbLine(positions),Y=L.dir.map(v=>-v),ref=Math.abs(Y[0])<.9?[1,0,0]:[0,0,1],d=ref[0]*Y[0]+ref[1]*Y[1]+ref[2]*Y[2];
 const u0=ref.map((v,k)=>v-Y[k]*d),lu=Math.hypot(...u0),u=u0.map(v=>v/lu),w=[u[1]*Y[2]-u[2]*Y[1],u[2]*Y[0]-u[0]*Y[2],u[0]*Y[1]-u[1]*Y[0]];// u × Y = w: same handedness, so triangles still face out
 const mesh={positions,index:ORIGINAL_LIMBS.parts.left.forearm.index},n=FOREARM_SEGMENTS,at=t=>L.start+t*L.length;
 const ringAt=t=>{const s0=at(t),axis=L.centre.map((c,k)=>c+L.dir[k]*s0);
  return Array.from({length:n},(_,k)=>{const [dx,dz]=direction(k,n),ray=u.map((v,j)=>v*dx+w[j]*dz),hit=rayHit(mesh,axis,ray);if(!isFinite(hit))throw Error('forearm ray found no surface');return hit;});};
 const upper=[];for(let t=.04;t<=FOREARM_ROUND_FROM+1e-9;t+=.04)upper.push({t,r:ringAt(t)});
 const middle=ringAt(FOREARM_ROUND_FROM),capLength=middle.reduce((a,b)=>a+b,0)/n,tCap=1-capLength/L.length;
 if(!(tCap>FOREARM_ROUND_FROM))throw Error('forearm too short for a rounded end');
 const lower=[{t:(FOREARM_ROUND_FROM+tCap)/2,r:middle},{t:tCap,r:middle}];
 // Local frame: y up the limb (y = -s), x along u, z along w; rings listed bottom first.
 const rings=[...upper,...lower].map(g=>({y:-at(g.t),r:g.r})).sort((a,b)=>a.y-b.y);
 const shape={center:[0,0],segments:n,capRings:4,bottom:{y:-L.end},top:{y:-L.start},rings};
 const surf=buildRingSurface(shape),out=new Array(surf.positions.length);
 for(let i=0;i<surf.positions.length;i+=3){const x=surf.positions[i],y=surf.positions[i+1],z=surf.positions[i+2];for(let k=0;k<3;k++)out[i+k]=L.centre[k]+u[k]*x+Y[k]*y+w[k]*z;}
 return {positions:out,index:surf.index,capLength,from:FOREARM_ROUND_FROM,tCap};
}

/** Owner (22 November 2026): "lengthen all the limbs" slightly, and "shrink the hands by a bit" (10% each: Claude's pick). */
export const ORIGINAL_LIMB_LENGTHEN=1.1,ORIGINAL_HAND_SHRINK=.9;
/** Then the calves to about 50 cm (owner, 22 November 2026), measured along their own line. */
export const ORIGINAL_CALF_LENGTH=.5;
/** The stretch happens in the limb's middle, between these shares of its length; the ends (rounded tips, the forearm's hand socket) stay rigid. */
export const STRETCH_FROM=.3,STRETCH_TO=.7;

/** A limb's own line: its longest direction through its middle (principal axis), and where along it the part starts and ends. */
export function limbLine(positions,along=null){
 const n=positions.length/3,c=[0,0,0];for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++)c[k]+=positions[i+k]/n;
 // `along`: the limb's own direction when it is already known (a limb nearly as wide as it is long, like the thigh
 // with its full top, no longer spreads most along its length, so the strongest spread would point sideways).
 let v;
 if(along){const l=Math.hypot(...along);v=along.map(x=>x/l);}
 else{
  const C=[[0,0,0],[0,0,0],[0,0,0]];for(let i=0;i<positions.length;i+=3){const d=[0,1,2].map(k=>positions[i+k]-c[k]);for(let r=0;r<3;r++)for(let q=0;q<3;q++)C[r][q]+=d[r]*d[q];}
  // Power iteration finds the strongest direction of spread.
  v=[0,-1,0];for(let it=0;it<100;it++){const w=[0,1,2].map(r=>C[r][0]*v[0]+C[r][1]*v[1]+C[r][2]*v[2]),l=Math.hypot(...w);v=w.map(x=>x/l);}
 }
 if(v[1]>0)v=v.map(x=>-x);// pointing down the body, from the joint above toward the joint below
 let lo=Infinity,hi=-Infinity;for(let i=0;i<positions.length;i+=3){const s=(positions[i]-c[0])*v[0]+(positions[i+1]-c[1])*v[1]+(positions[i+2]-c[2])*v[2];lo=Math.min(lo,s);hi=Math.max(hi,s);}
 return {centre:c,dir:v,start:lo,end:hi,length:hi-lo};
}
/**
 * Lengthens a limb by `extra` along its own line without changing its
 * thickness: the top end stays, the bottom end moves down rigidly, and only the
 * middle stretches (smoothly, so there is no kink where stretching starts and
 * ends). Returns the new points and how far the bottom moved.
 */
export function stretchLimb(positions,extra,from=STRETCH_FROM,to=STRETCH_TO){
 const L=limbLine(positions),a=L.start+from*L.length,b=L.start+to*L.length,out=new Array(positions.length);
 for(let i=0;i<positions.length;i+=3){
  const s=(positions[i]-L.centre[0])*L.dir[0]+(positions[i+1]-L.centre[1])*L.dir[1]+(positions[i+2]-L.centre[2])*L.dir[2];
  // Share of the extra length below this point: 0 above the middle, 1 below it, a smooth ramp across it.
  // Smooth ramp normally; a straight ramp when shortening a lot (the smooth ramp's steepest part would fold the surface).
  const t=Math.min(1,Math.max(0,(s-a)/(b-a))),smoothOk=1+1.5*extra/(b-a)>.25,share=smoothOk?t*t*(3-2*t):t,move=extra*share;
  for(let k=0;k<3;k++)out[i+k]=positions[i+k]+L.dir[k]*move;
 }
 return {positions:out,shift:L.dir.map(v=>v*extra),line:L};
}
/** A limb scaled around its own line (not along it) so its widest is `thickness` across. */
export function thickenTo(positions,thickness){
 const L=limbLine(positions);let r=0;
 for(let i=0;i<positions.length;i+=3){const v=[positions[i]-L.centre[0],positions[i+1]-L.centre[1],positions[i+2]-L.centre[2]],sa=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];r=Math.max(r,Math.hypot(v[0]-L.dir[0]*sa,v[1]-L.dir[1]*sa,v[2]-L.dir[2]*sa));}
 const k=thickness/(2*r),out=new Array(positions.length);
 for(let i=0;i<positions.length;i+=3){const v=[positions[i]-L.centre[0],positions[i+1]-L.centre[1],positions[i+2]-L.centre[2]],sa=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];
  for(let j=0;j<3;j++)out[i+j]=L.centre[j]+L.dir[j]*sa+(v[j]-L.dir[j]*sa)*k;}
 return out;
}
/**
 * A limb's top end made wider: each point moved out from the limb's line by `factor` at the top end, fading
 * smoothly (smoothstep) to no change at `until` (share of its length from the top) and below. Length unchanged.
 */
export function widenTop(positions,factor,until=THIGH_WIDEN_UNTIL){
 const L=limbLine(positions),out=new Array(positions.length);
 for(let i=0;i<positions.length;i+=3){
  const v=[positions[i]-L.centre[0],positions[i+1]-L.centre[1],positions[i+2]-L.centre[2]],sa=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];
  const t=Math.min(1,Math.max(0,((sa-L.start)/L.length)/until)),k=1+(factor-1)*(1-t*t*(3-2*t));
  for(let j=0;j<3;j++)out[i+j]=L.centre[j]+L.dir[j]*sa+(v[j]-L.dir[j]*sa)*k;
 }
 return out;
}
const shifted=(p,v)=>({...p,positions:p.positions.map((x,i)=>x+v[i%3]),...(p.pivot?{pivot:p.pivot.map((x,k)=>x+v[k])}:{})});

export function originalLimbBody(bodyId='boy'){
 const body=BODIES[bodyId],torsoShape=makeTorsoOption(torsoBase.shape,body.torso,body.torsoList);
 const parts=[{name:'torso',side:'centre',...buildTorsoSurface(torsoShape)}];
 // Head: the approved shape, only moved so its centre is where the original head's centre was.
 const head=buildHeadSet(CHOSEN_NECK,torsoShape).head,headPositions=head.positions.map((v,i)=>v+ORIGINAL_HEAD_CENTRE[i%3]);
 parts.push({name:'head',side:'centre',positions:headPositions,index:head.index,radius:head.radius,centre:ORIGINAL_HEAD_CENTRE});
 parts.push({name:'neck',side:'centre',...source.parts.neck});
 // Original limbs, matched to Our avatar's overall size (owner, 22 November 2026): each as thick as Our avatar's
 // limb (scaled around its own line), and as long as needed for Our avatar's joint-to-joint distance once the
 // balls are pressed in (PREVIEW_PRESS); the ends keep their shape, only the middle lengthens or shortens.
 // Everything below a limb moves with it (a chain).
 const chainShift={},stretched={};
 // The forearms with rounded wrist ends (built for his left, mirrored for his right).
 const roundLeft=roundForearmEnd(source.parts.left.forearm.positions),roundRight=mirrored(roundLeft);
 const raw=(side,name)=>name==='forearm'?(side==='left'?roundLeft:roundRight):source.parts[side][name];
 const piece=(side,name)=>{const p=raw(side,name);return {...p,positions:thickenTo(p.positions,ourAvatar.limbs[name].thickness)};};
 // Ball sizes follow the (thickened) limb ends, by the same rules as the separated avatar.
 const ends=n=>{const pos=piece('left',n).positions,L=limbLine(pos);return {top:endRadius(pos,L,'top'),bottom:endRadius(pos,L,'bottom')};};
 const E={u:ends('upper-arm'),f:ends('forearm'),t:ends('thigh'),c:ends('calf')};
 const ballR={shoulder:BALL_SIZE.shoulder*E.u.top,elbow:Math.min(E.u.bottom,E.f.top),wrist:BALL_SIZE.wrist*E.f.bottom,hip:BALL_SIZE.hip*E.t.top,knee:Math.min(E.t.bottom,E.c.top),ankle:BALL_SIZE.ankle*E.c.bottom};
 const between={'upper-arm':['shoulder','elbow'],forearm:['elbow','wrist'],thigh:['hip','knee'],calf:['knee','ankle']};
 const targetLength=n=>{const [a,b]=between[n];return ourAvatar.jointToJoint[n]-nearOffset(a,ballR[a])-nearOffset(b,ballR[b]);};
 const built={};
 for(const side of ['left','right'])for(const [upperName,lowerName] of [['upper-arm','forearm'],['thigh','calf']]){
  const upPos=piece(side,upperName).positions,up=stretchLimb(upPos,targetLength(upperName)-limbLine(upPos).length);
  const loMoved=piece(side,lowerName).positions.map((x,i)=>x+up.shift[i%3]);
  const loLine=limbLine(loMoved),lo=stretchLimb(loMoved,targetLength(lowerName)-loLine.length);
  built[side+':'+upperName]=up.positions;built[side+':'+lowerName]=lo.positions;
  chainShift[side+':'+lowerName]=up.shift.map((v,k)=>v+lo.shift[k]);stretched[side+':'+upperName]=up;stretched[side+':'+lowerName]=lo;}
 // The joint balls, sized from these limbs' ends (the same rules and sizes as before the slimming), measured with
 // every joint pressed the same (PREVIEW_PRESS): the hip's deeper press shortens the thigh a little, and the end
 // quarter of a shorter thigh can take in its widest ring, which must not change the ball's size.
 const refLength=n=>{const [a,b]=between[n];return ourAvatar.jointToJoint[n]-(1-PREVIEW_PRESS)*(ballR[a]+ballR[b]);};
 const endOf=(n,e)=>{const pos=built['left:'+n],L=limbLine(pos),ref=stretchLimb(pos,refLength(n)-L.length).positions;return endRadius(ref,limbLine(ref),e);};
 const balls={shoulder:BALL_SIZE.shoulder*endOf('upper-arm','top'),elbow:Math.min(endOf('upper-arm','bottom'),endOf('forearm','top')),wrist:BALL_SIZE.wrist*endOf('forearm','bottom'),
  hip:BALL_SIZE.hip*endOf('thigh','top'),knee:Math.min(endOf('thigh','bottom'),endOf('calf','top')),ankle:BALL_SIZE.ankle*endOf('calf','bottom')};
 // Then the forearms, thighs and calves slimmer (owner, 22 November 2026: "almost the size of the balls but
 // slightly bigger"): SLIM_OVER_BALL times the bigger of their two balls across, scaled around their own line
 // (same length). The balls keep their sizes.
 // Then thicker again (owner, 22 November 2026): the thigh "the same overall size as the hip ball but slightly bigger"
 // (SLIM_OVER widths from the bigger hip ball itself), the calf a hair wider still (SLIM_OVER.calf).
 const slimTo=n=>{const [a,b]=between[n];return SLIM_OVER[n]*2*Math.max(balls[a],balls[b]);};
 // The thigh's top a little wider (owner, 22 November 2026): THIGH_TOP_WIDER at its top end, fading smoothly to
 // the slim width by the thigh's middle. Thicker otherwise only overall (owner: keep the real, athletic shape,
 // thickest at the quads and calves; a straight cup-like top was tried and rejected).
 // Each limb keeps its own direction (`axis`, from before this shaping) for laying it out later.
 const shaped=(name,pos)=>name==='thigh'?widenTop(pos,THIGH_TOP_WIDER):pos;
 for(const side of ['left','right'])for(const name of ['upper-arm','forearm','thigh','calf']){
  const pos=built[side+':'+name],slim=SLIM_LIMBS.includes(name)?thickenTo(pos,slimTo(name)):pos;
  parts.push({name,side,positions:shaped(name,slim),index:raw(side,name).index,axis:limbLine(slim).dir});}
 // Hands and feet: approved shapes and sizes, at the original joints; the right side mirrors the left.
 const handSize=CHOSEN_HAND_FOOT.size*LIMB_SCALE*HAND_SCALE*ORIGINAL_HAND_SHRINK;
 const foot0=HAND_FEET_SOURCE.foot,flat=[foot0.axes.length[0],0,foot0.axes.length[2]],lf=Math.hypot(...flat),along=flat.map(v=>v/lf);
 const headHeight=2*head.radius,footSize=(headHeight+FOOT_OVER_HEAD)/extent(foot0.positions,along);
 const hand=handOrFoot('hand',handSize),foot=handOrFoot('foot',footSize);
 // Hands and feet follow the end of their (lengthened) arm or leg; the right side is the left's mirror image.
 for(const [name,p,limb] of [['hand',hand,'forearm'],['foot',foot,'calf']]){const left=shifted(p,chainShift['left:'+limb]);
  parts.push({name,side:'left',...left});parts.push({name,side:'right',...mirrored(left)});}
 let lo=Infinity,hi=-Infinity;for(const p of parts)for(let i=1;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}
 return {body:bodyId,torsoShape,parts,face:CHOSEN_FACE,ballR:balls,height:hi-lo,sole:lo,handSize,footSize,footLength:headHeight+FOOT_OVER_HEAD,headHeight,chainShift,stretched,roundedForearm:roundLeft};
}

// --- Separated, with a ball at every joint (owner, 22 November 2026) ---------------

/**
 * How thick a part is at one end: the widest it gets around its own line within
 * the end quarter of its length (for a capsule this is its round body just
 * before the cap closes; for the forearm's lower end, its hand socket's rim).
 */
export function endRadius(positions,line,end){
 let r=0;
 for(let i=0;i<positions.length;i+=3){
  const v=[positions[i]-line.centre[0],positions[i+1]-line.centre[1],positions[i+2]-line.centre[2]],s=v[0]*line.dir[0]+v[1]*line.dir[1]+v[2]*line.dir[2],t=(s-line.start)/line.length;
  if(end==='top'?t>.25:t<.75)continue;
  r=Math.max(r,Math.hypot(v[0]-line.dir[0]*s,v[1]-line.dir[1]*s,v[2]-line.dir[2]*s));
 }
 return r;
}
/** The farthest a part reaches along a direction from a point (its tip that way). */
const reach=(positions,from,dir)=>{let m=-Infinity;for(let i=0;i<positions.length;i+=3)m=Math.max(m,(positions[i]-from[0])*dir[0]+(positions[i+1]-from[1])*dir[1]+(positions[i+2]-from[2])*dir[2]);return m;};
/**
 * Clears a ball from the torso by `gap`: the shared step first (400 test points around the ball), then, for these
 * bigger balls, finer: 2,000 test points, moving on in 0.25 mm steps until none is closer than the gap (the
 * sparser test let the 26 cm hip ball come 1.6 mm too close).
 */
function clearOfTorso(shape,start,radius,dir,gap){
 let c=pushClear(shape,start,radius,dir,gap);
 const probes=Array.from({length:2000},(_,i)=>{const y=1-2*(i+.5)/2000,q=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*q,y,Math.sin(a)*q];});
 for(let k=0;k<400&&!probes.every(p=>insideTorso(shape,c.map((v,j)=>v+p[j]*(radius+gap)))<=0);k++)c=c.map((v,j)=>v+dir[j]*.00025);
 return c;
}
const ballPart=(name,side,radius,centre)=>{const b=buildBall({radius,triangles:CHOSEN_BALL_TRIANGLES});return {name,side,positions:b.positions.map((v,i)=>v+centre[i%3]),index:b.index,radius,centre};};
const moveBy=(p,v)=>({...p,positions:p.positions.map((x,i)=>x+v[i%3]),...(p.pivot?{pivot:p.pivot.map((x,k)=>x+v[k])}:{}),...(p.centre?{centre:p.centre.map((x,k)=>x+v[k])}:{})});
const add3=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],scale3=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],neg=a=>[-a[0],-a[1],-a[2]],dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

/**
 * Size adjustments to the joint balls (owner, 22 November 2026): wrists and ankles "a bit smaller", shoulders
 * and neck "slightly bigger". 10% each way is Claude's pick; 1 leaves a ball at its end's thickness.
 */
export const BALL_SIZE={shoulder:1.1,neck:1.1,wrist:.9,ankle:.9,hip:1.1};
/**
 * Hips (owner, 22 November 2026: hip balls "slightly bigger and closer together", the thigh's top "a little bit
 * wider"): hip balls 10% bigger (BALL_SIZE.hip); the gap between their inner edges Our avatar's divided by the
 * golden ratio; the thigh's top 20% wider at its end, fading out by the thigh's middle. Claude's picks.
 */
export const GOLDEN=(1+Math.sqrt(5))/2,HIP_BALL_GAP=ourAvatar.hipBallGap/GOLDEN,THIGH_TOP_WIDER=1.2,THIGH_WIDEN_UNTIL=.5;

/**
 * The owner's mix taken apart: every piece separate, the original neck removed,
 * and a ball (the approved 300-triangle ball, the fewest of the three tried)
 * between every two pieces that join. Each ball is as thick as the end it
 * joins: the limb's end at the shoulders, hips, wrists and ankles; at the
 * elbows and knees, the thinner of the two limb ends (so it never sticks out
 * past either). The neck ball keeps the approved neck ball's size.
 * Spacing, the approved rules: a ball clears the torso by 2 cm (shoulders:
 * "separated, not resting against the torso"; hips and neck the same), and
 * every other part sits the usual 6 mm from its ball, each ball exactly between
 * its two pieces (on both centre lines; owner: "exactly between the limbs"). The torso stays put; each
 * arm and leg is laid out from the torso down its own pieces' lines, every
 * piece only moved (not turned or reshaped); each leg then moves outward just
 * enough that the feet do not meet. The right side mirrors the left.
 */
/**
 * A preview of the avatar put together (owner, 22 November 2026: "see how it would look put together", exactly
 * our shapes): the same pieces and balls, only pressed closer. Each ball sinks `press` of its radius into the
 * limbs, hands, feet and head it joins, and the hip balls HIP_TORSO_PRESS into the torso (owner: "some of the balls can be deeper": 90% and 40%, was 80% and 25%); the
 * neck ball sits where it was approved, half in the torso. No sockets are carved: where a piece overlaps a ball
 * the ball is simply hidden inside it, which is how it will look once the sockets are made.
 */
/**
 * Slimmer forearms, thighs and calves: this many times the bigger of their two balls across (Claude's pick for
 * "slightly bigger"); the calf a hair more (owner: "just slightly slightly bigger ... barely noticeable": 3% more);
 * the thigh 5% more (owner, 22 November 2026: "make the upper leg slightly thicker": 15% wider than the hip ball);
 * then the calf 5% more again (owner: "make the calves slightly thicker overall": 18%). Scaled evenly around
 * each limb's line, so the shape stays.
 */
export const SLIM_OVER_BALL=1.1,SLIM_LIMBS=['forearm','thigh','calf'],SLIM_OVER={forearm:SLIM_OVER_BALL,thigh:SLIM_OVER_BALL+.05,calf:SLIM_OVER_BALL+.08};
export const PREVIEW_PRESS=.9;
/**
 * How deep the hip balls sit, put together (owner, 22 November 2026):
 *  - into the thigh, HIP_THIGH_EXTRA more of the ball's radius than the other joints (90% + 15% = 105%: the
 *    thigh's rounded top just past the ball's centre; "push the ball slightly deeper into the ... upper leg");
 *  - into the torso, HIP_TORSO_PRESS of the radius, measured on the torso's surface: 40%, then 45%, then about 1 cm
 *    deeper again ("the hip balls need to be deeper in the torso ... the torso only, not the upper leg"): 54%;
 *    then about 1 cm more ("ball needs to be deeper in the torso"): 63%; then 2 cm more ("I said deeper not slightly
 *    deeper, so another 2 cm deeper"): 80.3% (9.28 cm of the 11.55 cm radius).
 */
export const HIP_THIGH_EXTRA=.15,HIP_TORSO_PRESS=.803;
/**
 * The clay layer folded over the hip ball where the torso faces away from it, as a share of the ball's radius: 25%,
 * like the shoulders (SOCKET_SKIN). With the ball this deep it pokes out past the torso's sides, so the clay folds
 * over it. (Owner, 22 November 2026: "if you have to fold the edges more to achieve the soft edges" do it. With the
 * narrow soft edge, 25% left a thin shelf at the hip corners and 12% a sharp lip; with the full soft edge and the
 * rims rounded out, 25% folds into the roundest rim measured: tightest rounding 1.5 cm, sharpest turn 28°.)
 */
export const HIP_SOCKET_SKIN=.25;
/**
 * The torso's hip socket rims rounded out (owner, 22 November 2026: "the sockets in the torso has sharp rounded
 * edges ... round out the edges"): HIP_RIM_ROUNDS rounds of smoothing (roundOut) on the surface within HIP_RIM_BAND
 * of each cup (fading out over two more triangle lengths). Measured: the outer rims' tightest rounding went from
 * 5 mm to about 9 mm and the sharpest turn by the sockets from 39° to 34°; only the rims change, by up to about
 * 2 cm where the thin wedge of torso at the front of each cup rounds off. (Fewer rounds left a sharper turn; more
 * rounds or a wider band moved more of the torso, slimmed it around the hips and folded the strip between the balls.)
 */
export const HIP_RIM_ROUNDS=100,HIP_RIM_BAND=.01;
/**
 * Once pressed together, how far a limb's near end sits past its ball's centre, along the limb: 1 - press of the
 * ball's radius (the hip: 1 - press - HIP_THIGH_EXTRA, so the thigh's top is just above the centre).
 */
export const nearOffset=(joint,radius,press=PREVIEW_PRESS)=>radius*(1-press-(joint==='hip'?HIP_THIGH_EXTRA:0));
/**
 * A ball moved from `clear` (where it is clear of the torso) straight against `dir` until it sinks exactly `depth`
 * past the torso's surface: the furthest point along the way where a ball `depth` smaller still touches nothing
 * inside the torso (2,000 test points around it, bisection to 0.01 mm).
 */
export function sinkIntoTorso(shape,clear,radius,dir,depth){
 const probes=Array.from({length:2000},(_,i)=>{const y=1-2*(i+.5)/2000,q=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*q,y,Math.sin(a)*q];});
 const at=t=>clear.map((v,k)=>v-dir[k]*t),fits=t=>{const c=at(t);return probes.every(p=>insideTorso(shape,c.map((v,j)=>v+p[j]*(radius-depth)))<=0);};
 if(!fits(0))throw Error('sinkIntoTorso: the start is not clear');
 let lo=0,hi=.05;while(fits(hi)){lo=hi;hi*=2;if(hi>2)throw Error('sinkIntoTorso: never reaches the torso');}
 while(hi-lo>1e-5){const m=(lo+hi)/2;if(fits(m))lo=m;else hi=m;}
 return at(lo);
}
export function pressedPreviewBody(bodyId='boy',press=PREVIEW_PRESS){return separatedOriginalBody(bodyId,{press});}
// Both shoulder balls pushed into the torso like a hard ball into clay, then pulled back out (owner, 22 November 2026:
// "push the balls into the torso, imagine the torso is clay and the ball is hard, let the ball naturally sculpt the
// socket"; then "once you push the ball in pull it back out and leave it"). Each ball travels straight in along its
// push line (x), from beside the torso (where the separated avatar has it, 2 cm clear) to its put-together place, and clears the clay from its
// path: the ball plus the usual 6 mm gap (SOCKET_GAP) ahead of its centre, and the tube it travelled along behind it.
// Built as a cut (a mesh boolean, the standard way to take one shape out of another): the clay's triangles are cut
// exactly along the edge of each path (cutAlong), the ones inside are removed, and the socket is filled with the
// path's own surface, laid out exactly to the rim (the rim drawn flat around the bottom of the socket, filled with
// three.js's polygon filling, then split to the usual socket triangles and put back on the ball's surface). Where the
// path runs out through the top of a shoulder's outer corner, the socket opens there, as the ball would leave it.
// Before the cut the torso gets the usual socket triangles (refineNear, SOCKET_EDGE 1.2 cm) near each ball. Then each
// ball is pulled straight back out to where it started (the separated avatar's place). `inBalls`: where they were pushed to; `balls`: pulled out.
// `kind` per point: 0 the torso's outside, 1 the rim, 2 the socket. `displaced`: clay cleared (m^3).
export function pushShoulderBalls(bodyId='boy',pressed=pressedPreviewBody(bodyId),{apart=separatedOriginalBody(bodyId)}={}){
 const torso=pressed.parts.find(p=>p.name==='torso'),balls=pressed.parts.filter(p=>p.name==='ball-shoulder');
 const r=balls[0].radius,R=r+SOCKET_GAP,centres=balls.map(b=>b.centre),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 const reach=R+6*SOCKET_EDGE,fade=6*SOCKET_EDGE;
 const weight=m=>Math.max(...centres.map(c=>{const d=dist(m,c),f=Math.min(1,Math.max(0,(reach-d)/fade));return f>0?f*f*(3-2*f):(d<reach?1e-9:0);}));
 const refined=refineNear(torso.normals?torso:{...torso,normals:pointNormals(torso)},centres[0],reach,SOCKET_EDGE,6,weight);
 const paths=centres.map(c=>socketPath(c,R));
 // The cut, with snap rounding; a point the snapping would make into a pinch (the rim passing through it twice) is
 // left unsnapped and the cut redone.
 const EPS=1e-9,key=(a,b)=>a<b?a+','+b:b+','+a,noSnap=new Set();let part,P,N,kind,pt,kept,next;
 for(let attempt=0;;attempt++){
  part=refined;for(const w of paths)part=cutAlong(part,w.phi,0,noSnap);
  P=[...part.positions];N=[...part.normals];kind=[];pt=i=>[P[3*i],P[3*i+1],P[3*i+2]];
  for(let i=0;i<P.length/3;i++){const q=pt(i),f=Math.min(...paths.map(w=>w.phi(q)));kind.push(f<-EPS?3:Math.abs(f)<=1e-7?1:0);}
  // The clay outside the paths stays; the triangles inside go.
  kept=[];for(let t=0;t<part.index.length;t+=3){const v=[part.index[t],part.index[t+1],part.index[t+2]];if(v.some(i=>kind[i]===3))continue;if(v.every(i=>kind[i]===1)&&paths.some(w=>w.phi(v.map(pt).reduce((m,q)=>m.map((x,k)=>x+q[k]/3),[0,0,0]))<-EPS))continue;kept.push(...v);}
  // The rim: edges of the kept clay used once, each socket's rim going round the opposite way to the clay beside it.
  const used=new Map();for(let t=0;t<kept.length;t+=3)for(let e=0;e<3;e++){const a=kept[t+e],b=kept[t+(e+1)%3];used.set(key(a,b),(used.get(key(a,b))??0)+1);}
  next=new Map();const outs=new Map();for(let t=0;t<kept.length;t+=3)for(let e=0;e<3;e++){const a=kept[t+e],b=kept[t+(e+1)%3];if(used.get(key(a,b))===1){next.set(b,a);outs.set(b,(outs.get(b)??0)+1);}}
  const pinch=[...outs].filter(([,n])=>n>1).map(([v])=>v);if(!pinch.length)break;
  if(attempt>=5)throw Error('pushShoulderBalls: the rim keeps pinching');pinch.forEach(v=>noSnap.add(v));
 }
 // Each socket: its rim drawn flat around the socket's bottom, filled, split and put back on the path's surface.
 const sockets=[],seen=new Set();
 for(const start of next.keys()){if(seen.has(start))continue;const loop=[];let v=start;while(!seen.has(v)){seen.add(v);loop.push(v);v=next.get(v);if(v===undefined)throw Error('pushShoulderBalls: the rim is not closed');}
  if(v!==start)throw Error('pushShoulderBalls: the rim crosses itself');sockets.push(loop);}
 const cavity=[];
 for(const loop of sockets){
  const w=paths.find(w=>loop.every(i=>Math.abs(w.phi(pt(i)))<=1e-7));if(!w)throw Error('pushShoulderBalls: a rim on no path');
  const flat=loop.map(i=>w.toFlat(pt(i)));
  let faces=ShapeUtils.triangulateShape(flat.map(([x,y])=>new Vector2(x,y)),[]).map(f=>f.map(j=>loop[j]));
  // Facing into the socket (away from the clay), like the rest of the torso's outside.
  const face=f=>{const [a,b,c]=f.map(pt),n=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])],m=[0,1,2].map(k=>(a[k]+b[k]+c[k])/3),inw=w.inward(m);return n[0]*inw[0]+n[1]*inw[1]+n[2]*inw[2];};
  if(faces.reduce((s,f)=>s+face(f),0)<0)faces=faces.map(([a,b,c])=>[a,c,b]);
  // Split to the usual socket triangles; the rim's own edges stay as they are (they are shared with the clay).
  let T=faces.flat();const rimEdge=new Set();for(let k=0;k<loop.length;k++)rimEdge.add(key(loop[k],loop[(k+1)%loop.length]));const flatOf=new Map(loop.map((i,k)=>[i,flat[k]]));
  for(let round=0;round<12;round++){const split=new Map();
   for(let t=0;t<T.length;t+=3)for(let e=0;e<3;e++){const a=T[t+e],b=T[t+(e+1)%3],k=key(a,b);if(split.has(k)||rimEdge.has(k)||dist(pt(a),pt(b))<=SOCKET_EDGE)continue;
    const fa=flatOf.get(a),fb=flatOf.get(b),fm=[(fa[0]+fb[0])/2,(fa[1]+fb[1])/2],q=w.fromFlat(fm);split.set(k,P.length/3);flatOf.set(P.length/3,fm);P.push(...q);N.push(...w.inward(q));kind.push(2);}
   if(!split.size)break;const out=[];
   for(let t=0;t<T.length;t+=3){const v=[T[t],T[t+1],T[t+2]],m=[0,1,2].map(e=>split.get(key(v[e],v[(e+1)%3]))),n=m.filter(x=>x!==undefined).length;
    if(n===0){out.push(...v);continue;}if(n===3){out.push(v[0],m[0],m[2],m[0],v[1],m[1],m[2],m[1],v[2],m[0],m[1],m[2]);continue;}
    const rr=n===1?m.findIndex(x=>x!==undefined):[0,1,2].find(e=>m[e]!==undefined&&m[(e+1)%3]!==undefined),V=[0,1,2].map(k=>v[(k+rr)%3]),M=[0,1,2].map(k=>m[(k+rr)%3]);
    if(n===1)out.push(V[0],M[0],V[2],M[0],V[1],V[2]);else out.push(V[1],M[1],M[0],V[0],M[0],M[1],V[0],M[1],V[2]);}
   T=out;}
  // Lawson's edge flips on the drawing (a Delaunay triangulation): well-shaped triangles instead of slivers.
  const flips=()=>{for(let pass=0;pass<50;pass++){let n=0;const opp=new Map();
    for(let t=0;t<T.length;t+=3)for(let e=0;e<3;e++){const a=T[t+e],b=T[t+(e+1)%3],k=key(a,b);if(rimEdge.has(k))continue;(opp.get(k)??opp.set(k,[]).get(k)).push([t,e]);}
    const done=new Set();
    for(const [k,two] of opp){if(two.length!==2)continue;const [[t1,e1],[t2,e2]]=two;if(done.has(t1)||done.has(t2))continue;
     const a=T[t1+e1],b=T[t1+(e1+1)%3],c=T[t1+(e1+2)%3],d=T[t2+(e2+2)%3],F=i=>flatOf.get(i),[A,B,Cc,D]=[F(a),F(b),F(c),F(d)];
     const orient=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]),sg=Math.sign(orient(A,B,Cc));
     // d inside the circle through a, b, c (for the drawing's winding) and the flip keeps both triangles the same way round.
     const ad=[A[0]-D[0],A[1]-D[1]],bd=[B[0]-D[0],B[1]-D[1]],cd=[Cc[0]-D[0],Cc[1]-D[1]];
     const det=(ad[0]*ad[0]+ad[1]*ad[1])*(bd[0]*cd[1]-cd[0]*bd[1])-(bd[0]*bd[0]+bd[1]*bd[1])*(ad[0]*cd[1]-cd[0]*ad[1])+(cd[0]*cd[0]+cd[1]*cd[1])*(ad[0]*bd[1]-bd[0]*ad[1]);
     if(sg*det<=1e-30)continue;if(Math.sign(orient(Cc,A,D))!==sg||Math.sign(orient(D,B,Cc))!==sg)continue;
     T[t1]=c;T[t1+1]=a;T[t1+2]=d;T[t2]=d;T[t2+1]=b;T[t2+2]=c;done.add(t1);done.add(t2);n++;}
    if(!n)break;}};
  flips();
  // Even out the socket's inner points (on the drawing, so they stay on the ball's surface): a few relaxing rounds.
  const nb=new Map();for(let t=0;t<T.length;t+=3)for(let e=0;e<3;e++){const a=T[t+e],b=T[t+(e+1)%3];for(const [x,y] of [[a,b],[b,a]])if(kind[x]===2)(nb.get(x)??nb.set(x,new Set()).get(x)).add(y);}
  for(let it=0;it<10;it++)for(const [x,ys] of nb){let sx=0,sy=0;for(const y of ys){const f=flatOf.get(y);sx+=f[0];sy+=f[1];}const f=flatOf.get(x),g=[f[0]+.5*(sx/ys.size-f[0]),f[1]+.5*(sy/ys.size-f[1])];flatOf.set(x,g);}
  flips();
  for(const x of nb.keys()){const q=w.fromFlat(flatOf.get(x));P.splice(3*x,3,...q);N.splice(3*x,3,...w.inward(q));}
  cavity.push(...T);
 }
 // The points that were inside the paths are no longer used; the index keeps only the kept clay and the sockets.
 const index=[...kept,...cavity];
 const vol=(X,J)=>{let v=0;for(let t=0;t<J.length;t+=3){const a=3*J[t],b=3*J[t+1],e=3*J[t+2];v+=(X[a]*(X[b+1]*X[e+2]-X[b+2]*X[e+1])-X[a+1]*(X[b]*X[e+2]-X[b+2]*X[e])+X[a+2]*(X[b]*X[e+1]-X[b+1]*X[e]))/6;}return v;};
 // Unused points dropped and the rest renumbered.
 const keep=new Map(),pos=[],nor=[],kinds=[];for(const i of index)if(!keep.has(i)){keep.set(i,kinds.length);pos.push(P[3*i],P[3*i+1],P[3*i+2]);nor.push(N[3*i],N[3*i+1],N[3*i+2]);kinds.push(kind[i]===3?2:kind[i]);}
 let carved={...torso,positions:pos,index:index.map(i=>keep.get(i)),normals:nor};
 // Where the cut passed very close to a point it left rim points a fraction of a millimetre apart, with specks of
 // triangles between them. Those rim edges (under 1 mm) are collapsed, the standard clean-up: both points become one,
 // on the rim, if the two share no neighbours but the two triangles on that edge (the link condition) and no triangle
 // around them turns over.
 carved=collapseShortRimEdges(carved,kinds,paths,.001);
 const out=apart.parts.filter(p=>p.name==='ball-shoulder');
 // For drawing, the rim is a hard edge: the socket's triangles get their own copies of the rim points, shaded like
 // the socket, while the outside's triangles keep the rim points shaded like the outside (the standard way to draw a
 // crease; a shared point would blend the two and shade the first row of the socket unevenly). `solid` keeps one
 // point per place, for measuring and for the round-over.
 const sp=carved.positions,si=carved.index,phiAt=q=>Math.min(...paths.map(w=>w.phi(q))),dpos=[...sp],dnor=[...carved.normals],copy=new Map(),dindex=[];
 for(let t=0;t<si.length;t+=3){const v=[si[t],si[t+1],si[t+2]],q=k=>[sp[3*k],sp[3*k+1],sp[3*k+2]];
  const socket=v.some(k=>kinds[k]===2)||v.every(k=>kinds[k]===1)&&phiAt([0,1,2].map(j=>(sp[3*v[0]+j]+sp[3*v[1]+j]+sp[3*v[2]+j])/3))<0;
  dindex.push(...v.map(k=>{if(!socket||kinds[k]!==1)return k;if(!copy.has(k)){const p=q(k),w=paths.find(w=>Math.sign(w.c[0])===Math.sign(p[0]));copy.set(k,dpos.length/3);dpos.push(...p);dnor.push(...w.inward(p));}return copy.get(k);}));}
 const drawn={...carved,positions:dpos,index:dindex,normals:dnor};
 return {body:bodyId,parts:[drawn,...out],torso:drawn,solid:carved,kind:kinds,refined,before:part,paths,ways:paths.map(w=>w.phi),balls:out,inBalls:balls,R,displaced:vol(refined.positions,refined.index)-vol(carved.positions,carved.index)};
}
export function collapseShortRimEdges(part,kind,paths,minLen,types=null){
 let P=[...part.positions],N=[...part.normals],I=[...part.index];const pt=i=>[P[3*i],P[3*i+1],P[3*i+2]],key=(a,b)=>a<b?a+','+b:b+','+a,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 const nrm=(a,b,c)=>[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];
 for(let pass=0;pass<10;pass++){
  const fan=new Map();for(let t=0;t<I.length;t+=3)for(let k=0;k<3;k++)(fan.get(I[t+k])??fan.set(I[t+k],[]).get(I[t+k])).push(t);
  const gone=new Set(),touched=new Set();let n=0;
  for(let t=0;t<I.length;t+=3){if(gone.has(t))continue;for(let e=0;e<3;e++){const a=I[t+e],b=I[t+(e+1)%3];if(kind[a]!==1||kind[b]!==1||touched.has(a)||touched.has(b))continue;
   if(dist(pt(a),pt(b))>=minLen)continue;
   const ta=fan.get(a).filter(x=>!gone.has(x)),tb=fan.get(b).filter(x=>!gone.has(x)),both=ta.filter(x=>tb.includes(x));if(both.length!==2)continue;
   const nbr=v=>new Set(fan.get(v).filter(x=>!gone.has(x)).flatMap(x=>[I[x],I[x+1],I[x+2]]).filter(u=>u!==v)),na=nbr(a),nb=nbr(b),common=[...na].filter(u=>nb.has(u)&&u!==a&&u!==b);
   const opp=both.map(x=>[I[x],I[x+1],I[x+2]].find(u=>u!==a&&u!==b));if(common.length!==2||!opp.every(u=>common.includes(u)))continue;
   // The merged point: the middle of the edge, put back onto the rim (the edge bows into the path).
   const m=[0,1,2].map(k=>(P[3*a+k]+P[3*b+k])/2),w=paths.find(w=>Math.sign(w.c[0])===Math.sign(m[0])),q=w.phi(m)<0?w.nearest(m):m;
   // No triangle around either point may turn over.
   let ok=true;for(const x of [...ta,...tb]){if(both.includes(x))continue;const v=[I[x],I[x+1],I[x+2]],before=nrm(...v.map(pt)),after=nrm(...v.map(u=>u===a||u===b?q:pt(u)));if(before[0]*after[0]+before[1]*after[1]+before[2]*after[2]<=0){ok=false;break;}}
   if(!ok)continue;
   P.splice(3*a,3,...q);for(const x of tb)for(let k=0;k<3;k++)if(I[x+k]===b)I[x+k]=a;both.forEach(x=>gone.add(x));
   [...na,...nb,a,b].forEach(u=>touched.add(u));n++;break;}}
  if(!n)break;const out=[],ty=[];for(let t=0;t<I.length;t+=3)if(!gone.has(t)){out.push(I[t],I[t+1],I[t+2]);if(types)ty.push(types[t/3]);}I=out;if(types){types.length=0;types.push(...ty);}
 }
 // Unused points dropped (the collapsed ones) and the rest renumbered, kinds kept in step.
 const keep=new Map(),pos=[],nor=[],kinds=[];for(const i of I)if(!keep.has(i)){keep.set(i,kinds.length);pos.push(P[3*i],P[3*i+1],P[3*i+2]);nor.push(N[3*i],N[3*i+1],N[3*i+2]);kinds.push(kind[i]);}
 kind.length=0;kind.push(...kinds);
 return {...part,positions:pos,index:I.map(i=>keep.get(i)),normals:nor};
}
/**
 * A ball's path through the clay, travelling straight in along x toward the body's middle and stopping with its centre
 * at `c`: ahead of the centre the ball itself (radius R), behind it the tube it came along. `phi`: below 0 inside, 0 on
 * the edge, above 0 outside. `inward`: the direction from the edge into the path (the socket's facing). `toFlat` /
 * `fromFlat`: the edge drawn flat around the socket's bottom (distance along the edge from the bottom, and the angle
 * round the travel line), so a rim on it can be filled as a flat polygon and put back exactly on the edge.
 */
export function socketPath(c,R){
 const d=-Math.sign(c[0]),quarter=R*Math.PI/2;
 return {c,R,d,
  phi:p=>{const u=d*(p[0]-c[0]),rho=Math.hypot(p[1]-c[1],p[2]-c[2]);return u>0?Math.hypot(u,rho)-R:rho-R;},
  inward:p=>{const v=[p[0]-c[0],p[1]-c[1],p[2]-c[2]];if(d*v[0]>0){const l=Math.hypot(...v);return v.map(x=>-x/l);}const rho=Math.hypot(v[1],v[2]);return [0,-v[1]/rho,-v[2]/rho];},
  toFlat:p=>{const u=d*(p[0]-c[0]),y=p[1]-c[1],z=p[2]-c[2],rho=Math.hypot(y,z),th=Math.atan2(z,y),s=u>0?R*Math.atan2(rho,u):quarter-u;return [s*Math.cos(th),s*Math.sin(th)];},
  fromFlat:([X,Y])=>{const s=Math.hypot(X,Y),th=Math.atan2(Y,X);let u,rho;if(s<=quarter){u=R*Math.cos(s/R);rho=R*Math.sin(s/R);}else{u=quarter-s;rho=R;}return [c[0]+d*u,c[1]+rho*Math.cos(th),c[2]+rho*Math.sin(th)];},
  nearest:p=>{const v=[p[0]-c[0],p[1]-c[1],p[2]-c[2]];if(d*v[0]>0){const q=Math.hypot(...v);return v.map((x,k)=>c[k]+x*R/q);}const rho=Math.hypot(v[1],v[2]);return [p[0],c[1]+v[1]*R/rho,c[2]+v[2]*R/rho];}};
}
// The sockets' rims chiselled and softened (owner, 22 November 2026, circling the thin sliver of clay that overhangs the
// top of the socket: "can u chisel that away, then soften up the rim of the socket"). The proven way to do both at once
// is the rolling-ball round-over that CAD fillets use (in mathematics, the morphological opening): a ball of radius `f`
// rolls everywhere inside the clay; whatever it cannot reach is cut away. Clay thinner than the ball is chiselled off,
// and the rim takes the ball's round shape; everywhere the ball reaches, nothing changes. Here the ball's centre runs
// along the line where it touches both the torso's outside and the socket (`centre line`: the torso's outside moved in
// by f, crossed with the socket moved out by f); a point the ball cannot reach goes to the nearest point of the ball
// rolled along that line. First the clay near the rims gets triangles a third of f long, so the round edge is smooth.
export const SHOULDER_RIM_ROUND=.005;
export function softenShoulderRims(ps,f=SHOULDER_RIM_ROUND){
 const {paths}=ps,phi=p=>Math.min(...paths.map(w=>w.phi(p))),pathOf=p=>paths.find(w=>Math.sign(w.c[0])===Math.sign(p[0])),band=4*f;
 const P=[...ps.solid.positions],N=[...ps.solid.normals],K=[...ps.kind];let I=[...ps.solid.index],TT=[];
 const pt=(X,i)=>[X[3*i],X[3*i+1],X[3*i+2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],len=v=>Math.hypot(...v),key=(a,b)=>a<b?a*4194304+b:b*4194304+a;
 // Which side each triangle is on: the socket (any socket point, or all rim points with the middle inside a path) or the outside.
 for(let t=0;t<I.length;t+=3){const v=[I[t],I[t+1],I[t+2]];TT.push(v.some(i=>K[i]===2)||v.every(i=>K[i]===1)&&phi([0,1,2].map(k=>(P[3*v[0]+k]+P[3*v[1]+k]+P[3*v[2]+k])/3))<0?2:0);}
 // A grid of points for 'what is near here' questions; `each` visits the nearby items without building lists.
 const grid=(pts,cell)=>{const g=new Map(),K3=(x,y,z)=>((x+512)*1024+(y+512))*1024+(z+512),c=v=>Math.floor(v/cell);pts.forEach((p,i)=>{const k=K3(c(p[0]),c(p[1]),c(p[2]));(g.get(k)??g.set(k,[]).get(k)).push(i);});
  return {each:(p,r,fn)=>{const cx=c(p[0]),cy=c(p[1]),cz=c(p[2]),n=Math.ceil(r/cell);for(let x=-n;x<=n;x++)for(let y=-n;y<=n;y++)for(let z=-n;z<=n;z++){const l=g.get(K3(cx+x,cy+y,cz+z));if(l)for(const j of l)if(fn(j)===true)return true;}return false;}};};
 const rim=[];for(let i=0;i<K.length;i++)if(K[i]===1)rim.push(pt(P,i));
 const rimGrid=grid(rim,band),b2=band*band,nearRimAt=p=>rimGrid.each(p,band,j=>{const q=rim[j],x=q[0]-p[0],y=q[1]-p[1],z=q[2]-p[2];return x*x+y*y+z*z<b2;}),nearCache=[],nearRim=p=>nearRimAt(p),nearI=i=>nearCache[i]??(nearCache[i]=nearRimAt(pt(P,i)));
 const closest=(p,a,b,c)=>{const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),dot=(x,y)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2],d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return a;
  const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return b;const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);return a.map((x,k)=>x+v*ab[k]);}
  const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return c;const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return a.map((x,k)=>x+w*ac[k]);}
  const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));return b.map((x,k)=>x+w*(c[k]-x));}const den=1/(va+vb+vc),v=vb*den,w=vc*den;return a.map((x,k)=>x+ab[k]*v+ac[k]*w);};
 const unit=i=>{const n=pt(N,i),l=len(n)||1;return n.map(v=>v/l);};
 let inset,outside,line,lineGrid,triGrid;
 const insetOf=i=>{if(!inset.has(i)){const q=pt(P,i),n=unit(i);inset.set(i,[q[0]-f*n[0],q[1]-f*n[1],q[2]-f*n[2]]);}return inset.get(i);};
 // The ball's centre line: the torso's outside moved in by f, where the socket is exactly f away (one piece per
 // outside triangle that crosses that level), and the outside triangles near the rims (to tell how deep a point is).
 const measure=()=>{inset=new Map();outside=[];line=[];
  for(let t=0;t<I.length;t+=3){if(TT[t/3]!==0)continue;const v=[I[t],I[t+1],I[t+2]];if(!v.some(nearI))continue;outside.push(t);
   const X=v.map(insetOf),g=X.map(x=>phi(x)-f),cut=[];for(let e=0;e<3;e++){const a=e,b=(e+1)%3;if((g[a]<0)!==(g[b]<0)){const s=g[a]/(g[a]-g[b]);cut.push(X[a].map((x,j)=>x+s*(X[b][j]-x)));}}
   if(cut.length===2)line.push(cut);}
  lineGrid=grid(line.map(([a,b])=>a.map((x,j)=>(x+b[j])/2)),band);triGrid=grid(outside.map(t=>[0,1,2].map(j=>(P[3*I[t]+j]+P[3*I[t+1]+j]+P[3*I[t+2]+j])/3)),band);};
 const depth=p=>{let bd=Infinity,sign=1;triGrid.each(p,2*f,j=>{const t=outside[j],a=pt(P,I[t]),b=pt(P,I[t+1]),c=pt(P,I[t+2]),q=closest(p,a,b,c),d=len(sub(p,q));if(d<bd){bd=d;const n=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];sign=(p[0]-q[0])*n[0]+(p[1]-q[1])*n[1]+(p[2]-q[2])*n[2]<0?1:-1;}});return bd===Infinity?Infinity:sign*bd;};
 // Can the rolling ball touch this point from inside the clay? (Outside and rim points: the ball sits just under the
 // outside; socket points: just behind the socket's surface.)
 // (Asked once per point: splitting adds triangles but does not move any point or change the surfaces.)
 const reachCache=[],reaches=i=>{if(reachCache[i]!==undefined)return reachCache[i];const p=pt(P,i);let r;if(K[i]!==2)r=phi(insetOf(i))>=f-1e-9;else{const m=pathOf(p).inward(p);r=depth([p[0]-f*m[0],p[1]-f*m[1],p[2]-f*m[2]])>=f-1e-9;}return reachCache[i]=r;};
 const onLine=p=>{let best=null,bd=Infinity;lineGrid.each(p,band,j=>{const [a,b]=line[j],ab=sub(b,a),l2=ab[0]**2+ab[1]**2+ab[2]**2,s=l2?Math.max(0,Math.min(1,((p[0]-a[0])*ab[0]+(p[1]-a[1])*ab[1]+(p[2]-a[2])*ab[2])/l2)):0,q=a.map((x,k)=>x+s*ab[k]),d=len(sub(p,q));if(d<bd){bd=d;best=q;}});return best;};
 // 1. Where the ball cuts (the rim and every point it cannot reach), triangles are split until half of f long, so the
 // round edge is smooth. New points: on the outside, the middle of the edge; in the socket or on the rim, put back on
 // the socket's surface.
 for(let round=0;round<6;round++){
  measure();const cutHere=new Map(),cuts=i=>{if(!cutHere.has(i))cutHere.set(i,K[i]===1||nearI(i)&&!reaches(i));return cutHere.get(i);};
  const sides=new Map();for(let t=0;t<I.length;t+=3){if(!(nearI(I[t])||nearI(I[t+1])||nearI(I[t+2])))continue;for(let e=0;e<3;e++){const k=key(I[t+e],I[t+(e+1)%3]);(sides.get(k)??sides.set(k,[]).get(k)).push(TT[t/3]);}}
  const split=new Map();
  for(let t=0;t<I.length;t+=3){if(!(nearI(I[t])||nearI(I[t+1])||nearI(I[t+2])))continue;const v=[I[t],I[t+1],I[t+2]];if(!v.some(cuts))continue;
   for(let e=0;e<3;e++){const a=v[e],b=v[(e+1)%3],k=key(a,b);if(split.has(k)||len(sub(pt(P,a),pt(P,b)))<=f/2)continue;
    // (An edge between two rim points bows into the socket's path, the rim being curved: its middle goes onto the rim.)
    const m=[0,1,2].map(j=>(P[3*a+j]+P[3*b+j])/2),sd=sides.get(k),onSocket=sd.includes(2),onOut=sd.includes(0),kk=onSocket&&onOut||!onSocket&&phi(m)<0?1:onSocket?2:0;
    const q=kk===0?m:pathOf(m).nearest(m);split.set(k,P.length/3);P.push(...q);K.push(kk);
    if(kk===2)N.push(...pathOf(q).inward(q));else{const n=[0,1,2].map(j=>N[3*a+j]+N[3*b+j]),l=len(n)||1;N.push(n[0]/l,n[1]/l,n[2]/l);}}}
  if(!split.size)break;
  const out=[],types=[];
  for(let t=0;t<I.length;t+=3){const ty=TT[t/3],v=[I[t],I[t+1],I[t+2]],m=[0,1,2].map(e=>split.get(key(v[e],v[(e+1)%3]))),n=m.filter(x=>x!==undefined).length;
   let add;if(n===0)add=v;else if(n===3)add=[v[0],m[0],m[2],m[0],v[1],m[1],m[2],m[1],v[2],m[0],m[1],m[2]];
   else{const r=n===1?m.findIndex(x=>x!==undefined):[0,1,2].find(e=>m[e]!==undefined&&m[(e+1)%3]!==undefined),V=[0,1,2].map(k=>v[(k+r)%3]),M=[0,1,2].map(k=>m[(k+r)%3]);
    add=n===1?[V[0],M[0],V[2],M[0],V[1],V[2]]:[V[1],M[1],M[0],V[0],M[0],M[1],V[0],M[1],V[2]];}
   out.push(...add);for(let j=0;j<add.length;j+=3)types.push(ty);}
  I=out;TT=types;
 }
 // Specks of triangles the splitting left along the rims: rim edges under a fifth of f collapsed (as after the cut).
 {const c=collapseShortRimEdges({positions:P,normals:N,index:I},K,paths,f/5,TT);P.length=0;P.push(...c.positions);N.length=0;N.push(...c.normals);I=c.index;nearCache.length=0;reachCache.length=0;}
 // Slivers near the rims (left where the cut passed very close to a point) are cleaned up with edge flips, the standard
 // way to improve triangle shapes: where two triangles on the same side meet almost flat (under 10 degrees) and one has
 // a corner under 10 degrees, their shared edge is swapped for the other diagonal if that gives better corners. The
 // rim's own edges and the edges between the outside and the socket are never swapped.
 {const ang=(p,q,r)=>{const u=sub(q,p),w=sub(r,p);return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1]+u[2]*w[2])/(len(u)*len(w)||1))));};
  const minA=(a,b,c)=>{const A=pt(P,a),B=pt(P,b),C=pt(P,c);return Math.min(ang(A,B,C),ang(B,C,A),ang(C,A,B));};
  const nrm=(a,b,c)=>{const A=pt(P,a),B=pt(P,b),C=pt(P,c),n=[(B[1]-A[1])*(C[2]-A[2])-(B[2]-A[2])*(C[1]-A[1]),(B[2]-A[2])*(C[0]-A[0])-(B[0]-A[0])*(C[2]-A[2]),(B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0])],l=len(n)||1;return n.map(x=>x/l);};
  const lim=10*Math.PI/180;
  for(let pass=0;pass<20;pass++){let n=0;const opp=new Map();
   for(let t=0;t<I.length;t+=3){if(!nearI(I[t]))continue;for(let e=0;e<3;e++){const k=key(I[t+e],I[t+(e+1)%3]);(opp.get(k)??opp.set(k,[]).get(k)).push([t,e]);}}
   const done=new Set();
   for(const two of opp.values()){if(two.length!==2)continue;const [[t1,e1],[t2,e2]]=two;if(done.has(t1)||done.has(t2)||TT[t1/3]!==TT[t2/3])continue;
    const a=I[t1+e1],b=I[t1+(e1+1)%3],c=I[t1+(e1+2)%3],d=I[t2+(e2+2)%3];if(K[a]===1&&K[b]===1||c===d||opp.has(key(c,d)))continue;
    const before=Math.min(minA(a,b,c),minA(b,a,d));if(before>=lim)continue;
    const n1=nrm(a,b,c),n2=nrm(b,a,d);if(n1[0]*n2[0]+n1[1]*n2[1]+n1[2]*n2[2]<Math.cos(lim))continue;
    const m1=nrm(c,a,d),m2=nrm(d,b,c);if(m1[0]*n1[0]+m1[1]*n1[1]+m1[2]*n1[2]<=0||m2[0]*n1[0]+m2[1]*n1[1]+m2[2]*n1[2]<=0)continue;
    if(Math.min(minA(c,a,d),minA(d,b,c))<=before)continue;
    I[t1]=c;I[t1+1]=a;I[t1+2]=d;I[t2]=d;I[t2+1]=b;I[t2+2]=c;done.add(t1);done.add(t2);opp.set(key(c,d),[]);n++;}
   if(!n)break;}}
 measure();
 // 2. Every point the rolling ball cannot reach goes to the nearest point of the ball rolled along its centre line.
 const out=[...P];let chiselled=0;
 for(let i=0;i<K.length;i++){const p=pt(P,i);if(!nearI(i)||reaches(i))continue;const g=onLine(p);if(!g)continue;const d=len(sub(p,g));if(d<=f)continue;
  for(let k=0;k<3;k++)out[3*i+k]=g[k]+f*(p[k]-g[k])/d;chiselled++;}
 // Shading: where nothing moved, the directions it had; where the ball cut, the new surface's (blended over 5 mm).
 const A=angleNormals({positions:out,index:I}),NN=new Array(out.length);
 for(let i=0;i<out.length;i+=3){const m=Math.hypot(out[i]-P[i],out[i+1]-P[i+1],out[i+2]-P[i+2]),x=Math.min(1,m/.005),t=x*x*(3-2*x);
  const n=[0,1,2].map(k=>N[i+k]*(1-t)+A[i+k]*t),l=Math.hypot(...n)||1;for(let k=0;k<3;k++)NN[i+k]=n[k]/l;}
 const vol=(X,J)=>{let v=0;for(let t=0;t<J.length;t+=3){const a=3*J[t],b=3*J[t+1],e=3*J[t+2];v+=(X[a]*(X[b+1]*X[e+2]-X[b+2]*X[e+1])-X[a+1]*(X[b]*X[e+2]-X[b+2]*X[e])+X[a+2]*(X[b]*X[e+1]-X[b+1]*X[e]))/6;}return v;};
 const torso={...ps.solid,positions:out,index:I,normals:NN};
 return {...ps,parts:[torso,...ps.balls],torso,solid:torso,rough:{positions:P,index:I,kind:K},line,f,chiselled,removed:vol(P,I)-vol(out,I)};
}
/**
 * Splits every edge that crosses `phi = 0` (phi(point) < 0 inside) at the exact crossing (bisection on the edge),
 * so the mesh has a line of points exactly where it meets that boundary. Triangles are split with the same patterns
 * as refineNear (same winding); the new points lie on the old flat triangles, so the surface does not change shape,
 * and get the blend of their ends' carried directions. A point exactly on the boundary counts as outside.
 */
export function cutAlong(part,phi,snap=.15,noSnap=new Set()){
 const P=[...part.positions],I=part.index,N=[...part.normals],pt=i=>[P[3*i],P[3*i+1],P[3*i+2]],split=new Map(),key=(a,b)=>a<b?a+','+b:b+','+a;
 // A point within a hair (1e-9 m) of the boundary counts as on it (outside), so a snapped point is never split again.
 let inside=new Map(),isIn=i=>{if(!inside.has(i))inside.set(i,phi(pt(i))<-1e-9);return inside.get(i);};
 // Snap rounding: where the crossing falls within `snap` of an edge's end, that end is moved onto the boundary
 // (along the edge) instead of splitting the edge, which would leave a sliver of a triangle there.
 if(snap>0){const to=new Map();
  for(let t=0;t<I.length;t+=3)for(let e=0;e<3;e++){const a=I[t+e],b=I[t+(e+1)%3];if(isIn(a)===isIn(b))continue;
   const A=pt(a),B=pt(b),at=s=>A.map((v,j)=>v+s*(B[j]-v));let lo=0,hi=1;const inA=isIn(a);for(let n=0;n<60;n++){const m=(lo+hi)/2;if((phi(at(m))<0)===inA)lo=m;else hi=m;}
   const s=(lo+hi)/2,[v,d]=s<snap?[a,s]:s>1-snap?[b,1-s]:[null,0];if(v!==null&&!noSnap.has(v)&&(!to.has(v)||to.get(v).d>d))to.set(v,{d,q:at(s)});}
  for(const [v,{q}] of to)P.splice(3*v,3,...q);
  inside=new Map();isIn=i=>{if(!inside.has(i))inside.set(i,phi(pt(i))<-1e-9);return inside.get(i);};}
 for(let t=0;t<I.length;t+=3)for(let e=0;e<3;e++){
  const a=I[t+e],b=I[t+(e+1)%3],k=key(a,b);if(split.has(k)||isIn(a)===isIn(b))continue;
  const A=pt(a),B=pt(b),at=s=>A.map((v,j)=>v+s*(B[j]-v));let lo=0,hi=1;const inA=isIn(a);
  for(let n=0;n<60;n++){const m=(lo+hi)/2;if((phi(at(m))<0)===inA)lo=m;else hi=m;}
  const s=(lo+hi)/2;split.set(k,P.length/3);P.push(...at(s));
  const n=[0,1,2].map(j=>N[3*a+j]*(1-s)+N[3*b+j]*s),l=Math.hypot(...n)||1;N.push(n[0]/l,n[1]/l,n[2]/l);
 }
 const out=[];
 for(let t=0;t<I.length;t+=3){
  const v=[I[t],I[t+1],I[t+2]],m=[0,1,2].map(e=>split.get(key(v[e],v[(e+1)%3]))),n=m.filter(x=>x!==undefined).length;
  if(n===0){out.push(...v);continue;}
  if(n===3){out.push(v[0],m[0],m[2],m[0],v[1],m[1],m[2],m[1],v[2],m[0],m[1],m[2]);continue;}
  const r=n===1?m.findIndex(x=>x!==undefined):[0,1,2].find(e=>m[e]!==undefined&&m[(e+1)%3]!==undefined);
  const V=[0,1,2].map(k=>v[(k+r)%3]),M=[0,1,2].map(k=>m[(k+r)%3]);
  if(n===1)out.push(V[0],M[0],V[2],M[0],V[1],V[2]);else out.push(V[1],M[1],M[0],V[0],M[0],M[1],V[0],M[1],V[2]);
 }
 return {positions:P,index:out,normals:N};
}

/**
 * Rounds out every edge and rim near sockets (owner, 22 November 2026: no sharp edges, only smooth soft rims): the
 * surface within `reach` of a ball's centre (fading out over two more triangle lengths) is smoothed `rounds` times,
 * each point moved halfway to the middle of its neighbours, and after every round any point inside a socket's gap
 * is put back out onto it. Where the torso's side meets a deep cup it ends in a thin wedge; this smoothing rounds
 * the wedge's tip off and lays the clay softly onto the cup, never closer to the ball than the gap. (Taubin's
 * shrink-free smoothing was tried first: it keeps thin wedges as they are, so the edge stayed.)
 */
export function roundOut(part,centres,R,reach,rounds){
 const P=[...part.positions],n=P.length/3,I=part.index,near=Array.from({length:n},()=>new Set());
 for(let t=0;t<I.length;t+=3)for(let k=0;k<3;k++){const a=I[t+k],c=I[t+(k+1)%3];near[a].add(c);near[c].add(a);}
 const nb=near.map(s=>[...s]),fade=2*SOCKET_EDGE,w=new Float64Array(n);
 for(let i=0;i<n;i++){const d=Math.min(...centres.map(c=>Math.hypot(P[3*i]-c[0],P[3*i+1]-c[1],P[3*i+2]-c[2]))),x=Math.min(1,Math.max(0,(reach+fade-d)/fade));w[i]=x*x*(3-2*x);}
 const step=f=>{const Q=[...P];for(let i=0;i<n;i++){if(!w[i]||!nb[i].length)continue;const m=[0,0,0];for(const j of nb[i])for(let k=0;k<3;k++)m[k]+=Q[3*j+k]/nb[i].length;for(let k=0;k<3;k++)P[3*i+k]=Q[3*i+k]+w[i]*f*(m[k]-Q[3*i+k]);}};
 const out=()=>{for(const c of centres)for(let i=0;i<n;i++){const d=[0,1,2].map(k=>P[3*i+k]-c[k]),l=Math.hypot(...d);if(l<R&&l>0)for(let k=0;k<3;k++)P[3*i+k]=c[k]+d[k]/l*R;}};
 for(let r=0;r<rounds;r++){step(.5);out();}
 return {...part,positions:P};
}
/** Surface directions, each point's the average of its triangles' directions weighted by the angle they make there. */
export function angleNormals({positions:P,index:I}){
 const N=new Array(P.length).fill(0),pt=i=>[P[3*i],P[3*i+1],P[3*i+2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
 for(let t=0;t<I.length;t+=3){
  const v=[I[t],I[t+1],I[t+2]],p=v.map(pt),u=sub(p[1],p[0]),w=sub(p[2],p[0]),n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],l=Math.hypot(...n);if(!l)continue;
  for(let k=0;k<3;k++){const a=sub(p[(k+1)%3],p[k]),b=sub(p[(k+2)%3],p[k]),c=(a[0]*b[0]+a[1]*b[1]+a[2]*b[2])/(Math.hypot(...a)*Math.hypot(...b)),ang=Math.acos(Math.max(-1,Math.min(1,c)));
   for(let j=0;j<3;j++)N[3*v[k]+j]+=n[j]/l*ang;}
 }
 for(let i=0;i<N.length;i+=3){const l=Math.hypot(N[i],N[i+1],N[i+2])||1;N[i]/=l;N[i+1]/=l;N[i+2]/=l;}
 return N;
}
/**
 * Sockets for several balls of one size in one part, made like makeSocket (sockets.js: refine near the ball, then
 * press), but refined once for all of them, over everything the presses can move plus the refinement's fade (six
 * triangle lengths), and only then pressed one ball after another. (makeSocket refines only to R + soft + one
 * triangle, so a kept clay layer is pressed on coarse triangles past that: a jagged ring; and refining for a second
 * ball after the first was pressed bent the surface between them: a 57° fold at the torso's back.) Points the
 * later presses nudge back into an earlier socket are put back out onto it.
 */
export function mouldSockets(part,centres,R,soft,skin,roundRims=0,rimBand=HIP_RIM_BAND){
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 // Each ball's soft edge is as wide as `soft`, but never wider than the room left before another ball's socket
 // (two soft edges overlapping in the thin strip of torso between two deep sockets folded it).
 const softFor=c=>p=>Math.max(SOCKET_EDGE,Math.min(soft,...centres.filter(o=>o!==c).map(o=>dist(p,o)-R)));
 const reach=R+skin+soft+6*SOCKET_EDGE,fade=6*SOCKET_EDGE;
 const weight=m=>Math.max(...centres.map(c=>{const d=dist(m,c),f=Math.min(1,Math.max(0,(reach-d)/fade));return f>0?f*f*(3-2*f):(d<reach?1e-9:0);}));
 // The part's smooth surface directions, carried through the splitting (they also tell the clay layer which way the
 // surface faced before the press).
 const refined=refineNear(part.normals?part:{...part,normals:pointNormals(part)},centres[0],reach,SOCKET_EDGE,6,weight);
 let out=refined;for(const c of centres)out=pressBall(out,c,R,softFor(c),skin);
 for(const c of centres)out=keepOutside(out,c,R);
 // A deep press stretches the triangles it pushes into the cup (at 80% deep, a flat triangle's middle sat 3 mm
 // inside the gap): split them again, now following the pressed surface, and put the new points out onto the cup.
 const nOld=out.positions.length;
 out=refineNear({positions:out.positions,index:out.index,normals:angleNormals(out)},centres[0],R+soft,SOCKET_EDGE,6,m=>centres.some(c=>dist(m,c)<R+soft)?1:0);
 for(const c of centres)out=keepOutside(out,c,R);
 // Then the rims rounded out (owner: no sharp edges, only smooth soft rims): only right by the cups.
 if(roundRims)out=roundOut(out,centres,R,R+rimBand,roundRims);
 // Shading directions: where the press left the surface in place, the carried directions, so the split area shades
 // exactly like the rest of the part (directions measured on the split triangles showed faint patches and a seam
 // line where they meet the coarser triangles); where the press moved it (the socket and its soft edge), the
 // directions of the new surface, blended in over the first 5 mm of movement.
 // (Points added by the second split are all in the moved area.)
 const P=out.positions,C=refined.normals,A=angleNormals(out),N=new Array(P.length);
 for(let i=0;i<P.length;i+=3){const m=i<nOld?Math.hypot(P[i]-refined.positions[i],P[i+1]-refined.positions[i+1],P[i+2]-refined.positions[i+2]):1,x=Math.min(1,m/.005),t=x*x*(3-2*x);
  const n=[0,1,2].map(k=>(i<nOld?C[i+k]:0)*(1-t)+A[i+k]*t),l=Math.hypot(...n)||1;for(let k=0;k<3;k++)N[i+k]=n[k]/l;}
 return {positions:P,index:out.index,normals:N};
}
export function separatedOriginalBody(bodyId='boy',{press=0}={}){
 // How far a piece's near end sits from its ball's centre: one gap past the ball when apart; inside it when pressed.
 // Per ball when pressed: nearOffset (the hip a little deeper into the thigh).
 const offset=(r,ball)=>press?nearOffset(ball.replace('ball-',''),r,press):r+BALL_GAP;
 const whole=originalLimbBody(bodyId),get=(n,s='left')=>whole.parts.find(p=>p.name===n&&p.side===s),torsoShape=whole.torsoShape;
 const parts=[get('torso','centre')],balls={};
 const lineOf=p=>limbLine(p.positions,p.axis);
 // A chain from the torso: ball, piece, ball, piece, ... each piece moved so its near tip is one gap past the ball.
 // A chain from the torso: ball, piece, ball, piece, ... with every ball exactly between its two pieces: on the
 // centre line of the piece above and of the piece below, one 6 mm gap from each along that line.
 function chain(firstBall,pieces,ends,names){
  let ballCentre=firstBall.centre,radius=firstBall.radius,out=[ballPart(names[0],'left',radius,ballCentre)];
  for(let k=0;k<pieces.length;k++){
   const piece=pieces[k];
   if(k<pieces.length-1){
    // A limb: moved (not turned) so its centre line runs through the ball's centre and its near end is one gap past the ball.
    const L=lineOf(piece),dir=L.dir,nearEnd=add3(L.centre,scale3(dir,L.start)),moved=moveBy(piece,sub3(add3(ballCentre,scale3(dir,offset(radius,names[k]))),nearEnd));
    out.push(moved);
    // Next ball: on this limb's centre line, one gap past its far end, as thick as the joint's ends.
    const M=lineOf(moved),r=ends[k+1](moved,M,pieces[k+1]);
    ballCentre=add3(M.centre,scale3(dir,M.end+offset(r,names[k+1])));radius=r;out.push(ballPart(names[k+1],'left',r,ballCentre));
   }else{
    // The hand or foot: its joint point (wrist or ankle) moved onto the limb's centre line through the ball, then along
    // that line until its nearest point is one gap past the ball.
    const dir=lineOf(pieces[k-1]).dir,off=sub3(piece.pivot,ballCentre),along=dot3(off,dir),onLine=moveBy(piece,neg(sub3(off,scale3(dir,along))));
    const back=reach(onLine.positions,ballCentre,neg(dir));out.push(moveBy(onLine,scale3(dir,back+offset(radius,names[k]))));
   }
  }
  return out;
 }
 const thinner=(a,b)=>Math.min(a,b);
 // Arm: shoulder ball as thick as the upper arm's top, pushed straight out until 2 cm clear of the torso.
 const upper=get('upper-arm'),fore=get('forearm'),hand=get('hand');
 // Pressed: from clear of the torso, back in until the ball sinks exactly HIP_TORSO_PRESS of its radius past its surface.
 const intoTorso=(c,r,dir)=>press?sinkIntoTorso(torsoShape,c,r,dir,HIP_TORSO_PRESS*r):c;
 // Put together, the shoulder ball's centre sits as far from the body's middle as Our avatar's (owner: "more inward
 // towards the torso so it doesn't look like it has wide shoulders"); apart, it keeps the 2 cm clear rule.
 const shoulderIn=c=>press?[ourAvatar.shoulderBallX,c[1],c[2]]:c;
 // Ball sizes come from the joined avatar (sized from the limbs before they were slimmed), so slimming keeps them.
 const B=whole.ballR;
 const rS=B.shoulder,S=shoulderIn(clearOfTorso(torsoShape,[...SHOULDER],rS,[1,0,0],SHOULDER_TORSO_GAP));
 const arm=chain({centre:S,radius:rS},[upper,fore,hand],[null,()=>B.elbow,()=>B.wrist],['ball-shoulder','ball-elbow','ball-wrist']);
 // Leg: hip ball as thick as the thigh's top, pushed straight down until 2 cm clear of the torso.
 const thigh=get('thigh'),calf=get('calf'),foot=get('foot');
 // Hip balls close together (owner: "so it doesn't look like it has really wide hips", then "closer together"): HIP_BALL_GAP between their inner edges.
 const rH=B.hip,hipStart=[HIP_BALL_GAP/2+rH,HIP[1],HIP[2]],H=intoTorso(clearOfTorso(torsoShape,hipStart,rH,[0,-1,0],SHOULDER_TORSO_GAP),rH,[0,-1,0]);
 const leg=chain({centre:H,radius:rH},[thigh,calf,foot],[null,()=>B.knee,()=>B.ankle],['ball-hip','ball-knee','ball-ankle']);
 // The feet would meet in the middle: each whole leg moves straight outward just enough to leave the usual gap between them.
 const footNow=leg.at(-1);let inner=Infinity;for(let i=0;i<footNow.positions.length;i+=3)inner=Math.min(inner,footNow.positions[i]);
 const legOut=Math.max(0,BALL_GAP/2-inner);for(let k=0;k<leg.length;k++)leg[k]=moveBy(leg[k],[legOut,0,0]);
 // Put together, the torso gets real hip sockets (owner, 22 November 2026: "have that mould of the ball for the
 // socket", with soft edges), made like the shoulder sockets: the ball's shape plus the usual 6 mm gap, soft
 // edges, and a layer of clay kept over the ball where the torso faces away from it. The thigh keeps its own
 // rounded top around the ball (owner: no cup shape; "keep the edge of the socket soft").
 let hipSocket=null;
 if(press){
  const Hc=leg[0].centre,R=rH+SOCKET_GAP,soft=softEdge(rH),strip=m=>({positions:m.positions,index:m.index});
  // The full soft edge (mouldSockets narrows it only in the strip between the two balls), a clay layer
  // HIP_SOCKET_SKIN thick folded over the ball, and the rims rounded out.
  const torso=mouldSockets({positions:parts[0].positions,index:parts[0].index},[Hc,[-Hc[0],Hc[1],Hc[2]]],R,soft,HIP_SOCKET_SKIN*rH,HIP_RIM_ROUNDS);
  parts[0]={...parts[0],positions:torso.positions,index:torso.index,normals:torso.normals};
  hipSocket={centre:Hc,radius:rH,R,soft};
 }
 // Neck: the approved neck ball's size, straight up until 2 cm clear of the torso's top; the head one gap above it.
 const neckOption=buildHeadSet(CHOSEN_NECK,torsoShape),rN=BALL_SIZE.neck*neckOption.ball.radius,N=press?[0,neckOption.ball.y,0]:clearOfTorso(torsoShape,[0,neckOption.ball.y,0],rN,[0,1,0],SHOULDER_TORSO_GAP);
 const head=get('head','centre'),headLow=-reach(head.positions,N,[0,-1,0]),headUp=offset(rN,'ball-neck')-headLow;
 parts.push(ballPart('ball-neck','centre',rN,N),moveBy(head,[0,headUp,0]));
 for(const p of [...arm,...leg]){parts.push(p);parts.push({...mirrored(p),name:p.name,side:'right',...(p.centre?{centre:[-p.centre[0],p.centre[1],p.centre[2]]}:{})});}
 for(const p of parts)if(p.radius&&p.name.startsWith('ball-')&&p.side!=='right')balls[p.name]=p;
 let lo=Infinity,hi=-Infinity;for(const p of parts)for(let i=1;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}
 return {body:bodyId,parts,balls,face:whole.face,height:hi-lo,whole,legOut,hipSocket};
}
