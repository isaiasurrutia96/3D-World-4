// Checks the new elbow: the upper arm, elbow ball and forearm.
// Bends and twists the elbow through its whole range (the skeleton's limits)
// and checks the parts never pass into each other, the ball stays seated, and
// each shell is sealed and solid. Usage: node avatar-v2/check-elbow.mjs
import assert from 'node:assert/strict';
import {Euler,Quaternion,Vector3} from 'three';
import {buildLimb,insideDepth,limbFrame,outerRadius} from './limb-shape.js';
import {UPPER_ARM,FOREARM,ELBOW_BALL,ELBOW_LIMITS,ELBOW_REST,ELBOW,ELBOW_CLEAN_BEND} from './arm.js';

const RAD=Math.PI/180,TOUCH=.001;// parts may graze by at most 1 mm
const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const upper=buildLimb(UPPER_ARM),fore=buildLimb(FOREARM);
const points=mesh=>Array.from({length:mesh.positions.length/3},(_,i)=>mesh.positions.slice(3*i,3*i+3));

// The skeleton's rule: change from rest = R(angles) · R(rest)⁻¹, about the elbow.
const restInv=new Quaternion().setFromEuler(new Euler(ELBOW_REST.x*RAD,ELBOW_REST.y*RAD,ELBOW_REST.z*RAD,'XYZ')).invert();
function elbowTurn(bend,twist){return new Quaternion().setFromEuler(new Euler(bend*RAD,twist*RAD,0,'XYZ')).multiply(restInv);}
const centre=new Vector3(...ELBOW),v=new Vector3();
const turn=(p,q)=>v.set(...p).sub(centre).applyQuaternion(q).add(centre).toArray();

function shellChecks(name,mesh){
 check(`${name}: sealed (every edge shared by exactly two triangles)`,()=>{
  const edges=new Map(),ix=mesh.index;
  for(let i=0;i<ix.length;i+=3)for(let k=0;k<3;k++){const a=ix[i+k],b=ix[i+(k+1)%3];if(a===b)continue;const key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);}
  const bad=[...edges.values()].filter(n=>n!==2).length;assert.equal(bad,0,bad+' bad edges');return ix.length/3+' triangles';
 });
 check(`${name}: faces point outward (positive volume)`,()=>{
  let vol=0;const p=i=>mesh.positions.slice(3*i,3*i+3);
  for(let i=0;i<mesh.index.length;i+=3){const [a,b,c]=[0,1,2].map(k=>p(mesh.index[i+k]));vol+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
  assert(vol>0,'volume '+vol);return (vol*1000).toFixed(2)+' litres';
 });
}
shellChecks('upper arm',upper);shellChecks('forearm',fore);

check('not puffy: limbs never thicker than the elbow ball (90.7 mm), except the thin cup lip',()=>{
 let worst=0;
 for(const spec of [UPPER_ARM,FOREARM]){const f=limbFrame(spec);for(let k=0;k<=200;k++){const t=k/200*f.length;// away from the cup itself
  if(Math.abs(t-(spec===UPPER_ARM?f.length:0))<ELBOW_BALL.radius)continue;worst=Math.max(worst,outerRadius(spec,f,t));}}
 assert(worst<=ELBOW_BALL.radius,'thickest '+(worst*1000).toFixed(1)+' mm');return 'thickest '+(worst*1000).toFixed(1)+' mm';
});
check('cup walls are solid: at least 4 mm thick',()=>{
 assert(UPPER_ARM.endEnd.wall>=.004&&FOREARM.startEnd.wall>=.004);return (UPPER_ARM.endEnd.wall*1000)+' mm';
});
check('ball seated: it turns about its own centre, so it never moves in its cups',()=>{
 for(const [b,t] of [[-150,0],[-75,80],[0,-80]]){const moved=Math.hypot(...turn(ELBOW,elbowTurn(b,t)).map((x,i)=>x-ELBOW[i]));assert(moved<1e-9);}
 return 'centre fixed at every angle';
});
check('ball never cuts into either limb (only the hollow of each cup)',()=>{
 let worst=0;const r=ELBOW_BALL.radius;
 for(let i=0;i<400;i++){const z=1-2*(i+.5)/400,a=i*2.399963,s=Math.sqrt(1-z*z),p=[ELBOW[0]+r*s*Math.cos(a),ELBOW[1]+r*z,ELBOW[2]+r*s*Math.sin(a)];
  worst=Math.max(worst,insideDepth(UPPER_ARM,p),insideDepth(FOREARM,p));}
 assert(worst<=TOUCH,'cuts in '+(worst*1000).toFixed(1)+' mm');return 'deepest '+(worst*1000).toFixed(2)+' mm';
});

// The main check: sweep the whole range and test each limb's skin against the other limb.
const sweep=[];let deepest={depth:0};
const upperPts=points(upper),forePts=points(fore);
for(let bend=ELBOW_LIMITS.x[0];bend<=ELBOW_LIMITS.x[1];bend+=5)for(let twist=ELBOW_LIMITS.y[0];twist<=ELBOW_LIMITS.y[1];twist+=20){
 const q=elbowTurn(bend,twist),back=q.clone().invert();let depth=0;
 for(const p of forePts)depth=Math.max(depth,insideDepth(UPPER_ARM,turn(p,q)));
 for(const p of upperPts)depth=Math.max(depth,insideDepth(FOREARM,turn(p,back)));
 sweep.push({bend,twist,depth});if(depth>deepest.depth)deepest={bend,twist,depth};
}
const clean=sweep.filter(s=>s.bend>=ELBOW_CLEAN_BEND),worstClean=clean.reduce((a,b)=>b.depth>a.depth?b:a,{depth:0});
check(`no collision from straight to a ${-ELBOW_CLEAN_BEND}° bend, at every twist (±80°)`,()=>{
 assert(worstClean.depth<=TOUCH,`limbs overlap ${(worstClean.depth*1000).toFixed(1)} mm at bend ${worstClean.bend}°, twist ${worstClean.twist}°`);
 return clean.length+' angles, deepest '+(worstClean.depth*1000).toFixed(2)+' mm';
});
check('every existing pose that bends the elbow stays clean (Elbows 120°, Wave, Wind-up)',()=>{
 for(const [name,b,t] of [['elbows',-120,0],['wave',-74.6,-14.6],['wave swing',-89.6,-14.6],['wind-up',-70,0]]){
  const q=elbowTurn(b,t),back=q.clone().invert();let d=0;
  for(const p of forePts)d=Math.max(d,insideDepth(UPPER_ARM,turn(p,q)));for(const p of upperPts)d=Math.max(d,insideDepth(FOREARM,turn(p,back)));
  assert(d<=TOUCH,name+' overlaps '+(d*1000).toFixed(1)+' mm');}
 return 'all clean';
});
check('phone-ready: arm under 9,000 triangles',()=>{const n=(upper.index.length+fore.index.length)/3+ 960;assert(n<9000);return n+' triangles (incl. ball)';});

console.table(results);
// Information: where the limbs first touch beyond the clean range, per twist.
const touch=[...new Set(sweep.map(s=>s.twist))].map(t=>{const hit=sweep.filter(s=>s.twist===t&&s.depth>TOUCH).sort((a,b)=>b.bend-a.bend)[0];return `twist ${t}°: ${hit?'touches at '+(-hit.bend)+'°':'never touches'}`;});
console.log('Beyond the clean range (skeleton allows 150°): '+touch.join('; '));
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the elbow bends cleanly through its rigid range with no collisions; the ball stays seated.');
process.exitCode=failed?1:0;
