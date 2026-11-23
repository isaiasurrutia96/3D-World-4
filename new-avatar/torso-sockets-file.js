// The Torso sockets tab's shapes, built once ahead of time (by bake-torso-sockets.mjs during the build) and stored in
// one small file the page loads, instead of the page cutting every socket itself each time it opens (owner, 23 November
// 2026: "Its not loading in the test lab": the page had grown to about 30 s on a computer and more on a phone).
// The standard way games ship heavy shapes: baked ahead of time, stored compactly (positions as 16-bit steps across
// each shape's box, about 0.02 mm; directions as two 16-bit numbers, octahedral encoding), and only unpacked on load.
// Each shape is stored once; an item's piece that is the same shape moved, or mirrored left to right and moved, points
// at it. File: 4 bytes header length, the header (JSON), then the numbers, each block starting on a 4-byte boundary.

// Octahedral encoding of a unit direction into two numbers in [-1, 1] (Cigolle et al. 2014, "A Survey of Efficient
// Representations for Independent Unit Vectors").
export function octEncode(x,y,z){
 const s=Math.abs(x)+Math.abs(y)+Math.abs(z)||1;let u=x/s,v=y/s;
 if(z<0){const a=(1-Math.abs(v))*(u>=0?1:-1),b=(1-Math.abs(u))*(v>=0?1:-1);u=a;v=b;}
 return [u,v];
}
export function octDecode(u,v){
 let z=1-Math.abs(u)-Math.abs(v),x=u,y=v;
 if(z<0){const a=(1-Math.abs(y))*(x>=0?1:-1),b=(1-Math.abs(x))*(y>=0?1:-1);x=a;y=b;}
 const l=Math.hypot(x,y,z)||1;return [x/l,y/l,z/l];
}

// Writing (Node): items = {itemId: [{name, positions, index, normals}]}, facts = any small numbers for the notes.
export function packTorsoSockets(items,facts){
 const meshes=[],blocks=[],header={facts,meshes:[],items:{}};let offset=0;
 const add=arr=>{const pad=(4-offset%4)%4;if(pad){blocks.push(new Uint8Array(pad));offset+=pad;}const at=offset;blocks.push(new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength));offset+=arr.byteLength;return at;};
 // Is `p` the stored shape `m` moved (and maybe mirrored)? Checked on every point, so a match is exact.
 const sameAs=(p,m)=>{
  if(p.positions.length!==m.positions.length||p.index.length!==m.index.length)return null;
  for(const mirror of [false,true]){
   const X=(i)=>mirror&&i%3===0?-m.positions[i]:m.positions[i],t=[0,1,2].map(k=>p.positions[k]-X(k));let ok=true;
   for(let i=0;i<p.positions.length&&ok;i++)if(Math.abs(p.positions[i]-X(i)-t[i%3])>1e-9)ok=false;
   if(!ok)continue;
   for(let i=0;i<p.index.length&&ok;i+=3)ok=mirror?p.index[i]===m.index[i]&&p.index[i+1]===m.index[i+2]&&p.index[i+2]===m.index[i+1]:p.index[i]===m.index[i]&&p.index[i+1]===m.index[i+1]&&p.index[i+2]===m.index[i+2];
   if(ok)return {mirror,move:t};
  }
  return null;
 };
 for(const [id,parts] of Object.entries(items)){
  header.items[id]=parts.map(p=>{
   for(let k=0;k<meshes.length;k++){const s=sameAs(p,meshes[k]);if(s)return {name:p.name,mesh:k,...s};}
   const P=p.positions,n=P.length/3,lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<P.length;i++){lo[i%3]=Math.min(lo[i%3],P[i]);hi[i%3]=Math.max(hi[i%3],P[i]);}
   const step=hi.map((h,k)=>(h-lo[k])/65535||1),q=new Uint16Array(P.length);for(let i=0;i<P.length;i++)q[i]=Math.round((P[i]-lo[i%3])/step[i%3]);
   const N=p.normals,o=new Int16Array(n*2);
   for(let i=0;i<n;i++){const [u,v]=octEncode(N[3*i],N[3*i+1],N[3*i+2]);o[2*i]=Math.round(u*32767);o[2*i+1]=Math.round(v*32767);}
   const wide=n>65535,I=wide?Uint32Array.from(p.index):Uint16Array.from(p.index);
   header.meshes.push({points:n,triangles:p.index.length/3,lo,step,wide,positions:add(q),normals:add(o),index:add(I)});meshes.push(p);
   return {name:p.name,mesh:meshes.length-1,mirror:false,move:[0,0,0]};
  });
 }
 const json=new TextEncoder().encode(JSON.stringify(header)),head=new Uint8Array(4+json.length+((4-(4+json.length)%4)%4));
 new DataView(head.buffer).setUint32(0,json.length,true);head.set(json,4);
 const out=new Uint8Array(head.length+offset);out.set(head,0);let at=head.length;for(const b of blocks){out.set(b,at);at+=b.length;}
 return out;
}

// Reading (page): the file's bytes -> {facts, items: {itemId: [{name, positions, index, normals}]}}.
export function unpackTorsoSockets(buffer){
 const bytes=new Uint8Array(buffer),len=new DataView(buffer).getUint32(0,true),header=JSON.parse(new TextDecoder().decode(bytes.subarray(4,4+len)));
 const base=4+len+((4-(4+len)%4)%4),shapes=header.meshes.map(m=>{
  const q=new Uint16Array(buffer,base+m.positions,m.points*3),o=new Int16Array(buffer,base+m.normals,m.points*2);
  const positions=new Float32Array(m.points*3),normals=new Float32Array(m.points*3);
  for(let i=0;i<positions.length;i++)positions[i]=m.lo[i%3]+q[i]*m.step[i%3];
  for(let i=0;i<m.points;i++){const d=octDecode(o[2*i]/32767,o[2*i+1]/32767);normals[3*i]=d[0];normals[3*i+1]=d[1];normals[3*i+2]=d[2];}
  const index=m.wide?new Uint32Array(buffer,base+m.index,m.triangles*3):new Uint16Array(buffer,base+m.index,m.triangles*3);
  return {positions,normals,index};});
 const items={};
 for(const [id,parts] of Object.entries(header.items))items[id]=parts.map(({name,mesh,mirror,move})=>{
  const s=shapes[mesh];if(!mirror&&!move.some(Boolean))return {name,...s};
  const positions=new Float32Array(s.positions.length),normals=new Float32Array(s.normals.length);
  for(let i=0;i<positions.length;i++){const f=mirror&&i%3===0?-1:1;positions[i]=f*s.positions[i]+move[i%3];normals[i]=f*s.normals[i];}
  let index=s.index;if(mirror){index=new s.index.constructor(s.index.length);for(let t=0;t<index.length;t+=3){index[t]=s.index[t];index[t+1]=s.index[t+2];index[t+2]=s.index[t+1];}}
  return {name,positions,normals,index};});
 return {facts:header.facts,items};
}
