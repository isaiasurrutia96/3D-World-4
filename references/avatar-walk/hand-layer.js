import {createHandRig,REST_POSE} from '../../hand-lab/src/hand-rig.js';

export const RUN_HAND_POSE=Object.freeze({...REST_POSE,index:.50,middle:.52,ring:.54,little:.56,thumb:.40,opposition:.08,together:.40});

export function createRunningHandLayer(avatar){
 const [left,right]=avatar.handParts;
 // Independent geometry lets a future held-object grip override either hand.
 // Keep immutable bind arrays shared, with independent metadata owners.
 if(left.geometry===right.geometry){
  left.geometry=right.geometry.clone();left.geometry.userData={...right.geometry.userData};
 }
 const hands=avatar.handParts.map((hand,i)=>({side:i===0?-1:1,hand,rig:createHandRig(hand)}));
 function setPose(side,pose){const hand=hands.find(h=>h.side===side);if(!hand)throw Error('Unknown hand side');hand.rig.setPose({...RUN_HAND_POSE,...pose});}
 function reset(side){setPose(side,RUN_HAND_POSE);}
 hands.forEach(h=>reset(h.side));
 // Walking/running poses move arm joints only and never overwrite this layer.
 return {hands,setPose,reset};
}
