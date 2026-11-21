// New avatar (version 2): the left arm's numbers (his right is the mirror).
//
// Joint centres come straight from the skeleton (motion-core/skeleton/bones.js),
// so the new parts turn exactly where the movement code turns them.
//
// Look: a ragdoll / wooden-mannequin arm. The limbs stay a little slimmer than
// the joint balls, so they never bulge out past them (the old limbs did, which
// made the "puffy tyre man" look). Each socket is deep where its joint does
// not bend and cut away where it does.
import {SIDE} from '../motion-core/skeleton/bones.js';

const bone=name=>SIDE.find(b=>b.name===name);
export const SHOULDER=bone('upperArm').head,ELBOW=bone('lowerArm').head,WRIST=bone('hand').head;
export const ELBOW_LIMITS=bone('lowerArm').limits;// x: bend [-150, 0], y: twist [-80, 80]
export const ELBOW_REST=bone('lowerArm').rest;
// How far these solid limbs can bend before the forearm touches the upper arm,
// at every twist (measured by check-elbow.mjs). The skeleton allows 150°, which
// soft arms reach by squashing; rigid ones cannot. Whether to lower the
// skeleton's limit to this is the owner's decision, so it is unchanged.
export const ELBOW_CLEAN_BEND=-125;

/** Elbow ball: same size as the approved avatar's (radius 90.7 mm). */
export const ELBOW_BALL={centre:ELBOW,radius:.0907};

const FRONT=[0,0,1];// the elbow bends the forearm toward the front (+z)

// Socket settings shared by both cups at the elbow (metres).
const CUP={ball:ELBOW_BALL.radius,clearance:.0015,wall:.005,blend:.012};

export const UPPER_ARM={
 name:'upper-arm',start:SHOULDER,end:ELBOW,front:FRONT,
 // Thickness along the arm (share of length, radius in metres): a little
 // under the ball's 90.7 mm, easing in toward the elbow.
 profile:[[0,.084],[.45,.083],[1,.077]],
 // Shoulder end: a plain rounded cap for now (the shoulder joint comes next).
 startEnd:{type:'cap',length:.06},
 // Elbow socket: deep at the back (covers the ball well past its middle),
 // cut far back at the front, where the forearm folds up.
 endEnd:{type:'socket',...CUP,rim:{back:62,side:108,front:160}},
 // Inner-elbow crease: narrower in front near the elbow, so the forearm can
 // fold up against it.
 crease:{at:'end',depth:.5,from:.09,to:.21,width:90},
};

export const FOREARM={
 name:'forearm',start:ELBOW,end:WRIST,front:FRONT,
 profile:[[0,.077],[.5,.073],[1,.066]],
 // Elbow socket: a shallow, even cup. The forearm also twists (up to 80°
 // each way), so its rim is the same all round.
 startEnd:{type:'socket',...CUP,rim:{back:130,side:158,front:165}},
 // Wrist end: a plain rounded cap for now (the wrist joint comes later).
 endEnd:{type:'cap',length:.05},
 // Its side of the crease. Wider, because the forearm twists.
 crease:{at:'start',depth:.45,from:.09,to:.2,width:160},
};
