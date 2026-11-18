// Hand tilt checks: both hands turned slightly at the wrist (fingertips a
// little forward), still cradled in their sockets, mirrored, and nothing
// else on the avatar moved. Usage: node tests/avatar/hand-tilt.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'tilt-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createAssembledAvatar,HAND_TILT_DEGREES} from '${root}/avatar-lab/src/avatar.js';export * as T from 'three';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {createAssembledAvatar,HAND_TILT_DEGREES,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail}),mm=v=>(v*1000).toFixed(2)+' mm';
const before=createAssembledAvatar({handTilt:0}),after=createAssembledAvatar();
for(const a of [before,after])a.rig.root.updateMatrixWorld(true);
const pts=m=>{const p=m.geometry.attributes.position,o=[];for(let i=0;i<p.count;i++)o.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));return o;};
const ball=points=>{const A=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],N=[0,0,0,0];for(const p of points){const a=[2*p.x,2*p.y,2*p.z,1],b=p.lengthSq();for(let i=0;i<4;i++){N[i]+=a[i]*b;for(let j=0;j<4;j++)A[i][j]+=a[i]*a[j];}}
 const e=new T.Matrix4().set(...A.flat()).invert().elements;return new T.Vector3(...[0,1,2].map(i=>e[i]*N[0]+e[4+i]*N[1]+e[8+i]*N[2]+e[12+i]*N[3]));};
const centre=l=>l.reduce((s,v)=>s.add(v),new T.Vector3()).multiplyScalar(1/l.length);
const res={};
for(const side of [1,-1]){
 const h0=before.lowerArmParts.find(p=>p.side===side).hand,h1=after.lowerArmParts.find(p=>p.side===side).hand,p0=pts(h0),p1=pts(h1);
 // The wrist ball: same hand-surface points in both, fitted as a sphere.
 let top=-Infinity;for(const v of p0)top=Math.max(top,v.y);const idx=p0.map((v,i)=>v.y>top-.05?i:-1).filter(i=>i>=0);
 const b0=ball(idx.map(i=>p0[i])),b1=ball(idx.map(i=>p1[i]));
 const q0=h0.getWorldQuaternion(new T.Quaternion()),q1=h1.getWorldQuaternion(new T.Quaternion()),turn=q1.clone().multiply(q0.clone().invert());
 const angle=2*Math.acos(Math.min(1,Math.abs(turn.w)))*180/Math.PI,axis=new T.Vector3(turn.x,turn.y,turn.z).normalize();
 res[side]={ballMove:b0.distanceTo(b1),angle,axisX:Math.abs(axis.x),forward:centre(p1).z-centre(p0).z,c1:centre(p1)};
}
const L=res[1],Rt=res[-1]; // side 1 is his left (+x), side -1 his right
check(`both hands turned ${HAND_TILT_DEGREES}° at the wrist, about the sideways axis`,[L,Rt].every(r=>Math.abs(r.angle-HAND_TILT_DEGREES)<.01&&r.axisX>.999),`left ${L.angle.toFixed(2)}°, right ${Rt.angle.toFixed(2)}°`);
check('fingertips moved slightly forward on both hands',L.forward>0&&Rt.forward>0,`hand centres moved forward ${mm(L.forward)} (left), ${mm(Rt.forward)} (right)`);
check('each hand stays cradled in its socket (the wrist ball did not move)',Math.max(L.ballMove,Rt.ballMove)<1e-4,`wrist ball moved ${mm(L.ballMove)} (left), ${mm(Rt.ballMove)} (right)`);
check('left and right hands are exact mirror images',Math.hypot(L.c1.x+Rt.c1.x,L.c1.y-Rt.c1.y,L.c1.z-Rt.c1.z)<1e-6);
// Nothing else moved.
const meshes=a=>{const o=[];a.rig.root.traverse(m=>{if(m.isMesh&&!/hand/.test(m.name))o.push(m);});return o;};
const m0=meshes(before),m1=meshes(after);let worst=0;m0.forEach((m,i)=>{const a=pts(m),b=pts(m1[i]);for(let k=0;k<a.length;k+=5)worst=Math.max(worst,a[k].distanceTo(b[k]));});
check('nothing else on the avatar moved',worst<1e-9&&m0.length===m1.length,`${m0.length} other parts compared`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: both hands tilted at the wrist, still seated, nothing else changed.');process.exit(fail?1:0);
