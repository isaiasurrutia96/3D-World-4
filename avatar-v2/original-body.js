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
/**
 * The lower torso with straight sides (owner, 22 November 2026: keep the athletic V down to the waist, then
 * "straightening the lower sides", the bottom still round): below LOWER_SIDES_FROM every ring keeps the waist's
 * width at the sides, blended in over LOWER_SIDES_BLEND so there is no corner, and only at the sides (the front
 * and back keep their shape; the weight is cos² of the angle round the torso). The round bottom cap follows the
 * new bottom ring, so it keeps its roundness.
 */
export const LOWER_SIDES_FROM=1.10,LOWER_SIDES_BLEND=.05;
export function straightLowerSides(shape){
 const rings=shape.rings,n=shape.segments,at=y=>{let k=0;while(k<rings.length-2&&rings[k+1].y<y)k++;const a=rings[k],b=rings[k+1],t=(y-a.y)/(b.y-a.y);return a.r.map((r,i)=>r+(b.r[i]-r)*t);};
 const waist=at(LOWER_SIDES_FROM),top=LOWER_SIDES_FROM+LOWER_SIDES_BLEND,bottom=LOWER_SIDES_FROM-LOWER_SIDES_BLEND;
 const out=rings.map(ring=>{if(ring.y>=top)return ring;const x=Math.min(1,(top-ring.y)/(top-bottom)),t=x*x*(3-2*x);
  return {...ring,r:ring.r.map((r,i)=>{const [dx]=direction(i,n),side=dx*dx;return r+side*t*Math.max(0,waist[i]-r);})};});
 return {...shape,rings:out};
}
/**
 * A limb's end remade as a cup around its ball, in the style of the accepted Wrist and Feet studies (owner,
 * 22 November 2026): the limb is rebuilt as a smooth surface of revolution round its own line, from its own rings
 * (as round circles, `segments` round), and at `end` ('top' or 'bottom') it now ends in a cup: the ball's shape plus
 * the gap (R), captured `capture` of the ball's diameter deep, then a rolled round rim (a circle of radius `bead`
 * touching the cup and the limb's side), the side straight at `wall` times the ball's radius (flush, a little
 * wider), then a smooth curve back into the limb's own shape.
 */
export function cupLimbEnd(part,ball,{end,capture=1/3,bead=.007,wall=1.144,segments=48,blend=.03}){
 const L=limbLine(part.positions,part.axis),P=part.positions,r=ball.radius,R=r+SOCKET_GAP;
 const sC=[0,1,2].reduce((a,k)=>a+(ball.centre[k]-L.centre[k])*L.dir[k],0),sgn=end==='bottom'?-1:1;
 // The limb's own profile: each ring's place along the line and its radius (poles left out).
 const rings=new Map();for(let i=0;i<P.length;i+=3){const v=[0,1,2].map(k=>P[i+k]-L.centre[k]),s=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2],rho=Math.hypot(...v.map((x,k)=>x-L.dir[k]*s)),key=Math.round(s*1e5);const e=rings.get(key)??{s,sum:0,n:0};e.sum+=rho;e.n++;rings.set(key,e);}
 const profile=[...rings.values()].filter(e=>e.sum/e.n>1e-4).map(e=>({h:sgn*(e.s-sC),r:e.sum/e.n})).sort((a,b)=>a.h-b.h);
 const farPole=sgn>0?L.end:L.start,farH=sgn*(farPole-sC);
 // The cup: captured depth = r - (rim plane's height above the centre).
 const cosA=(r-2*r*capture)/R,A=Math.acos(Math.max(-1,Math.min(1,cosA))),sinA=Math.sin(A);
 const W=wall*r,f=bead,bc=[(R+f)*sinA,(R+f)*cosA];if(Math.abs(bc[0]+f-W)>.02*r)throw Error(`cupLimbEnd: the rim does not fit (side ${(W*100).toFixed(1)} cm, rim ${((bc[0]+f)*100).toFixed(1)} cm)`);
 const pts=[];
 for(let k=0;k<=24;k++){const a=A*k/24;pts.push([R*Math.sin(a),R*Math.cos(a)]);}// the cup, from its middle to the rim
 const a0=Math.atan2(-cosA,-sinA);for(let k=1;k<=16;k++){const a=a0+(0-a0)*k/16;pts.push([bc[0]+f*Math.cos(a),bc[1]+f*Math.sin(a)]);}// the round rim
 const wallTop=bc[1]+blend,side=pts.at(-1)[0];pts.push([side,wallTop*0.5+bc[1]*0.5]);
 // Back into the limb: a smooth curve from the side (going straight along the limb) to its first own ring past the
 // blend that is at least as wide as the side (or its widest), so the limb never narrows behind its cup like a cuff.
 const past=profile.filter(q=>q.h>=wallTop+blend);if(!past.length)throw Error('cupLimbEnd: the limb is too short for its cup');
 const join=past.find(q=>q.r>=side)??past.reduce((a,b)=>b.r>a.r?b:a);
 const next=profile[profile.indexOf(join)+1]??{h:join.h+.01,r:join.r},slope=(next.r-join.r)/(next.h-join.h);
 const p0=[side,wallTop],p3=[join.r,join.h],len=(join.h-wallTop)/3,p1=[side,wallTop+len],p2=[join.r-slope*len,join.h-len];
 for(let k=0;k<=12;k++){const t=k/12,u=1-t;pts.push([0,1].map(j=>u*u*u*p0[j]+3*u*u*t*p1[j]+3*u*t*t*p2[j]+t*t*t*p3[j]));}
 for(const q of profile)if(q.h>join.h)pts.push([q.r,q.h]);
 // A surface of revolution round the limb's line: the cup's middle point, the rings, then the far pole.
 const u=Math.abs(L.dir[1])<.9?[0,1,0]:[1,0,0],e1=[L.dir[1]*u[2]-L.dir[2]*u[1],L.dir[2]*u[0]-L.dir[0]*u[2],L.dir[0]*u[1]-L.dir[1]*u[0]],l1=Math.hypot(...e1),a1=e1.map(v=>v/l1),
  a2=[L.dir[1]*a1[2]-L.dir[2]*a1[1],L.dir[2]*a1[0]-L.dir[0]*a1[2],L.dir[0]*a1[1]-L.dir[1]*a1[0]];
 const at=(rad,h,j)=>{const t=j/segments*2*Math.PI,c=Math.cos(t),sn=Math.sin(t),s=sC+sgn*h;return [0,1,2].map(k=>L.centre[k]+L.dir[k]*s+rad*(a1[k]*c+a2[k]*sn));};
 const positions=[...at(0,pts[0][1],0)],index=[];
 for(let i=1;i<pts.length;i++)for(let j=0;j<segments;j++)positions.push(...at(pts[i][0],pts[i][1],j));
 const pole=positions.length/3;positions.push(...at(0,farH,0));
 const ring=(i,j)=>1+(i-1)*segments+(j%segments),last=pts.length-1;
 for(let j=0;j<segments;j++)index.push(0,ring(1,j),ring(1,j+1));
 for(let i=1;i<last;i++)for(let j=0;j<segments;j++){const a=ring(i,j),b=ring(i,j+1),c=ring(i+1,j),d=ring(i+1,j+1);index.push(a,c,d,a,d,b);}
 for(let j=0;j<segments;j++)index.push(pole,ring(last,j+1),ring(last,j));
 // Facing out: the enclosed volume must be positive; otherwise flip every triangle.
 let vol=0;for(let t=0;t<index.length;t+=3){const p=k=>positions.slice(3*index[t+k],3*index[t+k]+3),A0=p(0),B=p(1),C0=p(2);vol+=(A0[0]*(B[1]*C0[2]-B[2]*C0[1])-A0[1]*(B[0]*C0[2]-B[2]*C0[0])+A0[2]*(B[0]*C0[1]-B[1]*C0[0]))/6;}
 if(vol<0)for(let t=0;t<index.length;t+=3){const x=index[t+1];index[t+1]=index[t+2];index[t+2]=x;}
 return {...part,positions,index,cup:{end,capture,bead:f,wall:W,R,angle:A}};
}
const shifted=(p,v)=>({...p,positions:p.positions.map((x,i)=>x+v[i%3]),...(p.pivot?{pivot:p.pivot.map((x,k)=>x+v[k])}:{})});

export function originalLimbBody(bodyId='boy'){
 const body=BODIES[bodyId],torsoShape=straightLowerSides(makeTorsoOption(torsoBase.shape,body.torso,body.torsoList));
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
 const ballR={shoulder:BALL_SIZE.shoulder*E.u.top,elbow:Math.min(E.u.bottom,E.f.top),wrist:BALL_SIZE.wrist*E.f.bottom,hip:BALL_SIZE.hip*HIP_BALL_GROW*E.t.top,knee:Math.min(E.t.bottom,E.c.top),ankle:BALL_SIZE.ankle*E.c.bottom};
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
  hip:BALL_SIZE.hip*HIP_BALL_GROW*endOf('thigh','top'),knee:Math.min(endOf('thigh','bottom'),endOf('calf','top')),ankle:BALL_SIZE.ankle*endOf('calf','bottom')};
 // Then the forearms, thighs and calves slimmer (owner, 22 November 2026: "almost the size of the balls but
 // slightly bigger"): SLIM_OVER_BALL times the bigger of their two balls across, scaled around their own line
 // (same length). The balls keep their sizes.
 // Then thicker again (owner, 22 November 2026): the thigh "the same overall size as the hip ball but slightly bigger"
 // (SLIM_OVER widths from the bigger hip ball itself), the calf a hair wider still (SLIM_OVER.calf).
 // (The thigh's width follows the hip ball's size before HIP_BALL_GROW: the bigger ball does not thicken the thigh.)
 const slimBalls={...balls,hip:balls.hip/HIP_BALL_GROW},slimTo=n=>{const [a,b]=between[n];return SLIM_OVER[n]*2*Math.max(slimBalls[a],slimBalls[b]);};
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
 * The hip balls a little bigger again (owner, 22 November 2026: "the hip balls should also be a little bit bigger
 * because the hip kind of widens out"): 10% (Claude's pick), about as wide as the thigh's top, so the thigh can meet
 * it flush. The space between the two balls stays the same, so each ball grows outward from where it was (the hips
 * 4.6 cm wider across the balls), and the thigh keeps its width.
 */
export const HIP_BALL_GROW=1.1;
/** The new socket style tried on the knees first (template; owner, 22 November 2026). Off: the owner turned the
 * round cups down ("No not round cups"), so the thigh and calf keep their own ends. */
export const KNEE_CUPS=false;
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
export const HIP_RIM_ROUNDS=100,HIP_RIM_BAND=.015;
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
// Only the upper arms, forearms, thighs and calves (owner, 22 November 2026: "take away every part minus the upper
// arm, forearm, thighs and calves"): the put-together avatar is built as before and everything else is left out,
// so each limb keeps exactly its place and shape (the limbs' places are worked out from the torso and the balls).
export const LIMBS_ONLY=['upper-arm','forearm','thigh','calf'];
export function limbsOnlyBody(bodyId='boy'){
 const whole=pressedPreviewBody(bodyId),parts=whole.parts.filter(p=>LIMBS_ONLY.includes(p.name));
 let lo=Infinity,hi=-Infinity;for(const p of parts)for(let i=1;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}
 return {body:bodyId,parts,height:hi-lo,lowest:lo,whole};
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
 // The space between the two balls stays HIP_BALL_GAP, so each grows outward from where it was: put together, the
 // smaller ball's place (same height and depth) moved straight out by the growth; apart, the bigger ball still clears
 // the torso by 2 cm. (Keeping the centres left only 8 mm of torso between the two sockets, which folded.)
 const rH=B.hip,rPlace=rH/HIP_BALL_GROW,grow=rH-rPlace;
 const H=press?intoTorso(clearOfTorso(torsoShape,[HIP_BALL_GAP/2+rPlace,HIP[1],HIP[2]],rPlace,[0,-1,0],SHOULDER_TORSO_GAP),rPlace,[0,-1,0]).map((v,k)=>k===0?v+grow:v)
  :clearOfTorso(torsoShape,[HIP_BALL_GAP/2+rH,HIP[1],HIP[2]],rH,[0,-1,0],SHOULDER_TORSO_GAP);
 const leg=chain({centre:H,radius:rH},[thigh,calf,foot],[null,()=>B.knee,()=>B.ankle],['ball-hip','ball-knee','ball-ankle']);
 // The feet would meet in the middle: each whole leg moves straight outward just enough to leave the usual gap between them.
 const footNow=leg.at(-1);let inner=Infinity;for(let i=0;i<footNow.positions.length;i+=3)inner=Math.min(inner,footNow.positions[i]);
 const legOut=Math.max(0,BALL_GAP/2-inner);for(let k=0;k<leg.length;k++)leg[k]=moveBy(leg[k],[legOut,0,0]);
 // Put together, the torso gets real hip sockets (owner, 22 November 2026: "have that mould of the ball for the
 // socket", with soft edges), made like the shoulder sockets: the ball's shape plus the usual 6 mm gap, soft
 // edges, and a layer of clay kept over the ball where the torso faces away from it. The thigh keeps its own
 // rounded top around the ball (owner: no cup shape; "keep the edge of the socket soft").
 let hipSocket=null;
 // The knee as the template for the new socket style: the thigh's foot and the calf's top become cups round the knee ball.
 if(press&&KNEE_CUPS){const knee=leg[2];leg[1]=cupLimbEnd(leg[1],knee,{end:'bottom'});leg[3]=cupLimbEnd(leg[3],knee,{end:'top'});}
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
