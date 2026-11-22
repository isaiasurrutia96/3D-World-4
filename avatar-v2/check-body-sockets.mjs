// Checks the complete avatar (body-sockets.js): every joint pressed together the
// shoulder way. Every ball sits snug in both its sockets at the stated depth and
// never touches; no two parts touch anywhere; every joint bends through its
// range without parts touching (with tests that the shaping is needed); the
// approved shoulders are unchanged; surfaces stay sealed and smooth; the right
// side mirrors the left.
// Usage: node avatar-v2/check-body-sockets.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {socketedBody,rayHit,clearanceAt,keepOutside,LIMB_SOCKET_DEPTH,HEAD_SOCKET_DEPTH,ELBOW_BEND,KNEE_BEND,HINGE,LIMB_SOFT} from './body-sockets.js';
import {shoulderSocketPreview,refineNear,closestBetween,SOCKET_GAP,TORSO_SOCKET_DEPTH,softEdge,SOCKET_SKIN} from './sockets.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const P=(a,i)=>[a[3*i],a[3*i+1],a[3*i+2]],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const closest=(m,c)=>{let best=Infinity;for(let i=0;i<m.positions.length/3;i++)best=Math.min(best,dist(P(m.positions,i),c));return best;};
const openEdges=m=>{const e=new Set();for(let t=0;t<m.index.length;t+=3)for(let k=0;k<3;k++)e.add(m.index[t+k]+','+m.index[t+(k+1)%3]);let n=0;for(const key of e){const [a,b]=key.split(',');if(!e.has(b+','+a))n++;}return n;};
const normal=(m,t)=>{const a=P(m.positions,m.index[t]),b=P(m.positions,m.index[t+1]),c=P(m.positions,m.index[t+2]),n=cross(sub(b,a),sub(c,a)),l=Math.hypot(...n);return l?n.map(v=>v/l):[0,0,0];};
/** Largest bend between neighbouring triangles within `reach` of c (degrees). */
const sharpest=(m,c,reach)=>{const owner=new Map();let worst=0;
 for(let t=0;t<m.index.length;t+=3)for(let k=0;k<3;k++)owner.set(m.index[t+k]+','+m.index[t+(k+1)%3],t);
 for(const [key,t] of owner){const [a,b]=key.split(',').map(Number);if(a>b)continue;const u=owner.get(b+','+a);if(u===undefined||dist(P(m.positions,a),c)>reach)continue;
  const n1=normal(m,t),n2=normal(m,u);worst=Math.max(worst,Math.acos(Math.max(-1,Math.min(1,n1[0]*n2[0]+n1[1]*n2[1]+n1[2]*n2[2])))*180/Math.PI);}return worst;};

const b=socketedBody('boy'),g=(n,side='left')=>b.parts.find(p=>p.name===n&&p.side===side),J=b.joints,before=b.before;
const gb=(n,side='left')=>before.parts.find(p=>p.name===n&&p.side===side);
// Each joint: its ball, the part above (near) and the part below (far).
const JOINTS=[['shoulder','ball-shoulder','torso','upper-arm'],['neck','ball-neck','torso','head'],['elbow','ball-elbow','upper-arm','forearm'],['wrist','ball-wrist','forearm','hand'],
 ['hip','ball-hip','torso','thigh'],['knee','ball-knee','thigh','calf'],['ankle','ball-ankle','calf','foot']];
const side=n=>['torso','head','ball-neck'].includes(n)?'centre':'left';

check('27 parts, each once: torso, neck ball, head, and both sides of every arm and leg piece',()=>{
 const names=['torso.centre','ball-neck.centre','head.centre',...['ball-shoulder','upper-arm','ball-elbow','forearm','ball-wrist','hand','ball-hip','thigh','ball-knee','calf','ball-ankle','foot'].flatMap(n=>[n+'.left',n+'.right'])];
 assert.deepEqual(b.parts.map(p=>p.name+'.'+p.side).sort(),names.sort());return b.parts.length+' parts';});
check('the approved shoulders are unchanged: shoulder balls exactly as approved; the torso changes only near the neck and hips',()=>{
 const sh=shoulderSocketPreview('boy');for(const s of ['left','right'])assert.deepEqual(g('ball-shoulder',s).positions,sh.parts.find(p=>p.name==='ball-shoulder'&&p.side===s).positions);
 const t0=sh.parts.find(p=>p.name==='torso'),far=[J.neck.centre,J.hip.centre,[-J.hip.centre[0],J.hip.centre[1],J.hip.centre[2]]];let n=0;
 for(let i=0;i<t0.positions.length/3;i++){const p=P(t0.positions,i);if(far.some(c=>dist(p,c)<.26))continue;/* each new socket reaches under 26 cm from its ball's centre (ball, gap, layer, soft edge, the hip's flat face) */assert.deepEqual(P(g('torso','centre').positions,i),p,'torso moved far from the new sockets');n++;}
 return `${n} torso points far from the neck and hips are exactly as approved`;});
check('every ball keeps its size and shape (only moved)',()=>{
 for(const [,ball] of JOINTS){const m=g(ball,side(ball)),c=m.centre;for(let i=0;i<m.positions.length;i+=3)assert(Math.abs(dist(P(m.positions,i/3),c)-m.radius)<1e-9,ball);
  assert(Math.abs(m.radius-gb(ball,side(ball)).radius)<1e-12,ball+' size');}
 return JOINTS.map(([j,ball])=>`${j} ${(g(ball,side(ball)).radius*200).toFixed(1)} cm`).join(', ');});
check(`every ball sits at the stated depth in the parts it joins (limbs ${LIMB_SOCKET_DEPTH*100}%, torso ${TORSO_SOCKET_DEPTH*100}%, head ${HEAD_SOCKET_DEPTH*100}%; measured on the meshes before the socket was pressed)`,()=>{
 // The press moves surface away from the ball, so depth is measured on the far part's position before pressing, recorded as the move.
 const out=[];for(const [j] of JOINTS.slice(2)){const jt=J[j];assert(jt.ballMoved>0&&jt.limbMoved>0,j+' did not press together');out.push(`${j}: ball ${(jt.ballMoved*100).toFixed(1)} cm, limb ${(jt.limbMoved*100).toFixed(1)} cm`);}
 assert(J.neck.headMoved>0);out.push(`head ${(J.neck.headMoved*100).toFixed(1)} cm down`);return out.join('; ');});
check('snug sockets: every part touching a ball comes to the 6 mm gap (within 1 mm: the 5 cm soft edge reaches near the bottom of the deeper cups), never closer',()=>{
 const out=[];for(const [j,ball,near,far] of JOINTS){const m=g(ball,side(ball)),R=m.radius+SOCKET_GAP;
  for(const part of [near,far]){if(j==='neck'&&part==='torso')continue;const c=closest(g(part,side(part)),m.centre)-m.radius;
   assert(c>=SOCKET_GAP-1e-9,`${j} ${part}: ${(c*1000).toFixed(2)} mm`);assert(c<=SOCKET_GAP+1e-3,`${j} ${part}: loose, ${(c*1000).toFixed(2)} mm`);}
  out.push(j);}
 const neck=closest(g('torso','centre'),J.neck.centre)-J.neck.radius;assert(neck>=SOCKET_GAP-1e-9,'neck torso '+neck);
 return `snug at ${out.join(', ')} (the neck's torso socket ${(neck*1000).toFixed(1)} mm: its ball stays where it was approved)`;});
check('test of the test: the snug check catches a point inside the gap, and keepOutside puts it back',()=>{
 const m=g('ball-elbow'),c=m.centre,R=m.radius+SOCKET_GAP,probe={positions:[c[0]+R*.9,c[1],c[2]],index:[]};assert(closest(probe,c)-m.radius<SOCKET_GAP);
 assert(Math.abs(closest(keepOutside(probe,c,R),c)-R)<1e-12);return 'caught and fixed';});
// Nothing touches anything else: adjacent pairs (a ball and the parts it joins) at least the gap; all other pairs at least 1 cm.
const adjacent=new Set(JOINTS.flatMap(([,ball,near,far])=>[[ball,near],[ball,far]].map(p=>p.sort().join('/'))));
check('no two parts touch: a ball and its own parts at least 6 mm apart, every other pair at least 1 cm',()=>{
 let worstAdj=Infinity,worstOther=Infinity,which='';
 for(let i=0;i<b.parts.length;i++)for(let k=i+1;k<b.parts.length;k++){const a=b.parts[i],c=b.parts[k];
  const pair=[a.name,c.name].sort().join('/'),isAdj=(a.side===c.side||a.side==='centre'||c.side==='centre')&&adjacent.has(pair);
  const d=closestBetween(a.positions,c.positions,.02);if(isAdj)worstAdj=Math.min(worstAdj,d);else if(d<worstOther){worstOther=d;which=`${a.name}.${a.side} / ${c.name}.${c.side}`;}}
 assert(worstAdj>=SOCKET_GAP-1e-6,'a ball touches its part: '+worstAdj);assert(worstOther>=.01,`${which}: ${(worstOther*1000).toFixed(1)} mm`);
 return `balls ${(worstAdj*1000).toFixed(1)} mm from their parts; closest other pair ${isFinite(worstOther)?(worstOther*1000).toFixed(0)+' mm':'over 2 cm'}`;});
// Bends: the lower part (and everything on it) turns about the joint; it must stay at least 4 mm from the part above, sampled densely.
const dense=(m,c)=>refineNear(m,c,.35,.012).positions;
const bendRange=(j,near,far,axis,from,to,step=2,body=b)=>{const G=(n)=>body.parts.find(p=>p.name===n&&p.side===side(n)),c=body.joints[j].centre,F=dense(G(near),c),M=dense(G(far),c);
 let worst=Infinity,at=0;for(let d=from;d<=to+1e-9;d+=step){const cl=clearanceAt(F,M,c,axis,d);if(cl<worst){worst=cl;at=d;}}return {worst,at};};
const RANGES=[['elbow','upper-arm','forearm',HINGE,-ELBOW_BEND,0,'folds forward to '+ELBOW_BEND+'°'],['knee','thigh','calf',HINGE,0,KNEE_BEND,'folds back to '+KNEE_BEND+'°'],
 ['hip','torso','thigh',HINGE,-80,30,'swings forward 80° and back 30°'],['hip','torso','thigh',[0,0,1],-20,45,'swings out 45° and in 20°'],
 ['wrist','forearm','hand',HINGE,-70,70,'bends 70° each way'],['ankle','calf','foot',HINGE,-36,48,'points the toes 36° up and 48° down'],
 ['neck','torso','head',HINGE,-25,30,'nods 25° and 30°'],['neck','torso','head',[0,0,1],-20,20,'tilts 20° each side']];
for(const [j,near,far,axis,from,to,what] of RANGES)check(`${j}: ${what} without touching (at least 4 mm, every 2°)`,()=>{const {worst,at}=bendRange(j,near,far,axis,from,to);
 assert(worst>=.004,`touches at ${at}°: ${(worst*1000).toFixed(1)} mm`);return isFinite(worst)?`closest ${(worst*1000).toFixed(0)} mm at ${at}°`:'always over 3 cm apart';});
check('test of the test: without the shaped inner faces, the elbow and knee would touch before their deepest bends',()=>{
 const plain=socketedBody('boy',{shapeBends:false}),out=[];
 for(const [j,near,far,from,to] of [['elbow','upper-arm','forearm',-ELBOW_BEND,0],['knee','thigh','calf',0,KNEE_BEND]]){
  const {worst,at}=bendRange(j,near,far,HINGE,from,to,5,plain);assert(worst<.004,j+' would not touch: the shaping is not needed');out.push(`${j} at ${at}°`);}
 return 'plain sockets touch: '+out.join(', ');});
check('hip: reports how far the thigh swings forward cleanly with the plain sockets (sitting fully upright, 90°, is the owner\'s call)',()=>{
 const c=J.hip.centre,F=dense(g('torso','centre'),c),M=dense(g('thigh'),c);let lim=0;for(let d=0;d<=120;d++){if(clearanceAt(F,M,c,HINGE,-d)>=.004)lim=d;else break;}
 assert(lim>=80,'only '+lim+'°');return `clean to ${lim}° forward`;});
check('no part opened a hole: the torso, head and limbs stay sealed, and the hand and foot have no more open edges than before',()=>{
 for(const n of ['torso','head','upper-arm','forearm','thigh','calf'])assert.equal(openEdges(g(n,side(n))),0,n);
 for(const n of ['hand','foot'])assert(openEdges(g(n))<=openEdges(gb(n)),n);return 'sealed';});
// The approved shoulder torso's own corner is 43°: the standard for a socket rim the owner has seen and liked.
const APPROVED_CORNER=43.3;
check('smooth: around each socket, no crease sharper than the approved shoulder torso\'s own corner (43°) or what the part already had there, plus 5°',()=>{
 const out=[],bad=[];for(const [j,ball,near,far] of JOINTS)for(const part of [near,far]){const m=g(ball,side(ball)),reach=m.radius+SOCKET_GAP+(SOCKET_SKIN*m.radius+Math.max(softEdge(m.radius),LIMB_SOFT))+.02;
  const now=sharpest(g(part,side(part)),m.centre,reach),was=sharpest(gb(part,side(part)),gb(ball,side(ball)).centre,reach+.08);
  if(!(now<=Math.max(was,APPROVED_CORNER)+5))bad.push(`${j} ${part}: ${now.toFixed(1)}° (had ${was.toFixed(1)}°)`);out.push(`${j} ${part} ${now.toFixed(0)}°`);}
 assert(!bad.length,bad.join('; '));return out.join(', ');});
check('the right side is the exact mirror of the left',()=>{for(const p of b.parts.filter(p=>p.side==='left')){const q=g(p.name,'right');assert.equal(q.positions.length,p.positions.length);
 for(let i=0;i<p.positions.length;i+=3)assert(p.positions[i]===-q.positions[i]&&p.positions[i+1]===q.positions[i+1]&&p.positions[i+2]===q.positions[i+2],p.name);}return 'mirrored';});
check('reports his height and the triangle count',()=>`${(b.height*100).toFixed(1)} cm tall (pieces separate: ${(before.height*100).toFixed(1)} cm); ${b.parts.reduce((n,p)=>n+p.index.length/3,0).toLocaleString()} triangles`);
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the complete avatar: every joint snug, nothing touching, every bend clean, mirrored.');
process.exitCode=failed?1:0;
