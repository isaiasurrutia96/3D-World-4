import * as T from 'three';
import {AvatarWalkPreview,CYCLE} from './retarget.js';
const walk=new AvatarWalkPreview(),scene=new T.Scene();scene.background=new T.Color('#e8e9e6');scene.add(walk.root);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(720,900);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.prepend(renderer.domElement);
scene.add(new T.HemisphereLight(0xffffff,0x69727a,2.1));
const key=new T.DirectionalLight(0xffffff,3);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:15});key.shadow.bias=-.0002;key.shadow.normalBias=.01;scene.add(key);
const fill=new T.DirectionalLight(0xffffff,.55);fill.position.set(3,2,-4);scene.add(fill);
const tile=document.createElement('canvas');tile.width=tile.height=128;const ctx=tile.getContext('2d');ctx.fillStyle='#737b7c';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#858d8e';ctx.lineWidth=1;ctx.strokeRect(.5,.5,127,127);
const texture=new T.CanvasTexture(tile);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(40,40);texture.anisotropy=4;
const floor=new T.Mesh(new T.PlaneGeometry(walk.stride*40,walk.stride*40),new T.MeshStandardMaterial({map:texture,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.001;floor.receiveShadow=true;scene.add(floor);
const height=2.65,camera=new T.OrthographicCamera(-height*.8/2,height*.8/2,height/2,-height/2,.1,100);camera.position.set(-7,1.27,0);camera.lookAt(0,.96,0);
function frame(f){walk.setTime(f/77*CYCLE);camera.position.z=walk.travel;camera.lookAt(0,.96,walk.travel);key.position.z=walk.travel+4;key.target.position.z=walk.travel;scene.add(key.target);floor.position.z=Math.floor(walk.travel/walk.stride)*walk.stride;renderer.render(scene,camera);}
window.reference={frame,walk,scene,camera};frame(0);window.referenceReady=true;
