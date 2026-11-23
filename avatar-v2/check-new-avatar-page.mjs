// Browser check of the New avatar page: the Base avatar tab first (the 6 ft 4 in base, its torso split into a chest and a
// pelvis, and beside it the same avatar with a spine: chest, belly and pelvis; the 6 ft 1 in one no longer shown), the
// Torso sockets tab's steps, and no Our avatar anywhere on the page.
// Usage: npm run build:new-avatar, then node avatar-v2/check-new-avatar-page.mjs
// (Our avatar was removed from this page on 23 November 2026; the check makes sure it does not come back.)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createServer} from 'node:http';import {extname,join} from 'node:path';import {chromium} from 'playwright';
import {pressedPreviewBody} from './original-body.js';const together=pressedPreviewBody('boy');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=createServer(async(q,r)=>{let p=join('dist',decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';try{const b=await readFile(p);r.writeHead(200,{'content-type':types[extname(p)]??'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end();}});
await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const results=[];
try{
 for(const [w,h] of [[1280,800],[390,844]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  await page.goto(`http://localhost:${server.address().port}/new-avatar/`);await page.waitForFunction(()=>window.newAvatarReady,null,{timeout:180000});
  // The first tab: the base and the spine version side by side; the same pieces but the torso; both 193.04 cm (6 ft 4 in)
  // and the same width and depth; every right piece the exact mirror of its left piece (this caught right pieces from an
  // earlier step).
  const legs=await page.evaluate(()=>{const L=window.newAvatarLab,names=g=>{const n=[];g.traverse(o=>{if(o.isMesh)n.push(o.name);});return n.sort();};
   const size=g=>{const v=new (g.position.constructor)(),lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];g.updateMatrixWorld(true);g.traverse(o=>{if(!o.isMesh||o.name==='face')return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);[v.x,v.y,v.z].forEach((x,k)=>{lo[k]=Math.min(lo[k],x);hi[k]=Math.max(hi[k],x);});}});return hi.map((h,k)=>h-lo[k]);};
   const mirror=g=>{let worst=0;for(const n of ['upper-arm','forearm','hand','thigh','calf','foot']){const a=g.getObjectByName(n+'.left').geometry.attributes.position,b=g.getObjectByName(n+'.right').geometry.attributes.position;if(a.count!==b.count)return Infinity;for(let i=0;i<a.count;i++)worst=Math.max(worst,Math.abs(a.getX(i)+b.getX(i)),Math.abs(a.getY(i)-b.getY(i)),Math.abs(a.getZ(i)-b.getZ(i)));}return worst;};
   return {group:L.getGroup(),focus:L.getFocus(),ids:L.options.map(o=>o.id),names:L.options.map(o=>names(o.group)),sizes:L.options.map(o=>size(o.group)),mirror:L.options.map(o=>mirror(o.group))};});
  assert.equal(legs.group,'base-avatar','the Base avatar tab opens first');assert.equal(legs.focus,null,'both in view');assert.deepEqual(legs.ids,['legs-6ft4','legs-6ft4-spine'],'the base and the spine version; no 6 ft 1 in');
  assert(legs.names[0].includes('chest')&&legs.names[0].includes('pelvis')&&!legs.names[0].includes('torso'),'the base: torso split into a chest and a pelvis');
  assert.deepEqual(legs.names[1],[...legs.names[0],'belly'].sort(),'the spine version: the same pieces plus the belly');
  {const all=[0,1,2].map(k=>{let lo=Infinity,hi=-Infinity;for(const p of together.parts)for(let i=k;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}return hi-lo;});
   assert(Math.abs(legs.sizes[0][1]-1.9304)<1e-4,`base: ${legs.sizes[0][1]} m tall, wanted 1.9304 (6 ft 4 in)`);for(const k of [0,2])assert(legs.sizes[0][k]<=all[k]+1e-4,`base: wider or deeper than the put-together avatar along ${'xyz'[k]}`);
   for(const k of [0,1,2])assert(Math.abs(legs.sizes[1][k]-legs.sizes[0][k])<1e-4,`spine version: not the same size as the base along ${'xyz'[k]}`);}
  for(const w of legs.mirror)assert(w<1e-6,`a right piece is not the mirror of its left piece (off by ${w} m)`);
  await page.evaluate(()=>window.newAvatarLab.setGroup('torso-sockets'));
  // The Torso sockets tab: the torso with its shoulder sockets and both balls beside it, nothing else.
  const first=await page.evaluate(()=>{const L=window.newAvatarLab,names=g=>{const n=[];g.traverse(o=>{if(o.isMesh)n.push(o.name);});return n.sort();};
   const item=L.options[0],extra=item.group.children.find(o=>o.isMesh).clone();extra.name='head';item.group.add(extra);const withExtra=names(item.group);item.group.remove(extra);
   return {group:L.getGroup(),ids:L.options.map(o=>o.id),names:names(item.group),withExtra,hipNames:names(L.options[1].group),hipSocketNames:names(L.options[2].group),limbNames:names(L.options[3].group),ekNames:names(L.options[4].group),waNames:names(L.options[5].group),asNames:names(L.options[6].group),asSize:(()=>{const g=L.options[6].group,b=new (g.position.constructor)(),lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];g.updateMatrixWorld(true);g.traverse(o=>{if(!o.isMesh||o.name==='face')return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i++){b.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);[b.x,b.y,b.z].forEach((x,k)=>{lo[k]=Math.min(lo[k],x);hi[k]=Math.max(hi[k],x);});}});return hi.map((h,k)=>h-lo[k]);})()};});
  const want=['ball-shoulder.left','ball-shoulder.right','torso'];
  assert.equal(first.group,'torso-sockets');assert.deepEqual(first.ids,['torso-sockets-boy','torso-hips-apart','torso-hip-sockets','torso-limb-sockets','torso-elbow-knee-sockets','torso-wrist-ankle-sockets','torso-assembled']);
  assert.deepEqual(first.limbNames,['ball-hip.left','ball-hip.right','ball-shoulder.left','ball-shoulder.right','thigh.left','thigh.right','torso','upper-arm.left','upper-arm.right'],'limbs: the torso, its four balls, both upper arms and both thighs');assert.deepEqual(first.ekNames,['ball-elbow.left','ball-elbow.right','ball-hip.left','ball-hip.right','ball-knee.left','ball-knee.right','ball-shoulder.left','ball-shoulder.right','thigh.left','thigh.right','torso','upper-arm.left','upper-arm.right'],'elbows and knees: the torso, its four balls, both upper arms and thighs, and the elbow and knee balls');assert.deepEqual(first.waNames,['ball-ankle.left','ball-ankle.right','ball-elbow.left','ball-elbow.right','ball-hip.left','ball-hip.right','ball-knee.left','ball-knee.right','ball-shoulder.left','ball-shoulder.right','ball-wrist.left','ball-wrist.right','calf.left','calf.right','foot.left','foot.right','forearm.left','forearm.right','hand.left','hand.right','thigh.left','thigh.right','torso','upper-arm.left','upper-arm.right'],'whole arms and legs: every piece and ball below the neck, nothing else');assert.deepEqual(first.asNames,[...first.waNames,'face','head','neck'].sort(),'put together: the same pieces and balls, plus the neck, the head and its painted face');
  // Put together, with the neck and head: the same size as the whole put-together avatar.
  {const keep=together.parts,want=[0,1,2].map(k=>{let lo=Infinity,hi=-Infinity;for(const p of keep)for(let i=k;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}return hi-lo;});
   assert(Math.abs(first.asSize[1]-want[1])<1e-4,`put together: ${first.asSize[1]} m tall, the put-together avatar is ${want[1]}`);for(const k of [0,2])assert(first.asSize[k]<=want[k]+1e-4,`put together: wider or deeper along ${'xyz'[k]}`);
   assert(Math.abs(first.asSize[1]+.0037-want[1])>1e-4,'test of the test: 3.7 mm taller would not be caught');}assert.deepEqual(first.names,want,'only the torso and both shoulder balls');
  assert.deepEqual(first.hipNames,['ball-hip.left','ball-hip.right','ball-shoulder.left','ball-shoulder.right','torso'],'hips apart: the torso, both shoulder balls and both hip balls');
  assert.deepEqual(first.hipSocketNames,['ball-hip.left','ball-hip.right','ball-shoulder.left','ball-shoulder.right','torso'],'hip sockets: the torso, both shoulder balls and both hip balls');
  assert.notDeepEqual(first.withExtra,want,'test of the test: an extra piece was not caught');
  // No Our avatar: not loaded, not on the Put together tab, nothing named for it on the page.
  await page.evaluate(()=>window.newAvatarLab.setGroup('together'));
  const m=await page.evaluate(()=>({group:window.newAvatarLab.getGroup(),ids:window.newAvatarLab.options.map(o=>o.id),loader:'ourAvatarLoaded' in window,root:!!window.newAvatarLab.ourAvatar,all:window.newAvatarLab.groups.flatMap(g=>g.options.map(o=>o.id))}));
  assert.deepEqual(errors,[],'page errors');assert.equal(m.group,'together');assert.deepEqual(m.ids,['together-boy'],'Put together: only the new avatar');
  assert.equal(m.loader,false,'Our avatar is still being loaded');assert.equal(m.root,false,'Our avatar is still on the page');assert(!m.all.includes('our-avatar'),'an Our avatar item is still on the page');
  results.push(`${w}px: Base avatar first (the 6 ft 4 in base and the spine version, the same size; the right side mirrors the left), the Torso sockets steps, no Our avatar, no errors`);
  await page.close();}
}finally{await browser.close();server.close();}
console.log(results.join('\n'));console.log('PASS: Base avatar first (the 6 ft 4 in base and beside it the spine version, chest, belly and pelvis; no 6 ft 1 in), the Torso sockets steps, and no Our avatar on the page.');
