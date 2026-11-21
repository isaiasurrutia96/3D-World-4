// New avatar (version 2): head and neck options.
//
// The approved avatar had no visible neck: its round head (radius 22 cm) sat
// directly on the torso (a 5 mm gap). A neck ball, like every other joint,
// therefore lifts the head. These options show the range:
//  - ball: the neck ball's radius as a share of the torso's neck seat (the
//    round flat top where the neck sits); 0.92 matches the other joints'
//    rule ("slightly smaller than the part it joins");
//  - sink: 0 = the ball rests on the torso with a small gap; 0.5 = it sits
//    half inside the torso's top, as if in a shallow socket (a lower head);
//  - head: the head's radius (the approved head is 22 cm).
// The head is a Fibonacci sphere like the joint balls, with more triangles
// (800) because it is far bigger and the most looked-at part.
// Note for the joints discussion: the skeleton turns the head about its own
// centre; with a neck ball, the natural pivot would be the ball's centre (as
// for every other joint). That skeleton change is not made here.
import {buildBall,CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
import {makeTorsoOption,CHOSEN_TORSO} from './torso-variants.js';
import {BALL_GAP} from './limb-options.js';
import {SIDE,CENTRE} from '../motion-core/skeleton/bones.js';

export const HEAD_TRIANGLES=800;
export const APPROVED_HEAD_RADIUS=.22;
/** The skeleton's head centre (the approved head's centre). */
export const SKELETON_HEAD_CENTRE=CENTRE.find(b=>b.name==='head').head;

/** The neck seat of a torso shape: its top height and the radius of its top ring (thinnest direction). */
export function neckSeat(shape){const top=shape.rings.at(-1);return {y:shape.top.y,radius:Math.min(...top.r)};}

export const HEAD_OPTIONS=[
 {id:'neck-full',label:'1 · Full ball',note:'A neck ball by the usual rule (slightly smaller than the neck seat), resting on the torso. The tallest neck.',ball:.92,sink:0,head:APPROVED_HEAD_RADIUS},
 {id:'neck-full-sunk',label:'2 · Full ball, sunk',note:'The same ball sitting half inside the torso\'s top, like a shallow socket. A shorter neck.',ball:.92,sink:.5,head:APPROVED_HEAD_RADIUS},
 {id:'neck-small',label:'3 · Small ball',note:'A smaller neck ball resting on the torso.',ball:.65,sink:0,head:APPROVED_HEAD_RADIUS},
 {id:'neck-small-sunk',label:'4 · Small ball, sunk',note:'A smaller ball half inside the torso\'s top. The closest to the old look, with a ball.',ball:.65,sink:.5,head:APPROVED_HEAD_RADIUS},
 {id:'neck-full-sunk-head',label:'5 · Sunk ball, smaller head',note:'Option 2 with a slightly smaller head (19 cm), so the top of the head stays close to the old height.',ball:.92,sink:.5,head:.19},
];

/**
 * One option's parts above a torso shape: where the neck ball and head sit.
 * Returns {ball:{radius, y, ...surface}, head:{radius, y, ...surface},
 * headCentre, headTop, lift} (heights in metres, avatar space).
 */
export function buildHeadSet(option,torsoShape){
 if(!(option.ball>0&&option.ball<=1&&(option.sink===0||option.sink===.5)&&option.head>.05))throw Error('bad head option '+option.id);
 const seat=neckSeat(torsoShape),R=option.ball*seat.radius;
 const ballY=option.sink===0?seat.y+BALL_GAP+R:seat.y;// resting on top, or centred on the top (half inside)
 const headY=ballY+R+BALL_GAP+option.head;
 return {
  ball:{...buildBall({radius:R,triangles:CHOSEN_BALL_TRIANGLES}),radius:R,y:ballY},
  head:{...buildBall({radius:option.head,triangles:HEAD_TRIANGLES}),radius:option.head,y:headY},
  headCentre:headY,headTop:headY+option.head,
  // How much higher the top of the head is than on the approved avatar.
  lift:headY+option.head-(SKELETON_HEAD_CENTRE[1]+APPROVED_HEAD_RADIUS),
 };
}
