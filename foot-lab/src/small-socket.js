import * as T from 'three';

export const TINY_SOCKET=Object.freeze({center:Object.freeze([0,0]),radius:.04,depth:.008});

// A shallow circular depression with no raised rim. Its displacement and first
// two derivatives reach zero at the edge, blending into the original foot.
export function carveTinyFootSocket(foot){
 if(foot.userData.tinySocket)throw Error('The tiny socket is already carved');
 const {center:[cx,cz],radius,depth}=TINY_SOCKET,geometry=foot.geometry,p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)-cx,z=p.getZ(i)-cz,y=p.getY(i),r2=(x*x+z*z)/(radius*radius);
  if(r2>=1)continue;
  // Fade out well above the sole instead of cutting through the lower surface.
  const t=T.MathUtils.clamp((y-.04)/.06,0,1),upper=t*t*t*(10-15*t+6*t*t);
  p.setY(i,y-depth*(1-r2)**3*upper);
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const size=geometry.boundingBox.getSize(new T.Vector3());
 foot.userData.size={width:size.x,height:size.y,length:size.z};
 foot.userData.tinySocket={...TINY_SOCKET};
 return foot;
}
