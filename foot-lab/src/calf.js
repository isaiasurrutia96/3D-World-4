import * as T from 'three';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';

export const CALF_GAP=.055;

export function createCalf(foot){
 const reference=createCharacterRig({plain:true}),original=reference.kneeRight.children[0];
 const calf=new T.Mesh(original.geometry.clone(),original.material.clone());
 calf.name='original-avatar-calf';calf.castShadow=true;calf.geometry.computeBoundingBox();
 // The calf is deliberately suspended, with its original closed rounded
 // end intact. No socket, ball, connector or foot attachment is created.
 calf.position.set(0,foot.geometry.boundingBox.max.y+CALF_GAP-calf.geometry.boundingBox.min.y,foot.userData.suggestedAnklePivot[2]);
 calf.userData={gapAboveFoot:CALF_GAP,socket:false};
 const materials=new Set();reference.root.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});for(const material of materials)material.dispose();
 return calf;
}
