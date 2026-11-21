// New avatar (version 2): torso shape options to choose from.
//
// Each option starts from the clean one-piece torso (torso.json) and changes it
// with a few numbers, so every option keeps the same height, the same smooth
// one-piece surface and the same left/right symmetry:
//  - width / front / back: how wide (side to side) and how deep (chest and
//    back) it is, as multipliers at points up the body (0 = bottom, 1 = top);
//  - round: 0..1, how far each ring is evened out toward a circle;
//  - square: 0..1, how far each ring is pushed toward a rounded square.
// The options are built in code when the page loads; nothing is stored twice.

/** The options, in the order shown left to right. */
export const TORSO_OPTIONS=[
 {id:'original',label:'1 · Original',note:'The clean torso as it is now.',
  width:[[0,1],[1,1]],front:[[0,1],[1,1]],back:[[0,1],[1,1]],round:0,square:0},
 {id:'athletic',label:'2 · Athletic',note:'Broad shoulders and chest, narrower waist and hips (a V shape).',
  width:[[0,.9],[.35,.86],[.72,1.08],[1,1.12]],front:[[0,.92],[.5,.94],[.8,1.04],[1,1]],back:[[0,.92],[1,.96]],round:0,square:.15},
 {id:'round',label:'3 · Round',note:'A rounder, fuller toy-like body with a soft belly.',
  width:[[0,1],[.45,1.04],[1,.97]],front:[[0,1.04],[.4,1.14],[.75,1.04],[1,1]],back:[[0,1],[.5,1.04],[1,1]],round:.45,square:0},
 {id:'lean',label:'4 · Lean',note:'Slimmer and flatter, side to side and front to back.',
  width:[[0,.84],[.5,.84],[1,.9]],front:[[0,.84],[1,.86]],back:[[0,.84],[1,.86]],round:0,square:0},
 {id:'blocky',label:'5 · Blocky',note:'Squarer and sturdier, with wide, solid shoulders.',
  width:[[0,1],[.5,1.02],[1,1.1]],front:[[0,.96],[1,.98]],back:[[0,.96],[1,.98]],round:0,square:.6},
];

const TAU=Math.PI*2;
const smooth=t=>t*t*(3-2*t);
/** Value of a curve [[h, value], ...] at height share h (smooth between points). */
export function curveAt(curve,h){
 if(h<=curve[0][0])return curve[0][1];if(h>=curve.at(-1)[0])return curve.at(-1)[1];
 let i=0;while(h>curve[i+1][0])i++;
 const [h0,v0]=curve[i],[h1,v1]=curve[i+1];return v0+(v1-v0)*smooth((h-h0)/(h1-h0));
}
/** Radius of ring r (one value per direction) at any angle a (linear between directions). */
function ringAt(r,a){
 const n=r.length,f=((a/TAU)*n%n+n)%n,i=Math.floor(f),t=f-i;
 return r[i]*(1-t)+r[(i+1)%n]*t;
}
/** Radius of a rounded square (superellipse, exponent 4) relative to a circle, at angle a. */
const squareFactor=a=>Math.pow(Math.abs(Math.cos(a))**4+Math.abs(Math.sin(a))**4,-1/4);

/**
 * Makes one option's shape from the base shape. Each ring is: evened toward a
 * circle (round), pushed toward a rounded square (square), then stretched
 * side to side (width) and front/back (front, back) for its height. The
 * stretch is done exactly: for each final direction b we find the original
 * direction a that lands on it.
 */
export function makeTorsoOption(base,option){
 const {bottom,top,segments:n}=base,height=top.y-bottom.y;
 const rings=base.rings.map(ring=>{
  const h=(ring.y-bottom.y)/height,W=curveAt(option.width,h),F=curveAt(option.front,h),B=curveAt(option.back,h);
  const mean=ring.r.reduce((s,v)=>s+v,0)/n;
  const shaped=ring.r.map((r,s)=>{const a=s/n*TAU,rounded=r+(mean-r)*option.round;return rounded*(1+(squareFactor(a)-1)*option.square);});
  const r=Array.from({length:n},(_,s)=>{
   const b=s/n*TAU,D=Math.sin(b)>=0?F:B;// direction 0 is his left (+x), then toward the front (+z)
   const a=Math.atan2(Math.sin(b)/D,Math.cos(b)/W);
   return +(ringAt(shaped,a)*Math.hypot(W*Math.cos(a),D*Math.sin(a))).toFixed(5);
  });
  return {y:ring.y,r};
 });
 return {...base,rings};
}
