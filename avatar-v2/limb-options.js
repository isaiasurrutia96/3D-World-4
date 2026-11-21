// New avatar (version 2): upper arm and forearm options, tic-tac shaped.
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
// Each set is an upper arm, the elbow ball (300 triangles, the chosen count)
// and a forearm, hanging straight, separate, with a small gap either side of
// the ball. The ball is sized from the limbs (owner, 21 November 2026): as
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

const TAU=Math.PI*2,distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
/** Space between each limb's rounded end and the ball (metres). */
export const BALL_GAP=.006;
/** The ball's radius as a share of the thinner limb end's radius. */
export const BALL_TO_LIMB=.92;
/** Joint centre to joint centre, from the skeleton (metres). */
export const UPPER_ARM_SPAN=distance(SHOULDER,ELBOW),FOREARM_SPAN=distance(ELBOW,WRIST);
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
 * Sizes for one option: the elbow ball's radius (92% of the thinner of the
 * upper arm's bottom end and the forearm's top end) and each limb's length,
 * tip to tip, so the ball and its gaps fit exactly between the joint centres.
 */
export function armSizes(option){
 const ball=BALL_TO_LIMB*Math.min(thinnestAt(option.upper,1),thinnestAt(option.fore,0));
 return {ball,upper:UPPER_ARM_SPAN-ball-BALL_GAP,fore:FOREARM_SPAN-ball-BALL_GAP};
}

/**
 * One option's full set: upper arm, elbow ball and forearm, with where each
 * sits (the upper arm's top tip at y = 0, everything below it).
 */
export function buildArmSet(option){
 const size=armSizes(option),upper=buildLimbShape(option.upper,size.upper),fore=buildLimbShape(option.fore,size.fore);
 const ballY=-(size.upper+BALL_GAP+size.ball),foreY=ballY-size.ball-BALL_GAP;
 return {size,upper:{...upper,y:0},ball:{...buildBall({radius:size.ball,triangles:CHOSEN_BALL_TRIANGLES}),y:ballY,radius:size.ball},fore:{...fore,y:foreY}};
}

/** Chosen by the owner (21 November 2026): option 2, Athletic. */
export const CHOSEN_ARM=ARM_OPTIONS.find(o=>o.id==='athletic');
