import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createSkeleton} from '../../motion-core/skeleton/skeleton.js';
import {createSkinDeformer} from '../../avatar/src/skin/deform.js';
import {profile,blend} from '../../avatar/src/skin/field.js';
import {extractSurface} from '../../avatar/src/skin/surface.js';

test('Anatomical profiles are continuous and stay within their control radii',()=>{
 const f=profile([[0,.08],[.3,.12],[.6,.11],[1,.075]]);for(let i=0;i<=1000;i++){const y=f(i/1000);assert(y>=.075&&y<=.12);if(i)assert(Math.abs(y-f((i-1)/1000))<.001);}assert.equal(f(0),.08);assert.equal(f(1),.075);assert(Math.abs(blend(.02,.02,.04)-.01)<1e-12);
});
test('Dual-quaternion skinning equals the existing bone transform and preserves rigid volume',()=>{
 const s=createSkeleton(),d=createSkinDeformer(s),n=s.index.get('lowerArm.L'),head=new T.Vector3(...s.bones[n].head),p=new T.Vector3(.4,.85,.1);
 for(const angle of [-12,-60,-120,-150]){
  const solved=s.solve({'lowerArm.L':{x:angle}});d.update(solved);const b=solved.get('lowerArm.L'),expected=p.clone().sub(head).applyQuaternion(b.rotation).add(b.head),actual=d.transform(p,[n,0,0,0],[1,0,0,0]);
  assert(actual.distanceTo(expected)<2e-7);assert(Math.abs(actual.distanceTo(b.head)-p.distanceTo(head))<2e-7);
 }
 d.update(s.solve({}));assert(d.transform(p,[n,0,0,0],[1,0,0,0]).distanceTo(p)<1e-12);
});
test('An equal-weight 150-degree bend keeps the cross-section radius instead of collapsing it',()=>{
 const s=createSkeleton(),d=createSkinDeformer(s),parent=s.index.get('upperArm.L'),child=s.index.get('lowerArm.L'),c=new T.Vector3(...s.bones[child].head),axis=new T.Vector3(0,0,.07),a=c.clone().add(axis),b=c.clone().sub(axis);
 d.update(s.solve({'lowerArm.L':{x:-150}}));const A=d.transform(a,[parent,child,0,0],[.5,.5,0,0]),B=d.transform(b,[parent,child,0,0],[.5,.5,0,0]);assert(Math.abs(A.distanceTo(B)-.14)<2e-7);
});
test('Surface extraction produces one closed outward-wound sphere with an exact mirrored silhouette',()=>{
 const {geometry:g}=extractSurface({distance:(x,y,z)=>Math.hypot(x,y,z)-.203},{voxel:.035,bounds:{maxX:.3,minY:-.317,maxY:.31,minZ:-.312,maxZ:.31}});
 const P=g.attributes.position,I=g.index.array,edges=new Map();let volume=0;
 for(let i=0;i<I.length;i+=3){const a=new T.Vector3().fromBufferAttribute(P,I[i]),b=new T.Vector3().fromBufferAttribute(P,I[i+1]),c=new T.Vector3().fromBufferAttribute(P,I[i+2]);volume+=a.dot(b.clone().cross(c))/6;for(let k=0;k<3;k++){const a=I[i+k],b=I[i+(k+1)%3],key=Math.min(a,b)+','+Math.max(a,b),e=edges.get(key)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}}
 assert([...edges.values()].every(([n,w])=>n===2&&w===0));assert.equal(P.count-edges.size+I.length/3,2);assert(Math.abs(volume-4/3*Math.PI*.203**3)<.002);
 const keys=new Set();for(let i=0;i<P.count;i++)keys.add(P.getX(i)+','+P.getY(i)+','+P.getZ(i));for(let i=0;i<P.count;i++)assert(keys.has((-P.getX(i))+','+P.getY(i)+','+P.getZ(i)));
});
