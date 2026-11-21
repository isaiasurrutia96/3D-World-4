// New avatar (version 2): shared measuring tools for the shape checks, so the
// torso, limb and future checks all measure dents and grooves the same way.
const TAU=Math.PI*2;

/** The tightest outline with no hollows around 2D points (Andrew's monotone chain). */
export function convexOutline(points){
 const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
 for(const q of p){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}
 for(const q of p.reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}
 return lo.slice(0,-1).concat(hi.slice(0,-1));
}
/** Distance from the centre to an outline along direction (dx, dz). */
export function outlineRadius(poly,dx,dz){
 let best=0;
 for(let i=0;i<poly.length;i++){const [ax,az]=poly[i],[bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
  const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-9&&u<=1+1e-9)best=Math.max(best,t);}
 return best;
}
/**
 * How far a ring shape sinks in. dent: how far any point of a ring lies inside
 * that ring's convex outline (a flat side scores 0; a hollow of any width is
 * caught). groove: a ring sunk below the rings `span` above and below.
 */
export function smoothness(shape,span=2){
 let dent=0,groove=0;const R=shape.rings,n=shape.segments;
 for(const ring of R){
  const dirs=ring.r.map((_,s)=>[Math.cos(s/n*TAU),Math.sin(s/n*TAU)]),hull=convexOutline(ring.r.map((r,s)=>[r*dirs[s][0],r*dirs[s][1]]));
  ring.r.forEach((r,s)=>{dent=Math.max(dent,outlineRadius(hull,...dirs[s])-r);});
 }
 for(let s=0;s<n;s++)for(let i=span;i<R.length-span;i++)groove=Math.max(groove,Math.min(R[i-span].r[s],R[i+span].r[s])-R[i].r[s]);
 return {dent,groove};
}
