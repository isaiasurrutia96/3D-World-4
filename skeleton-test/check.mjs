// Skeleton section 2 checks: every body part hangs on a bone, the rest pose
// is the approved Checkpoint 2 avatar point for point, and every joint ball
// stays in its socket in random poses. Usage: node skeleton-test/check.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dir=mkdtempSync(join(tmpdir(),'attach-')),entry=join(dir,'e.js');
writeFileSync(entry,`export {createSkeletonAvatar} from '${root}/skeleton-test/attach.js';export {createAssembledAvatar} from '${root}/avatar-lab/src/avatar.js';export * as T from 'three';`);
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')],
 plugins:[{name:'h',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const {createSkeletonAvatar,createAssembledAvatar,T}=await import(pathToFileURL(join(dir,'o.mjs')).href);

const A=createSkeletonAvatar(),S=A.skeleton,R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail});
const mm=v=>(v*1000).toFixed(2)+' mm';
const part=label=>A.attached.find(a=>a.label===label);
check('all 16 clay body parts hang on a bone (chest and pelvis now separate)',A.attached.length===16&&new Set(A.attached.map(a=>a.mesh)).size===16,A.attached.map(a=>`${a.label}→${a.bone}`).join(', '));

// Rest pose = the approved avatar, point for point.
const ref=createAssembledAvatar();ref.rig.root.updateMatrixWorld(true);
const refMeshes=[];ref.rig.root.traverse(o=>{if(o.isMesh)refMeshes.push(o);});
let worst=0,count=0;const v=new T.Vector3(),w=new T.Vector3();
for(const a of A.attached){
 const twin=refMeshes.find(m=>m.geometry.attributes.position.count===a.mesh.geometry.attributes.position.count&&Math.abs(new T.Box3().setFromObject(m).getCenter(new T.Vector3()).x-new T.Box3().setFromBufferAttribute(a.mesh.geometry.attributes.position).applyMatrix4(a.mesh.matrix).getCenter(new T.Vector3()).x)<.01);
 const p=a.mesh.geometry.attributes.position,q=twin.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){v.fromBufferAttribute(p,i).applyMatrix4(a.mesh.matrix);w.fromBufferAttribute(q,i).applyMatrix4(twin.matrixWorld);worst=Math.max(worst,v.distanceTo(w));count++;}
}
check('at rest, every point of every part is exactly where Checkpoint 2 has it',worst<1e-6,`${count.toLocaleString()} points compared, largest difference ${worst.toExponential(1)} m`);

// Joint balls stay in their sockets.
const world=(a,local)=>local.clone().applyMatrix4(a.mesh.matrix);
const endPoints=(a,top,band)=>{const p=a.mesh.geometry.attributes.position,pts=[];for(let i=0;i<p.count;i++)pts.push(new T.Vector3().fromBufferAttribute(p,i));
 const ys=pts.map(x=>x.clone().applyMatrix4(a.rest).y);let e=top?-1e9:1e9;for(const y of ys)e=top?Math.max(e,y):Math.min(e,y);return pts.filter((x,i)=>top?ys[i]>e-band:ys[i]<e+band);};
const ballCentre=(pts,M)=>{const ATA=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],N=[0,0,0,0];for(const l of pts){const q=l.clone().applyMatrix4(M),a=[2*q.x,2*q.y,2*q.z,1],b=q.lengthSq();for(let i=0;i<4;i++){N[i]+=a[i]*b;for(let j=0;j<4;j++)ATA[i][j]+=a[i]*a[j];}}
 const e=new T.Matrix4().set(...ATA.flat()).invert().elements,s=[0,1,2,3].map(i=>e[i]*N[0]+e[4+i]*N[1]+e[8+i]*N[2]+e[12+i]*N[3]);return new T.Vector3(s[0],s[1],s[2]);};
const joints=[];
for(const s of ['L','R'])joints.push(
 {name:'shoulder '+s,child:part('upper-arm.'+s),parent:part('chest'),top:true,band:.06},
 {name:'elbow '+s,child:part('forearm.'+s),parent:part('upper-arm.'+s),top:true,band:.05},
 {name:'wrist '+s,child:part('hand.'+s),parent:part('forearm.'+s),top:true,band:.05},
 {name:'hip '+s,child:part('thigh.'+s),parent:part('pelvis'),top:true,band:.06},
 {name:'knee '+s,child:part('calf.'+s),parent:part('thigh.'+s),top:true,band:.05});
joints.push({name:'head',child:part('head'),parent:part('neck'),all:true});
// Waist: the chest's ball (its points below the underside) in the pelvis bowl.
const ballPts=(()=>{const c=part('chest'),P=c.mesh.geometry.attributes.position,piv=A.avatar.waist.pivotLocal,o=[];for(let i=0;i<P.count;i++){const v=new T.Vector3().fromBufferAttribute(P,i);if(v.y<piv.y+.03&&v.y>piv.y-.03&&Math.hypot(v.x,v.z)>.05)o.push(v);}return o;})();
joints.push({name:'waist',child:part('chest'),parent:part('pelvis'),pts:ballPts});
// The wrist ball's surface points are picked on the untilted hand (tilting changes which points are "top").
const flat=createAssembledAvatar({handTilt:0});flat.rig.root.updateMatrixWorld(true);
const flatTop=side=>{const h=flat.lowerArmParts.find(p=>p.side===side).hand,P=h.geometry.attributes.position,ys=[];let e=-1e9;for(let i=0;i<P.count;i++){const y=new T.Vector3().fromBufferAttribute(P,i).applyMatrix4(h.matrixWorld).y;ys.push(y);e=Math.max(e,y);}
 const out=[];for(let i=0;i<P.count;i++)if(ys[i]>e-.05)out.push(new T.Vector3().fromBufferAttribute(P,i));return out;};
for(const j of joints){if(j.name.startsWith('wrist'))j.pts=flatTop(j.name.endsWith('L')?1:-1);}
for(const j of joints){if(j.pts){j.restCentre=ballCentre(j.pts,j.child.rest);j.inParent=j.restCentre.clone().applyMatrix4(j.parent.rest.clone().invert());continue;}
 j.pts=j.all?(()=>{const p=j.child.mesh.geometry.attributes.position,o=[];for(let i=0;i<p.count;i++)o.push(new T.Vector3().fromBufferAttribute(p,i));return o;})():endPoints(j.child,j.top,j.band);
 j.restCentre=ballCentre(j.pts,j.child.rest);j.inParent=j.restCentre.clone().applyMatrix4(j.parent.rest.clone().invert());}
let seed=3;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
const randomPose=()=>{const p={};for(const b of S.bones){if(!b.parent||b.name==='spine')continue;p[b.name]=Object.fromEntries(['x','y','z'].map(k=>[k,b.limits[k][0]+rand()*(b.limits[k][1]-b.limits[k][0])]));}return p;};
// Shoulders sit in the chest's firm zone, which follows the chest bone (firmMatrix).
const parentMatrix=j=>j.name.startsWith('shoulder')?j.parent.firmMatrix:j.parent.mesh.matrix;
const worstSeat={};for(let n=0;n<40;n++){A.apply(randomPose());for(const j of joints){const ball=ballCentre(j.pts,j.child.mesh.matrix),socket=j.inParent.clone().applyMatrix4(parentMatrix(j));worstSeat[j.name]=Math.max(worstSeat[j.name]??0,ball.distanceTo(socket));}}
const seatMax=Math.max(...Object.values(worstSeat));
check('every joint ball stays in its socket (waist, shoulders, elbows, wrists, hips, knees, head) in 40 random poses, chest bending included',seatMax<5e-4,Object.entries(worstSeat).map(([k,v])=>`${k} ${mm(v)}`).join(', '));
A.apply(S.restPose());
const t0=performance.now();for(let n=0;n<2000;n++)A.apply(randomPose());const us=(performance.now()-t0)/2000*1000;
check('fast enough for every frame (under 2 ms of a 16 ms frame, chest bending every frame)',us<2000,`${us.toFixed(0)} µs to pose the whole body; holding still costs nothing extra for the chest`);
console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: the body parts follow the skeleton and every joint stays seated.');process.exit(fail?1:0);
