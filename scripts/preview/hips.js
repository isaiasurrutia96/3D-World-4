import * as T from 'three';
import {loadStudyAsset} from '../../src/study-asset.js';

async function open(){
 const study=await loadStudyAsset('./parts.json.gz'),scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(study.group);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(2);renderer.setSize(900,1200);document.body.append(renderer.domElement);
 const bounds=new T.Box3().setFromObject(study.group),target=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);
 scene.add(new T.HemisphereLight(0xffffff,0x6e8291,1.5));
 for(const [intensity,position] of [[2.7,[-2,3,4]],[.8,[3,.5,1]],[1.3,[0,2,-3]]]){const light=new T.DirectionalLight(0xffffff,intensity);light.position.copy(target).add(new T.Vector3(...position));light.target.position.copy(target);scene.add(light,light.target);}
 const frame=(height,aspect=.75)=>{camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();};
 const home=target.clone(),height=Math.max(size.y,size.x/.75)*1.2;
 const views={front:[0,0,3],side:[3,0,0],angled:[2,.65,3]};
 window.setPreviewView=name=>{
  target.copy(home);frame(height);camera.position.copy(target).add(new T.Vector3(...views[name]));camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld(true);
  document.querySelector('header').textContent=name[0].toUpperCase()+name.slice(1)+' · '+(document.body.dataset.studyState||'separated')+' hip study';renderer.render(scene,camera);
 };
 const label=(text,x,width)=>{const node=document.createElement('header');node.className='panel-label';node.style.left=x+'px';node.style.right='auto';node.style.width=width+'px';node.textContent=text;document.body.append(node);};
 function panels(width){document.querySelectorAll('.panel-label').forEach(p=>p.remove());document.querySelector('header').style.display='none';document.body.style.width=width+'px';renderer.setPixelRatio(1);renderer.setSize(width,1200);renderer.setScissorTest(true);}
 window.renderPreviewTriptych=()=>{
  panels(2700);for(const [i,name] of ['front','side','angled'].entries()){renderer.setViewport(i*900,0,900,1200);renderer.setScissor(i*900,0,900,1200);window.setPreviewView(name);label(name[0].toUpperCase()+name.slice(1),i*900,900);}
 };
 window.renderSocketDetails=()=>{
  panels(2400);
  for(let i=0;i<2;i++){
   for(const part of study.group.children)part.visible=i===0?part===study.torso:part===study.thighL||part===study.thighR;
   renderer.setViewport(i*1200,0,1200,1200);renderer.setScissor(i*1200,0,1200,1200);
   if(i===0){const box=new T.Box3().setFromObject(study.torso);target.set(0,box.min.y+.16,.025);frame(.68,1);camera.position.copy(target).add(new T.Vector3(.6,-3,2));}
   else {const box=new T.Box3().setFromObject(study.thighL);target.set(0,box.max.y-.08,.025);frame(.71,1);camera.position.copy(target).add(new T.Vector3(.4,3,2));}
   camera.lookAt(target);camera.updateMatrixWorld(true);renderer.render(scene,camera);label(i===0?'Torso sockets · underside':'Upper-leg sockets · from above',i*1200,1200);
  }
  for(const part of study.group.children)part.visible=true;
 };
 window.previewStudy=study;window.setPreviewView('front');window.previewReady=true;
}
open().catch(error=>{console.error(error);document.querySelector('header').textContent=error.message;});
