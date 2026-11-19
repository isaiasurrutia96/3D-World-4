import * as T from 'three';
import {createFootShape} from './foot-shape.js';
import {createCalf} from './calf.js';
import {pressAnkleBallIntoFoot} from './ball-mold.js';
import {createAnkleBall} from './ankle-socket.js';
import {carveCalfSocket} from './calf-socket.js';

// Build one layer at a time. Socket carving and rigid assembly are separate
// opt-ins, so each approved shape remains available for inspection.
export function createFootStudy({socket=true,ball=false,calfSocket=false,seatCalf=false}={}){
 if(ball&&!socket)throw Error('The ankle ball needs its molded socket');
 if(seatCalf&&(!ball||!calfSocket))throw Error('Calf seating needs the ball and both sockets');
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
 if(seatCalf){
  calf.updateMatrix();
  const socketCenter=new T.Vector3(...calf.userData.socketMold.center).applyMatrix4(calf.matrix);
  calf.position.add(ankleBall.position).sub(socketCenter);
 }
 group.updateMatrixWorld(true);
 return {group,foot,calf,...(ankleBall?{ankleBall}:{})};
}
