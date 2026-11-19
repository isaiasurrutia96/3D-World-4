import * as T from 'three';

// Float32 can identify two extremely close surface crossings. Split their
// local face fans without moving ANY point. Remove only detached sub-voxel
// sampling slivers; an anatomical part can never pass these size guards.
export function repairSkin(source,{maxSliverSpan=.009,maxSliverVertices=128}={}){
 const P=source.attributes.position,N=source.attributes.normal,n=P.count;let I=source.index.array;
 const faceMap=new Map(),keep=new Uint8Array(I.length/3).fill(1);let cancelledFaces=0;
 for(let f=0;f<I.length/3;f++){
  const a=I[3*f],b=I[3*f+1],c=I[3*f+2],sorted=[a,b,c].sort((a,b)=>a-b),key=sorted.join(','),sign=((a>b)+(a>c)+(b>c))%2?-1:1;
  const prev=faceMap.get(key);
  if(prev&&prev.sign!==sign){keep[f]=keep[prev.f]=0;faceMap.delete(key);cancelledFaces+=2;}else faceMap.set(key,{f,sign});
 }
 if(cancelledFaces){const filtered=[];for(let f=0;f<keep.length;f++)if(keep[f])filtered.push(I[3*f],I[3*f+1],I[3*f+2]);I=Uint32Array.from(filtered);}
 const parent=Int32Array.from({length:n},(_,i)=>i),root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<I.length;i+=3){parent[root(I[i])]=root(I[i+1]);parent[root(I[i+1])]=root(I[i+2]);}
 const components=new Map();for(let i=0;i<n;i++){const r=root(i);if(!components.has(r))components.set(r,{n:0,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});const c=components.get(r);c.n++;for(let k=0;k<3;k++){const v=P.array[3*i+k];c.min[k]=Math.min(c.min[k],v);c.max[k]=Math.max(c.max[k],v);}}
 const discarded=new Set(),slivers=[];for(const [r,c]of components)if(c.n<maxSliverVertices&&Math.max(...c.max.map((v,k)=>v-c.min[k]))<maxSliverSpan){discarded.add(r);slivers.push(c);}
 const triangles=[];for(let i=0;i<I.length;i+=3)if(!discarded.has(root(I[i])))triangles.push(I[i],I[i+1],I[i+2]);
 const corners=Int32Array.from({length:triangles.length},(_,i)=>i),find=i=>{while(corners[i]!==i){corners[i]=corners[corners[i]];i=corners[i];}return i;},join=(a,b)=>{corners[find(a)]=find(b);};
 const edges=new Map(),normals=[];
 for(let f=0;f<triangles.length/3;f++){
  const vs=triangles.slice(3*f,3*f+3),a=new T.Vector3().fromBufferAttribute(P,vs[0]),b=new T.Vector3().fromBufferAttribute(P,vs[1]),c=new T.Vector3().fromBufferAttribute(P,vs[2]);normals.push(b.sub(a).cross(c.sub(a)).normalize());
  for(let k=0;k<3;k++){const u=vs[k],v=vs[(k+1)%3],key=Math.min(u,v)*n+Math.max(u,v),e={f,sign:u<v?1:-1,cu:3*f+(u<v?k:(k+1)%3),cv:3*f+(u<v?(k+1)%3:k)};if(!edges.has(key))edges.set(key,[]);edges.get(key).push(e);}
 }
 let splitEdges=0;
 const pair=(a,b)=>{join(a.cu,b.cu);join(a.cv,b.cv);};
 for(const faces of edges.values()){
  if(faces.length===2){pair(faces[0],faces[1]);continue;}
  if(faces.length%2)throw Error('Open or odd surface edge cannot be repaired');
  splitEdges++;const a=faces.filter(f=>f.sign>0),b=faces.filter(f=>f.sign<0);if(a.length!==b.length)throw Error('Inconsistent surface winding');
  while(a.length){const f=a.pop();let best=0;for(let i=1;i<b.length;i++)if(normals[f.f].dot(normals[b[i].f])>normals[f.f].dot(normals[b[best].f]))best=i;pair(f,b.splice(best,1)[0]);}
 }
 const map=new Map(),position=[],normal=[],indices=[];
 for(let k=0;k<triangles.length;k++){const r=find(k);if(!map.has(r)){map.set(r,position.length/3);const i=triangles[k];position.push(P.getX(i),P.getY(i),P.getZ(i));normal.push(N.getX(i),N.getY(i),N.getZ(i));}indices.push(map.get(r));}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {geometry,report:{cancelledInteriorFaces:cancelledFaces,splitCoincidentEdges:splitEdges,removedSamplingSlivers:slivers,movedVertices:0}};
}
