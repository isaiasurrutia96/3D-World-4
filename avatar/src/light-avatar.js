import release from '../official.json' with {type:'json'};
import light from '../assembled-joints/light.json' with {type:'json'};
import {bindJointAssembly} from './joint-assembly/bind.js';
import {loadBinaryStudyAsset} from '../../src/load-binary-study.js';

// A light copy of the approved avatar for movement and smoothness tests on
// slow devices (about 14 times fewer triangles). It is made from the approved
// source by scripts/build-light-avatar.mjs and never replaces the official
// avatar. Same parts, joints and skeleton, so every pose looks the same shape.
export const LIGHT_AVATAR=Object.freeze({source:release.version,asset:light.asset,bytes:light.bytes,triangles:light.triangles});
export function bindLightAvatar(study){
 if(light.sourceSHA256!==release.sha256)throw Error('Light avatar was not made from the approved release');
 const avatar=bindJointAssembly(study);
 avatar.root.name='light-avatar';avatar.version=release.version+'-light';
 avatar.capabilities=Object.freeze({bodyPose:true,softChest:true,fingerSkin:false,toeSkin:false});
 return avatar;
}
export async function loadLightAvatar({assetBaseURL=new URL('../avatar/assembled-joints/',document.baseURI)}={}){
 const workerURL=typeof __AVATAR_WORKER_URL__==='undefined'?undefined:new URL(__AVATAR_WORKER_URL__,assetBaseURL);
 const study=await loadBinaryStudyAsset(new URL(light.asset,assetBaseURL),{sha256:light.sha256,workerURL});
 try{return bindLightAvatar(study);}catch(error){
  for(const mesh of study.group.children){mesh.geometry?.dispose();mesh.material?.dispose();}
  throw error;
 }
}
