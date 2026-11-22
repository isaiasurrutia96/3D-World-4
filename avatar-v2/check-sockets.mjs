// Checks the sockets (sockets.js): the shoulder for now. The ball sinks the
// stated depth into the torso and the upper arm; both take the ball's shape as
// snug sockets (the gap all round, nothing ever inside it, tested on points and
// on triangle middles); the surfaces stay sealed and smooth with no folded
// triangles; only the parts near the ball change; the right side mirrors the left.
// Usage: node avatar-v2/check-sockets.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {shoulderSocketPreview,refineNear,press,pointNormals,SOCKET_GAP,SOCKET_DEPTH,TORSO_SOCKET_DEPTH,SOCKET_SOFT,SOCKET_SKIN,softEdge} from './sockets.js';
import {insideTorso} from './assembly.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const P=(arr,i)=>[arr[3*i],arr[3*i+1],arr[3*i+2]],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(m,t)=>{const a=P(m.positions,m.index[t]),b=P(m.positions,m.index[t+1]),c=P(m.positions,m.index[t+2]),n=cross(sub(b,a),sub(c,a)),l=Math.hypot(...n);return n.map(v=>v/l);};
/** Closest any point comes to `c`. */
const closest=(m,c)=>{let best=Infinity;for(let i=0;i<m.positions.length/3;i++)best=Math.min(best,dist(P(m.positions,i),c));return best;};
/** Closest any triangle middle comes to `c` (a flat triangle sags a fraction of a millimetre inside a curved cup). */
const closestMiddle=(m,c)=>{let best=Infinity;for(let t=0;t<m.index.length;t+=3){const a=P(m.positions,m.index[t]),b=P(m.positions,m.index[t+1]),d=P(m.positions,m.index[t+2]);best=Math.min(best,dist([(a[0]+b[0]+d[0])/3,(a[1]+b[1]+d[1])/3,(a[2]+b[2]+d[2])/3],c));}return best;};
/** Every edge shared by exactly two triangles, in opposite directions (a sealed surface, no cracks). */
const sealed=m=>{const e=new Map();for(let t=0;t<m.index.length;t+=3)for(let k=0;k<3;k++){const a=m.index[t+k],b=m.index[t+(k+1)%3],key=a+','+b;assert(!e.has(key),'edge used twice the same way');e.set(key,1);}
 for(const key of e.keys()){const [a,b]=key.split(',');assert(e.has(b+','+a),'open edge '+key);}return e.size/2;};
/** Largest bend between neighbouring triangles within `reach` of c (degrees). */
const sharpest=(m,c,reach)=>{const owner=new Map();let worst=0;
 for(let t=0;t<m.index.length;t+=3)for(let k=0;k<3;k++){const a=m.index[t+k],b=m.index[t+(k+1)%3];owner.set(a+','+b,t);}
 for(const [key,t] of owner){const [a,b]=key.split(',').map(Number);if(a>b)continue;const u=owner.get(b+','+a);if(u===undefined||dist(P(m.positions,a),c)>reach)continue;
  const n1=normal(m,t),n2=normal(m,u);worst=Math.max(worst,Math.acos(Math.max(-1,Math.min(1,n1[0]*n2[0]+n1[1]*n2[1]+n1[2]*n2[2])))*180/Math.PI);}return worst;};

const s=shoulderSocketPreview('boy'),get=(n,side)=>s.parts.find(p=>p.name===n&&p.side===side);
const torso=get('torso','centre'),ball=get('ball-shoulder','left'),arm=get('upper-arm','left'),C=s.ball.centre,r=s.ball.radius,R=r+SOCKET_GAP;
const C2=[-C[0],C[1],C[2]];

check('five parts: torso, two shoulder balls, two upper arms',()=>{assert.deepEqual(s.parts.map(p=>p.name+'.'+p.side).sort(),['ball-shoulder.left','ball-shoulder.right','torso.centre','upper-arm.left','upper-arm.right']);return 'torso · balls · upper arms';});
check('the ball is the same ball (same size), only moved in toward the torso',()=>{
 for(let i=0;i<ball.positions.length;i+=3)assert(Math.abs(dist(P(ball.positions,i/3),C)-r)<1e-9);
 assert(s.inward>0);return `ball ${(r*200).toFixed(1)} cm wide, moved ${(s.inward*100).toFixed(1)} cm in`;});
check(`the ball sinks ${Math.round(TORSO_SOCKET_DEPTH*100)}% of its radius into the torso (shallower than the arm's ${Math.round(SOCKET_DEPTH*100)}%; measured on the torso's own shape)`,()=>{
 assert.equal(TORSO_SOCKET_DEPTH,.25);assert(TORSO_SOCKET_DEPTH<SOCKET_DEPTH);
 let deepest=-Infinity;for(let i=0;i<ball.positions.length;i+=3)deepest=Math.max(deepest,insideTorso(s.torsoShape,P(ball.positions,i/3)));
 assert(Math.abs(deepest-s.torsoDepth)<.002,'sinks '+deepest);return `${(deepest*100).toFixed(1)} cm into the torso`;});
check(`the ball sinks ${Math.round(SOCKET_DEPTH*100)}% of its radius into the upper arm's top end; the arm only moved, up its own line`,()=>{
 const tipDepth=r-dist(arm.top,C);assert(Math.abs(tipDepth-s.depth)<1e-9);
 const d=arm.direction,along=sub(arm.top,C);const off=cross(along,d);assert(Math.hypot(...off)<1e-9,'arm off its line');
 return `${(tipDepth*100).toFixed(1)} cm; arm moved ${(s.armUp*100).toFixed(1)} cm up`;});
check('snug sockets: the torso and the upper arm come to the gap from the ball (within 0.5 mm), never closer (triangle middles within 0.5 mm)',()=>{
 const out=[];for(const [name,m,c] of [['torso',torso,C],['torso (right)',torso,C2],['upper arm',arm,C]]){const g=closest(m,c)-r,gm=closestMiddle(m,c)-r;
  assert(g>=SOCKET_GAP-1e-9,`${name}: only ${(g*1000).toFixed(2)} mm from the ball`);assert(g<=SOCKET_GAP+5e-4,`${name}: loose, ${(g*1000).toFixed(2)} mm`);/* the cup's deepest spot can fall between points */
  assert(gm>=SOCKET_GAP-5e-4,`${name}: a triangle comes ${(gm*1000).toFixed(2)} mm from the ball`);out.push(`${name} ${(g*1000).toFixed(1)} mm (middles ${(gm*1000).toFixed(1)})`);}
 return out.join(', ');});
check('test of the test: a ball pushed in with no socket made is caught as inside the part',()=>{
 const g=closest(s.armMoved,C)-r;assert(g<0,'not caught');return `without a socket the arm would be ${(-g*1000).toFixed(0)} mm inside the ball`;});
check('the torso and upper arms are still sealed surfaces (no cracks or holes)',()=>`torso ${sealed(torso)} edges, arm ${sealed(arm)} edges`);
check('smooth: the sockets add no crease sharper than the part already had nearby (+5°), and nothing folds',()=>{
 const out=[],reach=R+(SOCKET_SKIN+SOCKET_SOFT)*r+.02;for(const [name,m,before,c] of [['torso',torso,s.before.torso,C],['arm',arm,s.armMoved,C]]){const a=sharpest(m,c,reach),was=sharpest(before,c,reach+.05);
  assert(a<Math.max(was,30)+5,`${name}: ${a.toFixed(1)}° bend (the part had ${was.toFixed(1)}°)`);out.push(`${name} sharpest ${a.toFixed(1)}° (had ${was.toFixed(1)}°)`);}
 return out.join(', ');});
check('test of the test: the crease check catches a fold',()=>{const m={positions:[0,0,0,1,0,0,0,1,0,0,1,.05],index:[0,1,2,0,3,1]};/* the second triangle lies folded back over the first */assert(sharpest(m,[0,0,0],5)>150);return 'a folded pair is caught';});
check('only the parts near the ball change (every point further away is exactly where it was)',()=>{
 for(const [m,before,centres] of [[torso,s.before.torso,[C,C2]],[arm,s.armMoved,[C]]]){const n=before.positions.length/3;
  for(let i=0;i<n;i++){const p=P(before.positions,i);if(centres.some(c=>dist(p,c)<R+(SOCKET_SKIN+SOCKET_SOFT)*r+1e-9))continue;assert.deepEqual(P(m.positions,i),p);}}
 return 'unchanged outside the socket';});
check('the right side is the exact mirror of the left (balls, arms and both torso sockets)',()=>{
 for(const n of ['ball-shoulder','upper-arm']){const a=get(n,'left'),b=get(n,'right');for(let i=0;i<a.positions.length;i+=3)assert(a.positions[i]===-b.positions[i]&&a.positions[i+1]===b.positions[i+1]);}
 const gl=closest(torso,C)-r,gr=closest(torso,C2)-r;assert(Math.abs(gl-gr)<1e-4,'torso sockets differ by '+Math.abs(gl-gr));/* the two sides' triangles split in a slightly different pattern */return 'mirrored (both torso sockets equally snug)';});
check('refining keeps every old point, stays sealed, and puts new points on the smooth surface (a curve, not the old flat triangles)',()=>{
 const m=refineNear(s.before.torso,C,.2,.012);assert.equal(m.positions.slice(0,s.before.torso.positions.length).join(),s.before.torso.positions.join());sealed(m);
 // Test on a coarse 8-sided tube of radius 1: flat midpoints would sit at 0.924; smooth ones on the circle.
 const n=8,pos=[],idx=[],nor=[];for(let i=0;i<n;i++){const a=i/n*2*Math.PI;pos.push(Math.cos(a),Math.sin(a),0,Math.cos(a),Math.sin(a),1);nor.push(Math.cos(a),Math.sin(a),0,Math.cos(a),Math.sin(a),0);}
 for(let i=0;i<n;i++){const a=2*i,b=2*((i+1)%n);idx.push(a,b,a+1,b,b+1,a+1);}
 const t=refineNear({positions:pos,index:idx,normals:nor},[0,0,.5],10,.5);let lo=9;for(let i=pos.length;i<t.positions.length;i+=3)lo=Math.min(lo,Math.hypot(t.positions[i],t.positions[i+1]));
 assert(lo>.99,'new points off the curve: '+lo);return `${s.before.torso.index.length/3} → ${m.index.length/3} triangles near one ball; tube test radius ≥ ${lo.toFixed(3)} (flat would be 0.924)`;});
check('refining carries smooth surface directions: every new point gets a unit direction blended from its edge',()=>{
 const base={...s.before.torso,normals:pointNormals(s.before.torso)},m=refineNear(base,C,.2,.012);
 assert.equal(m.normals.length,m.positions.length);for(let i=0;i<m.normals.length;i+=3)assert(Math.abs(Math.hypot(m.normals[i],m.normals[i+1],m.normals[i+2])-1)<1e-9);
 assert.deepEqual(m.normals.slice(0,base.normals.length),base.normals);return `${m.normals.length/3} points, all unit length; old points unchanged`;});
check('press never moves a point closer to the ball than it was, or closer than the gap',()=>{
 const pts=[];for(let q=0.001;q<.3;q+=.001)pts.push(C[0]+q,C[1],C[2]);const m=press({positions:pts,index:[]},C,R,softEdge(r));/* no skin: plain points */
 for(let i=0;i<pts.length;i+=3){const before=pts[i]-C[0],after=m.positions[i]-C[0];assert(after>=before-1e-12&&after>=R-1e-12);}return 'checked along a line from the centre';});
check('reports the triangle cost of the sockets',()=>`torso ${s.triangles.torso[0]} → ${s.triangles.torso[1]}, each upper arm ${s.triangles.arm[0]} → ${s.triangles.arm[1]}`);
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the shoulder sockets are snug, smooth, sealed and mirrored (every other socket: check-body-sockets.mjs).');
process.exitCode=failed?1:0;
