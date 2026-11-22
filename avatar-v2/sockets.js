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

/**
 * Splits triangles near `centre` (within `reach`) until their edges there are at
 * most `maxEdge` long. Each new point goes on the smooth curved surface the
 * old points describe (the PN-triangle midpoint, from the surface directions
 * at both ends of its edge), and gets the blend of their directions. If the
 * part carries directions (`normals`) they are used and carried along.
 */
export function refineNear(part,centre,reach,maxEdge,maxRounds=6,where=null){
 // `where(point)`: how much to refine at a point, 0 (not at all) to 1 (fully curved); by default a ball of
 // radius `reach` around `centre`, fading over its last six triangle lengths (measured: three left 61° where two refined areas overlap on the thigh; nine sharpened the wrist; six keeps every socket under 43°).
 const weight=where??(m=>{const f=Math.min(1,Math.max(0,(reach-dist(m,centre))/(6*maxEdge)));return f>0?f*f*(3-2*f):(dist(m,centre)<reach?1e-9:0);});
 const {positions,index}=part;let P=[...positions],I=[...index];
 // Smooth surface directions guide where new points go; carried if the part has them, else measured now.
 const N=[...(part.normals??pointNormals(part))];
 const pt=i=>[P[3*i],P[3*i+1],P[3*i+2]];
 for(let round=0;round<maxRounds;round++){
  // 1. Edges to split: long edges whose middle is near the ball.
  const split=new Map(),key=(a,b)=>a<b?a+','+b:b+','+a;
  for(let t=0;t<I.length;t+=3)for(let e=0;e<3;e++){
   const a=I[t+e],b=I[t+(e+1)%3],k=key(a,b);if(split.has(k))continue;
   const A=pt(a),B=pt(b),mid=[(A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2];
   const w=dist(A,B)>maxEdge?weight(mid):0;
   if(w>0){
    // PN-triangle midpoint: on the smooth curve through both ends that follows their surface directions,
    // not on the old flat triangle (flat midpoints keep the old facets, which show as stripes when shaded).
    const na=[N[3*a],N[3*a+1],N[3*a+2]],nb=[N[3*b],N[3*b+1],N[3*b+2]],ab=sub(B,A),wa=ab[0]*na[0]+ab[1]*na[1]+ab[2]*na[2],wb=-(ab[0]*nb[0]+ab[1]*nb[1]+ab[2]*nb[2]);
    // The curve is faded toward the border of the refined area (the weight), where unsplit flat triangles take
    // over: a full curve right at that border would stand proud of its flat neighbours and leave a kink.
    const f=Math.min(1,w);
    split.set(k,P.length/3);P.push(...mid.map((v,j)=>v-f*(wa*na[j]+wb*nb[j])/8));
    const n=[0,1,2].map(j=>na[j]+nb[j]),l=Math.hypot(...n)||1;N.push(n[0]/l,n[1]/l,n[2]/l);}
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
 return part.normals?{positions:P,index:I,normals:N}:{positions:P,index:I};
}

/** Smooth surface direction at every point (average of the triangles around it). */
export function pointNormals({positions:P,index:I}){
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
 // Which way the clay faced before the press: carried smooth directions if the part has them.
 const P=[...part.positions],N=skin?(part.normals??pointNormals(part)):null;
 for(let i=0;i<P.length;i+=3){
  const d=sub([P[i],P[i+1],P[i+2]],centre),q=Math.hypot(...d);
  if(q>=R+skin+soft||q===0)continue;
  // How much this point faces away from the ball: 0 facing it, 1 facing away (smooth in between).
  let away=0;if(skin){const f=(N[i]*d[0]+N[i+1]*d[1]+N[i+2]*d[2])/q,x=Math.min(1,Math.max(0,(f+SOCKET_LIP)/(2*SOCKET_LIP)));away=x*x*(3-2*x);}
  const base=R+skin*away;if(q>=base+soft)continue;
  const x=(q-base)/soft,to=x<=-1?base:base+soft*(x+1)*(x+1)/4;
  for(let k=0;k<3;k++)P[i+k]=centre[k]+d[k]/q*to;
 }
 return part.normals?{positions:P,index:part.index,normals:part.normals}:{positions:P,index:part.index};
}

/**
 * The stamp: a ball pressed straight down `axis` into a part, for a ball whose
 * centre lies on the part's surface (the neck ball, approved half sunk into the
 * torso's top). The radial press would push such a surface along itself and
 * bunch it into a ring; the stamp moves every point only along `axis`, so no
 * two points can land in the same place.
 * The cup's profile, at distance rho from the stamp's line (depth measured
 * along `axis` from the surface through the centre):
 *  - the ball plus the gap, sqrt(R^2 - rho^2), out to where it meets
 *  - a fillet: a circle of radius `fillet` touching both the cup and the
 *    surface, so the rim turns smoothly (no corner) from the cup to the top;
 *  - then 0: untouched.
 * Each point's depth becomes the larger of its own and the profile's, blended
 * over a narrow band (the sockets' smooth formula) so even a slightly curved
 * top joins without a crease. Points never move back toward the ball.
 */
export function stamp(part,centre,axis,R,fillet,level=0){
 // `level`: how deep (along axis) the part's surface sits around the ball; 0 for a ball centred on the surface.
 const P=[...part.positions],hc=level+fillet,rc=Math.sqrt(Math.max(0,(R+fillet)**2-hc**2)),rt=rc*R/(R+fillet),band=fillet/3;
 // The fillet circle sits inside the material: centre `fillet` below the surface level, R + fillet from the ball's centre,
 // so it touches the surface at rho = rc and the cup at rho = rt (on the sphere).
 const profile=rho=>rho<=rt?Math.sqrt(Math.max(0,R*R-rho*rho)):rho<rc?hc-Math.sqrt(Math.max(0,fillet*fillet-(rho-rc)**2)):level;
 for(let i=0;i<P.length;i+=3){
  const v=[P[i]-centre[0],P[i+1]-centre[1],P[i+2]-centre[2]],h=v[0]*axis[0]+v[1]*axis[1]+v[2]*axis[2];
  const rho=Math.hypot(v[0]-axis[0]*h,v[1]-axis[1]*h,v[2]-axis[2]*h);if(rho>=rc+band)continue;
  const D=profile(rho),x=(h-D)/band;if(x>=1)continue;
  const to=x<=-1?D:D+band*(x+1)*(x+1)/4;
  for(let k=0;k<3;k++)P[i+k]+=axis[k]*(to-h);
 }
 return {...part,positions:P};
}

/**
 * Refine, then press: one socket in one part. With a layer kept over the ball
 * (`skin`), the part's smooth surface directions from BEFORE any press are
 * computed once and carried along (also into later sockets in the same part),
 * so 'facing the ball or away from it' changes smoothly instead of jumping at
 * every old flat triangle, which left small lumps.
 */
export function makeSocket(part,centre,R,soft,maxEdge,skin=0){
 const withNormals=skin&&!part.normals?{...part,normals:pointNormals(part)}:part;
 return press(refineNear(withNormals,centre,R+soft+maxEdge,maxEdge),centre,R,soft,skin);
}

// --- The shoulder sockets (owner, 21 November 2026) ------------------------------
import {fullBodyPreview,insideTorso} from './assembly.js';
import {BALL_GAP} from './limb-options.js';

/** Space left between the ball and its sockets: snug, never touching (the usual 6 mm limb gap). */
export const SOCKET_GAP=BALL_GAP;
/** How deep the ball sinks into the limb's end, as a share of its radius (Claude's pick: about a third). */
export const SOCKET_DEPTH=.35;
/** How deep the shoulder ball sinks into the torso: shallower (owner approved Claude's recommendation, 22 November 2026), for more room to swing the arm and less cut into the torso's shoulder corner. */
export const TORSO_SOCKET_DEPTH=.25;
/** Width of the soft edge around each socket, as a share of the ball's radius, but never under SOCKET_SOFT_MIN (smaller balls would get sharper rims: measured 37° at the elbow with 2.2 cm). */
export const SOCKET_SOFT=.3,SOCKET_SOFT_MIN=.03;
export const softEdge=r=>Math.max(SOCKET_SOFT*r,SOCKET_SOFT_MIN);
/** Largest triangle edge inside a socket after refining (metres): keeps the cup round. */
export const SOCKET_EDGE=.012;
/** Thickness of the clay kept over the ball where the part faces away from it, as a share of the ball's radius (25%: measured smoothest lip for its size; 15% left a 51° crease with the shallower torso socket). */
export const SOCKET_SKIN=.25;
/** How gradually the surface turns from 'facing the ball' to 'facing away' (half-width of the blend, in the cosine of the angle): wider spreads the lip's turn over more of the surface. */
export const SOCKET_LIP=.25;

export const mirrorPart=p=>{const positions=p.positions.map((v,i)=>i%3===0?-v:v),index=[];
 for(let i=0;i<p.index.length;i+=3)index.push(p.index[i],p.index[i+2],p.index[i+1]);
 return {...p,positions,index,side:'right',...(p.centre?{centre:[-p.centre[0],p.centre[1],p.centre[2]]}:{})};};

/**
 * The torso, both shoulder balls and both upper arms of the full body (the
 * current sizes), pressed together: each shoulder ball moves straight in
 * toward the torso until it sinks TORSO_SOCKET_DEPTH of its radius into it, and
 * each upper arm moves straight up its own line until the ball sinks
 * SOCKET_DEPTH of its radius into its top end. The torso and the upper arms take the ball's shape (with
 * the gap) as sockets with soft edges (the torso keeps a thin layer over the
 * top of the ball, where the ball rises above its shoulder corner). Nothing else changes. Right side = mirror.
 */
const shoulderCache=new Map();
/** Built once per body and reused (the page and the complete avatar both need it; treat the result as read-only). */
export function shoulderSocketPreview(bodyId='boy'){
 if(!shoulderCache.has(bodyId))shoulderCache.set(bodyId,buildShoulderSockets(bodyId));
 return shoulderCache.get(bodyId);
}
function buildShoulderSockets(bodyId){
 const f=fullBodyPreview(bodyId),get=(n,s)=>f.parts.find(p=>p.name===n&&p.side===s);
 const torso0=get('torso','centre'),ball0=get('ball-shoulder','left'),arm0=get('upper-arm','left');
 const r=ball0.radius,depth=SOCKET_DEPTH*r,torsoDepth=TORSO_SOCKET_DEPTH*r,R=r+SOCKET_GAP,soft=softEdge(r);
 // 1. The ball moves straight in (toward the middle) until its deepest point is `torsoDepth` inside the torso.
 const probes=Array.from({length:600},(_,i)=>{const y=1-2*(i+.5)/600,q=Math.sqrt(1-y*y),a=i*2.399963;return [Math.cos(a)*q,y,Math.sin(a)*q];});
 const sink=c=>Math.max(...probes.map(p=>insideTorso(f.torsoShape,[c[0]+p[0]*r,c[1]+p[1]*r,c[2]+p[2]*r])));
 let lo=0,hi=r*2;for(let k=0;k<50;k++){const m=(lo+hi)/2;sink([ball0.centre[0]-m,ball0.centre[1],ball0.centre[2]])<torsoDepth?lo=m:hi=m;}
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
 const parts=[{name:'torso',side:'centre',positions:torso.positions,index:torso.index}];
 for(const p of left){parts.push(p);parts.push({...mirrorPart(p),name:p.name});}
 return {body:bodyId,parts,ball:{centre:C,radius:r},gap:SOCKET_GAP,depth,torsoDepth,soft,inward,armUp,armShift,torsoShape:f.torsoShape,full:f,
  before:{torso:torso0,ball:ball0,arm:arm0},armMoved,
  triangles:{torso:[torso0.index.length/3,torso.index.length/3],arm:[arm0.index.length/3,arm.index.length/3]}};
}

// --- The elbow sockets (owner, 22 November 2026) ---------------------------------

/** Rotates points about an axis through `pivot` (Rodrigues' formula). */
export function rotateAbout(positions,pivot,axis,angle){
 const c=Math.cos(angle),s=Math.sin(angle),[x,y,z]=axis,out=new Array(positions.length);
 for(let i=0;i<positions.length;i+=3){
  const v=[positions[i]-pivot[0],positions[i+1]-pivot[1],positions[i+2]-pivot[2]],d=v[0]*x+v[1]*y+v[2]*z,cr=[y*v[2]-z*v[1],z*v[0]-x*v[2],x*v[1]-y*v[0]];
  for(let k=0;k<3;k++)out[i+k]=pivot[k]+v[k]*c+cr[k]*s+axis[k]*d*(1-c);
 }
 return out;
}

/** Closest distance between two point sets (grid search; exact for distances under `cell`). */
export function closestBetween(A,B,cell=.03){
 const grid=new Map(),key=(x,y,z)=>Math.floor(x/cell)+','+Math.floor(y/cell)+','+Math.floor(z/cell);
 for(let i=0;i<B.length;i+=3){const k=key(B[i],B[i+1],B[i+2]);(grid.get(k)??grid.set(k,[]).get(k)).push(i);}
 let best=Infinity;
 for(let i=0;i<A.length;i+=3){const x=A[i],y=A[i+1],z=A[i+2];
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const g=grid.get(key(x+a*cell,y+b*cell,z+c*cell));if(!g)continue;
   for(const j of g){const d=Math.hypot(B[j]-x,B[j+1]-y,B[j+2]-z);if(d<best)best=d;}}}
 return best;
}

/**
 * Room for a joint that folds one way (the doll-maker's way, made soft). At the
 * deepest bend the two limbs meet on the plane halfway between them, through
 * the hinge line. So each limb's inner side is pressed flat onto its own plane:
 * the plane through the hinge line (`pivot`, `axis`) turned `half` (half of
 * 180° minus the deepest bend) from the limb's own line toward the fold side.
 * At the deepest bend both limbs' planes coincide and the gap is left between
 * them; at any smaller bend they are further apart. Points well behind the
 * plane do not move; points in front land on it (gap/2 back); a band of width
 * `soft` rounds the edge with the same smooth formula as the sockets. With
 * ballR > 0, points are never pushed closer to the ball than R and the corner
 * where the flat side meets an existing socket is rounded the same way; with
 * ballR = 0 (shaping before the socket is pressed) the press does that.
 * `width`: how far along the hinge line the moving part reaches from the
 * pivot; beyond it (fading over `soft`) nothing is flattened, so a wide part
 * like the torso only gives way where the limb actually swings.
 *   line: unit direction along the limb, from the joint toward the limb;
 *   fold: unit direction the joint folds toward, square to the hinge line.
 */
export function flattenForBend(part,pivot,axis,line,fold,half,gap,soft,ballR,width=Infinity){
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 // The plane holds the hinge line and the limb's line turned `half` toward the fold side; n points out of the limb, toward the fold.
 const inPlane=line.map((v,k)=>v*Math.cos(half)+fold[k]*Math.sin(half)),n0=[axis[1]*inPlane[2]-axis[2]*inPlane[1],axis[2]*inPlane[0]-axis[0]*inPlane[2],axis[0]*inPlane[1]-axis[1]*inPlane[0]];
 const n=dot(n0,fold)>0?n0:n0.map(v=>-v),ln=Math.hypot(...n),N=n.map(v=>v/ln),c=-gap/2,P=[...part.positions];
 for(let i=0;i<P.length;i+=3){
  const p=[P[i],P[i+1],P[i+2]],h=dot(sub(p,pivot),N),y=-(h-c)/soft;
  if(y>=1)continue;
  // Only as wide as the moving part sweeps: full within `width` of the pivot along the hinge line, fading out over `soft`.
  const side=Math.abs(dot(sub(p,pivot),axis)),fade=side<=width?1:side>=width+soft?0:(t=>1-t*t*(3-2*t))((side-width)/soft);if(!fade)continue;
  const g=y<=-1?0:(y+1)*(y+1)/4,to=c-soft*g;let q=p.map((v,k)=>v+N[k]*(to-h)*fade);
  // Keep clear of the ball: where the flat side meets the socket, round the corner with the socket's
  // own smooth formula, faded in by how far the flattening moved this point (untouched cup stays exact).
  const w=FOLD_CORNER*soft,d=sub(q,pivot),l=Math.hypot(...d),x=(l-ballR)/w,moved=Math.min(1,Math.abs(to-h)/w);
  if(ballR>0&&x<1){const hard=Math.max(l,ballR),smooth=x<=-1?ballR:ballR+w*(x+1)*(x+1)/4,want=hard+(smooth-hard)*moved;q=pivot.map((v,k)=>v+d[k]/l*want);}
  for(let k=0;k<3;k++)P[i+k]=q[k];
 }
 return {...part,positions:P};
}

/** Width of the rounding where a flat inner face meets its socket, as a multiple of the soft edge (without it, that corner measured 65° at the elbow). */
export const FOLD_CORNER=1;
