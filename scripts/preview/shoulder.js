import * as T from 'three';
import {loadStudyAsset} from '../../src/study-asset.js';

async function open(){
 const study=await loadStudyAsset('./parts.json.gz'),scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(study.group);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(2);renderer.setSize(900,1200);document.body.append(renderer.domElement);
 const box=new T.Box3().setFromObject(study.group),home=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);
 scene.add(new T.HemisphereLight(0xffffff,0x6e8291,1.5));
 for(const [intensity,position] of [[2.7,[-2,3,4]],[.8,[3,.5,1]],[1.3,[0,2,-3]]]){const light=new T.DirectionalLight(0xffffff,intensity);light.position.copy(home).add(new T.Vector3(...position));light.target.position.copy(home);scene.add(light,light.target);}
 function frame(target,offset,height,aspect=.75){camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();camera.position.copy(target).add(new T.Vector3(...offset));camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld(true);renderer.render(scene,camera);}
 let height=Math.max(size.y,size.x/.75)*1.18,mode='Separated';const views={front:[0,0,3],side:[3,0,0],angled:[2,.55,3]},separated=study.group.children.map(p=>[p.position.clone(),p.quaternion.clone()]);
 function reframe(){study.group.updateMatrixWorld(true);box.setFromObject(study.group);box.getCenter(home);box.getSize(size);height=Math.max(size.y,size.x/.75)*1.18;}
 window.useRestInspection=()=>{
  const q=new T.Quaternion().setFromEuler(new T.Euler(...study.group.userData.restEuler,'XYZ'));
  study.torso.position.copy(study.ball.position).sub(new T.Vector3(...study.torso.geometry.userData.shoulderCenter));
  study.upperArm.quaternion.copy(q);study.upperArm.position.copy(study.ball.position).sub(new T.Vector3(...study.upperArm.geometry.userData.shoulderCenter).applyQuaternion(q));mode='Resting';reframe();
 };
 window.useSeparatedInspection=()=>{study.group.children.forEach((p,i)=>{p.position.copy(separated[i][0]);p.quaternion.copy(separated[i][1]);p.visible=true;});mode='Separated';reframe();};
 window.resetPortrait=()=>{document.querySelectorAll('.panel-label').forEach(p=>p.remove());document.querySelector('header').style.display='block';document.body.style.width='900px';renderer.setScissorTest(false);renderer.setPixelRatio(2);renderer.setSize(900,1200);renderer.setViewport(0,0,900,1200);};
 window.setPreviewView=name=>{frame(home,views[name],height);document.querySelector('header').textContent=name[0].toUpperCase()+name.slice(1)+' · one shoulder · '+mode.toLowerCase();};
 const label=(text,x,width)=>{const node=document.createElement('header');node.className='panel-label';node.style.left=x+'px';node.style.right='auto';node.style.width=width+'px';node.textContent=text;document.body.append(node);};
 function panels(width){document.querySelectorAll('.panel-label').forEach(p=>p.remove());document.querySelector('header').style.display='none';document.body.style.width=width+'px';renderer.setPixelRatio(1);renderer.setSize(width,1200);renderer.setScissorTest(true);}
 window.renderPreviewTriptych=()=>{panels(2700);for(const [i,name] of ['front','side','angled'].entries()){renderer.setViewport(i*900,0,900,1200);renderer.setScissor(i*900,0,900,1200);window.setPreviewView(name);label(name[0].toUpperCase()+name.slice(1),i*900,900);}};
 window.renderSocketDetails=()=>{
  panels(2400);
  for(let i=0;i<2;i++){
   const part=i===0?study.torso:study.upperArm;
   for(const mesh of study.group.children)mesh.visible=mesh===part;
   renderer.setViewport(i*1200,0,1200,1200);renderer.setScissor(i*1200,0,1200,1200);
   const target=part.localToWorld(new T.Vector3(...part.geometry.userData.shoulderCenter));
   if(i===0)frame(target,[3,.2,1.3],.40,1);else {target.y-=.035;frame(target,[.6,3,2],.33,1);}
   label(i===0?'Torso socket · one shoulder':'Upper-arm socket · from above',i*1200,1200);
  }
  for(const part of study.group.children)part.visible=true;
 };
 window.previewStudy=study;window.setPreviewView('front');window.previewReady=true;
}
open().catch(error=>{console.error(error);document.querySelector('header').textContent=error.message;});
