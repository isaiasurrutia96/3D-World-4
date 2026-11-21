// New avatar (version 2): torso shape options to choose from.
//
// Each option starts from the clean one-piece torso (torso.json) and changes it
// with a few numbers, so every option keeps the same height, the same smooth
// one-piece surface and the same left/right symmetry. An option can set:
//  - width / front / back: how wide (side to side) and how deep (chest and
//    back) it is, as multipliers at points up the body (0 = bottom, 1 = top);
//  - round: 0..1, how far each ring is evened out toward a circle;
//  - square: 0..1, how far each ring is pushed toward a rounded square;
//  - bumps: smooth rounded raises, each placed by height share (h) and
//    direction (angle: 0 = his left, 90 = front, 180 = his right, 270 = back),
//    with a size up/down (hSpread) and around (aSpread, degrees), and how far
//    it stands out (amount, metres). mirror: true adds the same bump on the
//    other side. A full chest is one wide bump; pecs are a mirrored pair;
//  - detail: {segments, rings, capRings} rebuilds the shape with fewer (or
//    more) directions and rings, which sets the triangle count;
//  - shoulderRoll: {from, neck}: from height share `from` up, each ring curves
//    in smoothly (a quarter circle) toward a neck radius `neck` (metres) at the
//    top, so the shoulders slope down from the neck instead of ending in a
//    flat lid with a sharp edge;
//  - basedOn: the id of another option in the same list; every setting not
//    given here is taken from that option (so light versions repeat nothing).
// The options are built in code when the page loads; nothing is stored twice.

const SAME=[[0,1],[1,1]];
// Round 1's Athletic is widest at the very top, so the top is a wide flat lid
// with a sharp edge: the "pointed" upper chest. ROLLED keeps the V shape but
// rolls the shoulders down toward the neck (and drops the forward chest push).
const ROLLED={front:[[0,.92],[.5,.94],[1,.97]],shoulderRoll:{from:.74,neck:.11}};
const ATHLETIC={width:[[0,.9],[.35,.86],[.72,1.08],[1,1.12]],front:[[0,.92],[.5,.94],[.8,1.04],[1,1]],back:[[0,.92],[1,.96]],round:0,square:.15};

/** Round 1 (20-21 November 2026): five different body types. The owner liked Athletic. */
export const FIRST_OPTIONS=[
 {id:'original',label:'1 · Original',note:'The clean torso as it is now.',width:SAME,front:SAME,back:SAME,round:0,square:0},
 {id:'athletic',label:'2 · Athletic',note:'Broad shoulders and chest, narrower waist and hips (a V shape).',...ATHLETIC},
 {id:'round',label:'3 · Round',note:'A rounder, fuller toy-like body with a soft belly.',
  width:[[0,1],[.45,1.04],[1,.97]],front:[[0,1.04],[.4,1.14],[.75,1.04],[1,1]],back:[[0,1],[.5,1.04],[1,1]],round:.45,square:0},
 {id:'lean',label:'4 · Lean',note:'Slimmer and flatter, side to side and front to back.',
  width:[[0,.84],[.5,.84],[1,.9]],front:[[0,.84],[1,.86]],back:[[0,.84],[1,.86]],round:0,square:0},
 {id:'blocky',label:'5 · Blocky',note:'Squarer and sturdier, with wide, solid shoulders.',
  width:[[0,1],[.5,1.02],[1,1.1]],front:[[0,.96],[1,.98]],back:[[0,.96],[1,.98]],round:0,square:.6},
];

/**
 * Round 2 (21 November 2026): five athletic torsos. The owner liked Athletic
 * but noticed its upper chest comes to a point; these keep the athletic look
 * with a fuller, unpointed chest, one with soft pecs, and two lighter versions.
 */
export const ATHLETIC_OPTIONS=[
 {id:'athletic',label:'1 · Athletic',note:'Round 1\'s Athletic, unchanged, for comparison.',...ATHLETIC},
 {id:'athletic-full',label:'2 · Full chest',note:'Athletic with a broad, full chest that rolls over into rounded shoulders, instead of a sharp upper edge.',
  ...ATHLETIC,...ROLLED,bumps:[{h:.72,hSpread:.17,angle:90,aSpread:52,amount:.018}]},
 {id:'athletic-pecs',label:'3 · Pecs',note:'Like option 2, with two soft chest muscles (pecs).',
  ...ATHLETIC,...ROLLED,bumps:[{h:.74,hSpread:.09,angle:63,aSpread:19,amount:.027,mirror:true},{h:.74,hSpread:.1,angle:90,aSpread:24,amount:.01}]},
 {id:'athletic-light',label:'4 · Full chest, light',note:'Option 2 with about a third of the triangles.',
  basedOn:'athletic-full',detail:{segments:28,rings:20,capRings:4}},
 {id:'athletic-lightest',label:'5 · Full chest, lightest',note:'Option 2 with about a ninth of the triangles: you can see flat facets.',
  basedOn:'athletic-full',detail:{segments:16,rings:12,capRings:3}},
];

/**
 * Chosen (21 November 2026): Athletic at the light detail is the torso going
 * forward. The owner compared it with the full and lightest versions; the
 * light one keeps the look at about a third of the triangles.
 */
export const CHOSEN_TORSO={id:'athletic-light',label:'Athletic (light)',note:'The chosen torso: Athletic at the light detail (about a third of the triangles).',
 ...ATHLETIC,detail:{segments:28,rings:20,capRings:4}};

/** The torsos shown on the page now. */
export const TORSO_OPTIONS=[CHOSEN_TORSO];

/**
 * Female torso options (21 November 2026), for the girl avatar. Same base
 * torso and tools as the boy's; the main differences are narrower shoulders
 * compared with the hips, a defined waist, fuller hips, softer sloping
 * shoulders and a modest, stylized chest (kept simple, to suit a toy-like
 * ragdoll). All at the light detail, like the chosen boy's torso.
 */
const LIGHT={segments:28,rings:20,capRings:4};
const BUST=(amount,h=.72)=>[{h,hSpread:.085,angle:64,aSpread:21,amount,mirror:true}];
export const FEMALE_OPTIONS=[
 {id:'female-athletic',label:'F1 · Athletic',note:'Fit and sporty: shoulders a little narrower, a defined waist, slightly fuller hips.',
  width:[[0,.98],[.2,1.02],[.48,.84],[.75,.94],[1,.9]],front:[[0,.92],[1,.94]],back:[[0,.95],[1,.92]],round:0,square:.1,
  bumps:BUST(.016),shoulderRoll:{from:.8,neck:.1},detail:LIGHT},
 {id:'female-hourglass',label:'F2 · Hourglass',note:'A narrow waist with hips about as wide as the shoulders.',
  width:[[0,1.02],[.2,1.12],[.5,.75],[.78,.98],[1,.9]],front:[[0,.93],[1,.95]],back:[[0,.98],[1,.92]],round:0,square:.05,
  bumps:BUST(.024),shoulderRoll:{from:.8,neck:.1},detail:LIGHT},
 {id:'female-slim',label:'F3 · Slim',note:'Slender and light, with a gentle waist and a small chest.',
  width:[[0,.9],[.25,.92],[.5,.8],[.8,.86],[1,.84]],front:[[0,.86],[1,.87]],back:[[0,.86],[1,.86]],round:0,square:0,
  bumps:BUST(.011),shoulderRoll:{from:.82,neck:.09},detail:LIGHT},
 {id:'female-strong',label:'F4 · Strong',note:'Sturdy and powerful: broader overall, fuller hips and chest.',
  width:[[0,1.02],[.22,1.08],[.5,.9],[.78,1],[1,.95]],front:[[0,.96],[.5,.94],[1,.96]],back:[[0,.97],[1,.95]],round:0,square:.15,
  bumps:BUST(.02),shoulderRoll:{from:.8,neck:.11},detail:LIGHT},
 {id:'female-toy',label:'F5 · Toy',note:'Rounder and simpler, like a toy figure, with only a hint of a chest.',
  width:[[0,.96],[.25,1],[.5,.88],[.8,.9],[1,.86]],front:[[0,.94],[1,.94]],back:[[0,.94],[1,.94]],round:.35,square:0,
  bumps:BUST(.008),shoulderRoll:{from:.78,neck:.1},detail:LIGHT},
];

const TAU=Math.PI*2,RAD=Math.PI/180;
const smooth=t=>t*t*(3-2*t);
/** Value of a curve [[h, value], ...] at height share h (smooth between points). */
export function curveAt(curve,h){
 if(h<=curve[0][0])return curve[0][1];if(h>=curve.at(-1)[0])return curve.at(-1)[1];
 let i=0;while(h>curve[i+1][0])i++;
 const [h0,v0]=curve[i],[h1,v1]=curve[i+1];return v0+(v1-v0)*smooth((h-h0)/(h1-h0));
}
/** Radius of ring r (one value per direction) at any angle a (linear between directions). */
export function ringAt(r,a){
 const n=r.length,f=((a/TAU)*n%n+n)%n,i=Math.floor(f),t=f-i;
 return r[i]*(1-t)+r[(i+1)%n]*t;
}
/** Radius of a rounded square (superellipse, exponent 4) relative to a circle, at angle a. */
const squareFactor=a=>Math.pow(Math.abs(Math.cos(a))**4+Math.abs(Math.sin(a))**4,-1/4);
/** Smallest difference between two angles, in radians (0..π). */
const angleGap=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

/** All bumps of an option, with mirrored ones written out. */
export function expandBumps(bumps=[]){
 return bumps.flatMap(b=>b.mirror?[{...b,mirror:false},{...b,mirror:false,angle:180-b.angle}]:[b]);
}
/** How far the bumps raise the surface at height share h, direction a (radians). */
export function bumpAt(bumps,h,a){
 let sum=0;
 for(const b of bumps){const dh=(h-b.h)/b.hSpread,da=angleGap(a,b.angle*RAD)/(b.aSpread*RAD);sum+=b.amount*Math.exp(-(dh*dh+da*da));}
 return sum;
}

/** An option with everything it takes from its basedOn option filled in. */
export function resolveOption(option,list=TORSO_OPTIONS,seen=new Set()){
 if(!option.basedOn)return option;
 if(seen.has(option.id))throw Error('basedOn loops back to '+option.id);seen.add(option.id);
 const base=list.find(o=>o.id===option.basedOn);if(!base)throw Error(option.id+' is based on a missing option: '+option.basedOn);
 const {basedOn,...own}=option;return {...resolveOption(base,list,seen),...own};
}

/**
 * Rebuilds a shape with a different number of directions (segments, even, so
 * left and right still mirror) and rings, by reading the original surface at
 * the new places. The end heights and caps stay where they were.
 */
export function resampleShape(shape,{segments,rings,capRings}){
 if(!(segments>=8&&segments%2===0))throw Error('segments must be an even number, 8 or more');
 if(!(rings>=2))throw Error('rings must be 2 or more');
 const src=shape.rings,y0=src[0].y,y1=src.at(-1).y;
 const out=Array.from({length:rings},(_,k)=>{
  const y=y0+(y1-y0)*k/(rings-1);let i=0;while(i<src.length-2&&src[i+1].y<y)i++;
  const t=Math.min(1,Math.max(0,(y-src[i].y)/(src[i+1].y-src[i].y)));
  const r=Array.from({length:segments},(_,s)=>{const a=s/segments*TAU;return +(ringAt(src[i].r,a)*(1-t)+ringAt(src[i+1].r,a)*t).toFixed(5);});
  return {y:+y.toFixed(5),r};
 });
 return {...shape,segments,rings:out,capRings:capRings??shape.capRings};
}

/**
 * Makes one option's shape from the base shape. Each ring is: evened toward a
 * circle (round), pushed toward a rounded square (square), stretched side to
 * side (width) and front/back (front, back) for its height, then raised by the
 * bumps. The stretch is done exactly: for each final direction b we find the
 * original direction a that lands on it. Finally the detail setting, if any,
 * rebuilds it at the chosen number of directions and rings.
 */
export function makeTorsoOption(base,option,list=TORSO_OPTIONS){
 const o=resolveOption(option,list),{bottom,top,segments:n}=base,height=top.y-bottom.y;
 const width=o.width??SAME,front=o.front??SAME,back=o.back??SAME,round=o.round??0,square=o.square??0,bumps=expandBumps(o.bumps);
 const rings=base.rings.map(ring=>{
  const h=(ring.y-bottom.y)/height,W=curveAt(width,h),F=curveAt(front,h),B=curveAt(back,h);
  const mean=ring.r.reduce((s,v)=>s+v,0)/n;
  const shaped=ring.r.map((r,s)=>{const a=s/n*TAU,rounded=r+(mean-r)*round;return rounded*(1+(squareFactor(a)-1)*square);});
  const r=Array.from({length:n},(_,s)=>{
   const b=s/n*TAU,D=Math.sin(b)>=0?F:B;// direction 0 is his left (+x), then toward the front (+z)
   const a=Math.atan2(Math.sin(b)/D,Math.cos(b)/W);
   let radius=ringAt(shaped,a)*Math.hypot(W*Math.cos(a),D*Math.sin(a))+bumpAt(bumps,h,b);
   if(o.shoulderRoll&&h>o.shoulderRoll.from){// quarter circle in toward the neck
    const t=Math.min(1,(h-o.shoulderRoll.from)/(1-o.shoulderRoll.from)),neck=Math.min(radius,o.shoulderRoll.neck);
    radius=neck+(radius-neck)*Math.sqrt(Math.max(0,1-t*t));
   }
   return +radius.toFixed(5);
  });
  return {y:ring.y,r};
 });
 const shaped={...base,rings};
 return o.detail?resampleShape(shaped,o.detail):shaped;
}

/**
 * Athletic women's torsos (21 November 2026). Round 1 of the female torsos
 * read as unisex except F2, whose hips were too wide. The strongest female
 * signal is the waist-to-hip contrast, so these sit between F1 (waist 84%,
 * hips 102%) and F2 (waist 75%, hips 112%): a slim waist (78-82%), good but not
 * exaggerated hips (104-108%), softer sloping shoulders, and two slight,
 * rounded chest bumps: enough to read as female, modest enough for a game kids
 * play. All at the light detail.
 */
const CHEST=(amount,h=.72)=>[{h,hSpread:.08,angle:65,aSpread:19,amount,mirror:true}];
export const WOMEN_OPTIONS=[
 {id:'women-classic',label:'W1 · Classic',note:'Balanced athletic: a slim waist and good hips.',
  width:[[0,1],[.2,1.06],[.5,.8],[.78,.95],[1,.9]],front:[[0,.92],[1,.94]],back:[[0,.96],[1,.92]],round:0,square:.08,
  bumps:CHEST(.021),shoulderRoll:{from:.8,neck:.1},detail:LIGHT},
 {id:'women-runner',label:'W2 · Runner',note:'Leaner and flatter: a slim waist and a lighter build.',
  width:[[0,.95],[.2,1.04],[.5,.79],[.78,.9],[1,.86]],front:[[0,.87],[1,.89]],back:[[0,.9],[1,.88]],round:0,square:.05,
  bumps:CHEST(.019),shoulderRoll:{from:.81,neck:.095},detail:LIGHT},
 {id:'women-swimmer',label:'W3 · Swimmer',note:'Slightly broader shoulders, a slim waist and good hips.',
  width:[[0,1],[.2,1.05],[.5,.82],[.76,1],[1,.95]],front:[[0,.92],[1,.94]],back:[[0,.95],[1,.94]],round:0,square:.1,
  bumps:CHEST(.02),shoulderRoll:{from:.82,neck:.1},detail:LIGHT},
 {id:'women-soft',label:'W4 · Soft athletic',note:'A little rounder and softer, still fit.',
  width:[[0,1],[.2,1.07],[.5,.82],[.78,.93],[1,.88]],front:[[0,1],[.5,1.01],[1,.98]],back:[[0,1],[1,.96]],round:.4,square:0,
  bumps:CHEST(.022),shoulderRoll:{from:.79,neck:.1},detail:LIGHT},
 {id:'women-gymnast',label:'W5 · Gymnast',note:'Compact and strong, with a defined waist.',
  width:[[0,.97],[.2,1.04],[.5,.78],[.76,1.02],[1,.97]],front:[[0,.96],[1,.98]],back:[[0,.97],[1,.97]],round:0,square:.28,
  bumps:CHEST(.019),shoulderRoll:{from:.8,neck:.105},detail:LIGHT},
];

