import * as T from 'three';

// Authoring only: distance to the ACTUAL saved hand/foot, not replacement
// primitive fingers. A bounding-volume tree keeps grid sampling practical.
export function createMeshDistance(mesh,{margin=.055,leafSize=20}={}){
 mesh.updateMatrixWorld(true);
 const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
 const P=geometry.attributes.position,N=geometry.attributes.normal,I=geometry.index.array;
 geometry.computeBoundingBox();const box=geometry.boundingBox.clone().expandByScalar(margin);
 const ids=Array.from({length:I.length/3},(_,i)=>i),nodes=[];
 const centre=(t,a)=>(P.array[3*I[3*t]+a]+P.array[3*I[3*t+1]+a]+P.array[3*I[3*t+2]+a])/3;
 function build(lo,hi){
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let j=lo;j<hi;j++)for(let k=0;k<3;k++){const i=3*I[3*ids[j]+k];for(let a=0;a<3;a++){const v=P.array[i+a];if(v<min[a])min[a]=v;if(v>max[a])max[a]=v;}}
  const node={min,max,lo,hi,left:-1,right:-1},id=nodes.push(node)-1;
  if(hi-lo>leafSize){
   let axis=0;for(let a=1;a<3;a++)if(max[a]-min[a]>max[axis]-min[axis])axis=a;
   const middle=(min[axis]+max[axis])/2;let a=lo,b=hi-1;
   while(a<=b){if(centre(ids[a],axis)<middle)a++;else{[ids[a],ids[b]]=[ids[b],ids[a]];b--;}}
   if(a===lo||a===hi){const sorted=ids.slice(lo,hi).sort((a,b)=>centre(a,axis)-centre(b,axis));for(let k=0;k<sorted.length;k++)ids[lo+k]=sorted[k];a=(lo+hi)>>1;}
   node.left=build(lo,a);node.right=build(a,hi);
  }
  return id;
 }
 build(0,ids.length);
 const triangle=new T.Triangle(),point=new T.Vector3(),nearest=new T.Vector3(),bestPoint=new T.Vector3(),bary=new T.Vector3(),normal=new T.Vector3(),tmp=new T.Vector3();
 let best=Infinity,bestTriangle=0;
 const bound=(n,x,y,z)=>{const a=Math.max(n.min[0]-x,0,x-n.max[0]),b=Math.max(n.min[1]-y,0,y-n.max[1]),c=Math.max(n.min[2]-z,0,z-n.max[2]);return a*a+b*b+c*c;};
 function visit(id,x,y,z){
  const node=nodes[id];if(bound(node,x,y,z)>best)return;
  if(node.left<0){
   for(let j=node.lo;j<node.hi;j++){
    const t=ids[j];triangle.a.fromBufferAttribute(P,I[3*t]);triangle.b.fromBufferAttribute(P,I[3*t+1]);triangle.c.fromBufferAttribute(P,I[3*t+2]);
    triangle.closestPointToPoint(point,nearest);const d=nearest.distanceToSquared(point);
    if(d<best){best=d;bestTriangle=t;bestPoint.copy(nearest);}
   }
  }else{
   const a=bound(nodes[node.left],x,y,z),b=bound(nodes[node.right],x,y,z);
   if(a<b){if(a<=best)visit(node.left,x,y,z);if(b<=best)visit(node.right,x,y,z);}else{if(b<=best)visit(node.right,x,y,z);if(a<=best)visit(node.left,x,y,z);}
  }
 }
 // Parity supplies the sign independently of authored shading normals.
 // A fixed sub-micron ray offset avoids shared triangle-edge ties.
 function crossings(id,x,y,z){
  const node=nodes[id];if(x>=node.max[0]||y<node.min[1]||y>node.max[1]||z<node.min[2]||z>node.max[2])return 0;
  if(node.left>=0)return crossings(node.left,x,y,z)+crossings(node.right,x,y,z);
  let hits=0;
  for(let j=node.lo;j<node.hi;j++){
   const t=ids[j],a=3*I[3*t],b=3*I[3*t+1],c=3*I[3*t+2],A=P.array;
   const by=A[b+1]-A[a+1],bz=A[b+2]-A[a+2],cy=A[c+1]-A[a+1],cz=A[c+2]-A[a+2],den=by*cz-bz*cy;
   if(Math.abs(den)<1e-20)continue;
   const py=y-A[a+1],pz=z-A[a+2],u=(py*cz-pz*cy)/den,v=(by*pz-bz*py)/den;
   if(u>=0&&v>=0&&u+v<=1&&A[a]+u*(A[b]-A[a])+v*(A[c]-A[a])>x)hits++;
  }
  return hits;
 }
 function distance(x,y,z){
  if(x<box.min.x||x>box.max.x||y<box.min.y||y>box.max.y||z<box.min.z||z>box.max.z)return 1;
  point.set(x,y,z);best=Infinity;visit(0,x,y,z);
  return Math.sqrt(best)*(crossings(0,x,y+1.123e-8,z+1.781e-8)%2?-1:1);
 }
 return {distance,box,nodes:nodes.length,triangles:I.length/3};
}
