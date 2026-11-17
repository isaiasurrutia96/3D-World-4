import * as T from 'three';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';
import {fitAnkleSocket} from './ankle-socket.js';

export function createCalf(foot){
 const reference=createCharacterRig({plain:true}),original=reference.kneeRight.children[0];
 const calf=new T.Mesh(original.geometry.clone(),original.material.clone());
 calf.name='original-avatar-calf';calf.castShadow=true;calf.geometry.computeBoundingBox();
 fitAnkleSocket(calf,foot);
 const materials=new Set();reference.root.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});for(const material of materials)material.dispose();
 return calf;
}
