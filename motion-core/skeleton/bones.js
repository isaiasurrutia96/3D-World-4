// Skeleton · layer 1: the bones.
//
// One clean skeleton for the whole avatar: invisible bones joined at pivot
// points. Later layers hang the clay body parts on these bones, pose them,
// and solve reaching (put a foot here, a hand there).
//
// Units: metres. Avatar space: standing at rest, soles on y = 0, facing +Z.
// He faces +Z, so +X is HIS LEFT. (The approved model's code calls the +X
// parts "right", meaning screen-right when you face him; bone names here
// use his own left and right: .L and .R.) Every position below was measured from the
// approved Checkpoint 2 avatar (avatar-lab/src/avatar.js); the checks in
// motion-core/tests/skeleton.mjs re-measure the live model to prove it.
//
// Each joint turns about its own three axes, in degrees:
//   x = bend (flex), y = twist, z = side (out/in).
// For body joints the axes are the avatar's own (frame "body"). Fingers use
// a frame built from their bend axis and the finger's direction.
// Rotation order is x, then y, then z (three.js 'XYZ'), except where a bone
// names its own `order` (the upper chest bends forward, then twists: 'YXZ').
//
// Pivots are the centres of each joint's rounded ball (the end of the child
// part that sits in its socket), so turning a joint keeps the ball in place
// and the socket stays seated. They were found by fitting a sphere to each
// ball's surface on the approved model.
//
// Angles are absolute: 0 means the limb hanging straight (or a straight
// finger). `rest` is the angle the approved model is built at, so the rest
// pose reproduces Checkpoint 2 exactly. `limits` are [min, max] per axis.
//
// Only the centre line and HIS LEFT side (+X) are written here; his right
// side is the exact mirror (see skeleton.js), so the two sides can never
// drift apart.

const deg = v => v * 180 / Math.PI;

/**
 * The live avatar's hands rest turned 8° at the wrist, fingertips slightly
 * forward (avatar-lab/src/avatar.js HAND_TILT_DEGREES). The finger and hand
 * points below were measured straight; they are turned by this tilt about
 * the wrist ball, so the skeleton matches the live avatar.
 */
export const HAND_TILT = -8; // degrees about the avatar's sideways (x) axis
const WRIST = [0.4088,0.6778,0.1284];

/** Centre-line bones. */
export const CENTRE = [
 {name:'pelvis', parent:null, head:[0,0.8395,0.025], tail:[0,1.0572,0], frame:'body',
  note:'Root, the body\'s main control: it sits low, exactly between the two hip balls, and '
   +'reaches up to the waist. Moving or turning it carries the whole body; it has no limits.',
  rest:{x:0,y:0,z:0}, limits:null},
 {name:'spine', parent:'pelvis', head:[0,1.0572,0], tail:[0,1.2464,0], frame:'body',
  note:'Waist: the centre of the chest\'s ball in the pelvis socket (avatar-lab/src/torso-split.js). '
   +'y turns the chest on the hips (throwing, swinging). Leaning (x, z) is kept at 0 for now: the '
   +'chest rim meets the pelvis rim when it tilts.',
  rest:{x:0,y:0,z:0}, limits:{x:[0,0], y:[-35,35], z:[0,0]}},
 {name:'chest', parent:'spine', head:[0,1.2464,0], tail:[0,1.2965,0.004], frame:'body',
  note:'Upper chest. Pivots on the chest\'s centre line, level with both shoulder balls, so a '
   +'forward bend turns each ball in place and a twist turns around the waist\'s own axis. The chest surface bends softly between the waist and the shoulders '
   +'(avatar-lab/src/chest-bend.js), so it stays one smooth piece. Small on purpose: '
   +'+x bends forward up to 15°, y twists ±15°. No side bend (not asked for). Order YXZ: the '
   +'bend happens first, then the twist, so the shoulder balls stay snug in the chest.',
  order:'YXZ', rest:{x:0,y:0,z:0}, limits:{x:[0,15], y:[-15,15], z:[0,0]}},
 {name:'neck', parent:'chest', head:[0,1.2965,0.004], tail:[0,1.6745,0], frame:'body',
  rest:{x:0,y:0,z:0}, limits:{x:[-20,25], y:[-40,40], z:[-20,20]}},
 {name:'head', parent:'neck', head:[0,1.6745,0], tail:[0,1.8945,0], frame:'body',
  note:'Pivots at the centre of the round head, so it turns in place over the neck.',
  rest:{x:0,y:0,z:0}, limits:{x:[-25,30], y:[-40,40], z:[-20,20]}},
];

/** His left side's bones (+X), mirrored to make his right. */
export const SIDE = [
 // Collarbone: from the base of the neck out to the shoulder ball, so the
 // arm hangs from it like a real skeleton. It moves a little: a shrug
 // (+z raises the shoulder) and forward/back (-y brings the shoulder
 // forward). The chest around the shoulder socket follows it softly
 // (avatar-lab/src/chest-bend.js), so the ball stays snug.
 {name:'clavicle', parent:'chest', head:[0,1.2965,0.004], tail:[0.2979,1.2464,0.0035], frame:'body',
  note:'Collarbone. Shrug up to 4° (about 2 cm), down 1°; forward 4°, back 4°. No roll. '
   +'Kept small: the chest skin under each shoulder socket has only about 4 cm to stretch over.',
  rest:{x:0,y:0,z:0}, limits:{x:[0,0], y:[-4,4], z:[-1,4]}},
 // Arm. The approved model holds the arms a little out (z) and forward (x).
 {name:'upperArm', parent:'clavicle', head:[0.2979,1.2464,0.0035], tail:[0.3596,0.9441,0.0331], frame:'body',
  note:'Shoulder. -x swings forward/up, +z raises out to the side.',
  rest:{x:deg(-0.04),y:0,z:deg(0.20)}, limits:{x:[-170,50], y:[-90,90], z:[-10,170]}},
 {name:'lowerArm', parent:'upperArm', head:[0.3596,0.9441,0.0331], tail:[0.4088,0.6778,0.1284], frame:'body',
  note:'Elbow. Bends only forward (-x), never backwards. y turns the forearm.',
  rest:{x:deg(-0.22),y:0,z:0}, limits:{x:[-150,0], y:[-80,80], z:[0,0]}},
 {name:'hand', parent:'lowerArm', head:WRIST, tail:null, frame:'body',
  note:'Wrist. Rests turned 8° (fingertips slightly forward); 0 is the hand hanging straight.',
  rest:{x:HAND_TILT,y:0,z:0}, limits:{x:[-70,70], y:[0,0], z:[-20,30]}},

 // Hip bone: from the pelvis control (between the hips) out to the hip ball, so the leg
 // hangs from the pelvis. Fixed: the pelvis is one solid piece (as in a
 // real body, where the two hip bones are part of the pelvis).
 {name:'hip', parent:'pelvis', head:[0,0.8395,0.025], tail:[0.15,0.8395,0.025], frame:'body',
  note:'Hip bone (part of the pelvis). Fixed.',
  rest:{x:0,y:0,z:0}, limits:{x:[0,0], y:[0,0], z:[0,0]}},
 // Leg.
 {name:'thigh', parent:'hip', head:[0.15,0.8395,0.025], tail:[0.15,0.4724,0.025], frame:'body',
  note:'Hip. -x swings the leg forward, +z out to the side.',
  rest:{x:0,y:0,z:0}, limits:{x:[-120,30], y:[-40,40], z:[-20,45]}},
 {name:'shin', parent:'thigh', head:[0.15,0.4724,0.025], tail:[0.15,0.1635,0.025], frame:'body',
  note:'Knee. Bends only backwards (+x), never the wrong way.',
  rest:{x:0,y:0,z:0}, limits:{x:[0,150], y:[0,0], z:[0,0]}},
 {name:'foot', parent:'shin', head:[0.15,0.1635,0.025], tail:[0.1494,0.065,0.2153], frame:'body',
  note:'Ankle (the approved foot pivot). +x points the toes down; z tilts the foot. '
   +'Range matches the approved foot (toes up 18°, toes down 24°, plus up to 30° of heel raise = 54°; tilt ±10°).',
  rest:{x:0,y:0,z:0}, limits:{x:[-18,54], y:[0,0], z:[-10,10]}},
 {name:'toes', parent:'foot', head:[0.1494,0.065,0.2153], tail:[0.1494,0.03,0.355], frame:'body',
  note:'Ball of the foot. -x lifts the toes (or, with the toes planted, raises the heel). '
   +'Range matches the approved foot: toe bend 25° + heel raise 30° = 55°.',
  rest:{x:0,y:0,z:0}, limits:{x:[-55,0], y:[0,0], z:[0,0]}},
];

/**
 * Finger data, his left hand (+X), measured from the approved hand (hand-lab).
 * straight: the three joint pivots and the fingertip with the finger
 *   straight (all angles 0), on the approved hand's own finger centre line.
 * axes: the axis each joint curls about (positive = toward the palm).
 * rest / closed: the approved rest curl and fully curled angle of each joint,
 *   in degrees. spread: how far the finger turns toward the middle finger
 *   when the fingers close together.
 * Pivots sit at the middle of each of the approved hand's three bending
 * zones, and the tip length was fitted so that curling these bones lands
 * the fingertip where the approved hand puts it (checked in the tests).
 */
export const FINGERS = {
 thumb:{straight:[[0.415,0.6765,0.2097],[0.4192,0.6566,0.2298],[0.4237,0.6349,0.2519],[0.4276,0.6168,0.2702]],axes:[[0.1343,-0.6915,-0.7098],[0.1343,-0.6915,-0.7098],[0.1343,-0.6915,-0.7098]],rest:[8,10,0],closed:[20,18,0],spread:0},
 index:{straight:[[0.4309,0.5966,0.1814],[0.4386,0.559,0.1921],[0.447,0.5184,0.2041],[0.4539,0.4847,0.2141]],axes:[[0.0446,-0.2588,-0.9649],[0.047,-0.2706,-0.9615],[0.0479,-0.2748,-0.9603]],rest:[10,18,7],closed:[32,45,15],spread:4},
 middle:{straight:[[0.4334,0.5817,0.1137],[0.4417,0.5411,0.1192],[0.4506,0.4974,0.1255],[0.458,0.4612,0.131]],axes:[[0.016,-0.1188,-0.9928],[0.0197,-0.1369,-0.9904],[0.0208,-0.1424,-0.9896]],rest:[13,23,8],closed:[35,50,18],spread:0},
 ring:{straight:[[0.4313,0.59,0.0593],[0.4378,0.5577,0.0555],[0.4448,0.5232,0.0526],[0.451,0.4924,0.0502]],axes:[[-0.0375,0.1455,-0.9887],[-0.0259,0.0881,-0.9958],[-0.0232,0.0745,-0.997]],rest:[16,28,10],closed:[38,55,20],spread:-4},
 little:{straight:[[0.4241,0.624,0.024],[0.4279,0.6046,0.0088],[0.4321,0.5834,-0.0079],[0.4363,0.5618,-0.0248]],axes:[[-0.1273,0.5966,-0.7924],[-0.1273,0.5966,-0.7924],[-0.1273,0.5966,-0.7924]],rest:[20,30,12],closed:[40,55,22],spread:-6},
};

/** The thumb's base also swings across the palm (approved: up to 30° and 42°). */
export const THUMB_OPPOSITION = {y:[0,30], z:[0,42]};

/**
 * The bones inside the palm (one per finger, like a real hand's long palm
 * bones), his left hand at rest. Each runs from its finger's root (where the
 * approved hand's finger begins) to the first knuckle, and turns in the
 * approved hand's own frame (HAND_FRAME, the hand model's turn at rest):
 *   the thumb's swings across the palm (opposition): z by up to −42°, then y
 *   by up to −30° (order ZYX);
 *   the other fingers close toward the middle one (together): z by −4°
 *   (index), 0 (middle), +4° (ring), +6° (little).
 * Measured on the approved hand (hand-lab/src/hand-rig.js binding); the checks
 * re-measure it.
 */
/**
 * How thick each finger segment is: the distance from its bone line to the
 * finger's surface (the middle value over the segment's points), his left
 * hand, measured on the approved hand. Fingers stop when this surface touches
 * what they grip. Re-measured by tests/avatar/hand-skin.mjs.
 */
export const FINGER_RADII = {thumb:[0.0393,0.0364,0.0331], index:[0.0353,0.0319,0.0297], middle:[0.0284,0.0291,0.0298], ring:[0.0279,0.0293,0.0285], little:[0.0304,0.0275,0.0255]};

export const HAND_FRAME = [-0.117105, -0.684499, 0.257719, 0.67181];
export const PALM_BONES = {
 thumb:{root:[0.41314,0.69524,0.19911], limits:{x:[0,0], y:[-30,0], z:[-42,0]}, order:'ZYX'},
 index:{root:[0.42739,0.62124,0.18514], limits:{x:[0,0], y:[0,0], z:[-4,0]}},
 middle:{root:[0.42959,0.59887,0.12258], limits:{x:[0,0], y:[0,0], z:[0,0]}},
 ring:{root:[0.42823,0.59667,0.07292], limits:{x:[0,0], y:[0,0], z:[0,4]}},
 little:{root:[0.42238,0.6197,0.03815], limits:{x:[0,0], y:[0,0], z:[0,6]}},
};

/** Turn point p about a line (through c, direction axis) by deg degrees. */
function turn(p,c,axis,deg){
 const a=deg*Math.PI/180,k=axis,v=[p[0]-c[0],p[1]-c[1],p[2]-c[2]],cs=Math.cos(a),sn=Math.sin(a),dot=k[0]*v[0]+k[1]*v[1]+k[2]*v[2];
 const cr=[k[1]*v[2]-k[2]*v[1],k[2]*v[0]-k[0]*v[2],k[0]*v[1]-k[1]*v[0]];
 return [0,1,2].map(i=>c[i]+v[i]*cs+cr[i]*sn+k[i]*dot*(1-cs));
}

/**
 * Finger bones: three per finger, e.g. index1 (knuckle), index2, index3.
 * Their rest positions are the straight finger curled by the rest angles,
 * so the rest pose matches the approved, gently curled hand.
 */
export function fingerBones(){
 const bones=[],X=[1,0,0],O=[0,0,0];
 for(const [id,f] of Object.entries(FINGERS)){
  // The hand's rest tilt first, then each joint's rest curl.
  const pts=f.straight.map(p=>turn(p,WRIST,X,HAND_TILT)),axes=f.axes.map(a=>turn(a,O,X,HAND_TILT));
  for(let j=0;j<3;j++){
   const origin=[0,0,0];
   for(let k=j+1;k<4;k++)pts[k]=turn(pts[k],pts[j],axes[j],f.rest[j]);
   for(let k=j+1;k<3;k++)axes[k]=turn(axes[k],origin,axes[j],f.rest[j]);
  }
  // The palm bone first (finger root → first knuckle); the finger hangs from it.
  const pb=PALM_BONES[id];
  bones.push({name:`${id}0`, parent:'hand', head:pb.root, tail:pts[0].map(v=>+v.toFixed(6)), frame:{basis:HAND_FRAME},
   order:pb.order??'XYZ', rest:{x:0,y:0,z:0}, limits:pb.limits});
  for(let j=0;j<3;j++){
   // Each finger joint bends (x); sideways turns happen in the palm bone.
   const limits={x:[0,f.closed[j]], y:[0,0], z:[0,0]};
   bones.push({name:`${id}${j+1}`, parent:j===0?`${id}0`:`${id}${j}`,
    head:pts[j].map(v=>+v.toFixed(6)), tail:pts[j+1].map(v=>+v.toFixed(6)),
    frame:{bendAxis:axes[j]}, rest:{x:f.rest[j],y:0,z:0}, limits});
  }
 }
 return bones;
}

// The hand bone points from the wrist to the middle knuckle (tilted).
SIDE.find(b=>b.name==='hand').tail=turn([0.4296,0.6005,0.1116],WRIST,[1,0,0],HAND_TILT).map(v=>+v.toFixed(6));

/**
 * The centre of the palm, his left hand at rest (avatar space), and the way
 * the palm faces there. Measured on the approved hand by
 * avatar-lab/src/palm.js (halfway from the wrist to the knuckles, halfway
 * across between the index and little knuckles, on the palm's surface); the
 * checks re-measure the live model. Hands reach with this point.
 */
export const PALM = {point:[0.35087,0.63836,0.12305], normal:[-0.89553,-0.44485,-0.01159]};

/** Points on each foot that can touch the ground (his left foot, +X, avatar space). */
export const FOOT_CONTACTS = {
 heel:[0.15,0,-0.12], heelInner:[0.06,0,-0.08], heelOuter:[0.24,0,-0.08],
 ballInner:[0.035,0,0.2153], ballOuter:[0.265,0,0.2153], toe:[0.1494,0,0.345],
};
