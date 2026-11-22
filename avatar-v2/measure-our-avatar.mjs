// Measures "Our avatar" (the official avatar in the Test Lab, avatar/official.json, the 19 November joint
// assembly) so the new avatar's limbs can be matched to its overall size (owner, 22 November 2026: match the
// overall length and thickness, not the exact shapes). Writes our-avatar-sizes.json:
//  - each limb's thickness (widest around its own line) and length along that line, as drawn;
//  - each joint-to-joint distance, from the skeleton that avatar is built on (shoulder to elbow, elbow to
//    wrist, hip to knee, knee to ankle): the overall length of each limb including its joints.
// Usage: npm run build:avatar-test, then node avatar-v2/measure-our-avatar.mjs (CHROMIUM_PATH=... if needed)
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,join} from 'node:path';
import {chromium} from 'playwright';
import {limbLine} from './original-body.js';
import {SIDE} from '../motion-core/skeleton/bones.js';

const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.gz':'application/gzip','.bin':'application/octet-stream'};
const server=createServer(async(q,r)=>{let p=join('dist',decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';try{const b=await readFile(p);r.writeHead(200,{'content-type':types[extname(p)]??'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end();}});
await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),page=await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/avatar-test/`);await page.waitForFunction(()=>window.avatarLabReady,null,{timeout:120000});
const meshes=await page.evaluate(()=>{const s=window.avatarLab.scene;s.updateMatrixWorld(true);const out={};
 s.traverse(o=>{if(!o.isMesh||!/^(upper-arm|forearm|thigh|calf)\.L$/.test(o.name))return;const P=o.geometry.attributes.position,v=new o.position.constructor(),pos=[];
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);}out[o.name.slice(0,-2)]=pos;});return out;});
await browser.close();server.close();
const thickness=(pos,L)=>{let r=0;for(let i=0;i<pos.length;i+=3){const v=[pos[i]-L.centre[0],pos[i+1]-L.centre[1],pos[i+2]-L.centre[2]],s=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];r=Math.max(r,Math.hypot(v[0]-L.dir[0]*s,v[1]-L.dir[1]*s,v[2]-L.dir[2]*s));}return 2*r;};
const limbs={};for(const [n,pos] of Object.entries(meshes)){const L=limbLine(pos);limbs[n]={length:+L.length.toFixed(4),thickness:+thickness(pos,L).toFixed(4)};}
const head=n=>SIDE.find(b=>b.name===n).head,d=(a,b)=>+Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]).toFixed(4);
const joints={'upper-arm':d(head('upperArm'),head('lowerArm')),forearm:d(head('lowerArm'),head('hand')),thigh:d(head('thigh'),head('shin')),calf:d(head('shin'),head('foot'))};
await writeFile('avatar-v2/our-avatar-sizes.json',JSON.stringify({source:'avatar/official.json (Test Lab: Our avatar), left side',limbs,jointToJoint:joints},null,1)+'\n');
console.log(JSON.stringify({limbs,joints}));
