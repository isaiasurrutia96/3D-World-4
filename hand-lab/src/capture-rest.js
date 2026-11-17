import {poseRestingDigits as approvedRest} from '../../avatar/src/hand-study/resting-digits.js';

// The lab build substitutes only this observer for the rest-pose call.
// The approved generator and saved avatar files are never edited.
export function poseRestingDigits(geometry,side,bindPositions){
 const straight=geometry.attributes.position.array.slice();
 const result=approvedRest(geometry,side,bindPositions);
 result.userData.labBind={straight,original:bindPositions,side};
 return result;
}
