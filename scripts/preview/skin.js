import * as T from 'three';
import {loadSkinAvatar} from '../../avatar/src/skin/bind.js';
import {POSES} from '../../motion-core/skeleton/poses.js';
async function open(){
 const avatar=await loadSkinAvatar('./parts.json.gz'),scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(avatar.root);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1.5);renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);
 renderer.debug.onShaderError=(gl,program,vs,fs)=>{throw Error(gl.getShaderInfoLog(vs)+' '+gl.getShaderInfoLog(fs));};
 const box=avatar.skin.geometry.boundingBox,home=box.getCenter(new T.Vector3()),height=box.getSize(new T.Vector3()).y*1.12;
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,30),views={front:[0,0,4],side:[4,0,0],angled:[2,.3,4]};
 scene.add(new T.HemisphereLight(0xffffff,0x6e8291,1.5));
 for(const [intensity,position]of [[2.7,[-2,3,4]],[.8,[3,.5,1]],[1.3,[0,2,-3]]]){const light=new T.DirectionalLight(0xffffff,intensity);light.position.copy(home).add(new T.Vector3(...position));light.target.position.copy(home);scene.add(light,light.target);}
 function view(name='front',pose='rest'){
  avatar.apply(POSES[pose]??{});const aspect=innerWidth/innerHeight,h=height/2;camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;
  camera.position.copy(home).add(new T.Vector3(...views[name]));camera.lookAt(home);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.render(scene,camera);
  return {version:avatar.skin.geometry.userData.skin.version,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,error:renderer.getContext().getError()};
 }
 window.skinPreview={avatar,scene,camera,renderer,view};view();document.querySelector('header').remove();window.skinPreviewReady=true;
}
open().catch(error=>{window.skinPreviewError=error.message;console.error(error);});
