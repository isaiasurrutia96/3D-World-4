import * as T from 'three';

// The centre of the palm, measured on the approved hand (no estimates).
//
// Definition, his left hand at rest (his right is the mirror):
//   palm direction  the way the fingers curl: the average, over the index,
//                   middle, ring and little fingers, of (bend axis × finger
//                   direction) at the knuckle (positive bend = toward the palm).
//   along the hand  halfway from the wrist joint to the centre of the four
//                   knuckles.
//   across the hand halfway between the index and little knuckles.
//   the point       where a line through that spot, along the palm
//                   direction, meets the palm's surface.
//   the normal      the average surface direction of the palm within 15 mm
//                   of that point (the way the palm faces).

/**
 * Measure the palm centre.
 *   hand     the hand mesh (world matrix up to date)
 *   wrist    the wrist joint (Vector3, avatar space)
 *   fingers  [{head, tail, bendAxis}] for the index, middle, ring and little
 *            knuckle bones (Vector3s / arrays, avatar space)
 * Returns {point, normal} (arrays, avatar space).
 */
export function measurePalm(hand, wrist, fingers){
 const V = a => a.isVector3 ? a.clone() : new T.Vector3(...a);
 const palmDir = new T.Vector3();
 for(const f of fingers) palmDir.add(V(f.bendAxis).normalize().cross(V(f.tail).sub(V(f.head)).normalize()));
 palmDir.normalize();
 const knuckles = fingers.map(f => V(f.head)), centre = knuckles.reduce((a, b) => a.add(b), new T.Vector3()).multiplyScalar(1 / knuckles.length);
 const along = centre.clone().sub(wrist).normalize(), across = palmDir.clone().cross(along).normalize();
 const side = knuckles.map(k => k.clone().sub(wrist).dot(across)), mid = (Math.max(...side) + Math.min(...side)) / 2;
 const spot = wrist.clone().addScaledVector(along, centre.distanceTo(wrist) / 2).addScaledVector(across, mid);
 // Come in from outside the palm toward the hand, square to the hand's length (so the point
 // stays halfway along the palm): the first surface met is the palm.
 const inDir = palmDir.clone().addScaledVector(along, -palmDir.dot(along)).normalize();
 const hit = new T.Raycaster(spot.clone().addScaledVector(inDir, .2), inDir.clone().negate(), 0, 1).intersectObject(hand, false)[0];
 if(!hit) throw Error('Palm surface not found');
 const P = hand.geometry.attributes.position, N = hand.geometry.attributes.normal, nm = new T.Matrix3().getNormalMatrix(hand.matrixWorld);
 const normal = new T.Vector3(), v = new T.Vector3(), n = new T.Vector3();
 for(let i = 0; i < P.count; i++){
  v.fromBufferAttribute(P, i).applyMatrix4(hand.matrixWorld);
  if(v.distanceTo(hit.point) > .015) continue;
  n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
  if(n.dot(palmDir) > 0) normal.add(n);
 }
 normal.normalize();
 return {point: hit.point.toArray(), normal: normal.toArray()};
}
