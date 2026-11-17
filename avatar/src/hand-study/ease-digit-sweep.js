// Ease the common lateral sweep, keeping the reference finger fan.
// A shared displacement at each height preserves the gaps and widths;
// the rounded palm attachment and thumb stay outside this adjustment.
export function easeDigitSweep(geometry,side){
 geometry.computeBoundingBox();
 const b=geometry.boundingBox;
 geometry.userData.preSweepMaxDimension=Math.max(b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z);
 const p=geometry.attributes.position;
 let maxDisplacement=0;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),px=x*side/.0008+244;
  const depth=Math.max(0,-.040-y);
  if(!depth||px<=175)continue;
  const t=Math.min(1,(px-175)/20),weight=t*t*(3-2*t);
  const displacement=.18*depth*depth/(depth+.025)*weight;
  p.setX(i,x-side*displacement);
  maxDisplacement=Math.max(maxDisplacement,displacement);
 }
 geometry.userData.sweepEasingMaxDisplacement=maxDisplacement;
 return geometry;
}
