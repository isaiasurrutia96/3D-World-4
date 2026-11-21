// New avatar (version 2): a joint ball with an exact triangle count.
//
// Why this way (compared 21 November 2026):
//  - a UV sphere (latitude/longitude) bunches triangles at its two poles, and a
//    joint ball turns in every direction, so a pole often faces the camera;
//  - an icosphere is very even but only comes in fixed counts (80, 320, 1280);
//  - a cube sphere is even but cannot make 400 or 500;
//  - a Fibonacci sphere spreads points in an even spiral (like sunflower
//    seeds) and wraps them in their tightest skin (convex hull). Any even count
//    is exact (N points always give 2N - 4 triangles) and the triangles are the
//    most even of the four, so it looks equally round from every side.
// The hull is three.js's own tested ConvexHull, not a home-made one.
import {Vector3} from 'three';
import {ConvexHull} from 'three/addons/math/ConvexHull.js';

const GOLDEN_ANGLE=Math.PI*(3-Math.sqrt(5));

/** N points spread evenly over a sphere of the given radius (Fibonacci spiral). */
export function fibonacciPoints(count,radius){
 return Array.from({length:count},(_,i)=>{
  const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*GOLDEN_ANGLE;
  return new Vector3(Math.cos(a)*r*radius,y*radius,Math.sin(a)*r*radius);
 });
}

/**
 * Builds a ball centred at the origin with exactly `triangles` triangles
 * (an even number, 8 or more). Returns {positions, normals, index}; normals
 * point straight out from the centre, the exact normal of a sphere, so it is
 * shaded perfectly smoothly.
 */
export function buildBall({radius,triangles}){
 if(!(Number.isInteger(triangles)&&triangles>=8&&triangles%2===0))throw Error('triangles must be an even whole number, 8 or more');
 if(!(radius>0))throw Error('radius must be positive');
 const points=fibonacciPoints((triangles+4)/2,radius),hull=new ConvexHull().setFromPoints(points);
 const number=new Map(points.map((p,i)=>[p,i])),index=[];
 for(const face of hull.faces){
  // Each hull face is a triangle wound counter-clockwise seen from outside.
  const edge=face.edge,corners=[edge.head(),edge.next.head(),edge.next.next.head()].map(v=>number.get(v.point));
  if(edge.next.next.next!==edge)throw Error('hull face is not a triangle');
  index.push(...corners);
 }
 const positions=points.flatMap(p=>[p.x,p.y,p.z]),normals=points.flatMap(p=>{const n=p.clone().normalize();return [n.x,n.y,n.z];});
 return {positions,normals,index};
}

/** The ball choices shown in the Test Lab (radius of the approved avatar's balls, 90.7 mm). */
export const BALL_RADIUS=.0907;
export const BALL_OPTIONS=[
 {id:'ball-300',label:'Ball · 300',triangles:300,note:'A joint ball with 300 triangles.'},
 {id:'ball-400',label:'Ball · 400',triangles:400,note:'A joint ball with 400 triangles.'},
 {id:'ball-500',label:'Ball · 500',triangles:500,note:'A joint ball with 500 triangles.'},
];
