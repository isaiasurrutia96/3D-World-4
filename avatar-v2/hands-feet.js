// New avatar (version 2): the owner's original hand and foot, and five gentle
// variations of them (the owner likes the originals, 21 November 2026).
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
 {id:'hf-original',label:'1 · Original',note:'Your original hand and foot, exactly as approved, with the old wrist and ankle sockets filled in.',size:1,length:1,width:1,thickness:1,puff:0},
 {id:'hf-bigger',label:'2 · Slightly bigger',note:'The originals 8% bigger, to suit the boy\'s thicker arms.',size:1.08,length:1,width:1,thickness:1,puff:0},
 {id:'hf-softer',label:'3 · Softer',note:'The originals with softer, rounder edges (a slight puff), a touch more toy-like.',size:1.02,length:1,width:1,thickness:1,puff:.0025},
 {id:'hf-sleeker',label:'4 · Sleeker',note:'The originals a little longer and slimmer.',size:1,length:1.07,width:.95,thickness:.95,puff:0},
 {id:'hf-sturdier',label:'5 · Sturdier',note:'The originals a little wider and thicker, same length.',size:1,length:1,width:1.1,thickness:1.1,puff:0},
];

/**
 * Fills a part's old socket (owner, 21 November 2026: "without the sockets"),
 * like the torso's, so the patch flows into the surrounding surface.
 *
 * How (compared: a "soap film" across the opening is smooth inside but leaves a
 * crease at its edge; moving only the cup left the old rounded lip standing as
 * a ridge): the patch is the cup PLUS its rounded lip, the points near the
 * socket's sphere on the side it opens toward (the bone that plugged into it).
 * The cup points start on a gentle dome across the opening; then the whole patch
 * is relaxed with a smooth-blend (bi-Laplacian) step, which makes it continue
 * the curve of the untouched surface around it, without an edge. Points that
 * share a position move together (no cracks). Every point outside the patch
 * stays exactly the original, and the triangles are unchanged.
 * Returns a new part plus what was filled (for the checks).
 */
export function fillSocket(part,{lip=4,steps=600}={}){
 const {positions,normals,socket}=part,C=socket.centre,R=socket.radius,fillet=socket.fillet??.006,n=positions.length/3,axis=part.opening;
 const P=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]],height=v=>(v[0]-C[0])*axis[0]+(v[1]-C[1])*axis[1]+(v[2]-C[2])*axis[2];
 // Weld: one group per distinct position (seam copies move together).
 const groupOf=new Int32Array(n),groupKey=new Map(),members=[];
 for(let i=0;i<n;i++){const k=positions[3*i]+','+positions[3*i+1]+','+positions[3*i+2];let g=groupKey.get(k);if(g===undefined){g=members.length;groupKey.set(k,g);members.push([]);}groupOf[i]=g;members[g].push(i);}
 const G=members.length,neighbours=Array.from({length:G},()=>new Set());
 for(let k=0;k<part.index.length;k+=3)for(let a=0;a<3;a++){const x=groupOf[part.index[k+a]],y=groupOf[part.index[k+(a+1)%3]];if(x!==y){neighbours[x].add(y);neighbours[y].add(x);}}
 const nb=neighbours.map(s=>[...s]);
 // The cup (inward-facing points near the sphere) and its rim height.
 const cup=new Set();
 for(let i=0;i<n;i++){const v=P(i),toC=[C[0]-v[0],C[1]-v[1],C[2]-v[2]],dist=Math.hypot(...toC);
  if(dist<R*1.12&&(normals[3*i]*toC[0]+normals[3*i+1]*toC[1]+normals[3*i+2]*toC[2])/(dist||1)>.2)cup.add(groupOf[i]);}
 const local=g=>{const v=P(members[g][0]),h=height(v),side=[v[0]-C[0]-axis[0]*h,v[1]-C[1]-axis[1]*h,v[2]-C[2]-axis[2]*h];return {h,side,rho:Math.hypot(...side)};};
 const cupLocal=[...cup].map(g=>({g,...local(g)})),rimRho=Math.max(...cupLocal.map(l=>l.rho));
 const rim=cupLocal.filter(l=>l.rho>.9*rimRho),rimH=rim.reduce((s,l)=>s+l.h,0)/rim.length;
 // The patch: the cup plus its rounded lip (near the sphere, on the opening side).
 const patch=new Set(cup);
 for(let g=0;g<G;g++){const v=P(members[g][0]),dist=Math.hypot(v[0]-C[0],v[1]-C[1],v[2]-C[2]);if(dist<R+lip*fillet&&height(v)>rimH-lip*fillet)patch.add(g);}
 // Start: original positions; cup points on a gentle dome across the opening.
 const X=new Float64Array(G*3);for(let g=0;g<G;g++){const v=P(members[g][0]);X[3*g]=v[0];X[3*g+1]=v[1];X[3*g+2]=v[2];}
 for(const l of cupLocal){const t=l.rho/rimRho,h=rimH+.15*rimRho*(1-t*t);for(let k=0;k<3;k++)X[3*l.g+k]=C[k]+l.side[k]+axis[k]*h;}
 // Smooth blend: repeatedly move each patch point against the change in curvature
 // (bi-Laplacian), with every point outside the patch held fixed.
 const free=[...patch],L=new Float64Array(G*3),lap=g=>{const m=nb[g].length;for(let k=0;k<3;k++){let s=0;for(const h of nb[g])s+=X[3*h+k];L[3*g+k]=s/m-X[3*g+k];}};
 const touched=new Set(free);for(const g of free)for(const h of nb[g])touched.add(h);const ring=[...touched];
 for(let step=0;step<steps;step++){
  for(const g of ring)lap(g);
  for(const g of free){const m=nb[g].length;for(let k=0;k<3;k++){let s=0;for(const h of nb[g])s+=L[3*h+k];X[3*g+k]-=.25*(s/m-L[3*g+k]);}}
 }
 const out=[...positions];
 for(const g of free)for(const i of members[g])for(let k=0;k<3;k++)out[3*i+k]=X[3*g+k];
 const indices=free.flatMap(g=>members[g]);
 const cupIndices=[...cup].flatMap(g=>members[g]);
 return {...part,positions:out,normals:undefined,filled:{count:indices.length,cupCount:cupIndices.length,axis,rimRadius:rimRho,rimHeight:rimH,indices,cupIndices}};
}
/** The originals with their sockets filled: the starting point for every option. */
export const FILLED={hand:fillSocket(source.hand),foot:fillSocket(source.foot)};

/**
 * One variation of a part ({positions, normals, index, pivot, axes}): returns new
 * {positions, normals, index} with the same triangles.
 */
export function adjustPart(part,option){
 const {positions,pivot,axes}=part,n=positions.length/3,out=new Array(positions.length),normals=part.normals??faceNormals(part);
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

/** Surface directions averaged from the triangles around each point (after filling, the stored ones no longer fit). */
function faceNormals({positions,index}){
 const out=new Array(positions.length).fill(0);
 for(let k=0;k<index.length;k+=3){const [a,b,c]=[index[k],index[k+1],index[k+2]],P=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]],pa=P(a),pb=P(b),pc=P(c);
  const u=[pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]],v=[pc[0]-pa[0],pc[1]-pa[1],pc[2]-pa[2]],nrm=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  for(const p of [a,b,c])for(let j=0;j<3;j++)out[3*p+j]+=nrm[j];}
 for(let i=0;i<out.length;i+=3){const l=Math.hypot(out[i],out[i+1],out[i+2])||1;out[i]/=l;out[i+1]/=l;out[i+2]/=l;}
 return out;
}

/** The hand and foot for one option, in avatar space (his left side), sockets filled. */
export function buildHandFoot(option){
 return {hand:adjustPart(FILLED.hand,option),foot:adjustPart(FILLED.foot,option)};
}
