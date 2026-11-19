import * as T from 'three';
import {createFootShape} from './foot-shape.js';
import {createCalf} from './calf.js';
import {pressAnkleBallIntoFoot} from './ball-mold.js';
import {createAnkleBall} from './ankle-socket.js';

// Build one layer at a time. The calf stays raw and separate while the tiny
// foot socket is reviewed; the original two-shape baseline remains available.
export function createFootStudy({socket=true,ball=false}={}){
 if(ball&&!socket)throw Error('The ankle ball needs its molded socket');
 const foot=createFootShape(),calf=createCalf(foot,{socket:false}),group=new T.Group();
 if(socket)pressAnkleBallIntoFoot(foot);
 group.name='foot-and-calf-shapes';
 foot.position.x=-.22;
 calf.position.set(.22,-calf.geometry.boundingBox.min.y,.09);
 group.add(foot,calf);foot.updateMatrix();
 const ankleBall=ball?createAnkleBall(foot.material,new T.Vector3(...foot.userData.socketMold.center).applyMatrix4(foot.matrix)):null;
 if(ankleBall)group.add(ankleBall);
 group.updateMatrixWorld(true);
 return {group,foot,calf,...(ankleBall?{ankleBall}:{})};
}
