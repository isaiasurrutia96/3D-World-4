import * as T from 'three';
import {sourcePose} from '../avatar-walk/retarget.js';

// Reuse the already extracted model and textures for additional camera views.
export async function createMario(){
 const data=await fetch('/data.json').then(r=>r.json()),model=new T.Group(),joints=[],textures={},loader=new T.TextureLoader();model.scale.setScalar(data.scale);
 const names=new Set(Object.values(data.meshes).flatMap(b=>b.map(x=>x.texture)).filter(Boolean));
 await Promise.all([...names].map(async name=>{const texture=await loader.loadAsync('/textures/'+name+'.png');texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.LinearFilter;textures[name]=texture;}));
 for(const bone of data.bones){
  const joint=new T.Group();joint.matrixAutoUpdate=false;model.add(joint);joints.push(joint);
  for(const batch of data.meshes[bone.mesh]||[]){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(batch.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(batch.normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(batch.uv,2));g.computeBoundingSphere();
   const color=new T.Color().setRGB(...batch.color.map(v=>v/255),T.SRGBColorSpace),material=new T.MeshLambertMaterial({color:batch.texture?0xffffff:color,map:batch.texture?textures[batch.texture]:null,side:T.DoubleSide});joint.add(new T.Mesh(g,material));
  }
 }
 function setFrame(f){const {matrices}=sourcePose(f,true);joints.forEach((j,i)=>{j.matrix.copy(matrices[i]);j.matrixWorldNeedsUpdate=true;});model.updateMatrixWorld(true);}
 setFrame(0);return {model,joints,setFrame};
}
