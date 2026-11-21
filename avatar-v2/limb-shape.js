// New avatar (version 2): a limb with its sockets, drawn from numbers.
//
// A limb runs from one joint centre (start) to the next (end). Its body is a
// shaft whose thickness follows a profile along its length. Each end is either
// a socket (a cup that hugs the joint ball) or a plain rounded cap.
//
// Directions around a limb: angle 0 is the limb's FRONT (the side the joint
// bends toward), 90° is the limb's outer side, 180° its back. A socket's rim
// sits at a different depth in each direction. Depth is the angle on the ball,
// measured from the direction pointing out of the limb's end:
//    0°   would cover the whole ball (closed),
//    90°  is the ball's equator (half covered),
//    180° covers nothing (the cup is cut right back).
// So a deep back and a cut-away front is, for example, back 65°, front 170°.
//
// Everything here is plain arithmetic, shared by the builder, the page and the
// checks, so what is checked is exactly what is drawn.

const TAU=Math.PI*2,RAD=Math.PI/180;
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(...a);return mul(a,1/l);};
const clamp01=v=>Math.min(1,Math.max(0,v));
const smoothstep=(a,b,v)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
/** Smooth maximum: like Math.max, with a rounded blend k wide (bulges at most k/4). */
export function smoothMax(a,b,k){if(k<=0)return Math.max(a,b);const h=clamp01(.5+.5*(a-b)/k);return b+(a-b)*h+k*h*(1-h);}

/** The limb's own frame: axis u (start to end), front f, outer side s. */
export function limbFrame(spec){
 const axis=sub(spec.end,spec.start),length=Math.hypot(...axis),u=mul(axis,1/length);
 const f=norm(sub(spec.front,mul(u,dot(spec.front,u)))),s=cross(f,u);
 return {u,f,s,length};
}
const around=(frame,theta)=>add(mul(frame.f,Math.cos(theta)),mul(frame.s,Math.sin(theta)));

/** Rim depth (degrees) in direction theta, from front/side/back values; smooth all the way round. */
export function rimDepth(rim,theta){
 const {front,side,back}=rim;
 return side+(front-back)/2*Math.cos(theta)+((front+back)/2-side)*Math.cos(2*theta);
}

/** Shaft radius at distance t from the start (profile: [[share of length, radius]...], smooth). */
function profileRadius(spec,frame,t){
 const p=spec.profile,x=t/frame.length;
 if(x<=p[0][0])return p[0][1];if(x>=p.at(-1)[0])return p.at(-1)[1];
 let i=0;while(x>p[i+1][0])i++;
 const k=smoothstep(p[i][0],p[i+1][0],x);return p[i][1]+(p[i+1][1]-p[i][1])*k;
}

/** Facts about one end: where it is along the limb and which way is "out of the end". */
function endInfo(spec,frame,which){
 const end=spec[which==='start'?'startEnd':'endEnd'],sign=which==='start'?-1:1,tc=which==='start'?0:frame.length;
 if(end.type==='socket'){const outer=end.ball+end.clearance+end.wall,inner=end.ball+end.clearance;return {...end,sign,tc,outer,inner};}
 return {...end,sign,tc};
}

/**
 * Outer radius of the limb at distance t from the start (any direction). Near a
 * socket the shaft blends into the cup's sphere and, past the joint centre,
 * only the sphere remains, so the cup curls over the ball.
 */
export function outerRadius(spec,frame,t,theta=null){
 const a=endInfo(spec,frame,'start'),b=endInfo(spec,frame,'end');
 let shaft=profileRadius(spec,frame,Math.min(frame.length,Math.max(0,t)));
 let r=shaft;
 for(const e of [a,b]){
  const d=(t-e.tc)*e.sign;// distance past this end's joint centre (negative = inside the limb)
  if(e.type==='socket'){
   const fade=e.outer*.5;
   shaft*=smoothstep(0,-fade,d);// the shaft fades out over the last half radius
   const sphere=Math.sqrt(Math.max(0,e.outer*e.outer-d*d));
   r=smoothMax(shaft,sphere,e.blend??.01);
  }else if(e.type==='cap'&&d>0){
   // Rounded cap: a quarter ellipse from the shaft down to the tip.
   r=shaft*Math.sqrt(Math.max(0,1-(d/e.length)**2));
  }
 }
 return theta===null?r:r*(1-creaseAt(spec,frame,t,theta));
}

/**
 * The crease: the limb is narrower on its bending side near a joint (like the
 * inside of a real elbow), so the two limbs can fold further before touching.
 * spec.crease: {at:'start'|'end', depth (share of the radius removed at its
 * deepest), from/to (distance from the joint centre where it is deepest and
 * where it has faded out, metres), width (degrees either side of the front it
 * reaches)}. Zero when there is no crease.
 */
export function creaseAt(spec,frame,t,theta){
 const c=spec.crease;if(!c)return 0;
 const d=Math.abs(t-(c.at==='start'?0:frame.length));
 const along=smoothstep(c.to,c.from,d);if(along<=0)return 0;
 const off=Math.abs(Math.atan2(Math.sin(theta),Math.cos(theta)))/RAD;// degrees from the front
 const across=smoothstep(c.width,c.width*.35,off);
 return c.depth*along*across;
}

/** Where the outer surface stops in direction theta at one end (t value). */
function outerLimit(spec,frame,e,theta){
 if(e.type==='socket')return e.tc+e.sign*e.outer*Math.cos(rimDepth(e.rim,theta)*RAD);
 return e.tc+e.sign*e.length;
}

/**
 * Builds the limb surface at rest in avatar space: a sealed shell (outer skin,
 * rim lip, and the inside of each cup, which the ball fills).
 * Returns {positions, index}.
 */
export function buildLimb(spec){
 const frame=limbFrame(spec),n=spec.segments??32,rows=spec.rows??44,cupRows=spec.cupRows??10;
 const ends=[endInfo(spec,frame,'start'),endInfo(spec,frame,'end')];
 const positions=[],index=[],grid=[];// grid: list of rows, each row n vertex numbers
 const vertex=p=>{positions.push(...p);return positions.length/3-1;};
 const pointAt=(t,theta,r)=>add(add(spec.start,mul(frame.u,t)),mul(around(frame,theta),r));
 const capPole=(e,radius)=>vertex(add(add(spec.start,mul(frame.u,e.tc)),mul(frame.u,-e.sign*radius)));
 // Inside of a cup: sphere `inner` around the joint centre, from the rim back to the pole.
 const cupRowsFor=(e,fromRim)=>Array.from({length:cupRows},(_,k)=>{
  const share=(fromRim?k+1:cupRows-k)/(cupRows+1);
  return Array.from({length:n},(_,j)=>{
   const theta=j/n*TAU,rim=rimDepth(e.rim,theta)*RAD,phi=rim+(Math.PI-rim)*share;
   const along=e.tc+e.sign*e.inner*Math.cos(phi),r=e.inner*Math.sin(phi);
   return vertex(pointAt(along,theta,r));
  });
 });
 const outerRows=()=>Array.from({length:rows+1},(_,k)=>Array.from({length:n},(_,j)=>{
  const theta=j/n*TAU,t0=outerLimit(spec,frame,ends[0],theta),t1=outerLimit(spec,frame,ends[1],theta);
  // Rows are packed toward the ends, where the shape curves most.
  const s=k/rows,eased=.5-.5*Math.cos(Math.PI*s),t=t0+(t1-t0)*(.35*s+.65*eased);
  return vertex(pointAt(t,theta,outerRadius(spec,frame,t,theta)));
 }));
 // Start end, from its pole outward.
 let first;
 if(ends[0].type==='socket'){first=capPole(ends[0],ends[0].inner);grid.push(...cupRowsFor(ends[0],false));}
 else first=null;
 const outer=outerRows();
 if(ends[0].type!=='socket'){first=vertex(pointAt(outerLimit(spec,frame,ends[0],0),0,0));}// cap tip
 grid.push(...outer);
 let last;
 if(ends[1].type==='socket'){grid.push(...cupRowsFor(ends[1],true));last=capPole(ends[1],ends[1].inner);}
 else last=vertex(pointAt(outerLimit(spec,frame,ends[1],0),0,0));
 // Stitch: first pole, rows, last pole. Winding faces outward.
 const fan=(pole,row,flip)=>{for(let j=0;j<n;j++){const a=row[j],b=row[(j+1)%n];flip?index.push(pole,b,a):index.push(pole,a,b);}};
 fan(first,grid[0],false);
 for(let k=0;k<grid.length-1;k++)for(let j=0;j<n;j++){
  const a=grid[k][j],b=grid[k][(j+1)%n],c=grid[k+1][j],d=grid[k+1][(j+1)%n];index.push(a,c,d,a,d,b);
 }
 fan(last,grid.at(-1),true);
 return {positions,index};
}

/**
 * Is point p (avatar space, limb at rest) inside the solid limb? Returns how
 * deep it is (metres, > 0 inside) or 0. Used by the collision checks.
 */
export function insideDepth(spec,p,frame=limbFrame(spec)){
 const d=sub(p,spec.start),t=dot(d,frame.u),radial=sub(d,mul(frame.u,t)),r=Math.hypot(...radial);
 const theta=Math.atan2(dot(radial,frame.s),dot(radial,frame.f));
 const ends=[endInfo(spec,frame,'start'),endInfo(spec,frame,'end')];
 if(t<outerLimit(spec,frame,ends[0],theta)||t>outerLimit(spec,frame,ends[1],theta))return 0;
 let depth=outerRadius(spec,frame,t,theta)-r;if(depth<=0)return 0;
 for(const e of ends)if(e.type==='socket'){
  const centre=add(spec.start,mul(frame.u,e.tc)),fromCentre=Math.hypot(...sub(p,centre));
  if(fromCentre<e.inner)return 0;// in the cup's hollow (where the ball sits)
  depth=Math.min(depth,fromCentre-e.inner);
 }
 return depth;
}
