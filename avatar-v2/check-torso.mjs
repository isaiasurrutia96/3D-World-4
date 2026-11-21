// Checks the one-piece torso (avatar-v2/torso.json drawn by torso-shape.js),
// the shape tools in torso-variants.js (bumps, detail, basedOn), and every
// torso option of both rounds (round 1 body types, round 2 athletic torsos).
// Usage: node avatar-v2/check-torso.mjs   (npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildTorsoSurface} from './torso-shape.js';
import {FIRST_OPTIONS,ATHLETIC_OPTIONS,TORSO_OPTIONS,CHOSEN_TORSO,makeTorsoOption,curveAt,resolveOption,resampleShape,expandBumps,bumpAt,ringAt} from './torso-variants.js';

const torso=JSON.parse(await readFile('avatar-v2/torso.json','utf8'));
const source=JSON.parse(await readFile('avatar-v2/torso-source.json','utf8'));
const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const range=values=>Math.max(...values)-Math.min(...values);
const axis=(positions,k)=>positions.filter((_,i)=>i%3===k);

// The clean torso itself.
check('one piece: a single part with no separate chest and pelvis',()=>{
 assert.equal(torso.kind,'torso-shape');assert(!('parts' in torso),'still has separate parts');return 'one surface';
});
check('same size as the old torso: height and width within 2 cm',()=>{
 const {positions}=buildTorsoSurface(torso.shape),old=source.parts.flatMap(p=>p.positions);
 assert(Math.abs(range(axis(old,1))-range(axis(positions,1)))<.02,'height');assert(Math.abs(range(axis(old,0))-range(axis(positions,0)))<.02,'width');
 return `height ${range(axis(positions,1)).toFixed(3)} m, width ${range(axis(positions,0)).toFixed(3)} m`;
});
check('attach points kept for the arms and legs',()=>{const bones=torso.attach.map(a=>a.bone).sort().join(' ');assert.equal(bones,'thigh.L thigh.R upperArm.L upperArm.R');return bones;});
check('round 1 Original is exactly the clean torso',()=>{
 assert.equal(FIRST_OPTIONS[0].id,'original');assert.deepEqual(makeTorsoOption(torso.shape,FIRST_OPTIONS[0],FIRST_OPTIONS).rings.map(r=>r.r),torso.shape.rings.map(r=>r.r.map(v=>+v.toFixed(5))));
 return 'identical to torso.json';
});
check('round 2 starts with round 1\'s Athletic unchanged',()=>{
 const {id,label,note,...a}=ATHLETIC_OPTIONS[0],{id:i2,label:l2,note:n2,...b}=FIRST_OPTIONS.find(o=>o.id==='athletic');
 assert.deepEqual(a,b);return 'same numbers';
});
check('the chosen torso is exactly Athletic at the light detail, and it is what the page shows',()=>{
 const {id,label,note,detail,...a}=CHOSEN_TORSO,{id:i2,label:l2,note:n2,...b}=FIRST_OPTIONS.find(o=>o.id==='athletic');
 assert.deepEqual(a,b,'shape settings differ from Athletic');
 assert.deepEqual(detail,resolveOption(ATHLETIC_OPTIONS.find(o=>o.id==='athletic-light'),ATHLETIC_OPTIONS).detail,'detail differs from the light setting');
 assert.deepEqual(TORSO_OPTIONS,[CHOSEN_TORSO]);return 'Athletic numbers, light detail '+JSON.stringify(detail);
});
for(const [round,list] of [['round 1',FIRST_OPTIONS],['round 2',ATHLETIC_OPTIONS]])check(`${round}: five options, unique ids, labels, notes and valid settings`,()=>{
 assert.equal(list.length,5);assert.equal(new Set(list.map(o=>o.id)).size,5);
 for(const raw of list){const o=resolveOption(raw,list);assert(o.label&&o.note,o.id);
  for(const c of [o.width,o.front,o.back].filter(Boolean))assert(c.every(([h,v],i)=>h>=0&&h<=1&&v>.5&&v<1.5&&(i===0||h>c[i-1][0])),o.id+' curve');
  assert((o.round??0)>=0&&(o.round??0)<=1&&(o.square??0)>=0&&(o.square??0)<=1,o.id+' round/square');
  for(const b of o.bumps??[])assert(b.h>=0&&b.h<=1&&b.hSpread>0&&b.aSpread>0&&b.aSpread<=180&&b.amount>0&&b.amount<=.05,o.id+' bump');
  if(o.detail)assert(o.detail.segments%2===0&&o.detail.segments>=8&&o.detail.rings>=2,o.id+' detail');
  if(o.shoulderRoll)assert(o.shoulderRoll.from>0&&o.shoulderRoll.from<1&&o.shoulderRoll.neck>.03&&o.shoulderRoll.neck<.25,o.id+' shoulderRoll');}
 return list.map(o=>o.id).join(', ');
});
check('tool: basedOn fills in settings, and catches loops and missing options',()=>{
 const list=[{id:'a',label:'A',note:'n',width:[[0,1.1],[1,1]],bumps:[{h:.5,hSpread:.1,angle:90,aSpread:20,amount:.01}]},{id:'b',basedOn:'a',label:'B',note:'n',detail:{segments:16,rings:8}}];
 const b=resolveOption(list[1],list);assert.deepEqual(b.width,list[0].width);assert.deepEqual(b.bumps,list[0].bumps);assert.equal(b.label,'B');assert(!('basedOn' in b));
 assert.throws(()=>resolveOption({id:'x',basedOn:'y'},[{id:'y',basedOn:'x'},{id:'x',basedOn:'y'}]),/loops/);
 assert.throws(()=>resolveOption({id:'x',basedOn:'nope'},[]),/missing/);return 'ok';
});
check('tool: a bump raises the surface by exactly its amount at its centre, and mirrors to the other side',()=>{
 const bump={h:.6,hSpread:.1,angle:62,aSpread:20,amount:.017,mirror:true},both=expandBumps([bump]);
 assert.equal(both.length,2);assert.equal(both[1].angle,118);
 const peak=bumpAt([{...bump,mirror:false}],.6,62*Math.PI/180);assert(Math.abs(peak-.017)<1e-12,'peak '+peak);
 assert(bumpAt(both,.6,30*Math.PI/180)<.017*.2,'too wide');assert(Math.abs(bumpAt(both,.6,62*Math.PI/180)-bumpAt(both,.6,118*Math.PI/180))<1e-12,'not mirrored');
 return 'peak 17.0 mm, mirrored at 118°';
});
check('tool: detail at the same counts changes nothing; at other counts the ends stay put',()=>{
 const same=resampleShape(torso.shape,{segments:torso.shape.segments,rings:torso.shape.rings.length});
 let worst=0;same.rings.forEach((ring,k)=>ring.r.forEach((r,s)=>{worst=Math.max(worst,Math.abs(r-torso.shape.rings[k].r[s]));}));
 assert(worst<2e-5,'changed '+worst);
 const light=resampleShape(torso.shape,{segments:16,rings:9});assert.equal(light.rings.length,9);assert.equal(light.segments,16);
 assert.equal(light.rings[0].y,torso.shape.rings[0].y);assert.equal(light.rings.at(-1).y,torso.shape.rings.at(-1).y);
 assert.throws(()=>resampleShape(torso.shape,{segments:15,rings:9}),/even/);return 'ok';
});
check('curves are smooth and pass through their points',()=>{
 const c=[[0,1],[.5,1.2],[1,.9]];assert.equal(curveAt(c,0),1);assert.equal(curveAt(c,.5),1.2);assert.equal(curveAt(c,1),.9);assert.equal(curveAt(c,-1),1);assert.equal(curveAt(c,2),.9);
 const mid=curveAt(c,.25);assert(mid>1&&mid<1.2);return 'ok';
});

/**
 * How far the surface sinks in. dent: how far any point of a ring lies inside
 * that ring's convex outline (the tightest outline with no hollows), so a flat
 * side scores 0 and a hollow of any width is caught. groove: a ring sunk below
 * the rings 2 above and 2 below.
 */
function convexOutline(points){// Andrew's monotone chain
 const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
 for(const q of p){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}
 for(const q of p.reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}
 return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function outlineRadius(poly,dx,dz){// distance from the centre to the outline along (dx,dz)
 let best=0;
 for(let i=0;i<poly.length;i++){const [ax,az]=poly[i],[bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
  const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-9&&u<=1+1e-9)best=Math.max(best,t);}
 return best;
}
function smoothness(shape){
 let dent=0,groove=0;const R=shape.rings,n=shape.segments;
 for(const ring of R){
  const dirs=ring.r.map((_,s)=>[Math.cos(s/n*Math.PI*2),Math.sin(s/n*Math.PI*2)]),hull=convexOutline(ring.r.map((r,s)=>[r*dirs[s][0],r*dirs[s][1]]));
  ring.r.forEach((r,s)=>{dent=Math.max(dent,outlineRadius(hull,...dirs[s])-r);});
 }
 for(let s=0;s<n;s++)for(let i=2;i<R.length-2;i++)groove=Math.max(groove,Math.min(R[i-2].r[s],R[i+2].r[s])-R[i].r[s]);
 return {dent,groove};
}
check('the smoothness test catches a real dent and a real groove (test of the test)',()=>{
 const mid=Math.floor(torso.shape.rings.length/2),narrow=structuredClone(torso.shape),wide=structuredClone(torso.shape),grooved=structuredClone(torso.shape);
 narrow.rings[mid].r[5]-=.02;// 2 cm, one direction wide
 for(let k=-2;k<=2;k++)wide.rings[mid].r[(12+k+48)%48]-=.03*Math.cos(k/3*Math.PI/2)**2;// 3 cm deep, 30° wide, smooth (socket-like hollow)
 for(const s of grooved.rings[mid].r.keys())grooved.rings[mid].r[s]-=.006;
 const a=smoothness(narrow),b=smoothness(wide),g=smoothness(grooved);
 assert(a.dent>=.01,'missed a narrow 2 cm dent ('+(a.dent*1000).toFixed(1)+' mm)');assert(b.dent>=.01,'missed a socket-like 3 cm dent ('+(b.dent*1000).toFixed(1)+' mm)');assert(g.groove>=.003,'missed a 6 mm groove');
 return `narrow dent seen ${(a.dent*1000).toFixed(0)} mm, wide ${(b.dent*1000).toFixed(0)} mm, groove ${(g.groove*1000).toFixed(0)} mm`;
});

/** Radius of a shape at height y, direction a (between its rings and directions). */
function radiusAt(shape,y,a){
 const R=shape.rings;let i=0;while(i<R.length-2&&R[i+1].y<y)i++;
 const t=Math.min(1,Math.max(0,(y-R[i].y)/(R[i+1].y-R[i].y)));return ringAt(R[i].r,a)*(1-t)+ringAt(R[i+1].r,a)*t;
}
/** Largest and average gap between two shapes, measured at shape a's own points. */
function gap(a,b){let max=0,sum=0,count=0;for(const ring of a.rings)ring.r.forEach((r,s)=>{const d=Math.abs(r-radiusAt(b,ring.y,s/a.segments*Math.PI*2));max=Math.max(max,d);sum+=d;count++;});return {max,avg:sum/count};}

// Every option of both rounds must be a proper, sealed, smooth torso.
const rounds=[['R1',FIRST_OPTIONS],['R2',ATHLETIC_OPTIONS],['R3',TORSO_OPTIONS]];
const builtBy=Object.fromEntries(rounds.map(([tag,list])=>[tag,list.map(o=>{const shape=makeTorsoOption(torso.shape,o,list);return {o,list,shape,...buildTorsoSurface(shape)};})]));
const baseHeight=range(axis(builtBy.R1[0].positions,1));
for(const [tag] of rounds)for(const {o,shape,positions,index} of builtBy[tag]){
 const name=tag+' '+o.label;
 check(`${name}: every number is real and every radius positive`,()=>{
  assert(positions.every(Number.isFinite));assert(shape.rings.every(r=>r.r.every(v=>Number.isFinite(v)&&v>0)));return positions.length/3+' points';
 });
 check(`${name}: sealed and consistent (no holes, no flipped triangles)`,()=>{
  const edges=new Map(),directed=new Set();
  for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){
   const a=index[i+k],b=index[i+(k+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);
   const d=a+'>'+b;assert(!directed.has(d),'flipped triangle');directed.add(d);
  }
  const bad=[...edges.values()].filter(n=>n!==2).length;assert.equal(bad,0,bad+' open edges');return edges.size+' edges';
 });
 check(`${name}: faces out, torso-sized volume`,()=>{
  let v=0;const p=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]];
  for(let i=0;i<index.length;i+=3){const a=p(index[i]),b=p(index[i+1]),c=p(index[i+2]);v+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
  assert(v>.03&&v<.15,(v*1000).toFixed(1)+' litres');return (v*1000).toFixed(1)+' litres';
 });
 check(`${name}: smooth (no dent over 1 cm around, no groove over 3 mm up)`,()=>{
  const {dent,groove}=smoothness(shape);
  assert(dent<.01,'dent '+(dent*1000).toFixed(1)+' mm');assert(groove<.003,'groove '+(groove*1000).toFixed(1)+' mm');
  return `dent ${(dent*1000).toFixed(1)} mm, groove ${(groove*1000).toFixed(1)} mm`;
 });
 check(`${name}: same height as the original`,()=>{const h=range(axis(positions,1));assert(Math.abs(h-baseHeight)<1e-6);return h.toFixed(3)+' m';});
 check(`${name}: left and right match (mirror within 5 mm)`,()=>{
  // Direction s and its mirror (n/2 - s) must have nearly the same radius.
  let worst=0;const n=shape.segments;for(const ring of shape.rings)for(let s=0;s<n;s++)worst=Math.max(worst,Math.abs(ring.r[s]-ring.r[((n/2-s)%n+n)%n]));
  assert(worst<.005,(worst*1000).toFixed(1)+' mm');return 'within '+(worst*1000).toFixed(1)+' mm';
 });
 check(`${name}: phone-ready (under 6,000 triangles; light versions at their target)`,()=>{
  const n=shape.segments,rows=shape.rings.length+2*(shape.capRings??4),expected=(rows-1)*n*2+2*n;
  assert.equal(index.length/3,expected,'triangle count does not match its detail');assert(index.length/3<6000);return index.length/3+' triangles';
 });
}
// Light versions must still look like the option they are based on.
// Limits as a share of the torso's width (about 0.6 m): the light version must
// look the same at normal viewing distance (1%, 6 mm); the lightest exists to
// show visible facets, so it may differ more (2.5%, 15 mm).
const LIGHT_LIMIT={'athletic-light':.006,'athletic-lightest':.015};
for(const item of builtBy.R2.filter(b=>b.o.detail&&b.o.basedOn)){
 check(`R2 ${item.o.label}: stays close to the full version (largest gap under ${LIGHT_LIMIT[item.o.id]*1000} mm)`,()=>{
  const full=builtBy.R2.find(b=>b.o.id===item.o.basedOn),g=gap(full.shape,item.shape);
  assert(LIGHT_LIMIT[item.o.id],'no limit set for '+item.o.id);
  assert(g.max<=LIGHT_LIMIT[item.o.id],`largest gap ${(g.max*1000).toFixed(1)} mm`);
  return `largest ${(g.max*1000).toFixed(1)} mm, average ${(g.avg*1000).toFixed(1)} mm; ${full.index.length/3} → ${item.index.length/3} triangles`;
 });
}
check(`R3 ${CHOSEN_TORSO.label}: stays close to the full Athletic (largest gap under 6 mm, 1% of its width)`,()=>{
 const full=builtBy.R1.find(b=>b.o.id==='athletic'),light=builtBy.R3[0],g=gap(full.shape,light.shape);
 assert(g.max<=.006,`largest gap ${(g.max*1000).toFixed(1)} mm`);
 return `largest ${(g.max*1000).toFixed(1)} mm, average ${(g.avg*1000).toFixed(1)} mm; ${full.index.length/3} → ${light.index.length/3} triangles`;
});
// Options in a round must really differ, except a light version and the option it is based on.
// "Really differ" means a difference you can see somewhere: at least 1.5 cm.
// (An average over the whole torso would wrongly reject a chest-only change.)
for(const [tag] of rounds)check(`${tag}: options really differ (each pair at least 1.5 cm apart somewhere)`,()=>{
 const list=builtBy[tag],out=[],related=(a,b)=>a.o.basedOn===b.o.id||b.o.basedOn===a.o.id||(a.o.basedOn&&a.o.basedOn===b.o.basedOn);
 for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  if(related(list[i],list[j]))continue;
  const g=gap(list[i].shape,list[j].shape);
  assert(g.max>=.015,`${list[i].o.id} and ${list[j].o.id} too alike (${(g.max*1000).toFixed(0)} mm at most)`);
  out.push(`${list[i].o.id}/${list[j].o.id}`);
 }
 return out.length+' pairs compared';
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the torso, the shape tools and every option of both rounds check out.');
process.exitCode=failed?1:0;
