import * as T from 'three';
import {createSkeleton} from '../../../motion-core/skeleton/skeleton.js';
import {createSkinDeformer,installSkinShader} from './deform.js';
import {loadStudyAsset} from '../../../src/study-asset.js';

function partLabel(id,x,y){const side=x>=0?'L':'R';return id===0?(y>=1.0572?'chest':'pelvis'):id===1?'head':id===2?'neck':({3:'upper-arm',4:'forearm',5:'hand',6:'thigh',7:'calf',8:'foot'}[id]+'.'+side);}
const partBone=name=>name.startsWith('upper-arm.')?name.replace('upper-arm.','upperArm.'):name.startsWith('forearm.')?name.replace('forearm.','lowerArm.'):name.startsWith('calf.')?name.replace('calf.','shin.'):name==='chest'?'spine':name;

// Rest-surface proxies are used only by the lab's existing measurements.
// The visible body is one connected skinned mesh, never these rigid pieces.
function measurementParts(g,sk){
 const P=g.attributes.position,regions=g.attributes.part.array,groups=new Map(),I=g.index.array;
 const label=i=>partLabel(regions[i],P.getX(i),P.getY(i));
 for(let i=0;i<I.length;i+=3){const names=[label(I[i]),label(I[i+1]),label(I[i+2])],name=names[0]===names[1]||names[0]===names[2]?names[0]:names[1];if(!groups.has(name))groups.set(name,[]);groups.get(name).push(I[i],I[i+1],I[i+2]);}
 const material=new T.MeshBasicMaterial(),out=[];
 for(const [name,old]of groups){
  const map=new Map(),p=[],indices=[];for(const i of old){if(!map.has(i)){map.set(i,p.length/3);p.push(P.getX(i),P.getY(i),P.getZ(i));}indices.push(map.get(i));}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const mesh=new T.Mesh(geometry,material),bone=partBone(name);mesh.name=name;mesh.matrixAutoUpdate=false;
  if(!sk.index.has(bone))throw Error('Unknown measurement part '+name);
  out.push({label:name,mesh,bone,rest:new T.Matrix4(),restHead:new T.Vector3(...sk.bones[sk.index.get(bone)].head),sockets:[],measurementOnly:true});
 }
 return out;
}

export function bindSkinStudy(study){
 if(study.group.children.length!==1)throw Error('The skin must be one mesh');
 const source=study.group.children[0],g=source.geometry,spec=g.userData.skin,sk=createSkeleton();
 if(spec?.version!==1||spec.method!=='dual-quaternion')throw Error('Unsupported avatar skin');
 if(JSON.stringify(spec.boneNames)!==JSON.stringify(sk.bones.map(b=>b.name))||JSON.stringify(spec.jointHeads)!==JSON.stringify(sk.bones.map(b=>b.head)))throw Error('Skin/skeleton joint mismatch');
 const P=g.attributes.position,N=g.attributes.normal,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;
 if(!P||!N||!SI||!SW||!g.index||!g.attributes.part||[N,SI,SW,g.attributes.part].some(a=>a.count!==P.count)||SI.itemSize!==4||SW.itemSize!==4)throw Error('Incomplete skin buffers');
 for(let i=0;i<P.count;i++){
  let total=0;for(let k=0;k<3;k++)if(!Number.isFinite(P.array[3*i+k])||!Number.isFinite(N.array[3*i+k]))throw Error('Non-finite skin surface');
  for(let k=0;k<4;k++){const j=4*i+k,w=SW.array[j];if(!Number.isInteger(SI.array[j])||SI.array[j]>=sk.bones.length||!Number.isFinite(w)||w<0||w>1)throw Error('Invalid skin binding');total+=w;}
  if(Math.abs(total-1)>2e-6)throw Error('Skin weights must sum to one');
 }
 const deformer=createSkinDeformer(sk),root=new T.Group();root.name='continuous-avatar';
 const bones=sk.bones.map(b=>{const bone=new T.Bone();bone.name=b.name;bone.position.fromArray(b.head);return bone;});
 root.add(...bones);root.updateMatrixWorld(true);
 const graphicsSkeleton=new T.Skeleton(bones),material=installSkinShader(source.material,deformer,bones.length),skin=new T.SkinnedMesh(g,material);
 skin.name='continuous-skin';skin.frustumCulled=false;skin.bind(graphicsSkeleton);root.add(skin);
 skin.customDepthMaterial=installSkinShader(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking}),deformer,bones.length);
 skin.customDistanceMaterial=installSkinShader(new T.MeshDistanceMaterial(),deformer,bones.length);
 const point=new T.Vector3();
 skin.getVertexPosition=(i,target)=>deformer.transform(point.fromBufferAttribute(P,i),SI.array.subarray(4*i,4*i+4),SW.array.subarray(4*i,4*i+4),target);
 const attached=measurementParts(g,sk),delta=new T.Matrix4(),turn=new T.Matrix4(),back=new T.Matrix4();let solved;
 const jointNames=['upperArm','lowerArm','hand','thigh','shin','foot'].flatMap(n=>[n+'.L',n+'.R']);
 function apply(pose={}){
  solved=sk.solve(pose);deformer.update(solved);
  for(let i=0;i<bones.length;i++){const s=solved.get(bones[i].name);bones[i].position.copy(s.head);bones[i].quaternion.copy(s.rotation);}
  root.updateMatrixWorld(true);
  for(const a of attached){const s=solved.get(a.bone);delta.makeTranslation(s.head.x,s.head.y,s.head.z).multiply(turn.makeRotationFromQuaternion(s.rotation)).multiply(back.makeTranslation(-a.restHead.x,-a.restHead.y,-a.restHead.z));a.mesh.matrix.copy(delta);a.mesh.matrixWorld.multiplyMatrices(root.matrixWorld,delta);}
  // Conservative pose bounds keep ray inspection valid without CPU-skinning
  // every vertex every frame. The visible geometry itself remains unchanged.
  skin.boundingSphere??=new T.Sphere();skin.boundingSphere.center.copy(solved.get('pelvis').head);skin.boundingSphere.radius=2.4;
  skin.boundingBox??=new T.Box3();skin.boundingBox.setFromCenterAndSize(skin.boundingSphere.center,new T.Vector3(4.8,4.8,4.8));
  return solved;
 }
 let disposed=false;
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();g.dispose();material.dispose();skin.customDepthMaterial.dispose();skin.customDistanceMaterial.dispose();graphicsSkeleton.dispose();for(const a of attached)a.mesh.geometry.dispose();attached[0]?.mesh.material.dispose();}
 apply({});
 return {root,group:root,skin,skeleton:sk,graphicsSkeleton,attached,deformer,apply,dispose,jointNames,capabilities:Object.freeze({bodyPose:true,softChest:true,continuousSkin:true,fingerSkin:false,toeSkin:false}),get solved(){return solved;}};
}
export async function loadSkinAvatar(url){return bindSkinStudy(await loadStudyAsset(url));}
