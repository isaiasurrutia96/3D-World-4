// Checks the upper arm and forearm options (limb-options.js): every limb is a
// sealed, outward, smooth capsule of the right length, thinner than the joint
// ball, within budget; the ball sits separately between the two limbs; and the
// five options really differ. Usage: node avatar-v2/check-arms.mjs
import assert from 'node:assert/strict';
import {ARM_OPTIONS,buildArmSet,buildLimbShape,limbRadius,UPPER_ARM_LENGTH,FOREARM_LENGTH,BALL_GAP,LIMB_DETAIL} from './limb-options.js';
import {BALL_RADIUS,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {smoothness} from './shape-checks.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const axis=(positions,k)=>positions.filter((_,i)=>i%3===k),TAU=Math.PI*2;

check('five options with unique ids, labels and notes; option 1 is a plain capsule',()=>{
 assert.equal(ARM_OPTIONS.length,5);assert.equal(new Set(ARM_OPTIONS.map(o=>o.id)).size,5);for(const o of ARM_OPTIONS)assert(o.label&&o.note,o.id);
 const c=ARM_OPTIONS[0];for(const limb of [c.upper,c.fore]){assert.equal(new Set(limb.profile.map(p=>p[1])).size,1,'capsule thickness changes');assert(!limb.bumps,'capsule has muscles');assert(limb.side===1&&limb.front===1,'capsule not round');}
 return ARM_OPTIONS.map(o=>o.id).join(', ');
});
check('lengths follow the skeleton (joint centre to ball, ball to joint centre)',()=>{
 assert(Math.abs(UPPER_ARM_LENGTH-(.31-BALL_RADIUS-BALL_GAP))<.002&&Math.abs(FOREARM_LENGTH-(.287-BALL_RADIUS-BALL_GAP))<.002);
 return `upper arm ${(UPPER_ARM_LENGTH*100).toFixed(1)} cm, forearm ${(FOREARM_LENGTH*100).toFixed(1)} cm`;
});
check('a limb that is too short for its rounded ends is refused',()=>{assert.throws(()=>buildLimbShape({side:1,front:1,profile:[[0,.07],[1,.07]]},.1),/too short/);return 'refused';});

// Dents and grooves are measured with the shared tools (shape-checks.js).
const capsuleSmoothness=shape=>smoothness(shape,1);
// A capsule must have no hollow at all: anything sunk more than 0.5 mm inside
// its outline counts (the real limbs measure 0.00 mm).
const DENT_LIMIT=.0005,GROOVE_LIMIT=.0015;
check('the capsule-shape test catches a planted 5 mm dent and a 5 mm groove (test of the test)',()=>{
 const base=buildLimbShape(ARM_OPTIONS[0].upper,UPPER_ARM_LENGTH).shape,dented=structuredClone(base),grooved=structuredClone(base),mid=Math.floor(base.rings.length/2);
 dented.rings[mid].r[4]-=.005;grooved.rings[mid].r=grooved.rings[mid].r.map(r=>r-.005);
 const a=capsuleSmoothness(dented),b=capsuleSmoothness(grooved);
 assert(a.dent>DENT_LIMIT,'missed the dent');assert(b.groove>GROOVE_LIMIT,'missed the groove');
 return `dent seen ${(a.dent*1000).toFixed(1)} mm, groove seen ${(b.groove*1000).toFixed(1)} mm`;
});

const sets=ARM_OPTIONS.map(o=>({o,...buildArmSet(o)}));
for(const {o,upper,ball,fore} of sets){
 for(const [part,limb,len,spec] of [['upper arm',upper,UPPER_ARM_LENGTH,o.upper],['forearm',fore,FOREARM_LENGTH,o.fore]]){
  const name=`${o.label} ${part}`,{positions,index}=limb;
  check(`${name}: sealed and consistent`,()=>{
   const edges=new Map(),directed=new Set();
   for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){const a=index[i+k],b=index[i+(k+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);const d=a+'>'+b;assert(!directed.has(d),'flipped');directed.add(d);}
   assert([...edges.values()].every(n=>n===2),'open edge');return edges.size+' edges';
  });
  check(`${name}: faces out (positive volume)`,()=>{
   let v=0;const p=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]];
   for(let i=0;i<index.length;i+=3){const a=p(index[i]),b=p(index[i+1]),c=p(index[i+2]);v+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
   assert(v>0);return (v*1000).toFixed(2)+' litres';
  });
  check(`${name}: exact length, tip to tip`,()=>{const ys=axis(positions,1),l=Math.max(...ys)-Math.min(...ys);assert(Math.abs(l-len)<1e-6,l);return (l*100).toFixed(1)+' cm';});
  check(`${name}: thinner than the joint ball everywhere (not puffy)`,()=>{
   let worst=0;for(let k=0;k<=100;k++)for(let s=0;s<72;s++)worst=Math.max(worst,limbRadius(spec,k/100,s/72*TAU));
   assert(worst<BALL_RADIUS,'thickest '+(worst*1000).toFixed(1)+' mm');return `thickest ${(worst*1000).toFixed(1)} mm vs ball ${(BALL_RADIUS*1000).toFixed(1)} mm`;
  });
  check(`${name}: capsule shape (no dents or grooves; muscles only bulge out)`,()=>{
   const {dent,groove}=capsuleSmoothness(limb.shape);
   assert(dent<=DENT_LIMIT&&groove<=GROOVE_LIMIT,`dent ${(dent*1000).toFixed(1)} mm, groove ${(groove*1000).toFixed(1)} mm`);
   return `dent ${(dent*1000).toFixed(2)} mm, groove ${(groove*1000).toFixed(2)} mm`;
  });
  check(`${name}: phone-ready (about 500 triangles)`,()=>{const t=index.length/3,rows=LIMB_DETAIL.rings+2*LIMB_DETAIL.capRings;assert.equal(t,(rows-1)*LIMB_DETAIL.segments*2+2*LIMB_DETAIL.segments);assert(t<=600);return t+' triangles';});
 }
 check(`${o.label}: the ball is separate, centred between the limbs, with a ${BALL_GAP*1000} mm gap each side`,()=>{
  const upperBottom=Math.min(...axis(upper.positions,1))+upper.y,foreTop=Math.max(...axis(fore.positions,1))+fore.y;
  const gapAbove=upperBottom-(ball.y+BALL_RADIUS),gapBelow=(ball.y-BALL_RADIUS)-foreTop;
  assert(Math.abs(gapAbove-BALL_GAP)<1e-6&&Math.abs(gapBelow-BALL_GAP)<1e-6,`gaps ${gapAbove} / ${gapBelow}`);
  assert.equal(ball.index.length/3,CHOSEN_BALL_TRIANGLES);return `gaps ${(gapAbove*1000).toFixed(1)} and ${(gapBelow*1000).toFixed(1)} mm; ball ${CHOSEN_BALL_TRIANGLES} triangles`;
 });
}
check('the five options really differ (each pair at least 8 mm apart somewhere)',()=>{
 const out=[];
 for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){let max=0;
  for(const part of ['upper','fore'])for(let k=0;k<=40;k++)for(let s=0;s<36;s++){const t=k/40,a=s/36*TAU;max=Math.max(max,Math.abs(limbRadius(ARM_OPTIONS[i][part],t,a)-limbRadius(ARM_OPTIONS[j][part],t,a)));}
  assert(max>=.008,`${ARM_OPTIONS[i].id} and ${ARM_OPTIONS[j].id} too alike (${(max*1000).toFixed(1)} mm)`);out.push(max);}
 return `closest pair ${(Math.min(...out)*1000).toFixed(1)} mm apart`;
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: all five arm options are sealed, correct-length capsules, thinner than the ball, with the ball separate between them.');
process.exitCode=failed?1:0;
