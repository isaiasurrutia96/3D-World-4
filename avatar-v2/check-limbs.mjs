// Checks every limb set (limb-options.js): the arm options, the leg options and
// the girl's slimmer versions. For each: every limb is a sealed, outward,
// capsule-shaped limb of the right length within budget; the middle ball is
// sized from the limbs (slightly thinner) and sits separately between them
// with the joint centres unchanged; options in a group really differ.
// Usage: node avatar-v2/check-limbs.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {ARM_OPTIONS,LEG_OPTIONS,CHOSEN_ARM,GIRL_ARM,CHOSEN_LEG,GIRL_LEG,ARM_PAIR,LEG_PAIR,GIRL_LIMB_SHARE,buildPair,pairSizes,buildLimbShape,limbRadius,thinnestAt,slimmerLimb,girlVersion,UPPER_ARM_SPAN,FOREARM_SPAN,THIGH_SPAN,CALF_SPAN,BALL_GAP,BALL_TO_LIMB,LIMB_DETAIL} from './limb-options.js';
import {BALL_RADIUS,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {smoothness} from './shape-checks.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const axis=(positions,k)=>positions.filter((_,i)=>i%3===k),TAU=Math.PI*2;
// A capsule must have no hollow at all: anything sunk more than 0.5 mm inside
// its outline counts (real limbs measure 0.00 mm). Measured with the shared tools.
const DENT_LIMIT=.0005,GROOVE_LIMIT=.0015,capsuleSmoothness=shape=>smoothness(shape,1);

// --- Spans, choices and tools -------------------------------------------------
check('joint spans come from the skeleton (arm 31 / 28.7 cm, leg 36.7 / 30.9 cm)',()=>{
 for(const [v,want] of [[UPPER_ARM_SPAN,.31],[FOREARM_SPAN,.287],[THIGH_SPAN,.367],[CALF_SPAN,.309]])assert(Math.abs(v-want)<.002,v);
 return `arm ${(UPPER_ARM_SPAN*100).toFixed(1)} / ${(FOREARM_SPAN*100).toFixed(1)} cm, leg ${(THIGH_SPAN*100).toFixed(1)} / ${(CALF_SPAN*100).toFixed(1)} cm`;
});
check('the chosen arm is option 2, Athletic',()=>{assert.equal(CHOSEN_ARM,ARM_OPTIONS[1]);assert.equal(CHOSEN_ARM.id,'athletic');return CHOSEN_ARM.label;});
check('the chosen arm\'s limbs are clearly longer than with the old 18 cm ball (more than 10%)',()=>{
 const z=pairSizes(CHOSEN_ARM,ARM_PAIR),oldUpper=UPPER_ARM_SPAN-BALL_RADIUS-BALL_GAP,oldFore=FOREARM_SPAN-BALL_RADIUS-BALL_GAP;
 assert(z.upper>oldUpper*1.1&&z.fore>oldFore*1.1);
 return `upper arm ${(oldUpper*100).toFixed(1)} → ${(z.upper*100).toFixed(1)} cm, forearm ${(oldFore*100).toFixed(1)} → ${(z.fore*100).toFixed(1)} cm`;
});
check('the chosen leg is option 3, Strong; the girl\'s legs are it, 8% slimmer',()=>{
 assert.equal(CHOSEN_LEG,LEG_OPTIONS[2]);assert.equal(CHOSEN_LEG.id,'leg-strong');assert.deepEqual(GIRL_LEG,girlVersion(CHOSEN_LEG,LEG_PAIR));
 return `${CHOSEN_LEG.label}; girl knee ball ${(pairSizes(GIRL_LEG,LEG_PAIR).ball*200).toFixed(1)} cm wide`;
});
check('a limb too short for its rounded ends is refused; a bad slimming share is refused',()=>{
 assert.throws(()=>buildLimbShape({side:1,front:1,profile:[[0,.07],[1,.07]]},.1),/too short/);
 assert.throws(()=>slimmerLimb(CHOSEN_ARM.upper,0),/share/);assert.throws(()=>slimmerLimb(CHOSEN_ARM.upper,1.2),/share/);return 'refused';
});
check('slimmer tool: every radius and muscle scales by exactly the share; shape settings unchanged',()=>{
 const thin=slimmerLimb(CHOSEN_ARM.upper,.9);let worst=0;
 for(let k=0;k<=50;k++)for(let s=0;s<36;s++){const t=k/50,a=s/36*TAU;worst=Math.max(worst,Math.abs(limbRadius(thin,t,a)-.9*limbRadius(CHOSEN_ARM.upper,t,a)));}
 assert(worst<1e-12,'off by '+worst);assert.equal(thin.side,CHOSEN_ARM.upper.side);assert.equal(thin.front,CHOSEN_ARM.upper.front);return 'exact';
});
check(`the girl's arm is the chosen arm, ${Math.round((1-GIRL_LIMB_SHARE)*100)}% slimmer; her ball follows the 92% rule; joints unchanged`,()=>{
 assert.deepEqual(GIRL_ARM,girlVersion(CHOSEN_ARM,ARM_PAIR));assert(GIRL_LIMB_SHARE>=.88&&GIRL_LIMB_SHARE<1,'not "slightly"');
 const b=pairSizes(CHOSEN_ARM,ARM_PAIR),g=pairSizes(GIRL_ARM,ARM_PAIR);
 assert(Math.abs(g.ball-GIRL_LIMB_SHARE*b.ball)<1e-12,'ball did not follow');
 assert(Math.abs((g.upper+g.ball)-(b.upper+b.ball))<1e-12,'joint centre moved');
 return `ball ${(b.ball*200).toFixed(1)} → ${(g.ball*200).toFixed(1)} cm wide; upper arm ${(b.upper*100).toFixed(1)} → ${(g.upper*100).toFixed(1)} cm`;
});
check('the capsule-shape test catches a planted 5 mm dent and a 5 mm groove (test of the test)',()=>{
 const base=buildLimbShape(ARM_OPTIONS[0].upper,pairSizes(ARM_OPTIONS[0],ARM_PAIR).upper).shape,dented=structuredClone(base),grooved=structuredClone(base),mid=Math.floor(base.rings.length/2);
 dented.rings[mid].r[4]-=.005;grooved.rings[mid].r=grooved.rings[mid].r.map(r=>r-.005);
 const a=capsuleSmoothness(dented),b=capsuleSmoothness(grooved);
 assert(a.dent>DENT_LIMIT,'missed the dent');assert(b.groove>GROOVE_LIMIT,'missed the groove');
 return `dent seen ${(a.dent*1000).toFixed(1)} mm, groove seen ${(b.groove*1000).toFixed(1)} mm`;
});

// --- Every set in every group -------------------------------------------------
const groups=[
 {tag:'Arm',options:ARM_OPTIONS,pair:ARM_PAIR,names:['upper arm','forearm'],chosen:CHOSEN_ARM},
 {tag:'Leg',options:LEG_OPTIONS,pair:LEG_PAIR,names:['thigh','calf'],chosen:CHOSEN_LEG},
 {tag:'Girl arm',options:[GIRL_ARM],pair:ARM_PAIR,names:['upper arm','forearm'],chosen:GIRL_ARM},
 {tag:'Girl leg',options:[GIRL_LEG],pair:LEG_PAIR,names:['thigh','calf'],chosen:GIRL_LEG},
];
for(const g of groups){
 check(`${g.tag} options: unique ids, labels, notes; capsule option (if any) is plain and round`,()=>{
  assert.equal(new Set(g.options.map(o=>o.id)).size,g.options.length);for(const o of g.options)assert(o.label&&o.note,o.id);
  const c=g.options.find(o=>/capsule/.test(o.id));
  if(c)for(const key of g.pair.keys){const limb=c[key];assert.equal(new Set(limb.profile.map(p=>p[1])).size,1,'capsule thickness changes');assert(!limb.bumps,'capsule has muscles');assert(limb.side===1&&limb.front===1,'capsule not round');}
  return g.options.length+' options';
 });
 for(const o of g.options){
  const set=buildPair(o,g.pair),size=set.size,[upperKey,lowerKey]=g.pair.keys;
  g.pair.keys.forEach((key,i)=>{
   const name=`${g.tag} ${o.label} ${g.names[i]}`,limb=set[key],{positions,index}=limb,len=size[key],spec=o[key];
   check(`${name}: sealed, consistent, faces out`,()=>{
    const edges=new Map(),directed=new Set();
    for(let j=0;j<index.length;j+=3)for(let k=0;k<3;k++){const a=index[j+k],b=index[j+(k+1)%3],e=a<b?a+','+b:b+','+a;edges.set(e,(edges.get(e)||0)+1);const d=a+'>'+b;assert(!directed.has(d),'flipped');directed.add(d);}
    assert([...edges.values()].every(n=>n===2),'open edge');
    let v=0;const p=j=>[positions[3*j],positions[3*j+1],positions[3*j+2]];
    for(let j=0;j<index.length;j+=3){const a=p(index[j]),b=p(index[j+1]),c=p(index[j+2]);v+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
    assert(v>0,'inside out');return `${edges.size} edges, ${(v*1000).toFixed(2)} litres`;
   });
   check(`${name}: exact length, capsule shape, phone-ready`,()=>{
    const ys=axis(positions,1),l=Math.max(...ys)-Math.min(...ys);assert(Math.abs(l-len)<1e-6,'length '+l);
    const {dent,groove}=capsuleSmoothness(limb.shape);assert(dent<=DENT_LIMIT&&groove<=GROOVE_LIMIT,`dent ${(dent*1000).toFixed(1)} mm, groove ${(groove*1000).toFixed(1)} mm`);
    const t=index.length/3,rows=LIMB_DETAIL.rings+2*LIMB_DETAIL.capRings;assert.equal(t,(rows-1)*LIMB_DETAIL.segments*2+2*LIMB_DETAIL.segments);assert(t<=600);
    return `${(l*100).toFixed(1)} cm, dent ${(dent*1000).toFixed(2)} mm, ${t} triangles`;
   });
   // Only for a chosen set: options kept for reference may fail it (flattened
   // limbs give a small ball, so their muscles look big next to it).
   if(o===g.chosen)check(`${name}: muscles do not balloon (thickest point at most ${g.pair.maxBulge} times the ball's radius)`,()=>{
    let worst=0;for(let k=0;k<=100;k++)for(let s=0;s<72;s++)worst=Math.max(worst,limbRadius(spec,k/100,s/72*TAU));
    assert(worst<=g.pair.maxBulge*size.ball,'thickest '+(worst*1000).toFixed(1)+' mm');return `thickest ${(worst*1000).toFixed(1)} mm = ${(worst/size.ball).toFixed(2)}x the ball`;
   });
  });
  check(`${g.tag} ${o.label}: ball as thick as the limbs but slightly thinner (${BALL_TO_LIMB*100}% of the thinner end)`,()=>{
   const ends=[thinnestAt(o[upperKey],1),thinnestAt(o[lowerKey],0)];
   assert(Math.abs(size.ball-BALL_TO_LIMB*Math.min(...ends))<1e-12);assert(ends.every(e=>size.ball<e));
   return `ball ${(size.ball*2000).toFixed(1)} mm wide; limb ends ${(ends[0]*2000).toFixed(1)} and ${(ends[1]*2000).toFixed(1)} mm`;
  });
  check(`${g.tag} ${o.label}: ball separate and centred (${BALL_GAP*1000} mm gaps), ${CHOSEN_BALL_TRIANGLES} triangles, joint centres unchanged`,()=>{
   const up=set[upperKey],low=set[lowerKey],ball=set.ball,R=ball.radius,[span1,span2]=g.pair.spans;
   const gapAbove=Math.min(...axis(up.positions,1))+up.y-(ball.y+R),gapBelow=(ball.y-R)-(Math.max(...axis(low.positions,1))+low.y);
   assert(Math.abs(gapAbove-BALL_GAP)<1e-6&&Math.abs(gapBelow-BALL_GAP)<1e-6,`gaps ${gapAbove} / ${gapBelow}`);
   assert(Math.abs(-ball.y-span1)<1e-9,'middle joint moved');assert(Math.abs((-low.y+size[lowerKey])-(span1+span2))<1e-9,'end joint moved');
   assert.equal(ball.index.length/3,CHOSEN_BALL_TRIANGLES);return `gaps ${(gapAbove*1000).toFixed(1)} / ${(gapBelow*1000).toFixed(1)} mm`;
  });
 }
 if(g.options.length>1)check(`${g.tag} options really differ (each pair at least 8 mm apart somewhere)`,()=>{
  const out=[];
  for(let i=0;i<g.options.length;i++)for(let j=i+1;j<g.options.length;j++){let max=0;
   for(const key of g.pair.keys)for(let k=0;k<=40;k++)for(let s=0;s<36;s++){const t=k/40,a=s/36*TAU;max=Math.max(max,Math.abs(limbRadius(g.options[i][key],t,a)-limbRadius(g.options[j][key],t,a)));}
   assert(max>=.008,`${g.options[i].id} and ${g.options[j].id} too alike (${(max*1000).toFixed(1)} mm)`);out.push(max);}
  return `closest pair ${(Math.min(...out)*1000).toFixed(1)} mm apart`;
 });
}
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: every arm, leg and girl limb set is a sealed capsule pair of the right length, with a limb-sized ball separate between them.');
process.exitCode=failed?1:0;
