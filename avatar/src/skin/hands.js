import * as T from 'three';

function geometry(p,n,I,mask,source){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('handMask',new T.Float32BufferAttribute(mask??new Float32Array(p.length/3),1));g.setAttribute('handSourceIndex',new T.Int32BufferAttribute(source??new Int32Array(p.length/3).fill(-1),1));g.setIndex(I);return g;}
function compact(g){const P=g.attributes.position,N=g.attributes.normal,M=g.attributes.handMask.array,S=g.attributes.handSourceIndex.array,map=new Map(),p=[],n=[],m=[],s=[],I=[];for(const i of g.index.array){if(!map.has(i)){map.set(i,p.length/3);p.push(P.getX(i),P.getY(i),P.getZ(i));n.push(N.getX(i),N.getY(i),N.getZ(i));m.push(M[i]);s.push(S[i]);}I.push(map.get(i));}return geometry(p,n,I,m,s);}
function cut(g,distance){
 const P=g.attributes.position,N=g.attributes.normal,I=g.index.array,M=g.attributes.handMask?.array,S=g.attributes.handSourceIndex?.array,n=P.count,p=[],norm=[],mask=[],src=[],indices=[],old=new Int32Array(n).fill(-1),edges=new Map(),D=Float64Array.from({length:n},(_,i)=>distance(P.getX(i),P.getY(i),P.getZ(i)));
 const original=i=>{if(old[i]<0){old[i]=p.length/3;p.push(P.getX(i),P.getY(i),P.getZ(i));norm.push(N.getX(i),N.getY(i),N.getZ(i));mask.push(M?.[i]??0);src.push(S?.[i]??-1);}return old[i];};
 const crossing=(a,b)=>{
  if(a>b)[a,b]=[b,a];const key=a*n+b;if(edges.has(key))return edges.get(key);
  const t=D[a]/(D[a]-D[b]),v=new T.Vector3().fromBufferAttribute(P,a).lerp(new T.Vector3().fromBufferAttribute(P,b),t),q=new T.Vector3().fromBufferAttribute(N,a).lerp(new T.Vector3().fromBufferAttribute(N,b),t).normalize(),j=p.length/3;
  p.push(v.x,v.y,v.z);norm.push(q.x,q.y,q.z);mask.push((M?.[a]??0)*(1-t)+(M?.[b]??0)*t);src.push(-1);edges.set(key,j);return j;
 };
 for(let i=0;i<I.length;i+=3){const poly=[];for(let k=0;k<3;k++){const a=I[i+k],b=I[i+(k+1)%3],ia=D[a]>=0,ib=D[b]>=0;if(ia&&ib)poly.push(original(b));else if(ia&&!ib)poly.push(crossing(a,b));else if(!ia&&ib)poly.push(crossing(a,b),original(b));}for(let k=1;k<poly.length-1;k++)indices.push(poly[0],poly[k],poly[k+1]);}
 return geometry(p,norm,indices,mask,src);
}
function boundary(g,side=0){
 const I=g.index.array,n=g.attributes.position.count,E=new Map();
 for(let i=0;i<I.length;i+=3)for(let k=0;k<3;k++){const a=I[i+k],b=I[i+(k+1)%3],key=Math.min(a,b)*n+Math.max(a,b);if(E.has(key))E.get(key).count++;else E.set(key,{a,b,count:1});}
 const next=new Map();for(const e of E.values())if(e.count===1&&(!side||side*g.attributes.position.getX(e.a)>0)){if(next.has(e.a))throw Error('Branched hand connection');next.set(e.a,e.b);}
 const loops=[];while(next.size){const first=next.keys().next().value,loop=[];let at=first;do{loop.push(at);const n=next.get(at);if(n===undefined)throw Error('Open hand connection');next.delete(at);at=n;}while(at!==first&&loop.length<100000);loops.push(loop);}
 if(loops.length!==1)throw Error('Expected one hand connection, got '+loops.map(x=>x.length).join(','));return loops[0];
}
function ring(g,ids,axis,side){
 const P=g.attributes.position,N=g.attributes.normal,e=new T.Vector3(side,0,0).addScaledVector(axis,-side*axis.x).normalize();
 const centre=new T.Vector3();for(const i of ids)centre.add(new T.Vector3().fromBufferAttribute(P,i));centre.multiplyScalar(1/ids.length);
 let phase=0,max=-Infinity;for(let k=0;k<ids.length;k++){const d=new T.Vector3().fromBufferAttribute(P,ids[k]).sub(centre).dot(e);if(d>max){max=d;phase=k;}}
 ids=[...ids.slice(phase),...ids.slice(0,phase)];const point=ids.map(i=>new T.Vector3().fromBufferAttribute(P,i)),normal=ids.map(i=>new T.Vector3().fromBufferAttribute(N,i)),t=[0];let length=0;
 for(let i=1;i<=ids.length;i++){length+=point[i%ids.length].distanceTo(point[i-1]);t.push(length);}for(let i=0;i<t.length;i++)t[i]/=length;
 const sample=s=>{let i=0;while(i<ids.length-1&&t[i+1]<s)i++;const a=(s-t[i])/(t[i+1]-t[i]);return {p:point[i].clone().lerp(point[(i+1)%ids.length],a),n:normal[i].clone().lerp(normal[(i+1)%ids.length],a).normalize()};};
 return {ids,t:t.slice(0,-1),point,normal,centre,sample};
}
export async function graftHands(body,reference,skeleton){
 let result=body;const report=[];
 for(const side of [1,-1]){
  const suffix=side>0?'L':'R',bone=n=>skeleton.bones[skeleton.index.get(n+'.'+suffix)],wrist=new T.Vector3(...bone('hand').head),axis=wrist.clone().sub(new T.Vector3(...bone('lowerArm').head)).normalize();
  result=cut(result,(x,y,z)=>side*x>.30&&y<.82?-.08-new T.Vector3(x,y,z).sub(wrist).dot(axis):1);
  const original=reference.group.children.find(m=>m.name==='hand.'+suffix),world=original.geometry.clone().applyMatrix4(original.matrixWorld),socket=original.userData.assembly.sockets[0],removed=new Set([...socket.core,...socket.rim]),kept=[],drop=new Uint8Array(world.index.count/3);
  for(let f=0;f<drop.length;f++)drop[f]=Number([0,1,2].every(k=>removed.has(world.index.array[3*f+k])));
  // Remove the rolled socket lip as well. Six local edge rings stay on the
  // proximal palm cap; the authored fingers are neither moved nor rebuilt.
  for(let pass=0;pass<6;pass++){
   const rim=new Set();for(let f=0;f<drop.length;f++)if(drop[f])for(let k=0;k<3;k++)rim.add(world.index.array[3*f+k]);
   const next=drop.slice();for(let f=0;f<drop.length;f++)if(!drop[f]&&[0,1,2].filter(k=>rim.has(world.index.array[3*f+k])).length>=2)next[f]=1;drop.set(next);
  }
  for(let f=0;f<drop.length;f++)if(!drop[f])kept.push(world.index.array[3*f],world.index.array[3*f+1],world.index.array[3*f+2]);
  const P=world.attributes.position,N=world.attributes.normal,source=Int32Array.from({length:P.count},(_,i)=>i);
  let hand=geometry(P.array,N.array,kept,new Float32Array(P.count).fill(1),source);
  // Keep the approved hand topology. Coincident resting fingers must not
  // be welded by a general-purpose body simplifier.
  const error=0;hand=compact(hand);
  const A=ring(result,boundary(result,side).reverse(),axis,side),B=ring(hand,boundary(hand),axis,side);
  const p=Array.from(result.attributes.position.array),n=Array.from(result.attributes.normal.array),mask=Array.from(result.attributes.handMask.array),src=Array.from(result.attributes.handSourceIndex.array),indices=Array.from(result.index.array),offset=p.length/3;
  for(const v of hand.attributes.position.array)p.push(v);for(const v of hand.attributes.normal.array)n.push(v);for(const v of hand.attributes.handMask.array)mask.push(v);for(const v of hand.attributes.handSourceIndex.array)src.push(v);for(const i of hand.index.array)indices.push(offset+i);
  const rings=[A.ids],times=[A.t],steps=128,span=B.centre.distanceTo(A.centre);
  const tangent=normal=>{const nu=axis.dot(normal),radial=normal.clone().addScaledVector(axis,-nu).multiplyScalar(-nu/Math.max(.2,1-nu*nu));if(radial.length()>.35)radial.setLength(.35);return axis.clone().add(radial).multiplyScalar(span);};
  for(const t of [.25,.5,.75]){
   const ids=[],ts=[];for(let j=0;j<steps;j++){
    const s=j/steps,a=A.sample(s),b=B.sample(s),t2=t*t,t3=t2*t,v=a.p.clone().multiplyScalar(2*t3-3*t2+1).addScaledVector(tangent(a.n),t3-2*t2+t).addScaledVector(b.p,-2*t3+3*t2).addScaledVector(tangent(b.n),t3-t2),nn=a.n.lerp(b.n,t).normalize();
    ids.push(p.length/3);ts.push(s);p.push(v.x,v.y,v.z);n.push(nn.x,nn.y,nn.z);mask.push(t);src.push(-1);
   }rings.push(ids);times.push(ts);
  }
  rings.push(B.ids.map(i=>i+offset));times.push(B.t);
  for(let r=0;r<rings.length-1;r++){
   const a=rings[r],b=rings[r+1],ta=times[r],tb=times[r+1];let i=0,j=0;
   while(i<a.length||j<b.length){const ai=a[i%a.length],bj=b[j%b.length],an=i+1<a.length?ta[i+1]:1,bn=j+1<b.length?tb[j+1]:1;
    if(i<a.length&&(j===b.length||an<=bn)){indices.push(ai,a[(i+1)%a.length],bj);i++;}else{indices.push(ai,b[(j+1)%b.length],bj);j++;}
   }
  }
  result=compact(geometry(p,n,indices,mask,src));report.push({side:suffix,bodyRing:A.ids.length,handRing:B.ids.length,handErrorMeters:error,removedSocketFaces:(world.index.count-kept.length)/3});
 }
 result.computeBoundingBox();result.computeBoundingSphere();return {geometry:result,report};
}
