// Skeleton · section 3: the pose library. Poses list only the bones they
// move (degrees, see bones.js); clips are short animations made of poses.
// Bone names use the avatar's own left (.L) and right (.R).
import {createClip} from './pose.js';

/** Test poses that exercise every joint that can move so far. */
export const POSES={
 rest:{},
 'arms-out':{'upperArm.L':{x:0,y:0,z:88},'upperArm.R':{x:0,y:0,z:-88},'lowerArm.L':{x:0,y:0,z:0},'lowerArm.R':{x:0,y:0,z:0}},
 'arms-up':{'upperArm.L':{x:-165,y:0,z:8},'upperArm.R':{x:-165,y:0,z:-8},'lowerArm.L':{x:-5,y:0,z:0},'lowerArm.R':{x:-5,y:0,z:0}},
 // Natural wave: upper arm out at shoulder height, forearm straight up, palm forward;
 // the hand tilted 10° back (clockwise seen from his waving side) about its own middle.
 wave:{'upperArm.L':{x:-83.2,y:-5.1,z:79.2},'lowerArm.L':{x:-74.6,y:-14.6,z:0},'hand.L':{x:-1.2,y:0,z:8.5}},
 elbows:{'upperArm.L':{x:-15,y:0,z:12},'upperArm.R':{x:-15,y:0,z:-12},'lowerArm.L':{x:-120,y:0,z:0},'lowerArm.R':{x:-120,y:0,z:0},'hand.L':{x:30,y:0,z:0},'hand.R':{x:30,y:0,z:0}},
 kick:{'thigh.L':{x:-70,y:0,z:0},'shin.L':{x:35,y:0,z:0},'foot.L':{x:20,y:0,z:0},'upperArm.L':{x:25,y:0,z:12},'upperArm.R':{x:-35,y:0,z:-12}},
 knee:{'thigh.R':{x:-95,y:0,z:0},'shin.R':{x:115,y:0,z:0},'foot.R':{x:30,y:0,z:0},'upperArm.L':{x:-30,y:0,z:20},'upperArm.R':{x:20,y:0,z:-20}},
 look:{'neck':{x:5,y:25,z:0},'head':{x:-10,y:15,z:6}},
 // The chest turns on the hips (the start of a throw); the head keeps facing forward.
 turn:{'spine':{x:0,y:35,z:0},'neck':{x:0,y:-20,z:0},'head':{x:0,y:-15,z:0},'upperArm.L':{x:-20,y:0,z:25},'upperArm.R':{x:-35,y:0,z:-15}},
};

const WAVE=POSES.wave,ELBOW=WAVE['lowerArm.L'].x,WRIST=WAVE['hand.L'].x;
/**
 * A real wave: the arm holds the wave pose and the forearm swings side to
 * side from the elbow (bending and straightening it), with the hand
 * following a quarter-beat behind like a relaxed wrist. One swing out and
 * back takes 0.6 seconds, looping.
 */
export const CLIPS={
 wave:createClip([
  {time:0,   pose:{...WAVE,'lowerArm.L':{...WAVE['lowerArm.L'],x:ELBOW},     'hand.L':{...WAVE['hand.L'],x:WRIST-8}}},
  {time:.15, pose:{...WAVE,'lowerArm.L':{...WAVE['lowerArm.L'],x:ELBOW+15},  'hand.L':{...WAVE['hand.L'],x:WRIST}}},
  {time:.3,  pose:{...WAVE,'lowerArm.L':{...WAVE['lowerArm.L'],x:ELBOW},     'hand.L':{...WAVE['hand.L'],x:WRIST+8}}},
  {time:.45, pose:{...WAVE,'lowerArm.L':{...WAVE['lowerArm.L'],x:ELBOW-15},  'hand.L':{...WAVE['hand.L'],x:WRIST}}},
 ],{loop:true,duration:.6}),
};
