import * as T from 'three';
import {loadJointAvatar} from '../../avatar/src/joint-assembly/bind.js';
async function open(){
 const rig=await loadJointAvatar('./parts.json.gz'),scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(rig.root);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(2);renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);
 const box=new T.Box3().setFromObject(rig.root),home=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),camera=new T.OrthographicCamera(-1,1,1,-1,.01,30),height=Math.max(size.y,size.x/.75)*1.14;
 scene.add(new T.HemisphereLight(0xffffff,0x6e8291,1.5));for(const [intensity,offset]of [[2.7,[-2,3,4]],[.8,[3,.5,1]],[1.3,[0,2,-3]]]){const light=new T.DirectionalLight(0xffffff,intensity);light.position.copy(home).add(new T.Vector3(...offset));light.target.position.copy(home);scene.add(light,light.target);}
 const dots=new T.Group();dots.visible=false;const positions=[];
 for(const part of rig.attached.filter(p=>p.ball)){const center=rig.solved.get(part.bone).head,dot=new T.Mesh(new T.SphereGeometry(.012,16,12),new T.MeshBasicMaterial({color:'#8df5ee',depthTest:false}));dot.renderOrder=100;dot.position.copy(center);dots.add(dot);const b=rig.skeleton.bones[rig.skeleton.index.get(part.bone)];if(!part.bone.startsWith('hand.')&&!part.bone.startsWith('foot.'))positions.push(...b.head,...b.tail);}
 const lines=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)),new T.LineBasicMaterial({color:'#8df5ee',depthTest:false,transparent:true,opacity:.65}));lines.renderOrder=99;dots.add(lines);scene.add(dots);
 const views={front:[0,0,4],side:[4,0,0],angled:[2,.35,4]};let current='front';
 const corners=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new T.Vector3(x,y,z));
 function frame(name,width=innerWidth,h=innerHeight){
  const aspect=width/h;camera.position.copy(home).add(new T.Vector3(...views[name]));camera.up.set(0,1,0);camera.lookAt(home);camera.updateMatrixWorld(true);
  const projected=corners.map(v=>v.clone().applyMatrix4(camera.matrixWorldInverse)),spanX=Math.max(...projected.map(v=>v.x))-Math.min(...projected.map(v=>v.x)),spanY=Math.max(...projected.map(v=>v.y))-Math.min(...projected.map(v=>v.y)),fittedHeight=Math.max(spanY,spanX/aspect)*1.14;
  camera.left=-fittedHeight*aspect/2;camera.right=fittedHeight*aspect/2;camera.top=fittedHeight/2;camera.bottom=-fittedHeight/2;camera.updateProjectionMatrix();renderer.render(scene,camera);
 }
 window.framingBounds=()=>corners.map(v=>v.clone().project(camera).toArray());

 window.setPreviewView=name=>{current=name;frame(name);document.querySelector('header').textContent=name[0].toUpperCase()+name.slice(1)+' · assembled avatar';};
 window.showJointDots=show=>{dots.visible=show;window.setPreviewView(current);};
 window.renderTriptych=()=>{document.querySelectorAll('.panel-label').forEach(p=>p.remove());document.querySelector('header').style.display='none';document.body.style.width='2700px';renderer.setPixelRatio(1);renderer.setSize(2700,1200);renderer.setScissorTest(true);for(const [i,name]of ['front','side','angled'].entries()){renderer.setViewport(i*900,0,900,1200);renderer.setScissor(i*900,0,900,1200);frame(name,900,1200);const label=document.createElement('header');label.className='panel-label';label.style.left=i*900+'px';label.style.right='auto';label.style.width='900px';label.textContent=name[0].toUpperCase()+name.slice(1)+(dots.visible?' · joint centers':'');document.body.append(label);}};
 window.resetPortrait=()=>{document.querySelectorAll('.panel-label').forEach(p=>p.remove());document.querySelector('header').style.display='block';document.body.style.width='100%';renderer.setScissorTest(false);renderer.setPixelRatio(2);renderer.setSize(innerWidth,innerHeight);renderer.setViewport(0,0,innerWidth,innerHeight);window.setPreviewView(current);};
 window.previewRig=rig;window.setPreviewView('front');window.previewReady=true;
}
open().catch(error=>{console.error(error);document.querySelector('header').textContent=error.message;});
