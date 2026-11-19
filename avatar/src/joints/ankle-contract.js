// Shared mechanical ankle contract. Metres and degrees; no rendering dependencies.
export const ANKLE_RADIUS=.115;
// Existing ankle center above the flat sole, measured on the live lower leg.
export const ANKLE_REST_HEIGHT=.163520006775856;
export const ANKLE_CLEARANCE=.0006;
export const ANKLE_CAP_ANGLE=Math.PI/4;
// The foot wraps modestly farther up the ball than the unchanged calf cup.
export const FOOT_SOCKET_CAP_ANGLE=52*Math.PI/180;
export const FOOT_SOCKET_BLEND_WIDTH=.006;
export const ANKLE_LIP_RADIUS=.005;
// Actual outer foot/calf shells are clear through 60°, including 20° roll.
// Heel raise and pointing share this physical joint; their maxima cannot add.
export const ANKLE_MAX_COMBINED=60;
export const ANKLE_LIMITS=Object.freeze({
 ankle:Object.freeze([-36,48]),roll:Object.freeze([-20,20]),
 toes:Object.freeze([0,25]),heel:Object.freeze([0,30]),
});

export function normalizeAnklePose(input={}){
 const pose=Object.fromEntries(Object.entries(ANKLE_LIMITS).map(([id,[min,max]])=>[id,Math.max(min,Math.min(max,Number.isFinite(input[id])?input[id]:0))]));
 pose.ankle=Math.min(pose.ankle,ANKLE_MAX_COMBINED-pose.heel);
 return pose;
}
