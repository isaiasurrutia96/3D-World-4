import {MathUtils} from 'three';

// Driving already supplies an interpolated pose. Follow all three axes together:
// lagging only height can put the aim point inside an uphill road at boost speed.
export function updateFollowTarget(target,state,seconds,options,offset){
 const x=state.x+offset.x,y=(state.y||0)+(options?.targetHeight??.1)+offset.y,z=state.z+offset.z;
 if(options?.chase)target.set(x,y,z);
 else target.set(MathUtils.damp(target.x,x,10,seconds),MathUtils.damp(target.y,y,10,seconds),MathUtils.damp(target.z,z,10,seconds));
 return target;
}
