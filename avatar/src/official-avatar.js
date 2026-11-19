import release from '../official.json' with {type:'json'};
import manifest from '../assembled-joints/manifest.json' with {type:'json'};
import {bindJointAssembly} from './joint-assembly/bind.js';
import {loadStudyAsset} from '../../src/study-asset.js';

// The sole live-model entry point. Procedural factories are authoring tools;
// importing this module never constructs or molds any body part.
export const OFFICIAL_AVATAR=Object.freeze({...release,asset:manifest.asset,bytes:manifest.bytes});
export function bindOfficialAvatar(study){
 if(manifest.sha256!==release.sha256)throw Error('Avatar asset differs from the approved release');
 const avatar=bindJointAssembly(study);
 avatar.root.name='official-avatar';avatar.version=release.version;
 avatar.capabilities=Object.freeze({bodyPose:true,softChest:true,fingerSkin:false,toeSkin:false});
 return avatar;
}
/** Callers outside a one-level lab route must supply their own assetBaseURL. */
export async function loadOfficialAvatar({assetBaseURL=new URL('../avatar/assembled-joints/',document.baseURI)}={}){
 const study=await loadStudyAsset(new URL(manifest.asset,assetBaseURL));
 try{return bindOfficialAvatar(study);}catch(error){
  for(const mesh of study.group.children){mesh.geometry?.dispose();mesh.material?.dispose();}
  throw error;
 }
}
