// Skeleton · layer 1: building the bones and moving them.
//
// createSkeleton() returns the full bone list (centre, his left side, its mirror his right,
// fingers) and three operations:
//   restPose()        the angles that reproduce the approved model
//   clampPose(pose)   keeps every joint inside its limits
//   solve(pose)       forward kinematics: where every joint ends up
//
// A pose is { root?: {position:[x,y,z], rotation:{x,y,z}}, [bone]: {x,y,z} }
// with angles in degrees; any bone left out stays at its rest angle.
// Moving a bone turns everything below it; bone lengths never change.
import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import {CENTRE, SIDE, FOOT_CONTACTS, fingerBones} from './bones.js';

const RAD = Math.PI / 180;
const mirrorPoint = ([x,y,z]) => [-x,y,z];

/** A bone's frame (its own x/y/z axes) as a rotation from avatar space. */
function frameOf(bone){
 if(bone.frame==='body')return new Quaternion();
 const y=new Vector3(...bone.tail).sub(new Vector3(...bone.head)).normalize();
 const x=new Vector3(...bone.frame.bendAxis);x.addScaledVector(y,-x.dot(y)).normalize();
 const z=new Vector3().crossVectors(x,y);
 return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x,y,z));
}

/**
 * Mirror a bone from his left side to his right. Positions flip across x. Angles: x
 * (bend) stays the same, y (twist) and z (side) change sign, so the left
 * side moves as the exact mirror image of the other.
 */
function mirrorBone(b){
 const flip=([a,c])=>[-c,-a];
 const frame=b.frame==='body'?'body':{bendAxis:[b.frame.bendAxis[0],-b.frame.bendAxis[1],-b.frame.bendAxis[2]]};
 return {...b, name:b.name+'.R', parent:b.parent&&!CENTRE.some(c=>c.name===b.parent)?b.parent+'.R':b.parent,
  head:mirrorPoint(b.head), tail:mirrorPoint(b.tail), frame,
  rest:{x:b.rest.x,y:-b.rest.y,z:-b.rest.z},
  limits:b.limits&&{x:[...b.limits.x], y:flip(b.limits.y), z:flip(b.limits.z)}, side:'R'};
}

export function createSkeleton(){
 // Bone names use his own left (.L) and right (.R). He faces +Z, so +X is his left.
 const left=[...SIDE,...fingerBones()].map(b=>({...b, name:b.name+'.L',
  parent:b.parent&&!CENTRE.some(c=>c.name===b.parent)?b.parent+'.L':b.parent, side:'L'}));
 const right=[...SIDE,...fingerBones()].map(mirrorBone);
 const bones=[...CENTRE.map(b=>({...b,side:'C'})),...left,...right];
 const index=new Map(bones.map((b,i)=>[b.name,i]));
 for(const b of bones){
  b.parentIndex=b.parent===null?-1:index.get(b.parent);
  if(b.parentIndex===undefined)throw Error(`Bone ${b.name}: unknown parent ${b.parent}`);
  b.frameQ=frameOf(b);b.frameInv=b.frameQ.clone().invert();
  b.order=b.order??'XYZ';
  b.restQ=new Quaternion().setFromEuler(new Euler(b.rest.x*RAD,b.rest.y*RAD,b.rest.z*RAD,b.order));
  b.restInv=b.restQ.clone().invert();
  b.length=new Vector3(...b.tail).distanceTo(new Vector3(...b.head));
 }
 // Parents always come before their children, so one pass solves the chain.
 bones.forEach((b,i)=>{if(b.parentIndex>=i)throw Error(`Bone ${b.name} is listed before its parent`);});

 function restPose(){
  return Object.fromEntries(bones.filter(b=>b.parent!==null).map(b=>[b.name,{...b.rest}]));
 }

 function clampPose(pose){
  const out={};if(pose.root)out.root=pose.root;
  for(const b of bones){
   if(b.parent===null)continue;
   const p=pose[b.name];if(!p)continue;
   out[b.name]=Object.fromEntries(['x','y','z'].map(k=>{
    const v=Number.isFinite(p[k])?p[k]:b.rest[k];
    return [k,b.limits?Math.min(b.limits[k][1],Math.max(b.limits[k][0],v)):v];
   }));
  }
  return out;
 }

 const e=new Euler(),q=new Quaternion(),d=new Quaternion(),v=new Vector3();
 /**
  * Forward kinematics. Returns for each bone its world head and tail and its
  * world rotation relative to rest. Angles are clamped first.
  */
 function solve(pose={}){
  const p=clampPose(pose),result=new Array(bones.length);
  const rootPos=new Vector3(...(p.root?.position??[0,0,0])),r=p.root?.rotation??{x:0,y:0,z:0};
  const rootQ=new Quaternion().setFromEuler(new Euler(r.x*RAD,r.y*RAD,r.z*RAD,'XYZ'));
  bones.forEach((b,i)=>{
   const a=p[b.name]??b.rest;
   // Change from rest, in avatar space: frame · R(angles) · R(rest)⁻¹ · frame⁻¹.
   e.set(a.x*RAD,a.y*RAD,a.z*RAD,b.order);
   d.copy(b.frameQ).multiply(q.setFromEuler(e)).multiply(b.restInv).multiply(b.frameInv);
   let head,rot;
   if(b.parentIndex<0){
    rot=rootQ.clone().multiply(d);
    head=new Vector3(...b.head).applyQuaternion(rootQ).add(rootPos);
   }else{
    const P=result[b.parentIndex],parent=bones[b.parentIndex];
    head=v.set(b.head[0]-parent.head[0],b.head[1]-parent.head[1],b.head[2]-parent.head[2]).applyQuaternion(P.rotation).add(P.head).clone();
    rot=P.rotation.clone().multiply(d);
   }
   const tail=new Vector3(b.tail[0]-b.head[0],b.tail[1]-b.head[1],b.tail[2]-b.head[2]).applyQuaternion(rot).add(head);
   result[i]={name:b.name,head,tail,rotation:rot};
  });
  return {bones:result,get:name=>result[index.get(name)]};
 }

 /** The same pose for the other side (left and right swapped, mirrored). */
 function mirrorPose(pose){
  const out={};
  if(pose.root){const r=pose.root.rotation??{x:0,y:0,z:0},pp=pose.root.position??[0,0,0];out.root={position:[-pp[0],pp[1],pp[2]],rotation:{x:r.x,y:-r.y,z:-r.z}};}
  for(const [name,a] of Object.entries(pose)){
   if(name==='root')continue;
   const other=name.endsWith('.R')?name.slice(0,-2)+'.L':name.endsWith('.L')?name.slice(0,-2)+'.R':name;
   out[other]={x:a.x,y:-a.y,z:-a.z};
  }
  return out;
 }

 const contacts=side=>Object.fromEntries(Object.entries(FOOT_CONTACTS).map(([k,pnt])=>[k,side==='R'?mirrorPoint(pnt):[...pnt]]));
 return {bones,index,restPose,clampPose,solve,mirrorPose,footContacts:{R:contacts('R'),L:contacts('L')}};
}
