// New avatar (version 2): the owner's original hand and foot, from BEFORE the
// ball joints were added (Avatar Checkpoint 2; smooth rounded wrist and ankle
// ends, no sockets), and gentle variations of them (the owner likes the
// originals, 21 November 2026). The parts are copied by build-hands-feet.mjs.
//
// Nothing is remodelled: every variation is the original surface, adjusted in
// up to three simple ways, always anchored at the wrist or ankle joint so the
// attachment point never moves:
//  - size: uniform scale;
//  - length / width / thickness: scale along the part's own three directions,
//    taken from the skeleton (hand: wrist to middle fingertip, and the way the
//    palm faces; foot: ankle to toe, and straight up). (Directions found from
//    the shape alone were tried and rejected: the thumb and curled fingers make
//    the hand's 'longest' direction point forward, not to the fingertips.)
//  - puff: every point pushed out along its surface direction by a few
//    millimetres, for softer, rounder edges (points that share a position move
//    together, so the surface never cracks).
// The triangles stay exactly the original's, so each variation keeps every
// finger and toe detail.
import source from './hands-feet-source.json' with {type:'json'};

export const HAND_FEET_SOURCE=source;

/** The five options (the same adjustment applied to the hand and the foot). */
export const HAND_FOOT_OPTIONS=[
 {id:'hf-original',label:'1 · Original',note:'Your original hand and foot from before the ball joints (Avatar Checkpoint 2), exactly as they were.',size:1,length:1,width:1,thickness:1,puff:0},
 {id:'hf-bigger',label:'2 · Slightly bigger',note:'The originals 8% bigger, to suit the boy\'s thicker arms.',size:1.08,length:1,width:1,thickness:1,puff:0},
 {id:'hf-softer',label:'3 · Softer',note:'The originals with softer, rounder edges (a slight puff), a touch more toy-like.',size:1.02,length:1,width:1,thickness:1,puff:.0025},
 {id:'hf-sleeker',label:'4 · Sleeker',note:'The originals a little longer and slimmer.',size:1,length:1.07,width:.95,thickness:.95,puff:0},
 {id:'hf-sturdier',label:'5 · Sturdier',note:'The originals a little wider and thicker, same length.',size:1,length:1,width:1.1,thickness:1.1,puff:0},
];

/**
 * One variation of a part ({positions, normals, index, pivot, axes}): returns new
 * {positions, normals, index} with the same triangles.
 */
export function adjustPart(part,option){
 const {positions,normals,pivot,axes}=part,n=positions.length/3,out=new Array(positions.length);
 // Shared surface direction for points at the same position (so a puff never cracks the surface).
 const shared=new Map();
 for(let i=0;i<n;i++){const key=positions[3*i]+','+positions[3*i+1]+','+positions[3*i+2],s=shared.get(key)??[0,0,0];s[0]+=normals[3*i];s[1]+=normals[3*i+1];s[2]+=normals[3*i+2];shared.set(key,s);}
 const scales=[['length',option.length],['width',option.width],['thickness',option.thickness]];
 for(let i=0;i<n;i++){
  let p=[positions[3*i],positions[3*i+1],positions[3*i+2]];
  if(option.puff){const s=shared.get(p.join(',')),l=Math.hypot(...s)||1;p=p.map((v,k)=>v+s[k]/l*option.puff);}
  const d=p.map((v,k)=>v-pivot[k]),moved=[0,0,0];
  for(const [name,f] of scales){const ax=axes[name],along=d[0]*ax[0]+d[1]*ax[1]+d[2]*ax[2];for(let k=0;k<3;k++)moved[k]+=ax[k]*along*f*option.size;}
  for(let k=0;k<3;k++)out[3*i+k]=pivot[k]+moved[k];
 }
 return {positions:out,index:part.index,pivot};
}

/** The hand and foot for one option, in avatar space (his left side). */
export function buildHandFoot(option){
 return {hand:adjustPart(source.hand,option),foot:adjustPart(source.foot,option)};
}

/** Chosen by the owner (21 November 2026): option 2, the originals 8% bigger. */
export const CHOSEN_HAND_FOOT=HAND_FOOT_OPTIONS.find(o=>o.id==='hf-bigger');
