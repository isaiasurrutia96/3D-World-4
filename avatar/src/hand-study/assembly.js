import * as T from 'three';
import {createEmojiHand} from './hand.js';
import {fitSocket} from './fit-socket.js';

// The accepted forearm, shallow socket, and latest hand, in one reusable pair.
// Its origin is the forearm centre; no display-specific centring is applied.
export function createForearmHandAssembly(material){
 const forearm=new T.Mesh(new T.BufferGeometry(),material);
 forearm.name='isolated-forearm';
 const bowl=[[0,-.135],[.030,-.137],[.055,-.146],[.073,-.155],[.084,-.153],[.094,-.139],[.103,-.103],[.104,-.075],[.102,-.02],[.099,.035],[.096,.085]];
 for(let i=1;i<=12;i++){const a=Math.PI*.5*i/12;bowl.push([Math.cos(a)*.096,.085+Math.sin(a)*.096]);}
 const curve=new T.CatmullRomCurve3(bowl.map(([r,y])=>new T.Vector3(r,y,0)),false,'centripetal');
 forearm.geometry=new T.LatheGeometry(curve.getPoints(240).map(p=>new T.Vector2(Math.max(0,p.x),p.y)),96);
 forearm.geometry.computeBoundingBox();
 const unscaledTop=forearm.geometry.boundingBox.max.y;
 const size=forearm.geometry.boundingBox.getSize(new T.Vector3()),target=new T.Vector3(.2016150951,.329,.2068);
 forearm.geometry.scale(target.x/size.x,target.y/size.y,target.z/size.z);
 forearm.geometry.computeBoundingBox();
 forearm.geometry.translate(0,-forearm.geometry.boundingBox.getCenter(new T.Vector3()).y,0);
 forearm.geometry.computeBoundingBox();
 const hand=createEmojiHand(material.clone(),-1);
 hand.name='isolated-emoji-hand';
 const handSize=hand.geometry.boundingBox.getSize(new T.Vector3());
 hand.userData.enlargementFactor=1.113; // Another 5% over the accepted hand size.
 hand.scale.setScalar(hand.userData.enlargementFactor*.94*Math.max(target.x,target.y,target.z)/(hand.geometry.userData.preSweepMaxDimension??Math.max(handSize.x,handSize.y,handSize.z)));
 hand.rotation.z=T.MathUtils.degToRad(8);
 fitSocket(forearm,hand);
 const assembly=new T.Group();
 assembly.name='forearm-hand-assembly';
 assembly.add(forearm,hand);
 const socket=forearm.geometry.userData;
 const rotatedBase=new T.Vector3(...socket.palmSeatCenter).applyEuler(hand.rotation);
 hand.position.fromArray(socket.socketSeatCenter).sub(rotatedBase);
 // Palm inward, thumb forward for the right-side pair.
 assembly.rotation.y=-Math.PI/2;
 assembly.userData.unscaledForearmTop=unscaledTop;
 return {assembly,forearm,hand};
}
