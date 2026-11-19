import * as T from 'three';
import cdt2d from 'cdt2d';
import {smoothShoulderTrimNormals} from './shoulder-trim-normals.js';
import {originalSurface} from '../../../foot-lab/src/socket-roundover.js';

// Continuous sloping trim: retain +X, without scooping a notch below the lip.
export const SHOULDER_CLEARANCE=Object.freeze({slope:.5,intercept:-.11,edgeBlend:.006,maximumBevelMove:.0015});
const key=p=>p.map(x=>Math.round(x/1e-7)).join(',');
const distance=p=>(p[0]-SHOULDER_CLEARANCE.slope*p[1]-SHOULDER_CLEARANCE.intercept)/Math.hypot(1,SHOULDER_CLEARANCE.slope);
function contains(poly,p){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}

export function trimShoulderInnerArm(arm,radius){
 const g=arm.geometry,m=g.userData.shoulderMold,beforePositions=g.attributes.position.array.slice(),beforeNormals=g.attributes.normal.array.slice(),beforeIndex=g.index.array.slice();
 const positions=Array.from(beforePositions),normals=Array.from(beforeNormals),faces=[],cuts=new Map(),slope=SHOULDER_CLEARANCE.slope;
 const originalCount=beforePositions.length/3,canonical=new Map(),ids=[];
 for(let i=0;i<originalCount;i++){const k=key(positions.slice(3*i,3*i+3));if(!canonical.has(k))canonical.set(k,i);ids[i]=canonical.get(k);}
 const point=i=>new T.Vector3().fromArray(positions,3*i),dist=i=>positions[3*ids[i]]-slope*positions[3*ids[i]+1]-SHOULDER_CLEARANCE.intercept;
 function crossing(a,b){
  const ca=ids[a],cb=ids[b],edge=Math.min(ca,cb)+','+Math.max(ca,cb);if(cuts.has(edge))return cuts.get(edge);
  const da=dist(a),db=dist(b);if(Math.abs(da)<1e-12)return ca;if(Math.abs(db)<1e-12)return cb;
  const t=da/(da-db),v=point(ca).lerp(point(cb),t),i=positions.length/3;positions.push(v.x,v.y,v.z);ids[i]=i;
  const n=new T.Vector3().fromArray(normals,3*a).lerp(new T.Vector3().fromArray(normals,3*b),t).normalize();normals.push(n.x,n.y,n.z);cuts.set(edge,i);return i;
 }
 let clippedFaces=0,maximumInset=0;
 for(let f=0;f<beforeIndex.length;f+=3){
  const tri=Array.from(beforeIndex.subarray(f,f+3)),poly=[];if(new Set(tri.map(i=>ids[i])).size<3)continue;
  for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],insideA=dist(a)>=0,insideB=dist(b)>=0;if(insideA)poly.push(a);if(insideA!==insideB)poly.push(crossing(a,b));}
  if(poly.length!==3||poly.some((v,i)=>v!==tri[i]))clippedFaces++;
  for(let i=1;i+1<poly.length;i++){const f=[poly[0],poly[i],poly[i+1]];if(new Set(f.map(j=>ids[j])).size===3)faces.push(...f);}
 }
 // Build the cap from the actual open mesh edges, using the same shared
 // edge intersections as the retained shell. Never infer seams by proximity.
 const edges=new Map();for(let i=0;i<faces.length;i+=3)for(let j=0;j<3;j++){const a=ids[faces[i+j]],b=ids[faces[i+(j+1)%3]],k=Math.min(a,b)+','+Math.max(a,b);if(!edges.has(k))edges.set(k,[]);edges.get(k).push([a,b]);}
 const next=new Map();for(const list of edges.values())if(list.length===1){const [a,b]=list[0];if(next.has(b))throw Error('Shoulder cap boundary branches');next.set(b,a);}
 const loops=[],visited=new Set();for(const start of next.keys()){if(visited.has(start))continue;const loop=[];let i=start;do{if(i===undefined||visited.has(i)&&i!==start)throw Error('Shoulder cap is open');loop.push(i);visited.add(i);i=next.get(i);}while(i!==start);loops.push(loop);}
 if(loops.length!==1)throw Error('Expected one simple shoulder trim contour');
 // Constrained Delaunay triangulation keeps every boundary edge and adds
 // a regular 3 mm interior sampling, avoiding skinny fans and T seams.
 const outward=new T.Vector3(-1,slope,0).normalize(),loop=loops[0],capIds=[...loop],uv=loop.map(i=>[positions[3*i+2],positions[3*i+1]]),boundary=uv.map(p=>new T.Vector2(...p));
 const bounds={z0:Math.min(...uv.map(p=>p[0])),z1:Math.max(...uv.map(p=>p[0])),y0:Math.min(...uv.map(p=>p[1])),y1:Math.max(...uv.map(p=>p[1]))};
 for(let y=bounds.y0+.003;y<bounds.y1;y+=.003)for(let z=bounds.z0+.003;z<bounds.z1;z+=.003){
  const q=new T.Vector2(z,y);if(!contains(boundary,q))continue;
  let near=false;for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length],e=b.clone().sub(a),t=T.MathUtils.clamp(q.clone().sub(a).dot(e)/e.lengthSq(),0,1);if(a.clone().addScaledVector(e,t).distanceTo(q)<.001){near=true;break;}}if(near)continue;
  capIds.push(positions.length/3);uv.push([z,y]);positions.push(slope*y+SHOULDER_CLEARANCE.intercept,y,z);normals.push(outward.x,outward.y,outward.z);
 }
 const constraints=loop.map((_,i)=>[i,(i+1)%loop.length]);
 for(const tri of cdt2d(uv,constraints,{exterior:false})){const f=tri.map(i=>capIds[i]),a=point(f[0]),b=point(f[1]),c=point(f[2]);if(b.sub(a).cross(c.sub(a)).dot(outward)<0)[f[1],f[2]]=[f[2],f[1]];faces.push(...f);}
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setIndex(faces);
 const p=g.attributes.position,n=g.attributes.normal;
 const used=new Set(g.index.array),nodeMap=new Map(),nodes=[],nodeIds=[];
 for(const i of used){const v=[p.getX(i),p.getY(i),p.getZ(i)],k=key(v);if(!nodeMap.has(k)){nodeMap.set(k,nodes.length);nodes.push({rest:v,ids:[],links:new Set(),weight:0});}nodeIds[i]=nodeMap.get(k);nodes[nodeIds[i]].ids.push(i);}
 const pinned=new Set([...m.core,...m.rim.map(([i])=>i)]),center=new T.Vector3(...m.center);
 for(const node of nodes){const r=new T.Vector3(...node.rest).distanceTo(center),d=distance(node.rest);node.weight=node.ids.some(i=>pinned.has(i))||r<radius+.004?0:(1-T.MathUtils.smoothstep(d,0,SHOULDER_CLEARANCE.edgeBlend))*T.MathUtils.smoothstep(node.rest[1],.006,.025);}
 const I=g.index.array;for(let i=0;i<I.length;i+=3){const a=nodeIds[I[i]],b=nodeIds[I[i+1]],c=nodeIds[I[i+2]];nodes[a].links.add(b).add(c);nodes[b].links.add(a).add(c);nodes[c].links.add(a).add(b);}
 let coords=nodes.map(node=>[...node.rest]);
 for(let pass=0;pass<16;pass++){
  const next=coords.map(v=>[...v]),factor=pass%2?-.36:.35;
  nodes.forEach((node,i)=>{if(!node.weight||!node.links.size)return;for(let k=0;k<3;k++){let mean=0;for(const j of node.links)mean+=coords[j][k];mean/=node.links.size;next[i][k]+=factor*node.weight*(mean-coords[i][k]);}
   const move=new T.Vector3(...next[i]).sub(new T.Vector3(...node.rest));if(move.length()>SHOULDER_CLEARANCE.maximumBevelMove){move.setLength(SHOULDER_CLEARANCE.maximumBevelMove);next[i]=move.add(new T.Vector3(...node.rest)).toArray();}
   const d=distance(next[i]);if(d<0)next[i]=new T.Vector3(...next[i]).addScaledVector(outward,d).toArray();
  });coords=next;
 }
 let maximumBevelMove=0;nodes.forEach((node,i)=>{if(!node.weight)return;maximumBevelMove=Math.max(maximumBevelMove,new T.Vector3(...coords[i]).distanceTo(new T.Vector3(...node.rest)));for(const id of node.ids)p.setXYZ(id,...coords[i]);});
 const previousNormals=n.array.slice();g.computeVertexNormals();
 // The saved source duplicates coincident attribute seams. Average the
 // new cut's normals by geometric node too, so its cap and shell do not
 // acquire different lighting at the very same point.
 const sums=new Float64Array(nodes.length*3),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<I.length;i+=3){a.fromBufferAttribute(p,I[i]);b.fromBufferAttribute(p,I[i+1]);c.fromBufferAttribute(p,I[i+2]);b.sub(a).cross(c.sub(a));for(let k=0;k<3;k++){const j=nodeIds[I[i+k]]*3;sums[j]+=b.x;sums[j+1]+=b.y;sums[j+2]+=b.z;}}
 nodes.forEach((node,j)=>{const id=node.ids[0];if(p.getY(id)<=.006||distance([p.getX(id),p.getY(id),p.getZ(id)])>SHOULDER_CLEARANCE.edgeBlend*1.5)return;const normal=new T.Vector3().fromArray(sums,j*3).normalize();for(const id of node.ids)n.setXYZ(id,normal.x,normal.y,normal.z);});
 for(let i=0;i<p.count;i++)if(!used.has(i)||p.getY(i)<=.006||distance([p.getX(i),p.getY(i),p.getZ(i)])>SHOULDER_CLEARANCE.edgeBlend*1.5)n.setXYZ(i,...previousNormals.subarray(3*i,3*i+3));
 const normalEnergy=smoothShoulderTrimNormals(g,{slope,intercept:SHOULDER_CLEARANCE.intercept});
 m.core=m.core.filter(i=>used.has(i));m.rim=m.rim.filter(([i])=>used.has(i));m.clippedByMedialPlane={slope,intercept:SHOULDER_CLEARANCE.intercept};
 for(let i=0;i<beforePositions.length/3;i++)maximumInset=Math.max(maximumInset,slope*beforePositions[3*i+1]+SHOULDER_CLEARANCE.intercept-beforePositions[3*i]);
 g.computeBoundingBox();g.computeBoundingSphere();return {beforePositions,beforeNormals,beforeIndex,maximumInset,maximumBevelMove,normalEnergy,clippedFaces,loops:loops.length};
}

export function measureRestOverlap(torso,arm,ball,restQuaternion,report){
 const C=new T.Matrix4().set(0,-1,0,0,1,0,0,0,0,0,1,0,0,0,0,1),body=torso.geometry.clone();body.applyMatrix4(C);const sample=originalSurface(body),center=arm.geometry.userData.shoulderMold.center,position=ball.position.clone().sub(new T.Vector3(...center).applyQuaternion(restQuaternion)),v=new T.Vector3();
 let before=0,after=0,samples=0;
 for(const old of [true,false])for(const i of new Set(old?report.beforeIndex:arm.geometry.index.array)){
  if(old)v.fromArray(report.beforePositions,3*i);else v.fromBufferAttribute(arm.geometry.attributes.position,i);
  if(v.x>=0||v.y<.015||v.y>.15)continue;if(!old)samples++;v.applyQuaternion(restQuaternion).add(position).sub(torso.position);const s=sample(-v.y,v.z);if(!s)continue;const depth=Math.max(0,s.height-v.x);if(old)before=Math.max(before,depth);else after=Math.max(after,depth);
 }
 body.dispose();return {before,after,samples};
}
