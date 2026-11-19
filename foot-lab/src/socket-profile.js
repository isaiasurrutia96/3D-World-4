import {ANKLE_RADIUS,ANKLE_CLEARANCE,FOOT_SOCKET_CAP_ANGLE,FOOT_SOCKET_BLEND_WIDTH} from '../../avatar/src/joints/ankle-contract.js';

// Pure geometry profile: one bowl, no raised trim. Its outer continuation
// matches the sphere's height, slope and curvature, then meets the foot softly.
export function createFootSocketProfile(centerY){
 const radius=ANKLE_RADIUS+ANKLE_CLEARANCE,angle=FOOT_SOCKET_CAP_ANGLE;
 const rim=radius*Math.sin(angle),rimY=centerY-radius*Math.cos(angle);
 const slope=Math.tan(angle),curvature=1/(radius*Math.cos(angle)**3),blend=FOOT_SOCKET_BLEND_WIDTH;
 function bowlHeight(r,forward){
  if(r<=rim)return centerY-Math.sqrt(radius*radius-r*r);
  const d=r-rim,length=.003,e=Math.exp(-d/length);
  // Let the heel flatten into the lower foot instead of rising into a collar.
  // Both continuations always rise outward and match the sphere through C2.
  const heel=rimY+slope*length*(1-e)+(curvature+slope/length)*length*length*(1-(1+d/length)*e);
  const front=rimY+slope*d+curvature*d*d/2;
  const t=Math.max(0,Math.min(1,(forward+.2)/.85)),weight=t*t*t*(10-15*t+6*t*t);
  return heel+(front-heel)*weight;
 }
 function heightAt(y,r,forward){
  const bowl=bowlHeight(r,forward),h=Math.max(0,1-Math.abs(y-bowl)/blend);
  // Compact C2 smooth-min: only remove material; exactly unchanged away from
  // the join. No discrete top/side selection can leave a jagged mouth edge.
  return Math.min(y,bowl)-blend*h*h*h/6;
 }
 return {rim,bowlHeight,heightAt};
}
