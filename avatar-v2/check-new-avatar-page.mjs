// Browser check of the New avatar page's "Put together" tab: only the boy's upper arms, forearms, thighs and calves
// (owner, 22 November 2026: "take away every part minus the upper arm, forearm, thighs and calves"), each in its place,
// and next to them his torso with both shoulder balls apart ("next to each other but not together"); nothing else
// on the tab (no Our avatar).
// Usage: npm run build:new-avatar, then node avatar-v2/check-new-avatar-page.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createServer} from 'node:http';import {extname,join} from 'node:path';import {chromium} from 'playwright';
import {limbsOnlyBody,LIMBS_ONLY} from './original-body.js';
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=createServer(async(q,r)=>{let p=join('dist',decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';try{const b=await readFile(p);r.writeHead(200,{'content-type':types[extname(p)]??'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end();}});
await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
// What the page should show: the eight limb pieces, and how high and how big they are together.
const limbs=limbsOnlyBody('boy'),want=LIMBS_ONLY.flatMap(n=>[n+'.left',n+'.right']).sort();
const size=[0,1,2].map(k=>{let lo=Infinity,hi=-Infinity;for(const p of limbs.parts)for(let i=k;i<p.positions.length;i+=3){lo=Math.min(lo,p.positions[i]);hi=Math.max(hi,p.positions[i]);}return hi-lo;});
const results=[];
try{
 for(const [w,h] of [[1280,800],[390,844]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  await page.goto(`http://localhost:${server.address().port}/new-avatar/`);await page.waitForFunction(()=>window.newAvatarReady,null,{timeout:180000});
  const m=await page.evaluate(()=>{const L=window.newAvatarLab,item=L.options.find(o=>o.id==='together-boy');
   // The names of the shapes in a group (labels are sprites, not meshes, so they are left out).
   const names=g=>{const n=[];g.traverse(o=>{if(o.isMesh)n.push(o.name);});return n.sort();};
   const b={min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]},v=new (item.group.position.constructor)();item.group.updateMatrixWorld(true);
   item.group.traverse(o=>{if(!o.isMesh)return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);[v.x,v.y,v.z].forEach((x,k)=>{b.min[k]=Math.min(b.min[k],x);b.max[k]=Math.max(b.max[k],x);});}});
   // Test of the test: the same group with one more shape in it (a torso) gives a different list.
   const extra=item.group.children.find(o=>o.isMesh).clone();extra.name='torso';item.group.add(extra);const withExtra=names(item.group);item.group.remove(extra);
   const pair=L.options.find(o=>o.id==='torso-shoulders'),pushed=L.options.find(o=>o.id==='torso-shoulders-pushed');
   return {group:L.getGroup(),ids:L.options.map(o=>o.id),names:names(item.group),withExtra,box:b,pairNames:pair?names(pair.group):null,pushedNames:pushed?names(pushed.group):null,ourAvatar:'ourAvatarLoaded' in window};});
  assert.deepEqual(errors,[],'page errors');
  assert.equal(m.group,'together','the Put together tab opens first');
  assert.deepEqual(m.ids,['together-boy','torso-shoulders','torso-shoulders-pushed'],'the limbs, the torso with its shoulder balls apart, then the sockets they left (no Our avatar)');
  assert.deepEqual(m.pushedNames,['ball-shoulder.left','ball-shoulder.right','torso'],'sockets left: the torso and both shoulder balls only');
  assert.deepEqual(m.pairNames,['ball-shoulder.left','ball-shoulder.right','torso'],'the torso and both shoulder balls only');assert.equal(m.ourAvatar,false,'Our avatar is still loaded');
  assert.deepEqual(m.names,want,'only the eight limb pieces');assert.notDeepEqual(m.withExtra,want,'test of the test: an extra piece was not caught');
  // In their places: as high off the floor as in the put-together avatar (not dropped to the floor), and the same size.
  assert(Math.abs(m.box.min[1]-limbs.lowest)<1e-4,`the calves' bottoms are at ${m.box.min[1]} m, wanted ${limbs.lowest}`);
  for(let k=0;k<3;k++)assert(Math.abs(m.box.max[k]-m.box.min[k]-size[k])<1e-4,`size along ${'xyz'[k]} is ${m.box.max[k]-m.box.min[k]}, wanted ${size[k]}`);
  results.push(`${w}px: ${m.names.length} pieces (${m.names.join(', ')}), the calves' bottoms ${(m.box.min[1]*100).toFixed(1)} cm off the floor, ${(size[0]*100).toFixed(1)} × ${(size[1]*100).toFixed(1)} × ${(size[2]*100).toFixed(1)} cm, then the torso and both shoulder balls apart, and the sockets they left; no Our avatar, no errors; an extra piece is caught`);
  await page.close();}
}finally{await browser.close();server.close();}
console.log(results.join('\n'));console.log('PASS: the Put together tab shows only the eight limb pieces, in their places, and the torso with both shoulder balls, apart and with the sockets they left.');
