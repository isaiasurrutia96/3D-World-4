import * as T from 'three';
// One Loop refinement pass rounds the existing surface without new features.
export function refineSurface(g){
 const p=g.attributes.position.array,ind=g.index.array,n=g.attributes.position.count;
 const neighbors=Array.from({length:n},()=>new Set()),edges=new Map();
 const key=(a,b)=>a<b?a+','+b:b+','+a;
 function edge(a,b,c){const k=key(a,b);if(!edges.has(k))edges.set(k,{a,b,opposite:[]});edges.get(k).opposite.push(c);neighbors[a].add(b);neighbors[b].add(a);}
 for(let i=0;i<ind.length;i+=3){const a=ind[i],b=ind[i+1],c=ind[i+2];edge(a,b,c);edge(b,c,a);edge(c,a,b);}
 const out=new Float32Array((n+edges.size)*3);
 for(let i=0;i<n;i++){const near=[...neighbors[i]],beta=near.length===3?3/16:3/(8*near.length);for(let d=0;d<3;d++){let sum=0;for(const j of near)sum+=p[j*3+d];out[i*3+d]=(1-near.length*beta)*p[i*3+d]+beta*sum;}}
 let next=n;for(const e of edges.values()){e.index=next++;for(let d=0;d<3;d++)out[e.index*3+d]=e.opposite.length===2?.375*(p[e.a*3+d]+p[e.b*3+d])+.125*(p[e.opposite[0]*3+d]+p[e.opposite[1]*3+d]):.5*(p[e.a*3+d]+p[e.b*3+d]);}
 const faces=new Uint32Array(ind.length*4);let at=0;for(let i=0;i<ind.length;i+=3){const a=ind[i],b=ind[i+1],c=ind[i+2],ab=edges.get(key(a,b)).index,bc=edges.get(key(b,c)).index,ca=edges.get(key(c,a)).index;faces.set([a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca],at);at+=12;}
 const result=new T.BufferGeometry();result.setAttribute('position',new T.BufferAttribute(out,3));result.setIndex(new T.BufferAttribute(faces,1));result.userData={...g.userData,subdivisionPasses:1};g.dispose();return result;
}
