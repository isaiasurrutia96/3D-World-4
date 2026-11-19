import * as T from 'three';
import {createFootShape} from './foot-shape.js';
import {createCalf} from './calf.js';
import {pressAnkleBallIntoFoot} from './ball-mold.js';

// Build one layer at a time. The calf stays raw and separate while the tiny
// foot socket is reviewed; the original two-shape baseline remains available.
export function createFootStudy({socket=true}={}){
 const foot=createFootShape(),calf=createCalf(foot,{socket:false}),group=new T.Group();
 if(socket)pressAnkleBallIntoFoot(foot);
 group.name='foot-and-calf-shapes';
 foot.position.x=-.22;
 calf.position.set(.22,-calf.geometry.boundingBox.min.y,.09);
 group.add(foot,calf);group.updateMatrixWorld(true);
 return {group,foot,calf};
}
