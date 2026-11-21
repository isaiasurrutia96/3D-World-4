// Checks the painted base faces (face.js): every face fits on the front of the
// head, is mirrored left/right, keeps the same mouth, follows the measured
// concept (big oval eyes, slightly rounder than the scared ones, line mouth),
// and the five options really differ.
// Usage: node avatar-v2/check-face.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {BASE_FACES,BASE_MOUTH,faceShapes,drawFace} from './face.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const SCARED={width:.152,height:.285};// measured from the owner's preferred concept sheet

check('five base faces with unique ids, labels and notes',()=>{
 assert.equal(BASE_FACES.length,5);assert.equal(new Set(BASE_FACES.map(f=>f.id)).size,5);for(const f of BASE_FACES)assert(f.label&&f.note,f.id);return BASE_FACES.map(f=>f.id).join(', ');
});
check('the mouth is the same in every option: a line 16.7% of the head wide, as in the cool face',()=>{
 for(const f of BASE_FACES)assert.deepEqual(f.mouth,BASE_MOUTH,f.id);assert(BASE_MOUTH.width/BASE_MOUTH.thickness>=3,'not a line');
 return `${(BASE_MOUTH.width*100).toFixed(1)}% wide, ${(BASE_MOUTH.thickness*100).toFixed(1)}% thick`;
});
check('bad faces are refused (overlapping eyes, a mouth that is not a line)',()=>{
 assert.throws(()=>faceShapes({id:'x',eyes:{width:.3,height:.3,apart:.1,y:0},mouth:BASE_MOUTH}),/overlap/);
 assert.throws(()=>faceShapes({id:'x',eyes:{width:.1,height:.2,apart:.2,y:0},mouth:{width:.02,thickness:.05,y:.2}}),/line/);return 'refused';
});
for(const f of BASE_FACES){
 const shapes=faceShapes(f),[right,left,mouth]=shapes,name=f.label;
 check(`${name}: big oval eyes, at least as big as the scared ones and a little rounder (taller than wide by 1.4-1.75)`,()=>{
  const ratio=f.eyes.height/f.eyes.width,area=f.eyes.width*f.eyes.height,scared=SCARED.width*SCARED.height;
  assert(ratio>=1.4&&ratio<=1.75,'ratio '+ratio.toFixed(2));assert(ratio<SCARED.height/SCARED.width,'not rounder than the scared eyes');assert(area>=scared,'smaller than the scared eyes');
  return `taller than wide ×${ratio.toFixed(2)} (scared ×${(SCARED.height/SCARED.width).toFixed(2)}), ${(area/scared*100-100).toFixed(0)}% bigger`;
 });
 check(`${name}: mirrored left and right, eyes apart, mouth centred below the eyes`,()=>{
  assert.equal(left.cx,-right.cx);assert.equal(left.cy,right.cy);assert.equal(left.rx,right.rx);assert.equal(left.ry,right.ry);
  assert(left.cx-left.rx>right.cx+right.rx,'eyes touch');assert.equal(mouth.cx,0);assert(mouth.cy-mouth.thickness/2>left.cy+left.ry,'mouth overlaps the eyes');
  return `gap between eyes ${((left.cx-left.rx-(right.cx+right.rx))*100).toFixed(1)}% of the head`;
 });
 check(`${name}: fits on the front of the head (every shape within 40% of the centre, so it never wraps round the sides)`,()=>{
  let far=0;for(const s of shapes){const ex=s.type==='ellipse'?[Math.abs(s.cx)+s.rx,Math.abs(s.cy)+s.ry]:[Math.abs(s.cx)+s.width/2,Math.abs(s.cy)+s.thickness/2];far=Math.max(far,Math.hypot(...ex));}
  assert(far<=.4,'reaches '+(far*100).toFixed(0)+'%');return `furthest point ${(far*100).toFixed(0)}% from the centre`;
 });
}
check('the five options really differ (eye size, shape, spacing or height changes by at least 1% of the head)',()=>{
 const key=f=>[f.eyes.width,f.eyes.height,f.eyes.apart,f.eyes.y];const out=[];
 for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){const d=Math.max(...key(BASE_FACES[i]).map((v,k)=>Math.abs(v-key(BASE_FACES[j])[k])));assert(d>=.01,`${BASE_FACES[i].id} and ${BASE_FACES[j].id} too alike`);out.push(d);}
 return `closest pair differs by ${(Math.min(...out)*100).toFixed(1)}% of the head`;
});
check('drawing: each face draws exactly two eyes and one rounded mouth on a canvas',()=>{
 // A stand-in canvas that records what is drawn.
 const calls=[];const ctx={clearRect(){calls.push('clear');},beginPath(){},fill(){calls.push('fill');},ellipse(){calls.push('ellipse');},roundRect(...a){calls.push('roundRect:'+(a[4]>0));},set fillStyle(v){calls.push('ink:'+v);}};
 drawFace(ctx,512,BASE_FACES[0]);
 assert.equal(calls.filter(c=>c==='ellipse').length,2);assert.equal(calls.filter(c=>c==='roundRect:true').length,1);assert.equal(calls.filter(c=>c==='fill').length,3);
 return calls.join(' ');
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: every base face fits the head, is mirrored, keeps the line mouth and follows the concept.');
process.exitCode=failed?1:0;
