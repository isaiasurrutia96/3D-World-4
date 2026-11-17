import * as T from 'three';
import {MatchedMotion} from '../avatar-walk/matched.js';
import {createMario} from './mario.js';
const walk=new MatchedMotion(),mario=await createMario();
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,900);renderer.setPixelRatio(1);document.body.prepend(renderer.domElement);
function sceneFor(model,avatar){const scene=new T.Scene();scene.background=new T.Color('#f1f0eb');scene.add(model,new T.HemisphereLight(0xffffff,avatar?0x69727a:0xb0b9c5,avatar?2.1:1.45));const key=new T.DirectionalLight(0xffffff,avatar?3:1.3);key.position.set(-3,5,4);scene.add(key);const fill=new T.DirectionalLight(0xffffff,.55);fill.position.set(3,2,-4);scene.add(fill);return scene;}
const scenes=[sceneFor(mario.model,false),sceneFor(walk.root,true)],bounds=[new T.Box3(),new T.Box3()];
for(let f=0;f<77;f++){mario.setFrame(f);walk.setFrame(f);bounds[0].union(new T.Box3().setFromObject(mario.model));bounds[1].union(new T.Box3().setFromObject(walk.root));}
const cameras=bounds.map(()=>new T.OrthographicCamera(-1,1,1,-1,.01,3000));
let view='side';
function setView(next){view=next;walk.rig.body.visible=view!=='feet';walk.legs.forEach(l=>{l.foot.visible=l.calf.visible=view!=='feet'||l.side===1;});mario.joints.forEach((j,i)=>j.visible=view!=='feet'||i===14||i===15);bounds.forEach((b,i)=>{const center=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3()),height=size.y*1.35;const camera=cameras[i];Object.assign(camera,{left:-height*.8/2,right:height*.8/2,top:height/2,bottom:-height/2});camera.position.set(view==='front'?center.x:-700,center.y,view==='front'?center.z+700:center.z);camera.lookAt(center);camera.updateProjectionMatrix();});}
function frame(f){mario.setFrame(f);walk.setFrame(f);
 if(view==='feet')for(let i=0;i<2;i++){const leg=walk.legs.find(l=>l.side===1),parts=i===0?[mario.joints[14],mario.joints[15]]:[leg.calf,leg.foot],box=new T.Box3();parts.forEach(part=>box.union(new T.Box3().setFromObject(part)));const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),height=Math.max(bounds[i].getSize(new T.Vector3()).y*.64,size.y*1.25,size.z/.8*1.25),camera=cameras[i];Object.assign(camera,{left:-height*.8/2,right:height*.8/2,top:height/2,bottom:-height/2});camera.position.set(-700,center.y,center.z);camera.lookAt(center);camera.updateProjectionMatrix();}
 document.querySelector('#frame').textContent=(view==='front'?'Front view':view==='feet'?'Right foot close-up':'Side view')+' · Source frame '+(f+1)+' / 77';renderer.setScissorTest(true);for(let i=0;i<2;i++){renderer.setViewport(i*720,0,720,900);renderer.setScissor(i*720,0,720,900);renderer.render(scenes[i],cameras[i]);}renderer.setScissorTest(false);}
window.reference={frame,setView,walk,mario,scenes,cameras};setView('side');frame(0);window.referenceReady=true;
