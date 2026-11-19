import * as T from 'three';
import {loadStudyAsset} from '../../src/study-asset.js';

async function open(){
 const study=await loadStudyAsset('./parts.json.gz'),scene=new T.Scene();
 scene.background=new T.Color('#405363');scene.add(study.group);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(2);renderer.setSize(900,1200);document.body.append(renderer.domElement);
 renderer.shadowMap.enabled=false;
 const bounds=new T.Box3().setFromObject(study.group),target=bounds.getCenter(new T.Vector3()),height=bounds.getSize(new T.Vector3()).y*1.25;
 const camera=new T.OrthographicCamera(-height*.75/2,height*.75/2,height/2,-height/2,.01,20);
 scene.add(new T.HemisphereLight(0xffffff,0x6e8291,1.5));
 for(const [intensity,position] of [[2.7,[-2,3,4]],[.8,[3,.5,1]],[1.3,[0,2,-3]]]){
  const light=new T.DirectionalLight(0xffffff,intensity);light.position.copy(target).add(new T.Vector3(...position));light.target.position.copy(target);scene.add(light,light.target);
  if(intensity===2.7){light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-.6;light.shadow.camera.right=.6;light.shadow.camera.top=.7;light.shadow.camera.bottom=-.7;light.shadow.camera.near=.1;light.shadow.camera.far=10;light.shadow.bias=-.00005;light.shadow.normalBias=.0005;}
 }
 for(const part of study.group.children){part.castShadow=true;part.receiveShadow=true;}
 const views={front:[0,0,3],side:[3,0,0],angled:[2,.55,-3]};
 const restPosition=study.calf.position.clone(),restQuaternion=study.calf.quaternion.clone();let bend=0;
 window.setPreviewPose=degrees=>{
  if(!Number.isFinite(degrees)||degrees<0||degrees>150)throw Error('Static knee preview must stay within the existing bend limit');
  bend=degrees;const rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*Math.PI/180),pivot=study.ball.position;
  study.calf.position.copy(restPosition).sub(pivot).applyQuaternion(rotation).add(pivot);
  study.calf.quaternion.copy(rotation).multiply(restQuaternion);study.group.updateMatrixWorld(true);
  bounds.setFromObject(study.group);bounds.getCenter(target);const size=bounds.getSize(new T.Vector3()),height=degrees?Math.max(size.y,size.x/.75,size.z/.75)*1.35:size.y*1.25;
  camera.left=-height*.75/2;camera.right=height*.75/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
 };
 window.setPreviewView=name=>{
  camera.position.copy(target).add(new T.Vector3(...views[name]));camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld(true);
  const label=name==='angled'?'Angled · rear':name[0].toUpperCase()+name.slice(1);
  document.querySelector('#view').textContent=label+(bend?' · '+(180-bend)+'° inside angle':'');
  renderer.render(scene,camera);
 };
 window.renderPreviewTriptych=()=>{
  renderer.setPixelRatio(1);renderer.setSize(2700,1200);renderer.setScissorTest(true);
  document.body.style.width='2700px';document.body.style.height='1200px';
  document.querySelectorAll('.triptych-label').forEach(label=>label.remove());
  document.querySelector('header').style.display='none';
  for(const [i,name] of ['front','side','angled'].entries()){
   renderer.setViewport(i*900,0,900,1200);renderer.setScissor(i*900,0,900,1200);window.setPreviewView(name);
   const label=document.createElement('header');label.className='triptych-label';label.style.left=i*900+'px';label.style.right='auto';label.style.width='900px';
   label.textContent=(name==='angled'?'Angled · rear':name[0].toUpperCase()+name.slice(1))+' · '+(180-bend)+'° inside angle';document.body.append(label);
  }
 };
 window.previewStudy=study;window.setPreviewView('front');window.previewReady=true;
}
open().catch(error=>{console.error(error);document.querySelector('#view').textContent=error.message;});
