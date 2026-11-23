// Browser check of the New avatar page: the first tab, Torso sockets, shows only the torso and both shoulder balls;
// on the "Put together" tab Our avatar loads next to the new avatar.
// Usage: npm run build:new-avatar && npm run build:avatar-test, then node avatar-v2/check-new-avatar-page.mjs
// (the second build copies Our avatar's files into dist; restore avatar-test/index.html with git checkout after it).
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createServer} from 'node:http';import {extname,join} from 'node:path';import {chromium} from 'playwright';
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
  // The first tab: the torso with its shoulder sockets and both balls beside it, nothing else.
  const first=await page.evaluate(()=>{const L=window.newAvatarLab,names=g=>{const n=[];g.traverse(o=>{if(o.isMesh)n.push(o.name);});return n.sort();};
   const item=L.options[0],extra=item.group.children.find(o=>o.isMesh).clone();extra.name='head';item.group.add(extra);const withExtra=names(item.group);item.group.remove(extra);
   return {group:L.getGroup(),ids:L.options.map(o=>o.id),names:names(item.group),withExtra,hipNames:names(L.options[1].group),hipSocketNames:names(L.options[2].group),limbNames:names(L.options[3].group),ekNames:names(L.options[4].group),waNames:names(L.options[5].group)};});
  const want=['ball-shoulder.left','ball-shoulder.right','torso'];
  assert.equal(first.group,'torso-sockets','the Torso sockets tab opens first');assert.deepEqual(first.ids,['torso-sockets-boy','torso-hips-apart','torso-hip-sockets','torso-limb-sockets','torso-elbow-knee-sockets','torso-wrist-ankle-sockets']);
  assert.deepEqual(first.limbNames,['ball-hip.left','ball-hip.right','ball-shoulder.left','ball-shoulder.right','thigh.left','thigh.right','torso','upper-arm.left','upper-arm.right'],'limbs: the torso, its four balls, both upper arms and both thighs');assert.deepEqual(first.ekNames,['ball-elbow.left','ball-elbow.right','ball-hip.left','ball-hip.right','ball-knee.left','ball-knee.right','ball-shoulder.left','ball-shoulder.right','thigh.left','thigh.right','torso','upper-arm.left','upper-arm.right'],'elbows and knees: the torso, its four balls, both upper arms and thighs, and the elbow and knee balls');assert.deepEqual(first.waNames,['ball-ankle.left','ball-ankle.right','ball-elbow.left','ball-elbow.right','ball-hip.left','ball-hip.right','ball-knee.left','ball-knee.right','ball-shoulder.left','ball-shoulder.right','ball-wrist.left','ball-wrist.right','calf.left','calf.right','foot.left','foot.right','forearm.left','forearm.right','hand.left','hand.right','thigh.left','thigh.right','torso','upper-arm.left','upper-arm.right'],'whole arms and legs: every piece and ball below the neck, nothing else');assert.deepEqual(first.names,want,'only the torso and both shoulder balls');
  assert.deepEqual(first.hipNames,['ball-hip.left','ball-hip.right','ball-shoulder.left','ball-shoulder.right','torso'],'hips apart: the torso, both shoulder balls and both hip balls');
  assert.deepEqual(first.hipSocketNames,['ball-hip.left','ball-hip.right','ball-shoulder.left','ball-shoulder.right','torso'],'hip sockets: the torso, both shoulder balls and both hip balls');
  assert.notDeepEqual(first.withExtra,want,'test of the test: an extra piece was not caught');
  await page.evaluate(()=>window.newAvatarLab.setGroup('together'));
  const loaded=await page.evaluate(()=>window.ourAvatarLoaded);
  assert.equal(loaded,true,'Our avatar did not load: '+errors.join('; '));
  const m=await page.evaluate(()=>{const L=window.newAvatarLab,box=g=>{const b={min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]};g.updateMatrixWorld(true);const v=new (g.position.constructor)();
    g.traverse(o=>{if(!o.isMesh)return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);[v.x,v.y,v.z].forEach((x,k)=>{b.min[k]=Math.min(b.min[k],x);b.max[k]=Math.max(b.max[k],x);});}});return b;};
   const ids=L.options.map(o=>o.id),ours=box(L.ourAvatar.root),neu=box(L.options.find(o=>o.id==='together-boy').group);return {group:L.getGroup(),ids,ours,neu};});
  assert.equal(loaded,true,'Our avatar did not load');assert.deepEqual(errors,[],'page errors');
  assert.equal(m.group,'together');assert.deepEqual(m.ids,['our-avatar','together-boy'],'Our avatar first, then the new avatar');
  assert(Math.abs(m.ours.min[1])<.002,`Our avatar not on the floor: lowest ${m.ours.min[1]}`);
  const tall=m.ours.max[1]-m.ours.min[1];assert(tall>1.8&&tall<2,`Our avatar ${tall} m tall`);
  assert(m.ours.max[0]<m.neu.min[0],'Our avatar overlaps the new avatar');
  results.push(`${w}px: Torso sockets first (torso and both shoulder balls only; an extra piece is caught); Our avatar ${(tall*100).toFixed(1)} cm tall on the floor, ${((m.neu.min[0]-m.ours.max[0])*100).toFixed(0)} cm left of the new avatar, no errors`);
  await page.close();}
}finally{await browser.close();server.close();}
console.log(results.join('\n'));console.log('PASS: the Torso sockets tab opens first with only the torso and both shoulder balls; Our avatar loads next to the new avatar on the Put together tab.');
