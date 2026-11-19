import * as T from 'three';
import {createFootShape} from './foot-shape.js';
import {createCalf} from './calf.js';

// First layer: original shapes only. Socket construction and joint motion are
// deliberately absent from this study so each can be approved independently.
export function createFootStudy(){
 const foot=createFootShape(),calf=createCalf(foot,{socket:false}),group=new T.Group();
 group.name='foot-and-calf-shapes';
 foot.position.x=-.22;
 calf.position.set(.22,-calf.geometry.boundingBox.min.y,.09);
 group.add(foot,calf);group.updateMatrixWorld(true);
 return {group,foot,calf};
}
