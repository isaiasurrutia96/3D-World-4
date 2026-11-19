import * as T from 'three';
import {MeshoptSimplifier} from 'meshoptimizer';

// Authoring only. Simplify one side with its centre border locked, then
// mirror once. Maximum reported geometric error is in METERS, not percent.
export async function optimizeSkin(source,{maxError=.00075,halfTriangles=100000}={}){
 await MeshoptSimplifier.ready;
 const P=source.attributes.position,N=source.attributes.normal,I=source.index.array,map=new Int32Array(P.count).fill(-1),p=[],n=[],ii=[];
 const add=i=>{if(map[i]<0){map[i]=p.length/3;p.push(P.getX(i),P.getY(i),P.getZ(i));n.push(N.getX(i),N.getY(i),N.getZ(i));}return map[i];};
 for(let i=0;i<I.length;i+=3)if(P.getX(I[i])>=0&&P.getX(I[i+1])>=0&&P.getX(I[i+2])>=0)ii.push(add(I[i]),add(I[i+1]),add(I[i+2]));
 const [simplified,error]=MeshoptSimplifier.simplify(Uint32Array.from(ii),Float32Array.from(p),3,Math.min(ii.length,halfTriangles*3),maxError,['LockBorder','ErrorAbsolute']);
 const used=new Int32Array(p.length/3).fill(-1),position=[],normal=[],indices=[];
 for(const i of simplified){if(used[i]<0){used[i]=position.length/3;position.push(p[3*i],p[3*i+1],p[3*i+2]);normal.push(n[3*i],n[3*i+1],n[3*i+2]);}indices.push(used[i]);}
 const count=position.length/3,faces=indices.length,mirror=new Uint32Array(count);
 for(let i=0;i<count;i++){
  if(position[3*i]===0)mirror[i]=i;
  else{mirror[i]=position.length/3;position.push(-position[3*i],position[3*i+1],position[3*i+2]);normal.push(-normal[3*i],normal[3*i+1],normal[3*i+2]);}
 }
 for(let i=0;i<faces;i+=3)indices.push(mirror[indices[i]],mirror[indices[i+2]],mirror[indices[i+1]]);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {geometry,report:{maxErrorMeters:maxError,reportedErrorMeters:error,rawTriangles:I.length/3,triangles:indices.length/3,vertices:position.length/3,exactMirror:true}};
}

export function inspectTopology(g){
 const P=g.attributes.position,I=g.index.array,n=P.count,edges=new Map(),parent=Int32Array.from({length:n},(_,i)=>i);let volume=0,minArea=Infinity,finite=true;
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(const v of P.array)finite&&=Number.isFinite(v);
 for(let i=0;i<I.length;i+=3){
  const a=I[i],b=I[i+1],c=I[i+2];parent[root(a)]=root(b);parent[root(b)]=root(c);
  const ax=P.getX(a),ay=P.getY(a),az=P.getZ(a),bx=P.getX(b),by=P.getY(b),bz=P.getZ(b),cx=P.getX(c),cy=P.getY(c),cz=P.getZ(c);
  volume+=(ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx))/6;
  minArea=Math.min(minArea,.5*Math.hypot((by-ay)*(cz-az)-(bz-az)*(cy-ay),(bz-az)*(cx-ax)-(bx-ax)*(cz-az),(bx-ax)*(cy-ay)-(by-ay)*(cx-ax)));
  for(const [u,v]of [[a,b],[b,c],[c,a]]){const key=Math.min(u,v)*n+Math.max(u,v),e=edges.get(key)??[0,0];e[0]++;e[1]+=u<v?1:-1;edges.set(key,e);}
 }
 let boundary=0,nonManifold=0,windingErrors=0;for(const [count,w]of edges.values()){if(count===1)boundary++;if(count!==2)nonManifold++;if(w!==0)windingErrors++;}
 return {vertices:n,triangles:I.length/3,finite,components:new Set(Array.from({length:n},(_,i)=>root(i))).size,boundary,nonManifold,windingErrors,euler:n-edges.size+I.length/3,volume,minArea};
}
