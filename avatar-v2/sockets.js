// New avatar (version 2): sockets made the way the owner described (21 November
// 2026): the joint ball is hard, the parts around it are clay, and they are
// pressed toward each other, so the ball leaves a natural socket with soft
// edges in each part. One socket at a time; the first is the shoulder (torso,
// shoulder ball, upper arm).
//
// How a socket is made, for a part (a surface of points and triangles) and a
// ball (centre, radius):
//  1. refineNear: the part's triangles near the ball are split into smaller
//     ones (only there), so the cup comes out round instead of faceted. Splits
//     are matched along shared edges, so the surface never cracks.
//  2. press: every point inside the ball plus the gap is pushed straight away
//     from the ball's centre onto that sphere, which forms the cup. Points just
//     near the cup's edge (within `soft` of it) move partly, joining smoothly,
//     which rounds the edge like pushed clay. Nothing else moves.
// The triangles keep their order, so each part stays one sealed surface.

const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

/** Splits triangles near `centre` (within `reach`) until their edges there are at most `maxEdge` long. */
export function refineNear({positions,index},centre,reach,maxEdge,maxRounds=6){
 let P=[...positions],I=[...index];
 const pt=i=>[P[3*i],P[3*i+1],P[3*i+2]];
 for(let round=0;round<maxRounds;round++){
  // 1. Edges to split: long edges whose middle is near the ball.
  const split=new Map(),key=(a,b)=>a<b?a+','+b:b+','+a;
  for(let t=0;t<I.length;t+=3)for(let e=0;e<3;e++){
   const a=I[t+e],b=I[t+(e+1)%3],k=key(a,b);if(split.has(k))continue;
   const A=pt(a),B=pt(b),mid=[(A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2];
   if(dist(A,B)>maxEdge&&dist(mid,centre)<reach){split.set(k,P.length/3);P.push(...mid);}
  }
  if(!split.size)break;
  // 2. Each triangle is replaced according to how many of its edges were split (same winding).
  const out=[];
  for(let t=0;t<I.length;t+=3){
   const v=[I[t],I[t+1],I[t+2]],m=[0,1,2].map(e=>split.get(key(v[e],v[(e+1)%3])));
   const n=m.filter(x=>x!==undefined).length;
   if(n===0){out.push(...v);continue;}
   if(n===3){out.push(v[0],m[0],m[2],m[0],v[1],m[1],m[2],m[1],v[2],m[0],m[1],m[2]);continue;}
   // Rotate so the pattern starts at a fixed place: for one split, edge 0; for two, edges 0 and 1.
   let r=0;
   if(n===1)r=m.findIndex(x=>x!==undefined);else r=[0,1,2].find(e=>m[e]!==undefined&&m[(e+1)%3]!==undefined);
   const V=[0,1,2].map(k=>v[(k+r)%3]),M=[0,1,2].map(k=>m[(k+r)%3]);
   if(n===1)out.push(V[0],M[0],V[2],M[0],V[1],V[2]);
   else out.push(V[1],M[1],M[0],V[0],M[0],M[1],V[0],M[1],V[2]);
  }
  I=out;
 }
 return {positions:P,index:I};
}

/** Smooth surface direction at every point (average of the triangles around it). */
function pointNormals({positions:P,index:I}){
 const N=new Array(P.length).fill(0);
 for(let t=0;t<I.length;t+=3){const [a,b,c]=[I[t],I[t+1],I[t+2]],A=[P[3*a],P[3*a+1],P[3*a+2]],u=sub([P[3*b],P[3*b+1],P[3*b+2]],A),v=sub([P[3*c],P[3*c+1],P[3*c+2]],A);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const p of [a,b,c])for(let k=0;k<3;k++)N[3*p+k]+=n[k];}
 for(let i=0;i<N.length;i+=3){const l=Math.hypot(N[i],N[i+1],N[i+2])||1;N[i]/=l;N[i+1]/=l;N[i+2]/=l;}
 return N;
}
/**
 * Presses a ball into a part. Each point keeps its direction from the ball's
 * centre; only its distance q changes. Surface that faces the ball becomes the
 * cup, exactly the ball plus the gap (R). Surface that faces away from the ball
 * but is still in its way (for example the torso's top, where the ball rises
 * higher than the torso's shoulder corner) is kept `skin` further out, like a
 * thin layer of clay bulging over the ball, so the part never folds back on
 * itself; the two blend through a rounded lip. Then, with base = R (+ skin),
 *    base                         deep inside (q <= base - soft);
 *    base + soft * ((x + 1)^2 / 4) near the edge, x = (q - base) / soft;
 *    q                            outside (q >= base + soft): untouched.
 * The middle formula joins both sides with the same slope (a rounded edge,
 * no crease), and no point ever ends closer to the centre than R or than it was.
 */
export function press(part,centre,R,soft,skin=0){
 const P=[...part.positions],N=skin?pointNormals(part):null;
 for(let i=0;i<P.length;i+=3){
  const d=sub([P[i],P[i+1],P[i+2]],centre),q=Math.hypot(...d);
  if(q>=R+skin+soft||q===0)continue;
  // How much this point faces away from the ball: 0 facing it, 1 facing away (smooth in between).
  let away=0;if(skin){const f=(N[i]*d[0]+N[i+1]*d[1]+N[i+2]*d[2])/q,x=Math.min(1,Math.max(0,(f+.25)/.5));away=x*x*(3-2*x);}
  const base=R+skin*away;if(q>=base+soft)continue;
  const x=(q-base)/soft,to=x<=-1?base:base+soft*(x+1)*(x+1)/4;
  for(let k=0;k<3;k++)P[i+k]=centre[k]+d[k]/q*to;
 }
 return {positions:P,index:part.index};
}

/** Refine, then press: one socket in one part. */
export function makeSocket(part,centre,R,soft,maxEdge,skin=0){
 return press(refineNear(part,centre,R+soft+maxEdge,maxEdge),centre,R,soft,skin);
}

// --- The shoulder sockets (owner, 21 November 2026) ------------------------------
import {fullBodyPreview,insideTorso} from './assembly.js';
import {BALL_GAP} from './limb-options.js';

/** Space left between the ball and its sockets: snug, never touching (the usual 6 mm limb gap). */
export const SOCKET_GAP=BALL_GAP;
/** How deep the ball sinks into each part, as a share of its radius (Claude's pick: about a third). */
export const SOCKET_DEPTH=.35;
/** Width of the soft edge around each socket, as a share of the ball's radius. */
export const SOCKET_SOFT=.3;
/** Largest triangle edge inside a socket after refining (metres): keeps the cup round. */
export const SOCKET_EDGE=.012;
/** Thickness of the clay kept over the ball where the part faces away from it, as a share of the ball's radius. */
export const SOCKET_SKIN=.15;

const mirrorPart=p=>{const positions=p.positions.map((v,i)=>i%3===0?-v:v),index=[];
 for(let i=0;i<p.index.length;i+=3)index.push(p.index[i],p.index[i+2],p.index[i+1]);
 return {...p,positions,index,side:'right',...(p.centre?{centre:[-p.centre[0],p.centre[1],p.centre[2]]}:{})};};

/**
 * The torso, both shoulder balls and both upper arms of the full body (the
 * current sizes), pressed together: each shoulder ball moves straight in
 * toward the torso until it sinks SOCKET_DEPTH of its radius into it, and each
 * upper arm moves straight up its own line until the ball sinks the same share
 * into its top end. The torso and the upper arms take the ball's shape (with
 * the gap) as sockets with soft edges (the torso keeps a thin layer over the
 * top of the ball, where the ball rises above its shoulder corner). Nothing else changes. Right side = mirror.
 */
export function shoulderSocketPreview(bodyId='boy'){
 const f=fullBodyPreview(bodyId),get=(n,s)=>f.parts.find(p=>p.name===n&&p.side===s);
 const torso0=get('torso','centre'),ball0=get('ball-shoulder','left'),arm0=get('upper-arm','left');
 const r=ball0.radius,depth=SOCKET_DEPTH*r,R=r+SOCKET_GAP,soft=SOCKET_SOFT*r;
 // 1. The ball moves straight in (toward the middle) until its deepest point is `depth` inside the torso.
 const probes=Array.from({length:600},(_,i)=>{const y=1-2*(i+.5)/600,q=Math.sqrt(1-y*y),a=i*2.399963;return [Math.cos(a)*q,y,Math.sin(a)*q];});
 const sink=c=>Math.max(...probes.map(p=>insideTorso(f.torsoShape,[c[0]+p[0]*r,c[1]+p[1]*r,c[2]+p[2]*r])));
 let lo=0,hi=r*2;for(let k=0;k<50;k++){const m=(lo+hi)/2;sink([ball0.centre[0]-m,ball0.centre[1],ball0.centre[2]])<depth?lo=m:hi=m;}
 const inward=(lo+hi)/2,C=[ball0.centre[0]-inward,ball0.centre[1],ball0.centre[2]],shift=[-inward,0,0];
 const ball={...ball0,positions:ball0.positions.map((v,i)=>v+shift[i%3]),centre:C};
 // 2. The upper arm moves with the ball, then straight up its own line until its top tip is `depth` inside the ball.
 const d=arm0.direction,tipFrom=[arm0.top[0]+shift[0],arm0.top[1],arm0.top[2]],tipTo=C.map((v,k)=>v+d[k]*(r-depth));
 const armShift=sub(tipTo,tipFrom).map((v,k)=>v+shift[k]),armUp=-((tipTo[0]-tipFrom[0])*d[0]+(tipTo[1]-tipFrom[1])*d[1]+(tipTo[2]-tipFrom[2])*d[2]);
 const armMoved={positions:arm0.positions.map((v,i)=>v+armShift[i%3]),index:arm0.index};
 // 3. The sockets: the torso gets one for each ball, the upper arm one at its top.
 let torso={positions:torso0.positions,index:torso0.index};
 for(const c of [C,[-C[0],C[1],C[2]]])torso=makeSocket(torso,c,R,soft,SOCKET_EDGE,SOCKET_SKIN*r);
 // The upper arm's end wraps under the ball without folding, so it needs no layer kept over the ball.
 const arm=makeSocket(armMoved,C,R,soft,SOCKET_EDGE);
 const left=[{name:'ball-shoulder',side:'left',...ball},{name:'upper-arm',side:'left',...arm,top:tipTo,direction:d,length:arm0.length}];
 const parts=[{name:'torso',side:'centre',...torso}];
 for(const p of left){parts.push(p);parts.push({...mirrorPart(p),name:p.name});}
 return {body:bodyId,parts,ball:{centre:C,radius:r},gap:SOCKET_GAP,depth,soft,inward,armUp,torsoShape:f.torsoShape,
  before:{torso:torso0,ball:ball0,arm:arm0},armMoved,
  triangles:{torso:[torso0.index.length/3,torso.index.length/3],arm:[arm0.index.length/3,arm.index.length/3]}};
}
