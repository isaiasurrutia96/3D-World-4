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
import ourAvatar from './our-avatar-sizes.json' with {type:'json'};
import {makeTorsoOption} from './torso-variants.js';
import {buildTorsoSurface,buildRingSurface,direction} from './torso-shape.js';
import {rayHit} from './body-sockets.js';
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
 return {...p,positions,index,...(p.pivot?{pivot:mirrorPoint(p.pivot)}:{})};
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
export function limbLine(positions){
 const n=positions.length/3,c=[0,0,0];for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++)c[k]+=positions[i+k]/n;
 const C=[[0,0,0],[0,0,0],[0,0,0]];for(let i=0;i<positions.length;i+=3){const d=[0,1,2].map(k=>positions[i+k]-c[k]);for(let r=0;r<3;r++)for(let q=0;q<3;q++)C[r][q]+=d[r]*d[q];}
 // Power iteration finds the strongest direction of spread.
 let v=[0,-1,0];for(let it=0;it<100;it++){const w=[0,1,2].map(r=>C[r][0]*v[0]+C[r][1]*v[1]+C[r][2]*v[2]),l=Math.hypot(...w);v=w.map(x=>x/l);}
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
 const targetLength=n=>{const [a,b]=between[n];return ourAvatar.jointToJoint[n]-(1-pressAt(a))*ballR[a]-(1-pressAt(b))*ballR[b];};
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
 // The thigh's top a little wider (owner, 22 November 2026): THIGH_TOP_WIDER at its top end, fading
 // smoothly to the slim width by the thigh's middle.
 const shaped=(name,pos)=>name==='thigh'?widenTop(pos,THIGH_TOP_WIDER):pos;
 for(const side of ['left','right'])for(const name of ['upper-arm','forearm','thigh','calf']){
  const pos=built[side+':'+name],positions=shaped(name,SLIM_LIMBS.includes(name)?thickenTo(pos,slimTo(name)):pos);
  parts.push({name,side,positions,index:raw(side,name).index});}
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
 * limbs, hands, feet and head it joins, and TORSO_PRESS into the torso (owner: "some of the balls can be deeper": 90% and 40%, was 80% and 25%); the
 * neck ball sits where it was approved, half in the torso. No sockets are carved: where a piece overlaps a ball
 * the ball is simply hidden inside it, which is how it will look once the sockets are made.
 */
/**
 * Slimmer forearms, thighs and calves: this many times the bigger of their two balls across (Claude's pick for
 * "slightly bigger"); the calf a hair more (owner: "just slightly slightly bigger ... barely noticeable": 3% more).
 */
export const SLIM_OVER_BALL=1.1,SLIM_LIMBS=['forearm','thigh','calf'],SLIM_OVER={forearm:SLIM_OVER_BALL,thigh:SLIM_OVER_BALL,calf:SLIM_OVER_BALL+.03};
export const PREVIEW_PRESS=.9,TORSO_PRESS=.4;
/**
 * The hip balls pressed slightly deeper (owner, 22 November 2026): into the thigh, HIP_EXTRA_PRESS more of the
 * ball's radius than the other joints (90% to 100%: the thigh's top reaches the ball's centre); into the torso,
 * truly TORSO_PRESS of the radius (40%), measured on the torso's surface. (Before, the hip ball's move assumed it
 * started 2 cm clear, but it started about 6.5 cm clear, so it only reached the surface.)
 */
export const HIP_EXTRA_PRESS=.1;
/** How far (share of its radius) a joint's ball sinks into the limbs it joins, once pressed together. */
export const pressAt=(joint,press=PREVIEW_PRESS)=>press+(joint==='hip'?HIP_EXTRA_PRESS:0);
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

export function separatedOriginalBody(bodyId='boy',{press=0}={}){
 // How far a piece's near end sits from its ball's centre: one gap past the ball when apart; inside it when pressed.
 // Per ball: the hip ball sinks a little deeper (pressAt).
 const offset=(r,ball)=>press?r*(1-pressAt(ball.replace('ball-',''),press)):r+BALL_GAP;
 const whole=originalLimbBody(bodyId),get=(n,s='left')=>whole.parts.find(p=>p.name===n&&p.side===s),torsoShape=whole.torsoShape;
 const parts=[get('torso','centre')],balls={};
 const lineOf=p=>limbLine(p.positions);
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
 // Pressed: from clear of the torso, back in until the ball sinks exactly TORSO_PRESS of its radius past its surface.
 const intoTorso=(c,r,dir)=>press?sinkIntoTorso(torsoShape,c,r,dir,TORSO_PRESS*r):c;
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
 // Neck: the approved neck ball's size, straight up until 2 cm clear of the torso's top; the head one gap above it.
 const neckOption=buildHeadSet(CHOSEN_NECK,torsoShape),rN=BALL_SIZE.neck*neckOption.ball.radius,N=press?[0,neckOption.ball.y,0]:clearOfTorso(torsoShape,[0,neckOption.ball.y,0],rN,[0,1,0],SHOULDER_TORSO_GAP);
 const head=get('head','centre'),headLow=-reach(head.positions,N,[0,-1,0]),headUp=offset(rN,'ball-neck')-headLow;
 parts.push(ballPart('ball-neck','centre',rN,N),moveBy(head,[0,headUp,0]));
 for(const p of [...arm,...leg]){parts.push(p);parts.push({...mirrored(p),name:p.name,side:'right',...(p.centre?{centre:[-p.centre[0],p.centre[1],p.centre[2]]}:{})});}
 for(const p of parts)if(p.radius&&p.name.startsWith('ball-')&&p.side!=='right')balls[p.name]=p;
 let lo=Infinity,hi=-Infinity;for(const p of parts)for(let i=1;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}
 return {body:bodyId,parts,balls,face:whole.face,height:hi-lo,whole,legOut};
}
