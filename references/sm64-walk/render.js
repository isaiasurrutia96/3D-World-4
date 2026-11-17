import * as T from '/node_modules/three/build/three.module.js';
const data=await fetch('./data.json').then(r=>r.json());
const scene=new T.Scene();scene.background=new T.Color('#f1f0eb');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(720,900);renderer.setPixelRatio(1);document.body.prepend(renderer.domElement);
const model=new T.Group();model.scale.setScalar(data.scale);scene.add(model);const joints=[];
const loader=new T.TextureLoader(),textures={};
const textureNames=new Set(Object.values(data.meshes).flatMap(b=>b.map(x=>x.texture)).filter(Boolean));
await Promise.all([...textureNames].map(async name=>{const texture=await loader.loadAsync('./textures/'+name+'.png');texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.LinearFilter;texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;textures[name]=texture;}));
for(const bone of data.bones){
 const joint=new T.Group();joint.name=bone.name;joint.matrixAutoUpdate=false;(bone.parent<0?model:joints[bone.parent]).add(joint);joints.push(joint);
 for(const batch of data.meshes[bone.mesh]||[]){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(batch.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(batch.normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(batch.uv,2));g.computeBoundingSphere();
  const color=new T.Color().setRGB(...batch.color.map(v=>v/255),T.SRGBColorSpace);
  const material=new T.MeshLambertMaterial({color:batch.texture?0xffffff:color,map:batch.texture?textures[batch.texture]:null,side:T.DoubleSide});joint.add(new T.Mesh(g,material));
 }
}
const {indices,values,frames}=data.animation,TAU=Math.PI*2;
function sample(channel,frame,rotation=false){
 const count=indices[channel*2],base=indices[channel*2+1],f=Math.floor(frame),t=frame-f,a=values[base+Math.min(f,count-1)],b=values[base+Math.min((f+1)%frames,count-1)];
 let d=b-a;if(rotation){if(d>32767)d-=65536;if(d<-32768)d+=65536;}return a+d*t;
}
function matrix(x,y,z,rx,ry,rz){
 const sx=Math.sin(rx),cx=Math.cos(rx),sy=Math.sin(ry),cy=Math.cos(ry),sz=Math.sin(rz),cz=Math.cos(rz);
 return new T.Matrix4().set(cy*cz,sx*sy*cz-cx*sz,cx*sy*cz+sx*sz,x,cy*sz,sx*sy*sz+cx*cz,cx*sy*sz-sx*cz,y,-sy,sx*cy,cx*cy,z,0,0,0,1);
}
function pose(frame){
 frame=((frame%frames)+frames)%frames;
 for(let i=0;i<joints.length;i++){
  const p=data.bones[i].offset.slice();if(i===0)for(let a=0;a<3;a++)p[a]+=sample(a,frame);
  const r=[0,1,2].map(a=>sample(3+i*3+a,frame,true)*TAU/65536);joints[i].matrix.copy(matrix(...p,...r));joints[i].matrixWorldNeedsUpdate=true;
 }
 model.updateMatrixWorld(true);
}
const total=new T.Box3();for(let f=0;f<frames;f++){pose(f);total.union(new T.Box3().setFromObject(model));}
const center=total.getCenter(new T.Vector3()),size=total.getSize(new T.Vector3()),height=size.y*1.35;
const camera=new T.OrthographicCamera(-height*.8/2,height*.8/2,height/2,-height/2,.1,3000);camera.position.set(-700,center.y,center.z);camera.lookAt(0,center.y,center.z);
scene.add(new T.HemisphereLight(0xffffff,0xb0b9c5,1.45));const key=new T.DirectionalLight(0xffffff,1.3);key.position.set(-3,5,4);scene.add(key);const fill=new T.DirectionalLight(0xffffff,.4);fill.position.set(3,2,-5);scene.add(fill);
function frame(f){pose(f);renderer.render(scene,camera);}
window.reference={frame,bounds:{min:total.min.toArray(),max:total.max.toArray()},data,camera,scene,model,joints};frame(0);window.referenceReady=true;
