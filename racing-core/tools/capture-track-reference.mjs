// Explicit, reproducible source-data capture. Never runs in a browser or game build.
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const reference = process.argv[2];
if (!reference)
    throw Error('Usage: node racing-core/tools/capture-track-reference.mjs /path/to/3D-World-3');
const revision = '573664e824a04234240a24dfc2eae2273e30a4ca';
const root = fileURLToPath(new URL('../../', import.meta.url)), temp = await mkdtemp(join(tmpdir(), 'letsgo-track-source-'));
try {
    const archive = execFileSync('git', ['-C', reference, 'archive', revision, 'apps/letsgo-racing/src'], { maxBuffer: 16000000 });
    const result = spawnSync('tar', ['-x', '-C', temp], { input: archive });
    if (result.status !== 0)
        throw Error('Reference extraction failed');
    const sourceRoot = join(temp, 'apps/letsgo-racing/src');
    const files = ['track.js', 'track-builder.js', 'skyline-track.js', 'suzuka-track.js', 'winding-track.js', 'data/suzuka-layout.js', 'courses.js', 'race-course.js', 'world.js', 'npc/race-progress.js'];
    const fileHashes = {};
    for (const file of files)
        fileHashes[file] = createHash('sha256').update(await readFile(join(sourceRoot, file))).digest('hex');
    const output = resolve(root, 'racing-core/track/reference.json'), bundle = join(temp, 'capture.mjs');
    const code = `
 import {COURSES} from ${JSON.stringify(join(sourceRoot, 'courses.js'))};
 import * as original from ${JSON.stringify(join(sourceRoot, 'track.js'))};
 import {skylineTrack,createSkylineTrack} from ${JSON.stringify(join(sourceRoot, 'skyline-track.js'))};
 import {suzukaTrack,createSuzukaTrack} from ${JSON.stringify(join(sourceRoot, 'suzuka-track.js'))};
 import {windingTrack,createWindingTrack} from ${JSON.stringify(join(sourceRoot, 'winding-track.js'))};
 import {createRoadSurface} from ${JSON.stringify(join(sourceRoot, 'world.js'))};
 import {writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
 const xyz=p=>[p.x,p.y,p.z],hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const sourceTracks=[{segments:original.trackSegments,rails:original.railSegments,access:original.access},skylineTrack,suzukaTrack,windingTrack];
 const visualGroups=[original.createTrack(),createSkylineTrack(),createSuzukaTrack(),createWindingTrack()];
 const typedHash=a=>a?createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex'):null;
 const tracks=COURSES.map((course,i)=>{
  const raw=sourceTracks[i],surface=createRoadSurface(raw.segments,course.halfWidth+course.curbWidth+1);
  const opening=i===0?original.originalCurbOpening:raw.opening,outer=course.halfWidth+course.curbWidth;
  const curbOpenings=[-1,1].map(side=>course.samples.slice(0,-1).flatMap((s,index)=>opening(s.point.clone().addScaledVector(s.normal,side*outer))?[index]:[]));
  const visual=visualGroups[i].children.filter(o=>o.isMesh).map(o=>{o.updateMatrix();return {positions:typedHash(o.geometry.attributes.position.array),normals:typedHash(o.geometry.attributes.normal?.array),colors:typedHash(o.geometry.attributes.color?.array),instances:o.isInstancedMesh?typedHash(o.instanceMatrix.array.slice(0,o.count*16)):null,instanceColors:o.instanceColor?typedHash(o.instanceColor.array.slice(0,o.count*3)):null,count:o.isInstancedMesh?o.count:null,transform:o.matrix.elements.slice(),material:{color:o.material.color?.getHexString(),vertexColors:o.material.vertexColors,side:o.material.side}};});
  const probes=[];
  for(let j=0;j<course.count;j+=19)for(const lateral of [-13.5,-6,0,6,13.5]){const s=course.samples[j],x=s.point.x+s.normal.x*lateral,z=s.point.z+s.normal.z*lateral;probes.push([x,z,s.point.y+.65,surface(x,z,s.point.y+.65)]);}
  const crossings=[];
  for(let a=0;a<course.count;a++)for(let b=a+12;b<course.count;b++){
   const p=raw.segments[a],q=raw.segments[b],dx=p.b.x-p.a.x,dz=p.b.z-p.a.z,ex=q.b.x-q.a.x,ez=q.b.z-q.a.z,den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
   const qx=q.a.x-p.a.x,qz=q.a.z-p.a.z,t=(qx*ez-qz*ex)/den,u=(qx*dz-qz*dx)/den;if(t<0||t>1||u<0||u>1)continue;
   const y=p.a.y+(p.b.y-p.a.y)*t,v=q.a.y+(q.b.y-q.a.y)*u;if(Math.abs(y-v)<4)continue;
   const x=p.a.x+dx*t,z=p.a.z+dz*t,low=Math.min(y,v),high=Math.max(y,v);
   crossings.push({x,z,low,high,lowerSupport:surface(x,z,low+.65),upperSupport:surface(x,z,high+.65)});
  }
  return {id:['original','skyline','suzuka','winding'][i],sourceId:course.id,name:course.name,startIndex:course.startIndex,halfWidth:course.halfWidth,curbWidth:course.curbWidth,sourceLength:course.length,entrance:course.entrance,access:raw.access,curbOpenings,
   samples:course.samples.map(s=>[s.point.x,s.point.y,s.point.z,s.normal.x,s.normal.z,s.distance]),
   rails:raw.rails.map(r=>[...xyz(r.a),...xyz(r.b)]),
   gates:course.gates.map(g=>[g.x,g.y,g.z,g.fx,g.fz,g.distance]),
   expected:{roadCornersSHA256:hash(raw.segments.map(s=>s.corners.map(xyz))),railsSHA256:hash(raw.rails.map(r=>[...xyz(r.a),...xyz(r.b)])),probes,crossings,visual},
  };
 });
 const data={schemaVersion:1,source:{repository:'isaiasurrutia96/3D-World-3',revision:${JSON.stringify(revision)},threeVersion:'0.180.0',fileHashes:${JSON.stringify(fileHashes)}},units:'metres',axis:'Y up; yaw 0 faces +Z',roadThickness:.65,wallHeight:1.2,appearance:{asphalt:'#25272b',underside:'#424750',sides:'#555b65',curbs:['#f4f3ef','#dc2828'],curbHeight:.04,curbStripeLength:3,railColor:'#a5adb8',railBeamSize:.16,railBeamHeights:[.55,1.08],railPostHeight:1.18,railPostSize:.18,railPostCenter:.59,railBeamOverlap:.04},tracks};
 writeFileSync(${JSON.stringify(output)},JSON.stringify(data)+'\\n');
 `;
    await build({ stdin: { contents: code, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: bundle, plugins: [{ name: 'pinned-three', setup(b) { b.onLoad({filter:/\/track\.js$/},async args=>({contents:(await readFile(args.path,'utf8'))+'\nexport {opening as originalCurbOpening};',loader:'js'})); b.onResolve({ filter: /^three$/ }, () => ({ path: resolve(root, 'node_modules/three/build/three.module.js') })); } }] });
    await import(pathToFileURL(bundle).href);
    console.log('Captured exact road, access, rails, gates and independent support probes from ' + revision);
    console.log('reference.json SHA256 ' + createHash('sha256').update(await readFile(output)).digest('hex'));
}
finally {
    await rm(temp, { recursive: true, force: true });
}
