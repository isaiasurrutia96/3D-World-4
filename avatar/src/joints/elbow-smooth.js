import * as T from 'three';

export const ELBOW_SMOOTH=Object.freeze({maximumMove:.0025,pairs:28,normalPasses:96,capStart:.88,capEnd:1.90,capSlope:1.5});

// Fair the marked outer transition as one welded surface. The real spherical
// contact and rolling fillet stay pinned; neither the pivot nor topology moves.
export function smoothElbowTransition(part,radius,upper,{scale=1,capTransfer=true}={}){
 const g=part.geometry,p=g.attributes.position,n=g.attributes.normal,I=g.index.array,m=g.userData.elbowMold,body=upper?1:-1;
 const beforePositions=p.array.slice(),beforeNormals=n.array.slice(),ids=new Uint32Array(p.count),nodes=[],map=new Map();
 const core=new Set(m.core),pinned=new Set([...m.core,...m.rim.map(entry=>entry[0])]);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),key=[x,y,z].map(v=>Math.round(v/1e-7)).join(',');
  if(!map.has(key)){map.set(key,nodes.length);nodes.push({x,y,z,vertices:[],links:new Set(),locked:false,normalLocked:false});}
  const id=map.get(key);ids[i]=id;nodes[id].vertices.push(i);if(pinned.has(i))nodes[id].locked=true;if(core.has(i))nodes[id].normalLocked=true;
 }
 for(let i=0;i<I.length;i+=3){const [a,b,c]=[ids[I[i]],ids[I[i+1]],ids[I[i+2]]];if(a===b||b===c||c===a)continue;nodes[a].links.add(b).add(c);nodes[b].links.add(a).add(c);nodes[c].links.add(a).add(b);}
 const size=nodes.length,origin=new Float64Array(size*3),weights=new Float64Array(size),normalWeights=new Float64Array(size),sourceNormals=new Float64Array(size*3);
 const normalize=(array,i)=>{const length=Math.hypot(array[i],array[i+1],array[i+2])||1;array[i]/=length;array[i+1]/=length;array[i+2]/=length;};
 for(const [i,node] of nodes.entries()){
  const {x,y,z}=node,s=body*(y-m.center[1]),r=Math.hypot(x-m.center[0],y-m.center[1],z-m.center[2]);
  const blend=T.MathUtils.smoothstep(z-m.center[2],0,.04*scale)*T.MathUtils.smoothstep(s,.015*scale,.055*scale)*(1-T.MathUtils.smoothstep(s,.13*scale,.20*scale));
  weights[i]=node.locked?0:blend*T.MathUtils.smoothstep(r,radius+.003*scale,radius+.015*scale);
  normalWeights[i]=node.normalLocked?0:blend;
  origin.set([x,y,z],3*i);for(const v of node.vertices)for(let k=0;k<3;k++)sourceNormals[3*i+k]+=beforeNormals[3*v+k];normalize(sourceNormals,3*i);
  node.links=[...node.links];
 }
 let coordinates=origin.slice();
 function relax(factor){
  const next=coordinates.slice();
  for(let i=0;i<size;i++){
   const weight=weights[i],links=nodes[i].links;if(weight===0||!links.length)continue;
   let x=0,y=0,z=0,total=0;
   for(const j of links){const distance=Math.hypot(origin[3*i]-origin[3*j],origin[3*i+1]-origin[3*j+1],origin[3*i+2]-origin[3*j+2]),w=1/Math.max(distance,1e-6);x+=coordinates[3*j]*w;y+=coordinates[3*j+1]*w;z+=coordinates[3*j+2]*w;total+=w;}
   const means=[x/total,y/total,z/total];for(let k=0;k<3;k++)next[3*i+k]+=factor*weight*(means[k]-coordinates[3*i+k]);
   const dx=next[3*i]-origin[3*i],dy=next[3*i+1]-origin[3*i+1],dz=next[3*i+2]-origin[3*i+2],distance=Math.hypot(dx,dy,dz);
   if(distance>ELBOW_SMOOTH.maximumMove*scale)for(let k=0;k<3;k++)next[3*i+k]=origin[3*i+k]+(next[3*i+k]-origin[3*i+k])*ELBOW_SMOOTH.maximumMove*scale/distance;
  }
  coordinates=next;
 }
 for(let pass=0;pass<ELBOW_SMOOTH.pairs;pass++){relax(.4);relax(-.42);}

 // Fair the authored smooth normal field. Recomputing it from the coarse
 // source polygons would reintroduce a faceted ring at the cap/shaft join.
 let normals=sourceNormals.slice();
 for(let pass=0;pass<ELBOW_SMOOTH.normalPasses;pass++){
  const next=normals.slice();for(let i=0;i<size;i++){const links=nodes[i].links,w=normalWeights[i]*.5;if(!w||!links.length)continue;for(let k=0;k<3;k++){let sum=0;for(const j of links)sum+=normals[3*j+k];next[3*i+k]+=w*(sum/links.length-normals[3*i+k]);}normalize(next,3*i);}normals=next;
 }
 // Transfer a continuous rounded-cap normal field across the outer band.
 // The original coarse lathe's cap/shaft normals can turn back on themselves
 // after carving; averaging alone retains that false crease. This field has
 // a steadily decreasing cap slope and blends into the unchanged shaft.
 for(let i=0;i<size;i++)if(capTransfer&&normalWeights[i]>0){
  const x=coordinates[3*i]-m.center[0],y=coordinates[3*i+1]-m.center[1],z=coordinates[3*i+2]-m.center[2],r=Math.hypot(x,y,z),radial=Math.hypot(x,z);
  if(radial<1e-8)continue;
  const t=T.MathUtils.clamp((body*y-radius*ELBOW_SMOOTH.capStart)/(radius*(ELBOW_SMOOTH.capEnd-ELBOW_SMOOTH.capStart)),0,1),slope=ELBOW_SMOOTH.capSlope*(1-t)**2;
  const length=Math.hypot(1,slope),desired=[x/radial/length,-body*slope/length,z/radial/length];
  const blend=normalWeights[i]*T.MathUtils.smoothstep(r,radius+.002*scale,radius+.014*scale);
  for(let k=0;k<3;k++)normals[3*i+k]=normals[3*i+k]*(1-blend)+desired[k]*blend;normalize(normals,3*i);
 }
 function energy(values){let sum=0,total=0;for(let i=0;i<size;i++)for(const j of nodes[i].links)if(j>i){const w=Math.min(normalWeights[i],normalWeights[j]);if(!w)continue;let difference=0;for(let k=0;k<3;k++)difference+=(values[3*i+k]-values[3*j+k])**2;sum+=w*difference;total+=w;}return sum/total;}
 const changed=[];let maximumMove=0;
 for(let i=0;i<size;i++)if(weights[i]>0||normalWeights[i]>0){
  for(const vertex of nodes[i].vertices){if(weights[i]>0){const x=coordinates[3*i],y=coordinates[3*i+1],z=coordinates[3*i+2];maximumMove=Math.max(maximumMove,Math.hypot(x-beforePositions[3*vertex],y-beforePositions[3*vertex+1],z-beforePositions[3*vertex+2]));p.setXYZ(vertex,x,y,z);}if(normalWeights[i]>0)n.setXYZ(vertex,normals[3*i],normals[3*i+1],normals[3*i+2]);changed.push(vertex);}
 }
 const changedSet=new Set(changed);part.userData.elbowDesign.preserved=part.userData.elbowDesign.preserved.filter(i=>!changedSet.has(i));
 p.needsUpdate=true;n.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
 const report={beforePositions,beforeNormals,changed,maximumMove,normalEnergyBefore:energy(sourceNormals),normalEnergyAfter:energy(normals)};
 part.userData.elbowSmoothing={maximumMove,normalEnergyBefore:report.normalEnergyBefore,normalEnergyAfter:report.normalEnergyAfter};return report;
}
