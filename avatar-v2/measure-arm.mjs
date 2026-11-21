// Measures the reference arm (upper arm, forearm and elbow ball from the Game
// avatar) so the new arm keeps the approved proportions: length, and the
// average and front/back/side radius along each limb, plus the ball radius.
// Read-only; prints a table. Usage: node avatar-v2/measure-arm.mjs
import {readFile} from 'node:fs/promises';
import {decodeStudyBinary,binaryStudyReady} from '../src/study-binary.js';
import {SIDE} from '../motion-core/skeleton/bones.js';
const game=JSON.parse(await readFile('avatar/assembled-joints/game.json'));
await binaryStudyReady;const data=decodeStudyBinary(await readFile('avatar/assembled-joints/'+game.asset));
const bone=n=>SIDE.find(b=>b.name===n),sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(...a);
/** Part vertices in avatar space (parts store local positions plus a transform). */
function toWorld(part){
 const [qx,qy,qz,qw]=part.transform.quaternion,[px,py,pz]=part.transform.position,src=part.attributes.position.array,out=new Float64Array(src.length);
 for(let i=0;i<src.length;i+=3){const [x,y,z]=[src[i],src[i+1],src[i+2]];
  const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;
  out[i]=ix*qw+iw*-qx+iy*-qz-iz*-qy+px;out[i+1]=iy*qw+iw*-qy+iz*-qx-ix*-qz+py;out[i+2]=iz*qw+iw*-qz+ix*-qy-iy*-qx+pz;}
 return out;
}
for(const [part,from,to] of [['upper-arm.L','upperArm','lowerArm'],['forearm.L','lowerArm','hand']]){
 const A=bone(from).head,B=bone(to).head,axis=sub(B,A),L=len(axis),u=axis.map(v=>v/L);
 const q0=data.parts.find(q=>q.transform.name===part),p=toWorld(q0),bins=Array.from({length:12},()=>({max:0,front:0,back:0,side:0}));
 for(let i=0;i<p.length;i+=3){const d=sub([p[i],p[i+1],p[i+2]],A),t=dot(d,u),r=len(sub(d,u.map(v=>v*t)));const k=Math.floor(t/L*12);if(k<0||k>11)continue;const b=bins[k];b.max=Math.max(b.max,r);
  const radial=sub(d,u.map(v=>v*t));if(radial[2]>r*.9)b.front=Math.max(b.front,r);if(radial[2]<-r*.9)b.back=Math.max(b.back,r);if(Math.abs(radial[0])>r*.9)b.side=Math.max(b.side,r);}
 console.log(part,'length',L.toFixed(3),'m');console.log(bins.map((b,k)=>`  ${((k+.5)/12).toFixed(2)}  max ${(b.max*1000).toFixed(0)} front ${(b.front*1000).toFixed(0)} back ${(b.back*1000).toFixed(0)} side ${(b.side*1000).toFixed(0)} mm`).join('\n'));
}
for(const n of ['ball-upperArm.L','ball-lowerArm.L','ball-hand.L']){const q=data.parts.find(x=>x.transform.name===n);console.log(n,'radius',(q.transform.userData?.assembly?.radius??'?'),JSON.stringify(q.transform.userData?.assembly??{}).slice(0,160));}
