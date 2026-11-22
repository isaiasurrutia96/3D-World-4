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
import {makeTorsoOption} from './torso-variants.js';
import {buildTorsoSurface} from './torso-shape.js';
import {buildHeadSet,CHOSEN_NECK} from './head-options.js';
import {CHOSEN_FACE} from './face.js';
import {HAND_FEET_SOURCE,adjustPart,CHOSEN_HAND_FOOT} from './hands-feet.js';
import {BODIES,LIMB_SCALE,HAND_SCALE,FOOT_OVER_HEAD} from './assembly.js';
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

/** Owner (22 November 2026): "lengthen all the limbs" slightly, and "shrink the hands by a bit" (10% each: Claude's pick). */
export const ORIGINAL_LIMB_LENGTHEN=1.1,ORIGINAL_HAND_SHRINK=.9;
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
  const t=Math.min(1,Math.max(0,(s-a)/(b-a))),share=t*t*(3-2*t),move=extra*share;
  for(let k=0;k<3;k++)out[i+k]=positions[i+k]+L.dir[k]*move;
 }
 return {positions:out,shift:L.dir.map(v=>v*extra),line:L};
}
const shifted=(p,v)=>({...p,positions:p.positions.map((x,i)=>x+v[i%3]),...(p.pivot?{pivot:p.pivot.map((x,k)=>x+v[k])}:{})});

export function originalLimbBody(bodyId='boy'){
 const body=BODIES[bodyId],torsoShape=makeTorsoOption(torsoBase.shape,body.torso,body.torsoList);
 const parts=[{name:'torso',side:'centre',...buildTorsoSurface(torsoShape)}];
 // Head: the approved shape, only moved so its centre is where the original head's centre was.
 const head=buildHeadSet(CHOSEN_NECK,torsoShape).head,headPositions=head.positions.map((v,i)=>v+ORIGINAL_HEAD_CENTRE[i%3]);
 parts.push({name:'head',side:'centre',positions:headPositions,index:head.index,radius:head.radius,centre:ORIGINAL_HEAD_CENTRE});
 parts.push({name:'neck',side:'centre',...source.parts.neck});
 // Original limbs, each 10% longer in its middle; everything below a limb moves down with it (a chain).
 const chainShift={},stretched={};
 for(const side of ['left','right'])for(const [upperName,lowerName] of [['upper-arm','forearm'],['thigh','calf']]){
  const up=stretchLimb(source.parts[side][upperName].positions,(ORIGINAL_LIMB_LENGTHEN-1)*limbLine(source.parts[side][upperName].positions).length);
  const loMoved=source.parts[side][lowerName].positions.map((x,i)=>x+up.shift[i%3]);
  const lo=stretchLimb(loMoved,(ORIGINAL_LIMB_LENGTHEN-1)*limbLine(loMoved).length);
  parts.push({name:upperName,side,positions:up.positions,index:source.parts[side][upperName].index});
  parts.push({name:lowerName,side,positions:lo.positions,index:source.parts[side][lowerName].index});
  chainShift[side+':'+lowerName]=up.shift.map((v,k)=>v+lo.shift[k]);stretched[side+':'+upperName]=up;stretched[side+':'+lowerName]=lo;}
 // Hands and feet: approved shapes and sizes, at the original joints; the right side mirrors the left.
 const handSize=CHOSEN_HAND_FOOT.size*LIMB_SCALE*HAND_SCALE*ORIGINAL_HAND_SHRINK;
 const foot0=HAND_FEET_SOURCE.foot,flat=[foot0.axes.length[0],0,foot0.axes.length[2]],lf=Math.hypot(...flat),along=flat.map(v=>v/lf);
 const headHeight=2*head.radius,footSize=(headHeight+FOOT_OVER_HEAD)/extent(foot0.positions,along);
 const hand=handOrFoot('hand',handSize),foot=handOrFoot('foot',footSize);
 // Hands and feet follow the end of their (lengthened) arm or leg; the right side is the left's mirror image.
 for(const [name,p,limb] of [['hand',hand,'forearm'],['foot',foot,'calf']]){const left=shifted(p,chainShift['left:'+limb]);
  parts.push({name,side:'left',...left});parts.push({name,side:'right',...mirrored(left)});}
 let lo=Infinity,hi=-Infinity;for(const p of parts)for(let i=1;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}
 return {body:bodyId,torsoShape,parts,face:CHOSEN_FACE,height:hi-lo,sole:lo,handSize,footSize,footLength:headHeight+FOOT_OVER_HEAD,headHeight,chainShift,stretched};
}
