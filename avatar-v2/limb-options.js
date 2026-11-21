// New avatar (version 2): limb options (arms and legs), tic-tac shaped, and
// the girl's slightly slimmer versions.
//
// Every limb is a capsule (a cylinder rounded at both ends) described by
// numbers, drawn with the same ring builder as the torso (buildRingSurface):
//  - profile: radius along the limb, [[t, radius], ...], t = 0 at its top end
//    and 1 at its bottom end (smooth between points);
//  - side / front: the cross-section, as multipliers side to side and front to
//    back (1 and 1 = round; side below 1 = flattened like a real Tic Tac);
//  - bumps: muscles, the same tool as the torso's (h = t along the limb,
//    angle: 0 = outer side, 90 = front, 180 = inner side, 270 = back).
// Both ends are rounded (the end caps are as long as the end radius, so they
// are half-spheres for a round limb).
//
// Every set is a limb PAIR between three joint centres from the skeleton: an
// upper limb, a middle ball (300 triangles, the chosen count) and a lower limb,
// hanging straight, separate, with a small gap either side of the ball. Arms:
// upper arm, elbow, forearm. Legs: thigh, knee, calf. One builder does both. The ball is sized from the limbs (owner, 21 November 2026): as
// thick as they are, but slightly smaller, 92% of the thinner limb end in its
// thinnest direction. Joint centres stay where the skeleton has them, so a
// smaller ball leaves the limbs longer: the upper arm runs from the shoulder
// joint's centre to the ball, the forearm from the ball to the wrist joint's
// centre. (If the shoulder and wrist balls later also sit separately, the
// limbs get shorter; that is part of the joints discussion.)
import {buildRingSurface} from './torso-shape.js';
import {curveAt,bumpAt,expandBumps} from './torso-variants.js';
import {buildBall,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {SHOULDER,ELBOW,WRIST} from './arm.js';
import {SIDE} from '../motion-core/skeleton/bones.js';

const TAU=Math.PI*2,distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
/** Space between each limb's rounded end and the ball (metres). */
export const BALL_GAP=.006;
/** The ball's radius as a share of the thinner limb end's radius. */
export const BALL_TO_LIMB=.92;
/** Joint centre to joint centre, from the skeleton (metres). */
export const UPPER_ARM_SPAN=distance(SHOULDER,ELBOW),FOREARM_SPAN=distance(ELBOW,WRIST);
const bone=name=>SIDE.find(b=>b.name===name).head;
export const HIP=bone('thigh'),KNEE=bone('shin'),ANKLE=bone('foot');
export const THIGH_SPAN=distance(HIP,KNEE),CALF_SPAN=distance(KNEE,ANKLE);
/** The two kinds of limb pair: which option keys hold the limbs, and their spans. */
export const ARM_PAIR={keys:['upper','fore'],spans:[UPPER_ARM_SPAN,FOREARM_SPAN],ball:'ball-elbow'};
export const LEG_PAIR={keys:['thigh','calf'],spans:[THIGH_SPAN,CALF_SPAN],ball:'ball-knee'};
/** The girl's limbs are the boy's, slightly slimmer: 92% of the thickness (owner: "not by a lot"). */
export const GIRL_LIMB_SHARE=.92;
/** How finely every limb is built: 504 triangles each. Most of a short limb is
 *  its rounded ends, so the rings go there (4 per end) rather than the middle. */
export const LIMB_DETAIL={segments:18,rings:6,capRings:4};

const ROUND={side:1,front:1};
export const ARM_OPTIONS=[
 {id:'capsule',label:'1 · Capsule',note:'Plain capsules: straight, round and even, rounded at both ends.',
  upper:{...ROUND,profile:[[0,.07],[1,.07]]},
  fore:{...ROUND,profile:[[0,.065],[1,.065]]}},
 {id:'athletic',label:'2 · Athletic',note:'A capsule with a soft biceps and triceps; the forearm is fuller near the elbow and slims toward the wrist.',
  upper:{...ROUND,profile:[[0,.066],[.4,.072],[1,.064]],bumps:[{h:.55,hSpread:.2,angle:90,aSpread:42,amount:.01},{h:.42,hSpread:.22,angle:270,aSpread:48,amount:.008}]},
  fore:{...ROUND,profile:[[0,.068],[.28,.071],[1,.054]],bumps:[{h:.3,hSpread:.22,angle:55,aSpread:45,amount:.006}]}},
 {id:'strong',label:'3 · Strong',note:'Thicker and more muscular: a bigger biceps, triceps and forearm.',
  upper:{...ROUND,profile:[[0,.072],[.4,.079],[1,.07]],bumps:[{h:.55,hSpread:.2,angle:90,aSpread:42,amount:.009},{h:.42,hSpread:.22,angle:270,aSpread:48,amount:.008}]},
  fore:{...ROUND,profile:[[0,.074],[.28,.078],[1,.06]],bumps:[{h:.3,hSpread:.22,angle:55,aSpread:45,amount:.008}]}},
 {id:'defined',label:'4 · Defined',note:'Athletic with sharper muscles and a flatter, Tic Tac-like cross-section.',
  upper:{side:.86,front:1.04,profile:[[0,.066],[.4,.071],[1,.063]],bumps:[{h:.55,hSpread:.15,angle:90,aSpread:32,amount:.013},{h:.4,hSpread:.17,angle:270,aSpread:38,amount:.011}]},
  fore:{side:.88,front:1.02,profile:[[0,.068],[.28,.072],[1,.053]],bumps:[{h:.28,hSpread:.16,angle:55,aSpread:34,amount:.009}]}},
 {id:'slim',label:'5 · Slim',note:'A slimmer athletic arm, closest to a wooden mannequin, with light muscle shape.',
  upper:{...ROUND,profile:[[0,.058],[.45,.063],[1,.055]],bumps:[{h:.55,hSpread:.2,angle:90,aSpread:42,amount:.007},{h:.42,hSpread:.22,angle:270,aSpread:48,amount:.005}]},
  fore:{...ROUND,profile:[[0,.059],[.28,.061],[1,.047]],bumps:[{h:.3,hSpread:.22,angle:55,aSpread:45,amount:.004}]}},
];

/** Radius of a limb at share t of its length (0 = top) in direction a (radians). */
export function limbRadius(limb,t,a){
 const across=1/Math.hypot(Math.cos(a)/limb.side,Math.sin(a)/limb.front);// ellipse cross-section
 return curveAt(limb.profile,t)*across+bumpAt(expandBumps(limb.bumps),t,a);
}

/**
 * One limb as a ring shape: hanging straight down from its top tip (y = 0) to
 * its bottom tip (y = -length), rounded at both ends. Returns the shape (for
 * checks) and its surface {positions, index}.
 */
export function buildLimbShape(limb,length,detail=LIMB_DETAIL){
 const {segments:n,rings:count,capRings}=detail,top=curveAt(limb.profile,0),bottom=curveAt(limb.profile,1);
 if(!(length>top+bottom))throw Error('limb too short for its rounded ends');
 const y0=-length+bottom,y1=-top;// the straight part, between the two rounded ends
 const rings=Array.from({length:count},(_,k)=>{
  const y=y0+(y1-y0)*k/(count-1),t=-y/length;
  return {y:+y.toFixed(6),r:Array.from({length:n},(_,s)=>+limbRadius(limb,t,s/n*TAU).toFixed(6))};
 });
 const shape={center:[0,0],segments:n,capRings,bottom:{y:-length},top:{y:0},rings};
 return {shape,...buildRingSurface(shape)};
}

/** The thinnest a limb is at share t of its length, over every direction. */
export function thinnestAt(limb,t){let r=Infinity;for(let s=0;s<360;s++)r=Math.min(r,limbRadius(limb,t,s/360*TAU));return r;}

/**
 * Sizes for one pair: the middle ball's radius (92% of the thinner of the upper
 * limb's bottom end and the lower limb's top end) and each limb's length, tip
 * to tip, so the ball and its gaps fit exactly between the joint centres.
 */
export function pairSizes(option,pair){
 const [upperKey,lowerKey]=pair.keys,[upperSpan,lowerSpan]=pair.spans;
 const ball=BALL_TO_LIMB*Math.min(thinnestAt(option[upperKey],1),thinnestAt(option[lowerKey],0));
 return {ball,[upperKey]:upperSpan-ball-BALL_GAP,[lowerKey]:lowerSpan-ball-BALL_GAP};
}

/**
 * One option's full set: upper limb, middle ball and lower limb, with where each
 * sits (the upper limb's top tip at y = 0, everything below it). The result is
 * keyed by the pair's names (arms: upper, ball, fore; legs: thigh, ball, calf).
 */
export function buildPair(option,pair){
 const [upperKey,lowerKey]=pair.keys,size=pairSizes(option,pair);
 const upper=buildLimbShape(option[upperKey],size[upperKey]),lower=buildLimbShape(option[lowerKey],size[lowerKey]);
 const ballY=-(size[upperKey]+BALL_GAP+size.ball),lowerY=ballY-size.ball-BALL_GAP;
 return {size,[upperKey]:{...upper,y:0},ball:{...buildBall({radius:size.ball,triangles:CHOSEN_BALL_TRIANGLES}),y:ballY,radius:size.ball},[lowerKey]:{...lower,y:lowerY}};
}
/** Arms, kept under their earlier names. */
export const armSizes=option=>pairSizes(option,ARM_PAIR);
export const buildArmSet=option=>buildPair(option,ARM_PAIR);
/** Legs. */
export const legSizes=option=>pairSizes(option,LEG_PAIR);
export const buildLegSet=option=>buildPair(option,LEG_PAIR);

/** A limb made thinner by `share` (0..1): same shape and length, every radius and muscle scaled. */
export function slimmerLimb(limb,share){
 if(!(share>0&&share<=1))throw Error('share must be between 0 and 1');
 return {...limb,profile:limb.profile.map(([t,r])=>[t,r*share]),...(limb.bumps?{bumps:limb.bumps.map(b=>({...b,amount:b.amount*share}))}:{})};
}
/** The girl's version of a limb option: both limbs slimmer by GIRL_LIMB_SHARE. */
export function girlVersion(option,pair,share=GIRL_LIMB_SHARE){
 const [a,b]=pair.keys;
 return {...option,id:option.id+'-girl',label:option.label.replace(/^\d+ · /,'')+' (girl)',note:`The ${option.label.replace(/^\d+ · /,'')} limbs made ${Math.round((1-share)*100)}% slimmer for the girl: same shape, same joint positions (her smaller ball leaves the limbs a few millimetres longer).`,
  [a]:slimmerLimb(option[a],share),[b]:slimmerLimb(option[b],share)};
}

/** Chosen by the owner (21 November 2026): option 2, Athletic. */
export const CHOSEN_ARM=ARM_OPTIONS.find(o=>o.id==='athletic');
export const GIRL_ARM=girlVersion(CHOSEN_ARM,ARM_PAIR);

/**
 * Leg options (thigh and calf), 21 November 2026. Same five ideas as the arms.
 * Muscles: the thigh has its front (quadriceps) and back (hamstring) muscles
 * and a slight outer sweep; the calf muscle sits high at the back, and the calf
 * slims toward the ankle.
 */
export const LEG_OPTIONS=[
 {id:'leg-capsule',label:'1 · Capsule',note:'Plain capsules: straight, round and even, rounded at both ends.',
  thigh:{...ROUND,profile:[[0,.08],[1,.08]]},
  calf:{...ROUND,profile:[[0,.068],[1,.068]]}},
 {id:'leg-athletic',label:'2 · Athletic',note:'Soft front and back thigh muscles; a calf muscle high at the back, slimming to the ankle.',
  thigh:{...ROUND,profile:[[0,.084],[.35,.088],[1,.068]],bumps:[{h:.45,hSpread:.22,angle:90,aSpread:45,amount:.01},{h:.4,hSpread:.22,angle:270,aSpread:48,amount:.008},{h:.35,hSpread:.2,angle:20,aSpread:35,amount:.005}]},
  calf:{...ROUND,profile:[[0,.068],[.3,.073],[1,.05]],bumps:[{h:.28,hSpread:.16,angle:270,aSpread:40,amount:.012}]}},
 {id:'leg-strong',label:'3 · Strong',note:'Thicker and more muscular thighs and calves.',
  thigh:{...ROUND,profile:[[0,.093],[.35,.098],[1,.076]],bumps:[{h:.45,hSpread:.22,angle:90,aSpread:45,amount:.013},{h:.4,hSpread:.22,angle:270,aSpread:48,amount:.011},{h:.35,hSpread:.2,angle:20,aSpread:35,amount:.007}]},
  calf:{...ROUND,profile:[[0,.077],[.3,.083],[1,.058]],bumps:[{h:.28,hSpread:.16,angle:270,aSpread:40,amount:.016}]}},
 {id:'leg-defined',label:'4 · Defined',note:'Sharper muscles and a slightly flattened cross-section.',
  thigh:{side:.88,front:1.04,profile:[[0,.084],[.35,.087],[1,.067]],bumps:[{h:.45,hSpread:.15,angle:90,aSpread:32,amount:.013},{h:.4,hSpread:.16,angle:270,aSpread:36,amount:.011},{h:.35,hSpread:.15,angle:20,aSpread:28,amount:.006}]},
  calf:{side:.9,front:1.02,profile:[[0,.068],[.3,.072],[1,.05]],bumps:[{h:.27,hSpread:.12,angle:270,aSpread:32,amount:.015}]}},
 {id:'leg-slim',label:'5 · Slim',note:'Lean, closest to a wooden mannequin, with light muscle shape.',
  thigh:{...ROUND,profile:[[0,.072],[.4,.074],[1,.06]],bumps:[{h:.45,hSpread:.22,angle:90,aSpread:45,amount:.006},{h:.4,hSpread:.22,angle:270,aSpread:48,amount:.005}]},
  calf:{...ROUND,profile:[[0,.06],[.3,.064],[1,.045]],bumps:[{h:.28,hSpread:.16,angle:270,aSpread:40,amount:.007}]}},
];
