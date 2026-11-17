import * as T from 'three';
import {MatchedMotion} from '../avatar-walk/matched.js';
const walk=new MatchedMotion(),scene=new T.Scene();scene.background=new T.Color('#f1f0eb');scene.add(walk.root);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(720,900);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.querySelector("#avatar").append(renderer.domElement);
scene.add(new T.HemisphereLight(0xffffff,0x69727a,2.1));
const key=new T.DirectionalLight(0xffffff,3);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:15});key.shadow.bias=-.0002;key.shadow.normalBias=.01;scene.add(key);
const fill=new T.DirectionalLight(0xffffff,.55);fill.position.set(3,2,-4);scene.add(fill);
const bounds=new T.Box3();for(let f=0;f<77;f++){walk.setFrame(f);bounds.union(new T.Box3().setFromObject(walk.root));}
const center=bounds.getCenter(new T.Vector3()),height=bounds.getSize(new T.Vector3()).y*1.35;
const camera=new T.OrthographicCamera(-height*.8/2,height*.8/2,height/2,-height/2,.1,100);camera.position.set(-7,center.y,center.z);camera.lookAt(0,center.y,center.z);
const mario=document.querySelector('#mario');
async function frame(f){walk.setFrame(f);await new Promise((resolve,reject)=>{mario.onload=resolve;mario.onerror=reject;mario.src='/mario/'+String(f).padStart(3,'0')+'.png';});document.querySelector('#frame').textContent='Same source frame '+(f+1)+' / 77';renderer.render(scene,camera);}
window.reference={frame,walk,scene,camera};await frame(0);window.referenceReady=true;
