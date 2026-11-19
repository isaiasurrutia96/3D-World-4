import * as T from 'three';
import {createFootShape} from './foot-shape.js';
import {createCalf} from './calf.js';
import {pressAnkleBallIntoFoot} from './ball-mold.js';
import {createAnkleBall} from './ankle-socket.js';
import {carveCalfSocket} from './calf-socket.js';

// Build one layer at a time. The calf stays separate for socket review;
// each socket and the seated ball are explicit opt-ins over the baseline.
export function createFootStudy({socket=true,ball=false,calfSocket=false}={}){
 if(ball&&!socket)throw Error('The ankle ball needs its molded socket');
 const foot=createFootShape(),calf=createCalf(foot,{socket:false}),group=new T.Group();
 const calfBase=-calf.geometry.boundingBox.min.y;
 if(socket)pressAnkleBallIntoFoot(foot);
 if(calfSocket){if(!socket)throw Error('The calf socket needs the foot depth reference');carveCalfSocket(calf,foot.userData.socketMold);}
 group.name='foot-and-calf-shapes';
 foot.position.x=-.22;
 calf.position.set(.22,calfBase,.09);
 group.add(foot,calf);foot.updateMatrix();
 const ankleBall=ball?createAnkleBall(foot.material,new T.Vector3(...foot.userData.socketMold.center).applyMatrix4(foot.matrix)):null;
 if(ankleBall)group.add(ankleBall);
 group.updateMatrixWorld(true);
 return {group,foot,calf,...(ankleBall?{ankleBall}:{})};
}
